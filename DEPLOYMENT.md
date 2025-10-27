# 部署指南

## 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 12.0

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd EduPro
```

### 2. 安装依赖

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all

# 或者分别安装
npm install                 # 根目录依赖
cd backend && npm install  # 后端依赖
cd frontend && npm install # 前端依赖
```

### 3. 配置数据库

#### 3.1 创建 PostgreSQL 数据库

```bash
# 使用 psql 命令行
createdb edupro_db

# 或者使用 SQL
CREATE DATABASE edupro_db;
```

#### 3.2 导入数据库结构

```bash
# 导入数据库结构和初始数据
psql -d edupro_db -f database/schema.sql
```

### 4. 配置环境变量

#### 4.1 后端配置

复制并编辑后端环境变量文件：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=postgres
DB_PASSWORD=your_password

# 服务器配置
NODE_ENV=development
PORT=5001

# 其他配置...
```

### 5. 启动服务

#### 5.1 开发环境

```bash
# 从根目录同时启动前后端
npm run dev

# 或者分别启动
npm run backend:dev   # 后端服务 (端口 5001)
npm run frontend:dev  # 前端服务 (端口 3002)
```

#### 5.2 生产环境

```bash
# 构建前端
npm run frontend:build

# 启动后端
npm run backend:start
```

### 6. 访问系统

- 前端地址：http://localhost:3002
- 后端API：http://localhost:5001/api
- 健康检查：http://localhost:5001/health

## 目录结构

```
EduPro/
├── backend/           # Node.js + Express 后端
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/     # Sequelize 数据模型
│   │   ├── routes/     # API 路由
│   │   ├── middleware/ # 中间件
│   │   └── utils/
│   ├── config/
│   └── package.json
├── frontend/          # React.js 前端
│   ├── src/
│   │   ├── components/ # React 组件
│   │   ├── pages/      # 页面组件
│   │   ├── services/   # API 服务
│   │   └── utils/
│   └── package.json
├── database/          # 数据库相关
│   └── schema.sql     # 数据库结构
├── uploads/           # 文件上传目录
└── package.json       # 根目录配置
```

## API 接口

### 题目管理
- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `PUT /api/questions/:id` - 更新题目
- `DELETE /api/questions/:id` - 删除题目
- `PATCH /api/questions/batch-status` - 批量更新状态

### 知识点管理
- `GET /api/knowledge-points` - 获取知识点列表
- `POST /api/knowledge-points` - 创建知识点
- `PUT /api/knowledge-points/:id` - 更新知识点
- `DELETE /api/knowledge-points/:id` - 删除知识点

### 配置管理
- `GET /api/config/subjects` - 获取学科列表
- `GET /api/config/grades` - 获取年级列表
- `GET /api/config/question-types` - 获取题型列表
- `GET /api/config/difficulty-levels` - 获取难度级别

### 文件上传
- `POST /api/uploads/image` - 单文件上传
- `POST /api/uploads/batch` - 批量文件上传
- `DELETE /api/uploads/file/:filename` - 删除文件

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 PostgreSQL 服务是否启动
   - 验证数据库配置信息
   - 确认数据库用户权限

2. **端口被占用**
   - 检查 5001 和 3002 端口是否被占用
   - 修改配置文件中的端口设置

3. **依赖安装失败**
   - 检查 Node.js 版本是否符合要求
   - 尝试清除缓存：`npm cache clean --force`
   - 删除 node_modules 重新安装

4. **图片上传失败**
   - 检查 uploads 目录权限
   - 确认文件大小不超过限制
   - 验证文件格式是否支持

### 日志查看

```bash
# 后端日志
cd backend
npm run dev

# 前端日志
cd frontend  
npm run dev
```

## 生产环境部署

### 1. 服务器环境准备

#### 1.1 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **内存**: 最小 2GB，推荐 4GB+
- **存储**: 最小 20GB，推荐 50GB+
- **网络**: 稳定的互联网连接

#### 1.2 安装必要软件
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget git nginx postgresql postgresql-server
```

#### 1.3 安装 Node.js
```bash
# 使用 NodeSource 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 数据库配置

#### 2.1 PostgreSQL 安装和配置
```bash
# 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE edupro_prod;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_prod TO edupro_user;
ALTER USER edupro_user CREATEDB;
\q
EOF

# 导入数据库结构
psql -h localhost -U edupro_user -d edupro_prod -f database/schema.sql
```

#### 2.2 数据库性能优化
```bash
# 编辑 PostgreSQL 配置
sudo nano /etc/postgresql/*/main/postgresql.conf

# 添加/修改以下配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 3. 应用部署

#### 3.1 项目部署目录
```bash
# 创建部署目录
sudo mkdir -p /var/www/edupro
sudo chown $USER:$USER /var/www/edupro

# 克隆项目代码
cd /var/www/edupro
git clone <your-repository-url> .
```

#### 3.2 后端部署

**安装依赖**
```bash
cd /var/www/edupro/backend
npm ci --production
```

**生产环境配置**
```bash
# 进入后端目录
cd /var/www/edupro/backend

# 创建生产环境配置文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_prod
DB_USER=edupro_user
DB_PASSWORD=your_strong_password
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=REPLACE_WITH_GENERATED_SECRET
BCRYPT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# 文件上传配置
UPLOAD_DIR=/var/www/edupro/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

# 生成安全的 JWT 密钥并替换
JWT_SECRET=$(openssl rand -base64 32)
sed -i "s/REPLACE_WITH_GENERATED_SECRET/$JWT_SECRET/" .env

# 设置安全权限
chmod 600 .env
```

**创建上传目录**
```bash
mkdir -p /var/www/edupro/uploads
chmod 755 /var/www/edupro/uploads
```

#### 3.3 前端构建和部署

**构建前端**
```bash
cd /var/www/edupro/frontend

# 安装依赖
npm ci

# 生产环境构建
npm run build
```

**配置 Nginx**
```bash
# 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/edupro

# 添加以下配置
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 静态文件服务
    root /var/www/edupro/frontend/dist;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件服务
    location /uploads/ {
        alias /var/www/edupro/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}

# 启用站点
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL 证书配置

#### 4.1 使用 Let's Encrypt
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. 进程管理 (PM2)

#### 5.1 安装和配置 PM2
```bash
# 全局安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cd /var/www/edupro
cat > ecosystem.config.js << EOF
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
EOF

# 创建日志目录
sudo mkdir -p /var/log/edupro
sudo chown $USER:$USER /var/log/edupro

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 开机自启动
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

#### 5.2 PM2 常用命令
```bash
# 查看状态
pm2 status
pm2 monit

# 重启应用
pm2 restart edupro-backend

# 查看日志
pm2 logs edupro-backend

# 停止应用
pm2 stop edupro-backend

# 删除应用
pm2 delete edupro-backend
```

### 6. 监控和日志

#### 6.1 系统监控
```bash
# 安装系统监控工具
sudo apt install htop iotop nethogs

# 创建系统监控脚本
cat > /var/www/edupro/scripts/monitor.sh << 'EOF'
#!/bin/bash

# 系统资源监控
echo "=== 系统监控报告 $(date) ==="

# CPU 使用率
echo "CPU 使用率:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5}'

# 内存使用情况
echo -e "\n内存使用情况:"
free -h

# 磁盘使用情况
echo -e "\n磁盘使用情况:"
df -h /

# PM2 进程状态
echo -e "\nPM2 进程状态:"
pm2 jlist | jq '.[] | {name, status, cpu, memory}'

# 数据库连接数
echo -e "\n数据库连接数:"
sudo -u postgres psql -c "SELECT count(*) as connections FROM pg_stat_activity;"

EOF

chmod +x /var/www/edupro/scripts/monitor.sh

# 添加定时监控
crontab -e
# 每5分钟检查一次
*/5 * * * * /var/www/edupro/scripts/monitor.sh >> /var/log/edupro/monitor.log 2>&1
```

#### 6.2 日志轮转
```bash
# 创建 logrotate 配置
sudo nano /etc/logrotate.d/edupro

# 添加以下内容
/var/log/edupro/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 7. 备份策略

#### 7.1 数据库备份
```bash
# 创建备份脚本
cat > /var/www/edupro/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/edupro"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="edupro_prod"
DB_USER="edupro_user"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 上传文件备份
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/edupro/uploads/

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
EOF

chmod +x /var/www/edupro/scripts/backup.sh

# 每天凌晨2点自动备份
crontab -e
# 添加
0 2 * * * /var/www/edupro/scripts/backup.sh >> /var/log/edupro/backup.log 2>&1
```

### 8. Docker 生产环境部署

#### 8.1 创建 Dockerfile
```bash
# 创建多阶段构建 Dockerfile
cat > Dockerfile << 'EOF'
# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 安装依赖
RUN npm ci
RUN cd backend && npm ci --production
RUN cd frontend && npm ci

# 复制源代码
COPY . .

# 构建前端
RUN cd frontend && npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装 PM2
RUN npm install -g pm2

# 创建应用目录
WORKDIR /app

# 复制后端文件
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/database ./database
COPY --from=builder /app/ecosystem.config.js ./

# 复制前端构建文件
COPY --from=builder /app/frontend/dist ./frontend/dist

# 创建上传目录
RUN mkdir -p uploads

# 设置权限
RUN chown -R node:node /app

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 5001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1

# 启动命令
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
EOF
```

#### 8.2 Docker Compose 生产配置
```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5001:5001"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_NAME: edupro_prod
      DB_USER: edupro_user
      DB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./uploads:/app/uploads
      - app_logs:/var/log/edupro
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - edupro_network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: edupro_prod
      POSTGRES_USER: edupro_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped
    networks:
      - edupro_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - ./uploads:/usr/share/nginx/html/uploads
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - edupro_network

volumes:
  postgres_data:
  app_logs:

networks:
  edupro_network:
    driver: bridge
EOF
```

#### 8.3 Docker 部署命令
```bash
# 创建环境变量文件
echo "DB_PASSWORD=your_strong_password" > .env.prod

# 构建和启动
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f app
```

### 9. 自动化部署脚本

#### 9.1 创建部署脚本
```bash
cat > scripts/deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 开始部署 EduPro 生产环境..."

# 配置变量
APP_DIR="/var/www/edupro"
BACKUP_DIR="/var/backups/edupro"
DATE=$(date +%Y%m%d_%H%M%S)

# 1. 备份当前版本
echo "📦 备份当前版本..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www edupro

# 2. 更新代码
echo "📥 更新代码..."
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main

# 3. 安装依赖
echo "📚 安装后端依赖..."
cd backend
npm ci --production

echo "📚 安装前端依赖并构建..."
cd ../frontend
npm ci
npm run build

# 4. 数据库迁移（如果需要）
echo "🗄️ 检查数据库迁移..."
# 这里可以添加数据库迁移逻辑

# 5. 重启服务
echo "🔄 重启服务..."
pm2 restart edupro-backend

# 6. 重载 Nginx
echo "🌐 重载 Nginx..."
sudo nginx -t && sudo nginx -s reload

# 7. 健康检查
echo "🔍 健康检查..."
sleep 5
curl -f http://localhost:5001/health || {
    echo "❌ 健康检查失败，回滚..."
    tar -xzf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www
    pm2 restart edupro-backend
    exit 1
}

# 8. 清理旧备份
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "✅ 部署完成！"
echo "📊 应用状态："
pm2 status
EOF

chmod +x scripts/deploy.sh
```

#### 9.2 GitHub Actions 自动部署
```bash
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/edupro
          bash scripts/deploy.sh
EOF
```

### 10. 性能优化建议

#### 10.1 数据库优化
```sql
-- 创建索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_search 
ON questions USING GIN(to_tsvector('english', title || ' ' || COALESCE(remarks, '')));

-- 分析表统计信息
ANALYZE questions;
ANALYZE knowledge_points;
ANALYZE subjects;
```

#### 10.2 应用层优化
```bash
# 启用 Node.js 生产优化
export NODE_OPTIONS="--max-old-space-size=2048"

# PM2 集群模式配置
pm2 start ecosystem.config.js --env production -i max
```

## 部署清单检查

- [ ] 服务器环境准备完成
- [ ] PostgreSQL 安装和配置完成
- [ ] 应用代码部署完成
- [ ] 环境变量配置完成
- [ ] SSL 证书配置完成
- [ ] Nginx 配置完成
- [ ] PM2 进程管理配置完成
- [ ] 监控和日志配置完成
- [ ] 备份策略实施完成
- [ ] 防火墙和安全配置完成
- [ ] 性能测试通过
- [ ] 健康检查正常

## 安全建议

1. 修改默认密码和密钥
2. 配置防火墙规则
3. 启用 HTTPS
4. 定期备份数据库
5. 监控系统资源使用情况

## 技术支持

如遇到问题，请提供以下信息：
- 操作系统版本
- Node.js 版本
- 错误日志
- 复现步骤
