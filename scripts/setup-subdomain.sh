#!/bin/bash

# ==============================================
# EduPro 二级域名部署脚本
# 适用于已有项目的服务器，使用二级域名部署
# ==============================================

set -euo pipefail

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"; }

# 配置变量
SUBDOMAIN="edupro.adddesigngroup.com"
APP_DIR="/var/www/edupro"
DB_NAME="edupro_prod"
DB_USER="edupro_user"
BACKEND_PORT="5001"
EMAIL=""

# 检查是否为 root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "❌ 请不要以 root 用户运行此脚本"
        exit 1
    fi
}

# 检查现有 Nginx 配置
check_existing_nginx() {
    log "🔍 检查现有 Nginx 配置..."
    
    if ! command -v nginx &> /dev/null; then
        error "❌ Nginx 未安装，请先安装 Nginx"
        exit 1
    fi
    
    # 检查端口占用
    if netstat -tlnp 2>/dev/null | grep -q ":$BACKEND_PORT "; then
        error "❌ 端口 $BACKEND_PORT 已被占用，请修改 ecosystem.config.js 中的端口"
        exit 1
    fi
    
    # 检查主域名配置是否存在
    if [ -f "/etc/nginx/sites-enabled/adddesigngroup.com" ] || [ -f "/etc/nginx/sites-enabled/default" ]; then
        info "✅ 检测到现有 Nginx 配置，将配置二级域名"
    else
        warn "⚠️  未检测到主域名配置，请确认现有项目配置正确"
    fi
    
    log "✅ Nginx 环境检查完成"
}

# 检查数据库配置
check_database_config() {
    log "🔍 检查数据库配置..."
    
    # 检查 PostgreSQL 是否运行
    if ! systemctl is-active --quiet postgresql; then
        error "❌ PostgreSQL 服务未运行"
        exit 1
    fi
    
    # 检查数据库是否已存在
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        warn "⚠️  数据库 $DB_NAME 已存在，将使用现有数据库"
    else
        log "✅ 数据库检查完成，将创建新数据库"
    fi
}

# 配置 PostgreSQL 用户和数据库
setup_database() {
    log "🗄️  配置数据库..."
    
    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # 创建数据库和用户（如果不存在）
    sudo -u postgres psql << EOF
DO \$\$
BEGIN
    -- 创建用户（如果不存在）
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
    END IF;
    
    -- 创建数据库（如果不存在）
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME;
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
        ALTER USER $DB_USER CREATEDB;
    END IF;
END
\$\$;
EOF
    
    # 保存密码
    echo "DB_PASSWORD=$DB_PASSWORD" > ~/.edupro-credentials
    chmod 600 ~/.edupro-credentials
    
    log "✅ 数据库配置完成"
    log "📝 数据库密码已保存到 ~/.edupro-credentials"
}

# 创建应用目录结构
create_app_structure() {
    log "📁 创建应用目录结构..."
    
    # 创建主目录
    if [ ! -d "$APP_DIR" ]; then
        sudo mkdir -p "$APP_DIR"
        sudo chown $USER:$USER "$APP_DIR"
    fi
    
    # 创建子目录
    mkdir -p "$APP_DIR"/{uploads,logs}
    mkdir -p /var/log/edupro
    mkdir -p /var/backups/edupro
    
    # 设置权限
    chmod 755 "$APP_DIR"
    chmod 775 "$APP_DIR/uploads"
    chmod 755 "$APP_DIR/logs"
    
    log "✅ 应用目录结构创建完成"
}

# 配置 Nginx 二级域名
configure_nginx_subdomain() {
    log "🌐 配置 Nginx 二级域名..."
    
    # 复制 EduPro Nginx 配置
    sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/edupro
    
    # 测试配置
    if ! sudo nginx -t; then
        error "❌ Nginx 配置测试失败"
        exit 1
    fi
    
    log "✅ Nginx 二级域名配置完成"
}

# 安装 SSL 证书
install_ssl_subdomain() {
    log "🔐 安装二级域名 SSL 证书..."
    
    # 检查 certbot 是否安装
    if ! command -v certbot &> /dev/null; then
        log "📦 安装 Certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # 获取 SSL 证书
    if [[ -n "$EMAIL" ]]; then
        sudo certbot --nginx -d "$SUBDOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    else
        sudo certbot --nginx -d "$SUBDOMAIN" --register-unsafely-without-email --agree-tos --non-interactive
    fi
    
    log "✅ SSL 证书安装完成"
}

# 创建环境变量文件
create_env_file() {
    log "⚙️  创建环境变量文件..."
    
    # 读取数据库密码
    source ~/.edupro-credentials
    
    # 生成 JWT 密钥
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 创建 .env 文件
    cat > "$APP_DIR/backend/.env" << EOF
# EduPro 生产环境配置
# 二级域名部署: $SUBDOMAIN
# 生成时间: $(date)

NODE_ENV=production
PORT=$BACKEND_PORT
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=$JWT_SECRET
BCRYPT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=https://$SUBDOMAIN

# 文件上传配置
UPLOAD_DIR=$APP_DIR/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/edupro/app.log

TZ=Asia/Shanghai
EOF
    
    # 设置权限
    chmod 600 "$APP_DIR/backend/.env"
    
    log "✅ 环境变量文件创建完成"
}

# 配置防火墙（如果需要）
configure_firewall_subdomain() {
    log "🔥 检查防火墙配置..."
    
    # 检查 ufw 状态
    if command -v ufw &> /dev/null; then
        # 确保 HTTP/HTTPS 端口开放
        sudo ufw allow 'Nginx Full' 2>/dev/null || true
        
        # 检查后端端口是否需要开放（通常不需要，因为通过 Nginx 代理）
        info "后端端口 $BACKEND_PORT 通过 Nginx 代理，无需直接开放"
    fi
    
    log "✅ 防火墙检查完成"
}

# 创建 PM2 配置
create_pm2_config() {
    log "🚀 创建 PM2 配置..."
    
    # 检查是否已安装 PM2
    if ! command -v pm2 &> /dev/null; then
        log "📦 安装 PM2..."
        sudo npm install -g pm2@latest
    fi
    
    # 复制 ecosystem.config.js
    cp ecosystem.config.js "$APP_DIR/"
    
    log "✅ PM2 配置完成"
}

# 显示部署摘要
show_deployment_summary() {
    info "🎉 EduPro 二级域名环境配置完成！"
    
    echo "
📋 部署摘要:
- 二级域名: https://$SUBDOMAIN
- 后端端口: $BACKEND_PORT
- 数据库: $DB_NAME
- 应用目录: $APP_DIR
- SSL 证书: 已配置

📝 下一步操作:
1. 克隆应用代码到 $APP_DIR
   git clone <repository-url> $APP_DIR

2. 安装依赖并部署
   cd $APP_DIR && bash scripts/deploy.sh

3. 导入数据库结构
   psql -h localhost -U $DB_USER -d $DB_NAME -f database/schema.sql

🔧 管理命令:
- 查看应用状态: pm2 status
- 查看日志: pm2 logs edupro-backend
- 重启应用: pm2 restart edupro-backend
- Nginx 重载: sudo nginx -s reload

📊 监控地址:
- 应用健康检查: https://$SUBDOMAIN/health
- 前端访问: https://$SUBDOMAIN

🔒 安全信息:
- 数据库凭据已保存到: ~/.edupro-credentials
- 环境变量文件: $APP_DIR/backend/.env
- 请妥善保管这些敏感信息
"
}

# 参数处理
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -p|--port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "EduPro 二级域名部署脚本"
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -e, --email EMAIL     邮箱地址 (用于 SSL 证书)"
            echo "  -p, --port PORT       后端端口 (默认: 5001)"
            echo "  -h, --help           显示帮助信息"
            exit 0
            ;;
        *)
            error "未知参数: $1"
            exit 1
            ;;
    esac
done

# 主函数
main() {
    info "🚀 开始配置 EduPro 二级域名部署环境..."
    info "域名: $SUBDOMAIN"
    info "端口: $BACKEND_PORT"
    
    check_root
    check_existing_nginx
    check_database_config
    setup_database
    create_app_structure
    configure_nginx_subdomain
    install_ssl_subdomain
    create_env_file
    configure_firewall_subdomain
    create_pm2_config
    
    # 重载 Nginx
    sudo nginx -s reload
    
    show_deployment_summary
    
    log "✅ 二级域名环境配置完成！"
}

# 执行主函数
main "$@"
