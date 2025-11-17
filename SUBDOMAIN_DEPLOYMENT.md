# 🌐 EduPro 二级域名部署指南

本文档专门针对 `edupro.qingsongkao.cn` 二级域名的部署配置，适用于已有项目的服务器环境。

## 📋 部署概览

### 项目配置
- **主域名项目**: `adddesigngroup.com` (已存在)
- **EduPro 二级域名**: `edupro.qingsongkao.cn`
- **后端端口**: `5001` (避免与主项目冲突)
- **前端**: 通过 Nginx 代理服务静态文件

### 架构说明
```
Internet → Nginx → 
├── adddesigngroup.com (主项目, 端口 5000)
└── edupro.qingsongkao.cn (EduPro, 端口 5001)
```

## 🚀 快速部署

### 1. 克隆项目
```bash
# 克隆到指定目录
git clone <repository-url> /opt/EduPro
cd /opt/EduPro
```

### 2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm ci --production

# 安装前端依赖并构建
cd ../frontend
npm ci
npm run build
```

### 3. 配置数据库
```bash
# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE edupro_db;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;
\q

# 导入数据库结构
psql -h localhost -U edupro_user -d edupro_db -f database/schema.sql
```

### 4. 配置环境变量
```bash
# 创建后端环境变量文件
cd /opt/EduPro/backend
nano .env
```

**添加以下配置:**
```bash
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=edupro_user
DB_PASSWORD=your_password
DB_DIALECT=postgres
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://edupro.qingsongkao.cn
UPLOAD_DIR=/opt/EduPro/uploads
```

### 5. 配置 Nginx（HTTP 模式）
```bash
# 复制 Nginx 配置
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t
sudo nginx -s reload
```

### 6. 获取 SSL 证书
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书（会自动修改配置文件添加 HTTPS 支持）
sudo certbot --nginx -d edupro.qingsongkao.cn
```

**故障排除：** 如果遇到 SSL 证书文件不存在的错误，请确保域名解析正确，然后重新运行 certbot 命令。

### 7. 启动应用
```bash
# 安装 PM2
sudo npm install -g pm2

# 启动应用
cd /opt/EduPro
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
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
sudo certbot --nginx -d edupro.qingsongkao.cn
```

### 4. 数据库配置

```bash
# 创建独立数据库 (避免与主项目冲突)
sudo -u postgres psql << 'EOF'
CREATE DATABASE edupro_db;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;
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
curl -f https://edupro.qingsongkao.cn/health

# API 测试
curl https://edupro.qingsongkao.cn/api/health
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
psql -h localhost -U edupro_user -d edupro_db -c "SELECT version();"

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

- [ ] https://edupro.qingsongkao.cn 可正常访问
- [ ] SSL 证书有效 (绿锁图标)
- [ ] API 接口正常: https://edupro.qingsongkao.cn/api/health
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
4. 网络测试: `curl -I https://edupro.qingsongkao.cn`

---

**预计部署时间**: 10-20 分钟
**前提条件**: 服务器已有 Nginx、Node.js、PostgreSQL
