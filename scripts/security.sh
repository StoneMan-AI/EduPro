#!/bin/bash

# ==============================================
# EduPro 安全配置脚本
# ==============================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }

# 配置 SSH 安全
configure_ssh() {
    log "🔐 配置 SSH 安全..."
    
    # 备份原配置
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # SSH 安全配置
    sudo tee /etc/ssh/sshd_config.d/99-edupro-security.conf << EOF
# EduPro SSH 安全配置
Protocol 2
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 5
LoginGraceTime 30
EOF
    
    # 重启 SSH 服务
    sudo systemctl restart ssh
    
    log "✅ SSH 安全配置完成"
}

# 配置防火墙规则
configure_firewall() {
    log "🔥 配置防火墙规则..."
    
    # 重置防火墙规则
    sudo ufw --force reset
    
    # 默认策略
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 允许 SSH (根据实际端口调整)
    sudo ufw allow ssh
    
    # 允许 HTTP/HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # 允许内部网络访问数据库 (根据需要调整)
    # sudo ufw allow from 10.0.0.0/8 to any port 5432
    
    # 限制 SSH 连接频率
    sudo ufw limit ssh/tcp
    
    # 启用防火墙
    sudo ufw --force enable
    
    # 显示状态
    sudo ufw status verbose
    
    log "✅ 防火墙配置完成"
}

# 配置 fail2ban
configure_fail2ban() {
    log "🛡️  配置 fail2ban..."
    
    # 安装 fail2ban
    sudo apt install -y fail2ban
    
    # 创建本地配置
    sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
# 禁用时间 (秒)
bantime = 3600
# 检查时间窗口 (秒)
findtime = 600
# 最大尝试次数
maxretry = 3
# 忽略 IP 列表
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    # 启动服务
    sudo systemctl start fail2ban
    sudo systemctl enable fail2ban
    
    log "✅ fail2ban 配置完成"
}

# 配置系统安全更新
configure_auto_updates() {
    log "🔄 配置自动安全更新..."
    
    # 安装 unattended-upgrades
    sudo apt install -y unattended-upgrades apt-listchanges
    
    # 配置自动更新
    sudo tee /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF
    
    sudo tee /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    
    log "✅ 自动安全更新配置完成"
}

# 配置文件权限
configure_file_permissions() {
    log "📁 配置文件权限..."
    
    APP_DIR="/var/www/edupro"
    
    # 设置应用目录权限
    sudo chown -R $USER:www-data "$APP_DIR"
    sudo chmod -R 755 "$APP_DIR"
    
    # 上传目录权限
    sudo chmod -R 775 "$APP_DIR/uploads"
    
    # 日志目录权限
    sudo chmod -R 755 /var/log/edupro
    
    # 环境变量文件权限
    if [ -f "$APP_DIR/backend/.env" ]; then
        chmod 600 "$APP_DIR/backend/.env"
    fi
    
    # 脚本执行权限
    find "$APP_DIR/scripts" -name "*.sh" -exec chmod +x {} \;
    
    log "✅ 文件权限配置完成"
}

# 安装安全扫描工具
install_security_tools() {
    log "🔍 安装安全扫描工具..."
    
    # 安装 rkhunter
    sudo apt install -y rkhunter
    
    # 更新病毒库
    sudo rkhunter --update
    
    # 安装 chkrootkit
    sudo apt install -y chkrootkit
    
    # 安装 lynis
    sudo apt install -y lynis
    
    log "✅ 安全扫描工具安装完成"
}

# 配置日志监控
configure_log_monitoring() {
    log "📊 配置日志监控..."
    
    # 创建日志监控脚本
    sudo tee /usr/local/bin/security-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/security-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] 开始安全监控检查..." >> $LOG_FILE

# 检查失败登录
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
    echo "[$DATE] 警告: 发现 $FAILED_LOGINS 次失败登录尝试" >> $LOG_FILE
fi

# 检查 SSH 连接
SSH_CONNECTIONS=$(who | wc -l)
if [ $SSH_CONNECTIONS -gt 5 ]; then
    echo "[$DATE] 警告: 当前有 $SSH_CONNECTIONS 个 SSH 连接" >> $LOG_FILE
fi

# 检查磁盘使用率
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "[$DATE] 警告: 磁盘使用率达到 $DISK_USAGE%" >> $LOG_FILE
fi

# 检查内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "[$DATE] 警告: 内存使用率达到 $MEM_USAGE%" >> $LOG_FILE
fi

echo "[$DATE] 安全监控检查完成" >> $LOG_FILE
EOF
    
    sudo chmod +x /usr/local/bin/security-monitor.sh
    
    # 添加定时任务
    (sudo crontab -l 2>/dev/null || echo "") | grep -v "security-monitor" | sudo crontab -
    (sudo crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/security-monitor.sh") | sudo crontab -
    
    log "✅ 日志监控配置完成"
}

# 生成安全报告
generate_security_report() {
    log "📋 生成安全检查报告..."
    
    REPORT_FILE="/tmp/security-report-$(date +%Y%m%d).txt"
    
    cat > $REPORT_FILE << EOF
EduPro 安全检查报告
生成时间: $(date)
===========================================

系统信息:
- 操作系统: $(lsb_release -d | cut -f2)
- 内核版本: $(uname -r)
- 主机名: $(hostname)

网络配置:
- 监听端口:
$(netstat -tuln)

防火墙状态:
$(sudo ufw status verbose)

SSH 配置:
$(grep -E "^(Port|PermitRootLogin|PasswordAuthentication)" /etc/ssh/sshd_config)

fail2ban 状态:
$(sudo fail2ban-client status)

最近登录:
$(last -n 10)

系统进程:
$(ps aux --sort=-%cpu | head -10)

磁盘使用率:
$(df -h)

内存使用率:
$(free -h)

===========================================
EOF
    
    echo "安全报告已生成: $REPORT_FILE"
    cat $REPORT_FILE
}

# 主函数
main() {
    info "🛡️  开始配置 EduPro 安全设置..."
    
    # 检查权限
    if [[ $EUID -eq 0 ]]; then
        error "❌ 请不要以 root 用户运行此脚本"
        exit 1
    fi
    
    configure_ssh
    configure_firewall
    configure_fail2ban
    configure_auto_updates
    configure_file_permissions
    install_security_tools
    configure_log_monitoring
    generate_security_report
    
    log "✅ 安全配置完成！"
    
    info "
🔒 安全配置摘要:
- SSH 已加固 (禁用密码登录，限制 root 登录)
- 防火墙已启用 (仅开放必要端口)
- fail2ban 已配置 (自动封禁攻击 IP)
- 自动安全更新已启用
- 文件权限已正确设置
- 日志监控已配置

📋 建议的后续操作:
1. 定期运行安全扫描: sudo rkhunter --check
2. 查看 fail2ban 状态: sudo fail2ban-client status
3. 监控日志文件: tail -f /var/log/security-monitor.log
4. 定期备份重要数据
5. 保持系统和应用更新

🚨 重要提醒:
- 请确保已配置 SSH 密钥认证
- 定期更改密码和密钥
- 监控系统日志和安全报告
"
}

# 执行主函数
main "$@"
