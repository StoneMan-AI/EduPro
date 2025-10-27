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

### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
cd backend
pm2 start src/server.js --name "edupro-backend"

# 构建并部署前端（使用 Nginx）
cd frontend
npm run build
# 将 dist 目录部署到 Nginx
```

### 使用 Docker

```bash
# 构建镜像
docker build -t edupro .

# 运行容器
docker run -p 3002:3002 -p 5001:5001 edupro
```

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
