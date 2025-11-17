# 🔧 环境变量加载问题修复指南

## ❌ 问题描述

使用 `psql` 可以正常连接数据库，但服务器启动时提示密码认证失败。

## 🔍 问题原因

PM2 的工作目录是 `/var/www/EduPro`，而 `.env` 文件在 `/var/www/EduPro/backend/.env`。`dotenv` 默认在当前工作目录查找 `.env` 文件，导致无法找到配置文件。

## ✅ 已修复

已更新代码，现在会自动查找以下位置的 `.env` 文件：
1. `/var/www/EduPro/backend/.env` (优先)
2. `/var/www/EduPro/.env` (备用)

## 🛠️ 验证步骤

### 步骤 1: 确认 .env 文件位置

```bash
# 检查 .env 文件是否存在
ls -la /var/www/EduPro/backend/.env

# 查看数据库配置
cat /var/www/EduPro/backend/.env | grep DB_
```

### 步骤 2: 确认数据库配置

确保 `.env` 文件中的配置与您能连接的数据库一致：

```bash
# 查看当前配置
cat /var/www/EduPro/backend/.env | grep -E "DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|DB_PORT"
```

**重要**: 确保 `DB_NAME` 与您能连接的数据库名称一致：
- 如果 `psql` 连接的是 `edupro_db`，则 `.env` 中应该是 `DB_NAME=edupro_db`
- 如果 `psql` 连接的是 `edupro_prod`，则 `.env` 中应该是 `DB_NAME=edupro_prod`

### 步骤 3: 验证 .env 文件格式

确保 `.env` 文件格式正确：

```bash
# 检查是否有语法错误
cat /var/www/EduPro/backend/.env

# 确保：
# 1. 没有多余的空格
# 2. 没有引号（除非值中包含空格）
# 3. 每行一个配置项
# 4. 没有注释在同一行
```

**正确格式示例：**
```bash
DB_NAME=edupro_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

**错误格式示例：**
```bash
DB_NAME = edupro_db  # ❌ 等号两边有空格
DB_PASSWORD="password"  # ❌ 不需要引号（除非值中有空格）
DB_NAME=edupro_db # comment  # ❌ 注释在同一行可能有问题
```

### 步骤 4: 重启服务并查看日志

```bash
# 停止服务
pm2 stop edupro-backend
pm2 delete edupro-backend

# 重新启动
cd /var/www/EduPro
pm2 start ecosystem.config.js --env production

# 查看启动日志
pm2 logs edupro-backend --lines 50
```

**应该看到以下输出：**
```
📁 环境变量文件路径: /var/www/EduPro/backend/.env
📁 文件是否存在: true
🔐 数据库配置: {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'edupro_db',
  DB_USER: 'postgres',
  DB_PASSWORD: '***已设置***'
}
✅ 数据库连接成功
```

### 步骤 5: 如果仍然失败

如果日志显示 `DB_PASSWORD: '未设置'`，说明 `.env` 文件没有被正确加载。

**检查清单：**
1. ✅ `.env` 文件路径是否正确：`/var/www/EduPro/backend/.env`
2. ✅ 文件权限是否正确：`chmod 600 /var/www/EduPro/backend/.env`
3. ✅ 文件格式是否正确（无多余空格、无引号等）
4. ✅ 配置项名称是否正确（`DB_PASSWORD` 不是 `DB_PASS` 或其他）

**手动测试环境变量加载：**

创建测试脚本：

```bash
cd /var/www/EduPro/backend
cat > test-env.js << 'EOF'
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('环境变量测试:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***已设置***' : '未设置');
EOF

node test-env.js
rm test-env.js
```

## 🔧 常见问题

### Q1: 日志显示 "文件是否存在: false"

**A:** `.env` 文件不在预期位置。检查文件路径：
```bash
find /var/www/EduPro -name ".env" -type f
```

### Q2: 日志显示 "DB_PASSWORD: '未设置'"

**A:** `.env` 文件中的配置项名称或格式有问题。检查：
```bash
# 检查配置项名称
cat /var/www/EduPro/backend/.env | grep -i password

# 确保是 DB_PASSWORD（不是 DB_PASS 或其他）
```

### Q3: 数据库名称不匹配

**A:** 确保 `.env` 中的 `DB_NAME` 与您能连接的数据库名称一致：
```bash
# 查看您能连接的数据库
psql -h localhost -U postgres -l

# 更新 .env 文件中的 DB_NAME
nano /var/www/EduPro/backend/.env
```

### Q4: 密码包含特殊字符

**A:** 如果密码包含特殊字符，可能需要用引号：
```bash
# 如果密码包含 $、# 等特殊字符
DB_PASSWORD="your$password#here"
```

### Q5: 文件编码问题

**A:** 确保 `.env` 文件使用 UTF-8 编码：
```bash
# 检查文件编码
file /var/www/EduPro/backend/.env

# 如果编码不对，重新创建文件
nano /var/www/EduPro/backend/.env
```

## 📝 完整配置示例

确保 `/var/www/EduPro/backend/.env` 文件包含以下内容：

```bash
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# 数据库配置（根据实际情况修改）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_db
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_DIALECT=postgres

# 安全配置
JWT_SECRET=your_jwt_secret

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

## ✅ 验证修复

修复后，重启服务并检查日志：

```bash
pm2 restart edupro-backend
pm2 logs edupro-backend --lines 30
```

应该看到：
- ✅ 环境变量文件路径正确
- ✅ 文件存在
- ✅ 数据库配置正确显示
- ✅ 数据库连接成功

## 📞 需要帮助？

如果问题仍然存在，请提供：

1. 环境变量文件路径输出
2. 数据库配置输出（隐藏密码）
3. 完整的错误日志
4. `.env` 文件内容（隐藏密码）：`cat /var/www/EduPro/backend/.env | grep -v PASSWORD`

