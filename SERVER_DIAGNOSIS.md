# 🔍 服务器端 500 错误诊断指南

## 问题分析

API 接口返回 500 错误，可能的原因：
1. 后端服务未运行或崩溃
2. 数据库连接失败
3. 环境变量配置错误
4. 文件权限问题
5. 依赖包缺失

## 🚀 诊断步骤

### 1. 检查后端服务状态

```bash
# 检查 PM2 进程状态
pm2 status

# 查看详细日志
pm2 logs edupro-backend --lines 50

# 如果服务未运行，启动服务
pm2 start ecosystem.config.js --env production
```

### 2. 检查端口监听

```bash
# 检查 5001 端口是否被监听
netstat -tlnp | grep :5001

# 或者使用 ss 命令
ss -tlnp | grep :5001
```

### 3. 测试本地 API 连接

```bash
# 在服务器上测试本地 API
curl -v http://localhost:5001/api/questions?page=1&page_size=20

# 测试健康检查
curl http://localhost:5001/health
```

### 4. 检查数据库连接

```bash
# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_prod -c "SELECT version();"

# 检查数据库服务状态
sudo systemctl status postgresql
```

### 5. 检查环境变量

```bash
# 查看环境变量文件
cat /opt/EduPro/backend/.env

# 检查关键配置
grep -E "(DB_|PORT|NODE_ENV)" /opt/EduPro/backend/.env
```

### 6. 检查文件权限

```bash
# 检查项目目录权限
ls -la /opt/EduPro/

# 检查上传目录权限
ls -la /opt/EduPro/uploads/

# 检查日志目录权限
ls -la /var/log/edupro/
```

### 7. 检查 Nginx 配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 EduPro 特定日志
sudo tail -f /var/log/nginx/edupro.error.log
```

## 🔧 常见问题修复

### 问题 1：后端服务未启动

```bash
# 启动后端服务
cd /opt/EduPro
pm2 start ecosystem.config.js --env production

# 如果 PM2 未安装
sudo npm install -g pm2
```

### 问题 2：数据库连接失败

```bash
# 检查 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 检查数据库是否存在
sudo -u postgres psql -c "\l" | grep edupro_prod

# 如果数据库不存在，创建它
sudo -u postgres psql << 'EOF'
CREATE DATABASE edupro_prod;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_prod TO edupro_user;
EOF
```

### 问题 3：环境变量配置错误

```bash
# 创建正确的环境变量文件
cd /opt/EduPro/backend
nano .env
```

**确保包含以下配置：**
```env
NODE_ENV=production
PORT=5001
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edupro_prod
DB_USER=edupro_user
DB_PASSWORD=your_actual_password
DB_DIALECT=postgres
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://edupro.adddesigngroup.com
UPLOAD_DIR=/opt/EduPro/uploads
```

### 问题 4：文件权限问题

```bash
# 设置正确的权限
sudo chown -R $USER:$USER /opt/EduPro
sudo chmod -R 755 /opt/EduPro
sudo chmod -R 775 /opt/EduPro/uploads

# 创建日志目录
sudo mkdir -p /var/log/edupro
sudo chown -R $USER:$USER /var/log/edupro
```

### 问题 5：依赖包问题

```bash
# 重新安装依赖
cd /opt/EduPro/backend
rm -rf node_modules package-lock.json
npm install

# 检查是否有缺失的依赖
npm list --depth=0
```

## 🚨 紧急修复流程

如果问题持续存在，执行完整重启：

```bash
# 1. 停止所有服务
pm2 stop all
sudo systemctl stop nginx

# 2. 检查并清理
sudo netstat -tlnp | grep -E ':(80|443|5001)'

# 3. 重新启动
sudo systemctl start nginx
pm2 start ecosystem.config.js --env production

# 4. 验证服务
curl http://localhost:5001/health
curl https://edupro.adddesigngroup.com/api/questions?page=1&page_size=20
```

## 📊 监控和日志

### 实时监控

```bash
# 监控 PM2 日志
pm2 logs edupro-backend --lines 0 -f

# 监控 Nginx 日志
sudo tail -f /var/log/nginx/edupro.access.log
sudo tail -f /var/log/nginx/edupro.error.log

# 监控系统日志
sudo journalctl -u nginx -f
```

### 性能检查

```bash
# 检查内存使用
free -h

# 检查磁盘空间
df -h

# 检查 CPU 使用
top -p $(pgrep -f "node.*server.js")
```

## 🔍 详细错误分析

### 查看完整错误信息

```bash
# 查看 PM2 错误日志
pm2 logs edupro-backend --err --lines 100

# 查看系统日志
sudo journalctl -u nginx --since "1 hour ago"

# 查看应用日志
tail -100 /var/log/edupro/error.log
```

### 数据库连接测试

```bash
# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_prod -c "SELECT 1;"

# 检查数据库表
psql -h localhost -U edupro_user -d edupro_prod -c "\dt"
```

## 📞 获取支持信息

如果问题仍然存在，请提供以下信息：

1. **PM2 状态**：`pm2 status`
2. **错误日志**：`pm2 logs edupro-backend --lines 50`
3. **Nginx 日志**：`sudo tail -20 /var/log/nginx/edupro.error.log`
4. **系统信息**：`uname -a` 和 `node --version`
5. **端口状态**：`netstat -tlnp | grep :5001`

---

**最后更新**：2024年10月28日
