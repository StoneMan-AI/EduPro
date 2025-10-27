#!/bin/bash

# ==============================================
# EduPro 生产环境部署脚本
# ==============================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
APP_NAME="EduPro"
APP_DIR="/var/www/edupro"
BACKUP_DIR="/var/backups/edupro"
DATE=$(date +%Y%m%d_%H%M%S)
BRANCH="${1:-main}"
HEALTH_CHECK_URL="http://localhost:5001/health"
MAX_RETRY=5

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查环境
check_environment() {
    log "检查部署环境..."
    
    # 检查必要命令
    for cmd in node npm pm2 nginx git psql; do
        if ! command -v $cmd &> /dev/null; then
            error "❌ $cmd 未安装"
            exit 1
        fi
    done
    
    # 检查目录
    if [ ! -d "$APP_DIR" ]; then
        error "❌ 应用目录 $APP_DIR 不存在"
        exit 1
    fi
    
    # 检查权限
    if [ ! -w "$APP_DIR" ]; then
        error "❌ 对 $APP_DIR 没有写入权限"
        exit 1
    fi
    
    log "✅ 环境检查通过"
}

# 备份当前版本
backup_current_version() {
    log "📦 备份当前版本..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份应用代码
    if [ -d "$APP_DIR/.git" ]; then
        cd "$APP_DIR"
        CURRENT_COMMIT=$(git rev-parse HEAD)
        echo "$CURRENT_COMMIT" > "$BACKUP_DIR/commit_$DATE.txt"
        log "当前版本: $CURRENT_COMMIT"
    fi
    
    # 备份应用文件
    tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
        -C "$(dirname "$APP_DIR")" \
        "$(basename "$APP_DIR")" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='uploads' \
        --exclude='logs'
    
    log "✅ 备份完成: $BACKUP_DIR/app_backup_$DATE.tar.gz"
}

# 更新代码
update_code() {
    log "📥 更新代码..."
    
    cd "$APP_DIR"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        warn "⚠️  发现未提交的更改，将被重置"
        git reset --hard HEAD
    fi
    
    # 更新代码
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    NEW_COMMIT=$(git rev-parse HEAD)
    log "✅ 代码更新完成: $NEW_COMMIT"
}

# 安装依赖
install_dependencies() {
    log "📚 安装依赖..."
    
    cd "$APP_DIR"
    
    # 安装根目录依赖
    if [ -f "package.json" ]; then
        npm ci --only=production
    fi
    
    # 安装后端依赖
    if [ -d "backend" ]; then
        cd backend
        npm ci --only=production
        cd ..
        log "✅ 后端依赖安装完成"
    fi
    
    # 安装前端依赖并构建
    if [ -d "frontend" ]; then
        cd frontend
        npm ci
        npm run build
        cd ..
        log "✅ 前端构建完成"
    fi
}

# 数据库迁移
run_database_migration() {
    log "🗄️  检查数据库迁移..."
    
    # 这里可以添加数据库迁移逻辑
    # 例如：
    # cd "$APP_DIR"
    # npm run db:migrate
    
    log "✅ 数据库迁移检查完成"
}

# 重启服务
restart_services() {
    log "🔄 重启服务..."
    
    # 重启 PM2 应用
    if pm2 describe edupro-backend > /dev/null 2>&1; then
        pm2 restart edupro-backend
        log "✅ PM2 应用重启完成"
    else
        warn "⚠️  PM2 应用不存在，尝试启动..."
        cd "$APP_DIR"
        pm2 start ecosystem.config.js --env production
        pm2 save
        log "✅ PM2 应用启动完成"
    fi
    
    # 重载 Nginx
    if nginx -t 2>/dev/null; then
        nginx -s reload
        log "✅ Nginx 重载完成"
    else
        error "❌ Nginx 配置测试失败"
        return 1
    fi
}

# 健康检查
health_check() {
    log "🔍 进行健康检查..."
    
    local retry=0
    while [ $retry -lt $MAX_RETRY ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log "✅ 健康检查通过"
            return 0
        fi
        
        retry=$((retry + 1))
        warn "⚠️  健康检查失败 ($retry/$MAX_RETRY)，等待 5 秒后重试..."
        sleep 5
    done
    
    error "❌ 健康检查失败，应用可能未正常启动"
    return 1
}

# 回滚
rollback() {
    error "🔄 开始回滚..."
    
    # 查找最近的备份
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "app_backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -z "$latest_backup" ]; then
        error "❌ 未找到备份文件"
        return 1
    fi
    
    log "使用备份文件: $latest_backup"
    
    # 恢复备份
    cd "$(dirname "$APP_DIR")"
    tar -xzf "$latest_backup"
    
    # 重启服务
    restart_services
    
    log "✅ 回滚完成"
}

# 清理旧备份
cleanup_old_backups() {
    log "🧹 清理旧备份..."
    
    # 保留最近 7 天的备份
    find "$BACKUP_DIR" -name "app_backup_*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "commit_*.txt" -mtime +7 -delete
    
    log "✅ 旧备份清理完成"
}

# 显示状态
show_status() {
    info "📊 应用状态:"
    pm2 status edupro-backend 2>/dev/null || warn "PM2 状态查看失败"
    
    info "🌐 Nginx 状态:"
    systemctl is-active nginx || warn "Nginx 状态查看失败"
    
    info "🗄️  数据库状态:"
    systemctl is-active postgresql || warn "PostgreSQL 状态查看失败"
    
    info "💾 磁盘使用率:"
    df -h / | tail -1
    
    info "🧠 内存使用率:"
    free -h | grep Mem
}

# 发送通知 (可选)
send_notification() {
    local status="$1"
    local message="$2"
    
    # 这里可以添加通知逻辑，比如发送到 Slack、钉钉等
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"$APP_NAME 部署$status: $message\"}" \
    #   YOUR_WEBHOOK_URL
    
    log "📢 通知: $APP_NAME 部署$status: $message"
}

# 主函数
main() {
    info "🚀 开始部署 $APP_NAME 到生产环境..."
    info "部署分支: $BRANCH"
    info "部署时间: $(date)"
    
    # 部署步骤
    if check_environment && \
       backup_current_version && \
       update_code && \
       install_dependencies && \
       run_database_migration && \
       restart_services && \
       health_check; then
        
        cleanup_old_backups
        show_status
        send_notification "成功" "版本已成功部署到生产环境"
        log "🎉 部署完成！"
        
    else
        error "💥 部署失败，开始回滚..."
        rollback
        send_notification "失败" "部署失败，已回滚到上个版本"
        exit 1
    fi
}

# 脚本使用说明
usage() {
    echo "用法: $0 [branch]"
    echo "  branch: 要部署的分支 (默认: main)"
    echo ""
    echo "示例:"
    echo "  $0              # 部署 main 分支"
    echo "  $0 develop      # 部署 develop 分支"
    echo "  $0 v1.2.0       # 部署 v1.2.0 标签"
}

# 参数处理
case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
