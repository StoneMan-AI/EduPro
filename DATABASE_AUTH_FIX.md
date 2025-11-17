# 🔧 PostgreSQL 密码认证失败修复指南

## ❌ 错误信息
```
password authentication failed for user "postgres"
```

## 🔍 问题诊断

### 1. 检查后端环境变量配置

```bash
# 进入后端目录
cd /opt/EduPro/backend

# 检查 .env 文件是否存在
ls -la .env

# 如果不存在，需要创建
cat .env
```

### 2. 检查数据库连接配置

查看 `.env` 文件中的数据库配置：
```bash
cat .env | grep DB_
```

应该包含以下配置：
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_prod
DB_USER=edupro_user
DB_PASSWORD=your_password_here
DB_DIALECT=postgres
```

## 🛠️ 解决方案

### 方案 1: 创建/修复 .env 文件

如果 `.env` 文件不存在或配置不正确：

```bash
# 进入后端目录
cd /opt/EduPro/backend

# 创建 .env 文件
nano .env
```

**添加以下内容（根据实际情况修改）：**

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
DB_PASSWORD=你的数据库密码
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=你的JWT密钥
BCRYPT_ROUNDS=12

# CORS 配置
CORS_ORIGIN=https://edupro.adddesigngroup.com

# 文件上传配置
UPLOAD_DIR=/opt/EduPro/backend/src/uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# 日志配置
LOG_LEVEL=info
TZ=Asia/Shanghai
```

**设置文件权限：**
```bash
chmod 600 .env
```

### 方案 2: 检查并创建数据库用户

#### 2.1 检查 PostgreSQL 服务状态

```bash
# 检查 PostgreSQL 服务是否运行
sudo systemctl status postgresql

# 如果未运行，启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2.2 连接到 PostgreSQL

```bash
# 使用 postgres 超级用户连接
sudo -u postgres psql
```

#### 2.3 检查数据库和用户是否存在

在 PostgreSQL 命令行中执行：

```sql
-- 列出所有数据库
\l

-- 列出所有用户
\du

-- 检查 edupro_prod 数据库是否存在
SELECT datname FROM pg_database WHERE datname = 'edupro_prod';

-- 检查 edupro_user 用户是否存在
SELECT usename FROM pg_user WHERE usename = 'edupro_user';
```

#### 2.4 创建数据库和用户（如果不存在）

```sql
-- 创建数据库
CREATE DATABASE edupro_prod;

-- 创建用户并设置密码
CREATE USER edupro_user WITH ENCRYPTED PASSWORD '你的强密码';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupro_prod TO edupro_user;

-- 连接到 edupro_prod 数据库
\c edupro_prod

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edupro_user;

-- 退出
\q
```

### 方案 3: 重置 postgres 用户密码（如果使用默认用户）

如果您的 `.env` 文件中使用的是 `DB_USER=postgres`，需要重置 postgres 用户密码：

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行
ALTER USER postgres WITH ENCRYPTED PASSWORD '你的新密码';

# 退出
\q
```

然后更新 `.env` 文件：
```bash
DB_USER=postgres
DB_PASSWORD=你的新密码
```

### 方案 4: 测试数据库连接

#### 4.1 使用 psql 测试连接

```bash
# 测试 edupro_user 用户连接
psql -h localhost -U edupro_user -d edupro_prod

# 如果提示输入密码，输入 .env 文件中配置的密码
# 如果连接成功，说明数据库配置正确
```

#### 4.2 使用 Node.js 测试连接

创建测试脚本：

```bash
cd /opt/EduPro/backend
nano test-db.js
```

添加以下内容：

```javascript
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: console.log
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

testConnection();
```

运行测试：

```bash
node test-db.js
```

如果测试成功，删除测试文件：
```bash
rm test-db.js
```

### 方案 5: 检查 PostgreSQL 认证配置

如果以上方案都不行，可能需要检查 PostgreSQL 的 `pg_hba.conf` 配置：

```bash
# 查找 pg_hba.conf 文件位置
sudo -u postgres psql -c "SHOW hba_file"

# 编辑配置文件
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

确保有以下配置（允许本地密码认证）：

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# 或者使用 md5（旧版本）
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**重启 PostgreSQL 服务：**
```bash
sudo systemctl restart postgresql
```

## ✅ 验证修复

### 1. 重启后端服务

```bash
# 使用 PM2 重启
pm2 restart edupro-backend

# 查看日志
pm2 logs edupro-backend --lines 50
```

### 2. 检查服务状态

```bash
# 检查 PM2 状态
pm2 status

# 查看详细日志
pm2 logs edupro-backend
```

### 3. 测试 API 端点

```bash
# 测试健康检查端点
curl http://localhost:5001/api/health

# 测试配置端点
curl http://localhost:5001/api/config/subjects
```

## 📝 常见问题

### Q1: 为什么使用 `edupro_user` 而不是 `postgres`？

**A:** 使用专用数据库用户是安全最佳实践：
- 限制权限，只授予必要的权限
- 如果用户被泄露，影响范围更小
- 符合最小权限原则

### Q2: 如何生成强密码？

```bash
# 生成随机强密码
openssl rand -base64 32
```

### Q3: 忘记数据库密码怎么办？

```bash
# 使用 postgres 超级用户重置
sudo -u postgres psql

# 在 PostgreSQL 中执行
ALTER USER edupro_user WITH ENCRYPTED PASSWORD '新密码';
\q
```

### Q4: 数据库连接超时怎么办？

检查：
1. PostgreSQL 服务是否运行：`sudo systemctl status postgresql`
2. 防火墙是否阻止连接：`sudo ufw status`
3. PostgreSQL 是否监听正确端口：`sudo netstat -tlnp | grep 5432`

## 🔐 安全建议

1. **使用强密码**：至少 16 个字符，包含大小写字母、数字和特殊字符
2. **限制访问**：只允许本地连接，或使用防火墙限制 IP
3. **定期更新密码**：建议每 3-6 个月更换一次
4. **备份配置**：将 `.env` 文件备份到安全位置（不要提交到 Git）

## 📞 需要帮助？

如果以上方案都无法解决问题，请提供以下信息：

1. `.env` 文件内容（隐藏密码）
2. PostgreSQL 版本：`psql --version`
3. 错误日志：`pm2 logs edupro-backend --lines 100`
4. 数据库用户列表：`sudo -u postgres psql -c "\du"`

