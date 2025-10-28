# 🛠️ EduPro 手动部署指南

本文档提供 EduPro 试题管理系统的完整手动部署步骤，适用于 `edupro.adddesigngroup.com` 二级域名部署。

## 📋 部署概览

### 系统架构
```
Internet → Nginx → 
├── adddesigngroup.com (主项目, 端口 5000)
└── edupro.adddesigngroup.com (EduPro, 端口 5001)
```

### 技术栈
- **前端**: React.js + Vite
- **后端**: Node.js + Express
- **数据库**: PostgreSQL
- **反向代理**: Nginx
- **进程管理**: PM2

## 🔧 环境准备

### 1. 系统要求
```bash
# 检查系统版本
lsb_release -a

# 检查内存和磁盘空间
free -h
df -h
```

**最低要求:**
- Ubuntu 20.04+ / CentOS 8+
- 2GB RAM
- 10GB 磁盘空间
- Node.js 18+
- PostgreSQL 12+
- Nginx

### 2. 检查现有服务
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查端口占用
netstat -tlnp | grep -E ':(80|443|5000|5001|5432)'
```

## 📦 安装依赖软件

### 1. 更新系统包
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装 Node.js 18+
```bash
# 安装 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装 PM2
```bash
sudo npm install -g pm2@latest

# 验证安装
pm2 --version
```

### 4. 安装 PostgreSQL (如果未安装)
```bash
# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
sudo -u postgres psql -c "SELECT version();"
```

### 5. 安装 Nginx (如果未安装)
```bash
sudo apt install -y nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
```

## 🗄️ 数据库配置

### 1. 创建数据库和用户
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 中执行以下命令
CREATE DATABASE edupro_prod;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE edupro_prod TO edupro_user;
ALTER USER edupro_user CREATEDB;
\q
```

### 2. 配置 PostgreSQL 性能优化
```bash
# 编辑 PostgreSQL 配置
sudo nano /etc/postgresql/*/main/postgresql.conf

# 添加以下配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 3. 导入数据库结构
```bash
# 进入项目目录
cd /var/www/edupro

# 导入数据库结构
psql -h localhost -U edupro_user -d edupro_prod -f database/schema.sql
```

## 📁 项目部署

### 1. 创建项目目录
```bash
# 创建项目目录
sudo mkdir -p /var/www/edupro
sudo chown $USER:$USER /var/www/edupro

# 创建子目录
mkdir -p /var/www/edupro/{uploads,logs}
mkdir -p /var/log/edupro
mkdir -p /var/backups/edupro
```

### 2. 克隆项目代码
```bash
# 克隆项目
cd /var/www/edupro
git clone <your-repository-url> .

# 设置权限
chmod -R 755 /var/www/edupro
chmod -R 775 /var/www/edupro/uploads
```

### 3. 安装后端依赖
```bash
# 进入后端目录
cd /var/www/edupro/backend

# 安装生产依赖
npm ci --production

# 验证安装
npm list --depth=0
```

### 4. 安装前端依赖并构建
```bash
# 进入前端目录
cd /var/www/edupro/frontend

# 安装依赖
npm ci

# 构建生产版本
npm run build

# 验证构建
ls -la dist/
```

## ⚙️ 环境配置

### 1. 创建后端环境变量文件
```bash
# 进入后端目录
cd /var/www/edupro/backend

# 创建 .env 文件
nano .env
```

**添加以下内容:**
```bash
# EduPro 生产环境配置
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_prod
DB_USER=edupro_user
DB_PASSWORD=your_strong_password_here
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=https://edupro.adddesigngroup.com

# 文件上传配置
UPLOAD_DIR=/var/www/edupro/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/edupro/app.log

TZ=Asia/Shanghai
```

### 2. 生成安全密钥
```bash
# 生成 JWT 密钥
openssl rand -base64 32

# 生成数据库密码
openssl rand -base64 32
```

## 🌐 Nginx 配置

### 1. 创建 EduPro Nginx 配置
```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/edupro
```

**添加以下内容:**
```nginx
# EduPro 试题管理系统 Nginx 配置
# 二级域名配置 - edupro.adddesigngroup.com

# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name edupro.adddesigngroup.com;
    
    # Let's Encrypt ACME 验证
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
    
    # 重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name edupro.adddesigngroup.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/edupro.adddesigngroup.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/edupro.adddesigngroup.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/edupro.adddesigngroup.com/chain.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob:; font-src 'self' data:;" always;
    
    # 文件上传大小限制
    client_max_body_size 20M;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
    
    # 缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端静态文件
    root /var/www/edupro/frontend/dist;
    index index.html;
    
    # 前端路由 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # EduPro API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:5001;
        access_log off;
    }
    
    # 上传文件服务
    location /uploads/ {
        alias /var/www/edupro/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 错误页面
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /var/www/html;
    }
    
    # 访问日志
    access_log /var/log/nginx/edupro.access.log;
    error_log /var/log/nginx/edupro.error.log;
    
    # 添加服务器标识
    add_header X-Served-By "EduPro-System" always;
}
```

### 2. 启用站点配置
```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 如果测试通过，重载 Nginx
sudo nginx -s reload
```

## 🔐 SSL 证书配置

### 1. 安装 Certbot
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. 获取 SSL 证书
```bash
# 为二级域名获取 SSL 证书
sudo certbot --nginx -d edupro.adddesigngroup.com

# 测试自动续期
sudo certbot renew --dry-run
```

## 🚀 进程管理配置

### 1. 创建 PM2 配置文件
```bash
# 在项目根目录创建 PM2 配置
cd /var/www/edupro
nano ecosystem.config.js
```

**添加以下内容:**
```javascript
module.exports = {
  apps: [{
    name: 'edupro-backend',
    script: './backend/src/server.js',
    cwd: '/var/www/edupro',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    log_file: '/var/log/edupro/combined.log',
    out_file: '/var/log/edupro/out.log',
    error_file: '/var/log/edupro/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

### 2. 启动应用
```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 🔥 防火墙配置

### 1. 配置 UFW 防火墙
```bash
# 检查 UFW 状态
sudo ufw status

# 如果 UFW 未启用，启用它
sudo ufw enable

# 允许必要端口
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh

# 检查状态
sudo ufw status verbose
```

## 📊 验证部署

### 1. 检查服务状态
```bash
# 检查 PM2 进程
pm2 status

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口占用
netstat -tlnp | grep -E ':(80|443|5001)'
```

### 2. 测试应用功能
```bash
# 测试后端健康检查
curl -f http://localhost:5001/health

# 测试前端访问
curl -I https://edupro.adddesigngroup.com

# 测试 API 接口
curl https://edupro.adddesigngroup.com/api/health
```

### 3. 检查日志
```bash
# 查看应用日志
pm2 logs edupro-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/edupro.access.log
tail -f /var/log/nginx/edupro.error.log
```

## 🔧 日常维护

### 1. 应用更新
```bash
# 进入项目目录
cd /var/www/edupro

# 拉取最新代码
git pull origin main

# 更新后端依赖
cd backend && npm ci --production

# 更新前端依赖并构建
cd ../frontend && npm ci && npm run build

# 重启应用
pm2 restart edupro-backend
```

### 2. 数据库备份
```bash
# 创建备份目录
mkdir -p /var/backups/edupro

# 备份数据库
pg_dump -h localhost -U edupro_user -d edupro_prod > /var/backups/edupro/edupro_$(date +%Y%m%d_%H%M%S).sql

# 备份上传文件
tar -czf /var/backups/edupro/uploads_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/edupro/uploads/
```

### 3. 日志管理
```bash
# 设置日志轮转
sudo nano /etc/logrotate.d/edupro
```

**添加以下内容:**
```
/var/log/edupro/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🚨 故障排除

### 1. 常见问题

**端口冲突:**
```bash
# 检查端口占用
sudo lsof -i :5001

# 如果端口被占用，修改 ecosystem.config.js 中的端口
```

**Nginx 配置错误:**
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

**数据库连接失败:**
```bash
# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_prod -c "SELECT version();"

# 检查 PostgreSQL 服务
sudo systemctl status postgresql
```

**SSL 证书问题:**
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew
```

### 2. 性能优化

**PostgreSQL 优化:**
```bash
# 编辑 PostgreSQL 配置
sudo nano /etc/postgresql/*/main/postgresql.conf

# 根据服务器配置调整参数
shared_buffers = 25% of RAM
effective_cache_size = 75% of RAM
```

**Nginx 优化:**
```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/nginx.conf

# 调整工作进程数
worker_processes auto;
worker_connections 1024;
```

## 📝 部署检查清单

- [ ] 系统环境准备完成
- [ ] Node.js 和 PM2 安装完成
- [ ] PostgreSQL 安装和配置完成
- [ ] 数据库和用户创建完成
- [ ] 项目代码克隆完成
- [ ] 依赖安装和构建完成
- [ ] 环境变量配置完成
- [ ] Nginx 配置完成
- [ ] SSL 证书获取完成
- [ ] PM2 进程启动完成
- [ ] 防火墙配置完成
- [ ] 应用功能测试通过
- [ ] 日志配置完成
- [ ] 备份策略配置完成

---

**预计部署时间**: 30-60 分钟
**维护复杂度**: 中等
**安全等级**: 高
