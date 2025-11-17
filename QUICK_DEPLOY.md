# ⚡ EduPro 快速部署指南

> 适用于生产环境的手动部署方案

## 📋 系统要求

- Ubuntu 20.04+ / CentOS 8+
- 2GB+ RAM, 10GB+ 磁盘空间
- Node.js 18+, PostgreSQL 12+, Nginx, Git

## 🚀 快速开始

### 1. 克隆项目
```bash
# 克隆项目到指定目录
git clone <your-repository-url> /opt/EduPro
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

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=edupro_user
DB_PASSWORD=请设置强密码
DB_DIALECT=postgres

# 安全配置 (使用下面命令生成)
JWT_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# 文件上传配置
UPLOAD_DIR=/var/www/EduPro/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

# 设置文件权限
chmod 600 .env

# 编辑配置文件
nano .env
```

**必须修改的配置项:**
```bash
DB_PASSWORD=设置强数据库密码                    # 更改为实际的数据库密码
CORS_ORIGIN=https://edupro.qingsongkao.cn  # 二级域名
```

### 4. 部署应用
```bash
# 运行部署脚本
scripts/deploy.sh
```

### 5. 配置安全
```bash
# 运行安全配置脚本
scripts/security.sh
```

## 🐳 Docker 快速部署

### 1. 使用 Docker Compose
```bash
# 进入项目目录
cd /var/www/edupro

# 创建环境变量文件
echo "DB_PASSWORD=$(openssl rand -base64 32)" > .env.prod
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.prod

# 启动所有服务
docker-compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d

# 查看服务状态
docker-compose -f docker/docker-compose.prod.yml ps
```

### 2. 健康检查
```bash
# 检查应用健康状态
curl http://localhost:5001/health

# 查看日志
docker-compose -f docker/docker-compose.prod.yml logs -f app
```

## 🔧 配置 Nginx (传统部署)

### 1. 复制配置文件 (二级域名)
```bash
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/edupro

# 测试配置 (域名已预配置为 edupro.qingsongkao.cn)
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 获取二级域名 SSL 证书
```bash
# 使用 Let's Encrypt 为二级域名获取证书
sudo certbot --nginx -d edupro.qingsongkao.cn
```

### 3. 多项目配置参考
如果需要自定义多项目配置，可参考：
```bash
# 查看多项目配置示例
cat nginx/multi-project.conf.example
```

## 📊 验证部署

### 1. 服务状态检查
```bash
# 检查所有服务
systemctl status nginx postgresql
pm2 status

# 检查端口
netstat -tlnp | grep -E ':(80|443|5001|5432)'
```

### 2. 应用功能测试
```bash
# API 健康检查
curl -f http://localhost:5001/health

# 前端访问测试
curl -I https://edupro.qingsongkao.cn
```

### 3. 数据库连接测试
```bash
# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_db -c "SELECT version();"
```

## 🚨 常见问题排查

### 端口占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :5001
sudo lsof -i :5001

# 杀死占用进程
sudo kill -9 <PID>
```

### 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:www-data /var/www/edupro
sudo chmod -R 755 /var/www/edupro
sudo chmod -R 775 /var/www/edupro/uploads
```

### 数据库连接失败
```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 检查数据库用户
sudo -u postgres psql -c "\du"

# 重置数据库密码
sudo -u postgres psql -c "ALTER USER edupro_user PASSWORD 'new_password';"
```

### PM2 进程异常
```bash
# 查看错误日志
pm2 logs edupro-backend

# 重启应用
pm2 restart edupro-backend

# 重新加载配置
pm2 reload ecosystem.config.js --env production
```

## 📈 性能优化

### 1. 数据库优化
```bash
# 优化 PostgreSQL 配置
sudo cp docker/postgres/postgresql.conf /etc/postgresql/*/main/
sudo systemctl restart postgresql
```

### 2. 启用 HTTP/2 和压缩
```bash
# Nginx 配置已包含 gzip 和 HTTP/2
# 确保 SSL 证书正确配置
```

### 3. PM2 集群模式
```bash
# 已在 ecosystem.config.js 中配置
# instances: 'max' 启用所有 CPU 核心
```

## 🔄 更新部署

### 代码更新
```bash
# 拉取最新代码并部署
cd /var/www/edupro
scripts/deploy.sh
```

### 配置更新
```bash
# 更新环境变量后重启
pm2 restart edupro-backend

# 更新 Nginx 配置后重载
sudo nginx -s reload
```

## 📞 支持

如遇到问题：
1. 查看日志文件: `/var/log/edupro/`
2. 检查系统状态: `scripts/monitor.sh`
3. 生成安全报告: `scripts/security.sh`

---

**预计部署时间**: 15-30 分钟
**技术要求**: Linux 系统管理基础知识
