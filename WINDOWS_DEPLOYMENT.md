# 🪟 Windows 环境部署指南

## 问题诊断

您遇到的 500 错误是因为后端服务没有运行。在 Windows 环境中，我们需要使用不同的方式启动服务。

## 🚀 Windows 环境快速启动

### 1. 启动后端服务

```powershell
# 进入后端目录
cd backend

# 安装依赖（如果尚未安装）
npm install

# 启动后端服务
npm start
# 或者
node src/server.js
```

### 2. 启动前端服务（新终端窗口）

```powershell
# 进入前端目录
cd frontend

# 安装依赖（如果尚未安装）
npm install

# 启动前端开发服务器
npm run dev
```

### 3. 验证服务运行

```powershell
# 测试后端 API
curl http://localhost:5001/
curl http://localhost:5001/health

# 测试前端
# 浏览器访问 http://localhost:3002
```

## 🔧 生产环境部署（Windows）

### 1. 使用 PM2 for Windows

```powershell
# 全局安装 PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start src/server.js --name "edupro-backend"

# 查看状态
pm2 status

# 查看日志
pm2 logs edupro-backend
```

### 2. 使用 Windows 服务

```powershell
# 安装 PM2 Windows 服务
pm2 install pm2-windows-service

# 将 PM2 设置为 Windows 服务
pm2-service-install

# 启动服务
pm2 start ecosystem.config.js --env production
```

### 3. 使用 IIS 和 Node.js

如果您有 IIS，可以配置反向代理到 Node.js 应用。

## 🐳 Docker 部署（推荐）

### 1. 安装 Docker Desktop

下载并安装 Docker Desktop for Windows。

### 2. 使用 Docker Compose

```powershell
# 构建并启动服务
docker-compose -f docker/docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker/docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker/docker-compose.prod.yml logs -f app
```

## 🔍 故障排除

### 问题 1：端口被占用

```powershell
# 查看端口占用
netstat -ano | findstr :5001

# 终止占用端口的进程
taskkill /PID <进程ID> /F
```

### 问题 2：依赖安装失败

```powershell
# 清理缓存
npm cache clean --force

# 删除 node_modules 重新安装
rmdir /s node_modules
npm install
```

### 问题 3：环境变量问题

```powershell
# 检查环境变量文件
type backend\.env

# 设置环境变量
set NODE_ENV=production
set PORT=5001
```

### 问题 4：数据库连接失败

```powershell
# 检查 PostgreSQL 服务
sc query postgresql

# 启动 PostgreSQL 服务
net start postgresql
```

## 📊 开发环境完整启动流程

```powershell
# 1. 启动后端（终端 1）
cd backend
npm install
npm start

# 2. 启动前端（终端 2）
cd frontend
npm install
npm run dev

# 3. 访问应用
# 前端：http://localhost:3002
# 后端 API：http://localhost:5001
```

## 🔧 生产环境完整部署流程

```powershell
# 1. 安装 PM2
npm install -g pm2

# 2. 构建前端
cd frontend
npm run build

# 3. 启动后端
cd ../backend
pm2 start src/server.js --name "edupro-backend"

# 4. 配置 IIS 或 Nginx 反向代理
# 将请求代理到 http://localhost:5001
```

## 📝 环境变量配置

创建 `backend\.env` 文件：

```env
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
CORS_ORIGIN=http://localhost:3002
UPLOAD_DIR=../uploads
```

## 🚨 紧急修复 500 错误

如果您现在就想快速解决 500 错误：

```powershell
# 1. 确保在项目根目录
cd F:\AICoding\EduPro

# 2. 启动后端服务
cd backend
node src/server.js

# 3. 在另一个终端启动前端
cd frontend
npm run dev

# 4. 访问 http://localhost:3002
```

---

**注意**：Windows 环境下的部署与 Linux 环境有所不同，主要区别在于进程管理和服务启动方式。
