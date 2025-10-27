#!/bin/bash

# ==============================================
# EduPro 环境变量文件创建脚本
# ==============================================

set -euo pipefail

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"; }

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    error "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 获取用户输入
read -p "请输入数据库密码 (留空将生成随机密码): " DB_PASSWORD
read -p "请输入域名 (默认: edupro.adddesigngroup.com): " DOMAIN
read -p "请输入上传目录 (默认: /var/www/edupro/uploads): " UPLOAD_DIR

# 设置默认值
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 32)
    log "✅ 已生成随机数据库密码: $DB_PASSWORD"
fi

if [ -z "$UPLOAD_DIR" ]; then
    UPLOAD_DIR="/var/www/edupro/uploads"
fi

# 设置默认域名
if [ -z "$DOMAIN" ]; then
    DOMAIN="edupro.adddesigngroup.com"
    log "✅ 使用默认域名: $DOMAIN"
fi

CORS_ORIGIN="https://$DOMAIN"

# 生成 JWT 密钥
JWT_SECRET=$(openssl rand -base64 32)

log "📝 创建后端环境变量文件..."

# 创建后端 .env 文件
cat > backend/.env << EOF
# EduPro 后端生产环境配置
# 生成时间: $(date)

# ==============================================
# 应用配置
# ==============================================
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# ==============================================
# 数据库配置
# ==============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_prod
DB_USER=edupro_user
DB_PASSWORD=$DB_PASSWORD
DB_DIALECT=postgres

# 连接池配置
DB_POOL_MIN=0
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# ==============================================
# 安全配置
# ==============================================
JWT_SECRET=$JWT_SECRET
BCRYPT_ROUNDS=12

# ==============================================
# CORS 配置
# ==============================================
CORS_ORIGIN=$CORS_ORIGIN

# ==============================================
# 文件上传配置
# ==============================================
UPLOAD_DIR=$UPLOAD_DIR
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# ==============================================
# 速率限制配置
# ==============================================
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# ==============================================
# 日志配置
# ==============================================
LOG_LEVEL=info
LOG_FILE=/var/log/edupro/app.log

# ==============================================
# 时区配置
# ==============================================
TZ=Asia/Shanghai

EOF

# 设置安全权限
chmod 600 backend/.env

log "✅ 后端环境变量文件已创建: backend/.env"

# 显示配置摘要
echo "
📋 配置摘要:
- 数据库密码: $DB_PASSWORD
- JWT 密钥: 已生成
- 域名: $DOMAIN
- CORS 来源: $CORS_ORIGIN
- 上传目录: $UPLOAD_DIR

🔒 安全提醒:
- .env 文件权限已设为 600 (仅所有者可读写)
- 请妥善保管数据库密码和 JWT 密钥
- 不要将 .env 文件提交到版本控制系统

📝 下一步:
1. 确认数据库配置是否正确
2. 运行部署脚本: scripts/deploy.sh
3. 配置 Nginx 和 SSL 证书
"

# 保存配置到安全位置
echo "DB_PASSWORD=$DB_PASSWORD" > ~/.edupro-credentials
echo "JWT_SECRET=$JWT_SECRET" >> ~/.edupro-credentials
chmod 600 ~/.edupro-credentials

log "🔐 凭据已安全保存到: ~/.edupro-credentials"
