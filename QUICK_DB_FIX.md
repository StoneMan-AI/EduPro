# ⚡ 快速修复数据库认证失败

## ❌ 错误信息
```
❌ 服务器启动失败: password authentication failed for user "postgres"
```

## 🔍 快速诊断

这个错误表示后端服务无法使用配置的数据库用户和密码连接 PostgreSQL。

## 🛠️ 快速修复步骤

### 步骤 1: 检查 .env 文件

```bash
# 进入后端目录
cd /var/www/EduPro/backend

# 检查 .env 文件是否存在
ls -la .env

# 查看数据库配置
cat .env | grep DB_
```

### 步骤 2: 创建或修复 .env 文件

如果 `.env` 文件不存在或配置不正确：

```bash
cd /var/www/EduPro/backend
nano .env
```

**添加以下配置（根据实际情况修改）：**

```bash
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=edupro_user
DB_PASSWORD=你的数据库密码
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=你的JWT密钥

# CORS 配置
CORS_ORIGIN=https://edupro.qingsongkao.cn

# 文件上传配置
UPLOAD_DIR=/var/www/EduPro/backend/src/uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif

# 速率限制
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

TZ=Asia/Shanghai
```

**设置文件权限：**
```bash
chmod 600 .env
```

### 步骤 3: 检查并创建数据库用户

#### 选项 A: 使用专用用户（推荐）

```bash
# 连接到 PostgreSQL
sudo -u postgres psql
```

在 PostgreSQL 命令行中执行：

```sql
-- 检查数据库是否存在
SELECT datname FROM pg_database WHERE datname = 'edupro_db';

-- 如果不存在，创建数据库
CREATE DATABASE edupro_db;

-- 检查用户是否存在
SELECT usename FROM pg_user WHERE usename = 'edupro_user';

-- 如果不存在，创建用户并设置密码
CREATE USER edupro_user WITH ENCRYPTED PASSWORD '你的强密码';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;

-- 连接到数据库并授予 schema 权限
\c edupro_db
GRANT ALL ON SCHEMA public TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edupro_user;

-- 退出
\q
```

#### 选项 B: 使用 postgres 用户（不推荐，但快速）

如果必须使用 `postgres` 用户：

```bash
# 连接到 PostgreSQL
sudo -u postgres psql
```

```sql
-- 重置 postgres 用户密码
ALTER USER postgres WITH ENCRYPTED PASSWORD '你的新密码';

-- 退出
\q
```

然后更新 `.env` 文件：
```bash
DB_USER=postgres
DB_PASSWORD=你的新密码
```

### 步骤 4: 测试数据库连接

```bash
# 测试连接（使用 edupro_user）
psql -h localhost -U edupro_user -d edupro_db

# 或者测试 postgres 用户
psql -h localhost -U postgres -d edupro_db

# 如果提示输入密码，输入 .env 文件中配置的密码
# 如果连接成功，说明配置正确
```

### 步骤 5: 重启后端服务

```bash
# 停止服务
pm2 stop edupro-backend

# 删除服务
pm2 delete edupro-backend

# 重新启动
cd /var/www/EduPro
pm2 start ecosystem.config.js --env production

# 或者直接启动
pm2 start ./backend/src/server.js --name edupro-backend --env production

# 查看日志
pm2 logs edupro-backend --lines 50

# 保存配置
pm2 save
```

### 步骤 6: 验证修复

```bash
# 检查服务状态
pm2 status

# 应该显示 edupro-backend 为 online 状态

# 查看日志确认数据库连接成功
pm2 logs edupro-backend --lines 20

# 应该看到：✅ 数据库连接成功
```

## 📝 常见问题

### Q1: 忘记数据库密码怎么办？

**A:** 使用 postgres 超级用户重置：

```bash
sudo -u postgres psql
ALTER USER edupro_user WITH ENCRYPTED PASSWORD '新密码';
\q
```

### Q2: 如何生成强密码？

```bash
# 生成随机强密码
openssl rand -base64 32
```

### Q3: 数据库不存在怎么办？

**A:** 创建数据库：

```sql
CREATE DATABASE edupro_db;
```

### Q4: 用户不存在怎么办？

**A:** 创建用户：

```sql
CREATE USER edupro_user WITH ENCRYPTED PASSWORD '密码';
GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;
```

### Q5: 权限不足怎么办？

**A:** 授予完整权限：

```sql
\c edupro_db
GRANT ALL ON SCHEMA public TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edupro_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edupro_user;
```

## ✅ 验证清单

- [ ] `.env` 文件存在且配置正确
- [ ] 数据库用户存在
- [ ] 数据库密码正确
- [ ] 数据库存在
- [ ] 用户有足够权限
- [ ] 可以使用 `psql` 连接数据库
- [ ] PM2 服务启动成功
- [ ] 日志显示"✅ 数据库连接成功"

## 🚀 一键修复脚本（谨慎使用）

如果需要快速修复，可以执行以下命令（**请先备份**）：

```bash
# 进入后端目录
cd /var/www/EduPro/backend

# 备份现有 .env（如果存在）
[ -f .env ] && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 创建新的 .env 文件（需要手动填写密码）
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=edupro_user
DB_PASSWORD=请替换为实际密码
DB_DIALECT=postgres
JWT_SECRET=请替换为JWT密钥
CORS_ORIGIN=https://edupro.qingsongkao.cn
UPLOAD_DIR=/var/www/EduPro/backend/src/uploads
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
TZ=Asia/Shanghai
EOF

chmod 600 .env

# 提示：需要手动编辑 .env 文件填写密码
echo "请编辑 .env 文件，填写正确的数据库密码和 JWT 密钥"
nano .env
```

## 📞 需要帮助？

如果以上步骤都无法解决问题，请提供：

1. `.env` 文件内容（隐藏密码）：`cat .env | grep -v PASSWORD`
2. 数据库用户列表：`sudo -u postgres psql -c "\du"`
3. 数据库列表：`sudo -u postgres psql -c "\l"`
4. PM2 日志：`pm2 logs edupro-backend --lines 100`

