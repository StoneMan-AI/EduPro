# 🌐 EduPro 二级域名部署指南

本文档专门针对 `edupro.adddesigngroup.com` 二级域名的部署配置，适用于已有项目的服务器环境。

## 📋 部署概览

### 项目配置
- **主域名项目**: `adddesigngroup.com` (已存在)
- **EduPro 二级域名**: `edupro.adddesigngroup.com`
- **后端端口**: `5001` (避免与主项目冲突)
- **前端**: 通过 Nginx 代理服务静态文件

### 架构说明
```
Internet → Nginx → 
├── adddesigngroup.com (主项目, 端口 5000)
└── edupro.adddesigngroup.com (EduPro, 端口 5001)
```

## 🚀 快速部署

### 1. 克隆项目
```bash
# 克隆到指定目录
git clone <repository-url> /var/www/edupro
cd /var/www/edupro
chmod +x scripts/*.sh
```

### 2. 运行二级域名配置脚本
```bash
# 一键配置二级域名环境
scripts/setup-subdomain.sh -e admin@adddesigngroup.com
```

这个脚本会自动完成：
- ✅ 检查现有 Nginx 配置兼容性
- ✅ 配置 PostgreSQL 数据库 (独立数据库)
- ✅ 创建应用目录结构
- ✅ 配置 Nginx 二级域名
- ✅ 获取 SSL 证书
- ✅ 生成环境变量文件
- ✅ 配置 PM2 进程管理

### 3. 部署应用代码
```bash
# 安装依赖并部署
scripts/deploy.sh
```

### 4. 导入数据库结构
```bash
# 使用生成的数据库凭据
source ~/.edupro-credentials
psql -h localhost -U edupro_user -d edupro_prod -f database/schema.sql
```

## 🔧 手动配置 (高级用户)

### 1. Nginx 配置

#### 查看现有配置
```bash
# 检查现有站点
ls -la /etc/nginx/sites-enabled/

# 查看主域名配置 (如果存在)
cat /etc/nginx/sites-enabled/adddesigngroup.com
```

#### 配置二级域名
```bash
# 复制 EduPro 配置
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t
sudo nginx -s reload
```

### 2. 多项目配置示例

参考 `nginx/multi-project.conf.example` 了解完整的多项目配置：

```bash
# 查看多项目配置示例
cat nginx/multi-project.conf.example
```

**关键配置点:**
- 不同的 `server_name` (主域名 vs 二级域名)
- 不同的后端代理端口 (5000 vs 5001)
- 独立的日志文件
- 独立的 SSL 证书

### 3. SSL 证书配置

```bash
# 为二级域名获取独立的 SSL 证书
sudo certbot --nginx -d edupro.adddesigngroup.com
```

### 4. 数据库配置

```bash
# 创建独立数据库 (避免与主项目冲突)
sudo -u postgres psql << 'EOF'
CREATE DATABASE edupro_prod;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_prod TO edupro_user;
EOF
```

## 🔒 安全考虑

### 1. 端口隔离
- 主项目: 5000 端口
- EduPro: 5001 端口
- 两个项目通过 Nginx 代理，不直接暴露端口

### 2. 数据库隔离
- 使用独立的数据库和用户
- 数据完全分离，互不干扰

### 3. 日志隔离
```bash
# EduPro 独立日志
/var/log/nginx/edupro.access.log
/var/log/nginx/edupro.error.log
/var/log/edupro/app.log
```

### 4. 权限管理
```bash
# 设置正确的文件权限
sudo chown -R $USER:www-data /var/www/edupro
chmod -R 755 /var/www/edupro
chmod -R 775 /var/www/edupro/uploads
```

## 📊 监控和维护

### 1. 服务状态检查
```bash
# 检查 PM2 进程
pm2 status

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口占用
netstat -tlnp | grep -E ':(5000|5001)'
```

### 2. 健康检查
```bash
# EduPro 健康检查
curl -f https://edupro.adddesigngroup.com/health

# API 测试
curl https://edupro.adddesigngroup.com/api/health
```

### 3. 日志监控
```bash
# 查看应用日志
pm2 logs edupro-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/edupro.access.log
tail -f /var/log/nginx/edupro.error.log
```

## 🔧 常见问题

### 1. 端口冲突
```bash
# 检查端口占用
sudo lsof -i :5001

# 如果端口被占用，修改 ecosystem.config.js
nano ecosystem.config.js
# 修改 PORT: 5002 或其他端口
```

### 2. SSL 证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --dry-run
```

### 3. Nginx 配置冲突
```bash
# 检查配置语法
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 4. 数据库连接问题
```bash
# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_prod -c "SELECT version();"

# 检查 PostgreSQL 服务
sudo systemctl status postgresql
```

## 📝 更新和备份

### 1. 代码更新
```bash
cd /var/www/edupro
scripts/deploy.sh
```

### 2. 数据备份
```bash
# 手动备份
scripts/backup.sh

# 查看自动备份
ls -la /var/backups/edupro/
```

### 3. 配置备份
```bash
# 备份 Nginx 配置
sudo cp /etc/nginx/sites-available/edupro /tmp/edupro-nginx-backup.conf

# 备份环境变量
cp backend/.env /tmp/edupro-env-backup
```

## 🎯 部署验证清单

部署完成后，请检查以下项目：

- [ ] https://edupro.adddesigngroup.com 可正常访问
- [ ] SSL 证书有效 (绿锁图标)
- [ ] API 接口正常: https://edupro.adddesigngroup.com/api/health
- [ ] 文件上传功能正常
- [ ] 数据库连接正常
- [ ] PM2 进程运行正常
- [ ] 日志文件正常生成
- [ ] 主域名项目未受影响

## 📞 技术支持

如遇到问题，请提供：
1. 错误日志: `/var/log/nginx/edupro.error.log`
2. 应用日志: `pm2 logs edupro-backend`
3. 系统信息: `uname -a` 和 `nginx -v`
4. 网络测试: `curl -I https://edupro.adddesigngroup.com`

---

**预计部署时间**: 10-20 分钟
**前提条件**: 服务器已有 Nginx、Node.js、PostgreSQL
