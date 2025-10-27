#!/bin/bash

# ==============================================
# EduPro 生产环境初始化脚本
# ==============================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
APP_DIR="/var/www/edupro"
DB_NAME="edupro_prod"
DB_USER="edupro_user"
DOMAIN=""
EMAIL=""

# 日志函数
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }

# 检查是否为 root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "❌ 请不要以 root 用户运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if ! command -v apt &> /dev/null; then
        error "❌ 此脚本仅支持 Ubuntu/Debian 系统"
        exit 1
    fi
    log "✅ 操作系统检查通过"
}

# 更新系统
update_system() {
    log "🔄 更新系统包..."
    sudo apt update && sudo apt upgrade -y
    log "✅ 系统更新完成"
}

# 安装基础软件
install_base_packages() {
    log "📦 安装基础软件包..."
    
    sudo apt install -y \
        curl \
        wget \
        git \
        vim \
        htop \
        iotop \
        nethogs \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        python3-dev
    
    log "✅ 基础软件包安装完成"
}

# 安装 Node.js
install_nodejs() {
    log "📦 安装 Node.js 18..."
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 验证安装
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log "✅ Node.js 安装完成: $node_version"
    log "✅ npm 版本: $npm_version"
}

# 安装 PM2
install_pm2() {
    log "📦 安装 PM2..."
    
    sudo npm install -g pm2@latest
    
    # 配置 PM2 开机启动
    pm2 startup | grep -E '^sudo' | bash
    
    log "✅ PM2 安装完成"
}

# 安装 PostgreSQL
install_postgresql() {
    log "📦 安装 PostgreSQL..."
    
    sudo apt install -y postgresql postgresql-contrib
    
    # 启动服务
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    log "✅ PostgreSQL 安装完成"
}

# 配置 PostgreSQL
configure_postgresql() {
    log "🔧 配置 PostgreSQL..."
    
    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # 创建数据库和用户
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF
    
    # 保存密码
    echo "DB_PASSWORD=$DB_PASSWORD" >> ~/.env.edupro
    chmod 600 ~/.env.edupro
    
    log "✅ PostgreSQL 配置完成"
    log "📝 数据库密码已保存到 ~/.env.edupro"
}

# 安装 Nginx
install_nginx() {
    log "📦 安装 Nginx..."
    
    sudo apt install -y nginx
    
    # 启动服务
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log "✅ Nginx 安装完成"
}

# 配置防火墙
configure_firewall() {
    log "🔧 配置防火墙..."
    
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 允许 SSH
    sudo ufw allow ssh
    
    # 允许 HTTP/HTTPS
    sudo ufw allow 'Nginx Full'
    
    # 显示状态
    sudo ufw status verbose
    
    log "✅ 防火墙配置完成"
}

# 安装 SSL 证书
install_ssl() {
    if [[ -z "$DOMAIN" ]]; then
        warn "⚠️  未提供域名，跳过 SSL 证书安装"
        return 0
    fi
    
    log "🔐 安装 SSL 证书..."
    
    # 安装 Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # 获取证书
    if [[ -n "$EMAIL" ]]; then
        sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive
    else
        sudo certbot --nginx -d "$DOMAIN" --register-unsafely-without-email --agree-tos --non-interactive
    fi
    
    # 配置自动续期
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    log "✅ SSL 证书安装完成"
}

# 创建应用目录
create_app_directory() {
    log "📁 创建应用目录..."
    
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    
    # 创建必要的子目录
    mkdir -p "$APP_DIR"/{uploads,logs,backups}
    mkdir -p /var/log/edupro
    mkdir -p /var/backups/edupro
    
    log "✅ 应用目录创建完成"
}

# 配置日志轮转
configure_logrotate() {
    log "🔧 配置日志轮转..."
    
    sudo tee /etc/logrotate.d/edupro << EOF
/var/log/edupro/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/edupro.*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
EOF
    
    log "✅ 日志轮转配置完成"
}

# 安装监控工具
install_monitoring() {
    log "📊 安装监控工具..."
    
    # 安装系统监控工具
    sudo apt install -y htop iotop nethogs ncdu tree jq
    
    # 创建系统监控脚本
    tee "$APP_DIR/scripts/monitor.sh" << 'EOF'
#!/bin/bash

echo "=== EduPro 系统监控报告 $(date) ==="

echo -e "\n📊 CPU 使用率:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5}'

echo -e "\n💾 内存使用情况:"
free -h

echo -e "\n💿 磁盘使用情况:"
df -h /

echo -e "\n🚀 PM2 进程状态:"
pm2 jlist | jq '.[] | {name, status, cpu, memory}' 2>/dev/null || echo "PM2 未运行"

echo -e "\n🗄️  数据库连接数:"
sudo -u postgres psql -d edupro_prod -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || echo "数据库连接失败"

echo -e "\n🌐 Nginx 状态:"
systemctl is-active nginx

echo -e "\n📈 系统负载:"
uptime
EOF
    
    chmod +x "$APP_DIR/scripts/monitor.sh"
    
    log "✅ 监控工具安装完成"
}

# 创建备份脚本
create_backup_script() {
    log "💾 创建备份脚本..."
    
    tee "$APP_DIR/scripts/backup.sh" << EOF
#!/bin/bash

BACKUP_DIR="/var/backups/edupro"
DATE=\$(date +%Y%m%d_%H%M%S)
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"

# 读取数据库密码
if [ -f ~/.env.edupro ]; then
    source ~/.env.edupro
fi

mkdir -p \$BACKUP_DIR

echo "开始备份: \$DATE"

# 数据库备份
PGPASSWORD=\$DB_PASSWORD pg_dump -h localhost -U \$DB_USER -d \$DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# 上传文件备份
tar -czf \$BACKUP_DIR/uploads_backup_\$DATE.tar.gz "$APP_DIR/uploads/"

# 应用代码备份
tar -czf \$BACKUP_DIR/app_backup_\$DATE.tar.gz -C "$APP_DIR" . --exclude=node_modules --exclude=uploads --exclude=logs

# 删除 7 天前的备份
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: \$DATE"
EOF
    
    chmod +x "$APP_DIR/scripts/backup.sh"
    
    log "✅ 备份脚本创建完成"
}

# 配置定时任务
configure_cron() {
    log "⏰ 配置定时任务..."
    
    # 添加定时任务
    (crontab -l 2>/dev/null || echo "") | grep -v "edupro" | crontab -
    
    (crontab -l 2>/dev/null; cat << EOF
# EduPro 监控 - 每5分钟
*/5 * * * * $APP_DIR/scripts/monitor.sh >> /var/log/edupro/monitor.log 2>&1

# EduPro 备份 - 每天凌晨2点
0 2 * * * $APP_DIR/scripts/backup.sh >> /var/log/edupro/backup.log 2>&1

# 清理临时文件 - 每天凌晨3点
0 3 * * * find /tmp -name "*.tmp" -mtime +1 -delete 2>/dev/null

# PM2 日志轮转 - 每周日凌晨4点
0 4 * * 0 pm2 flush
EOF
    ) | crontab -
    
    log "✅ 定时任务配置完成"
}

# 优化系统性能
optimize_system() {
    log "⚡ 优化系统性能..."
    
    # 增加文件描述符限制
    sudo tee -a /etc/security/limits.conf << EOF

# EduPro 性能优化
$USER soft nofile 65535
$USER hard nofile 65535
EOF
    
    # 优化网络设置
    sudo tee -a /etc/sysctl.conf << EOF

# EduPro 网络优化
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1800
EOF
    
    # 应用设置
    sudo sysctl -p
    
    log "✅ 系统性能优化完成"
}

# 显示总结信息
show_summary() {
    info "🎉 EduPro 生产环境初始化完成！"
    
    echo "
📋 环境信息:
- 应用目录: $APP_DIR
- 数据库名: $DB_NAME
- 数据库用户: $DB_USER
- 数据库密码: 已保存到 ~/.env.edupro

📝 下一步:
1. 克隆应用代码到 $APP_DIR
2. 配置应用环境变量
3. 导入数据库结构
4. 配置 Nginx 虚拟主机
5. 运行部署脚本

🔧 管理命令:
- 监控系统: $APP_DIR/scripts/monitor.sh
- 备份数据: $APP_DIR/scripts/backup.sh
- 部署应用: $APP_DIR/scripts/deploy.sh

📚 文档: 
- 详细部署文档请查看 DEPLOYMENT.md
"
}

# 参数处理
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo "选项:"
            echo "  -d, --domain DOMAIN    域名 (用于 SSL 证书)"
            echo "  -e, --email EMAIL      邮箱 (用于 SSL 证书)"
            echo "  -h, --help            显示帮助信息"
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
    info "🚀 开始初始化 EduPro 生产环境..."
    
    check_root
    check_os
    update_system
    install_base_packages
    install_nodejs
    install_pm2
    install_postgresql
    configure_postgresql
    install_nginx
    configure_firewall
    install_ssl
    create_app_directory
    configure_logrotate
    install_monitoring
    create_backup_script
    configure_cron
    optimize_system
    show_summary
    
    log "✅ 初始化完成！"
}

# 执行主函数
main "$@"
