# 🔧 EduPro 故障排除指南

## 常见问题及解决方案

### 1. SSL 证书相关错误

#### 问题：SSL 证书文件不存在
**错误信息：**
```
cannot load certificate "/etc/letsencrypt/live/edupro.qingsongkao.cn/fullchain.pem": BIO_new_file() failed
```

**原因：** Nginx 配置中引用了不存在的 SSL 证书文件

**解决方案：**
```bash
# 方案1：先使用 HTTP 配置部署
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/
sudo nginx -t
sudo nginx -s reload

# 然后获取 SSL 证书
sudo certbot --nginx -d edupro.qingsongkao.cn
```

**方案2：检查域名解析**
```bash
# 确保域名正确解析到服务器 IP
nslookup edupro.qingsongkao.cn
dig edupro.qingsongkao.cn

# 检查防火墙是否允许 80 和 443 端口
sudo ufw status
sudo ufw allow 'Nginx Full'
```

#### 问题：Certbot 无法获取证书
**错误信息：**
```
The nginx plugin is not working; there may be problems with your existing configuration
```

**解决方案：**
```bash
# 1. 检查 Nginx 配置语法
sudo nginx -t

# 2. 确保域名解析正确
ping edupro.qingsongkao.cn

# 3. 检查端口是否被占用
sudo netstat -tlnp | grep -E ':(80|443)'

# 4. 临时停止可能冲突的服务
sudo systemctl stop apache2  # 如果安装了 Apache

# 5. 重新尝试获取证书
sudo certbot --nginx -d edupro.qingsongkao.cn
```

### 2. Nginx 配置错误

#### 问题：Nginx 配置测试失败
```bash
# 测试配置语法
sudo nginx -t

# 查看详细配置
sudo nginx -T

# 检查错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 问题：端口冲突
```bash
# 检查端口占用
sudo netstat -tlnp | grep -E ':(80|443|5001)'

# 查看哪个进程占用了端口
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :5001

# 停止冲突的进程
sudo systemctl stop <service-name>
```

### 3. 数据库连接问题

#### 问题：数据库连接失败
**错误信息：**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案：**
```bash
# 1. 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 2. 启动 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. 检查数据库是否存在
sudo -u postgres psql -c "\l"

# 4. 检查用户权限
sudo -u postgres psql -c "\du"

# 5. 测试连接
psql -h localhost -U edupro_user -d edupro_db -c "SELECT version();"
```

#### 问题：数据库用户权限不足
```bash
# 重新创建用户并授权
sudo -u postgres psql << 'EOF'
DROP USER IF EXISTS edupro_user;
CREATE USER edupro_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;
ALTER USER edupro_user CREATEDB;
\q
EOF
```

### 4. 应用启动问题

#### 问题：PM2 进程启动失败
```bash
# 查看 PM2 状态
pm2 status

# 查看详细日志
pm2 logs edupro-backend

# 重启应用
pm2 restart edupro-backend

# 删除并重新启动
pm2 delete edupro-backend
pm2 start ecosystem.config.js --env production
```

#### 问题：端口 5001 被占用
```bash
# 检查端口占用
sudo lsof -i :5001

# 修改端口（编辑 ecosystem.config.js）
nano ecosystem.config.js
# 修改 PORT: 5002

# 同时修改 Nginx 配置中的代理端口
sudo nano /etc/nginx/sites-available/edupro
# 修改 proxy_pass http://127.0.0.1:5002;
```

### 5. 文件权限问题

#### 问题：上传文件失败
```bash
# 检查上传目录权限
ls -la /var/www/edupro/uploads/

# 设置正确的权限
sudo chown -R $USER:www-data /var/www/edupro
sudo chmod -R 755 /var/www/edupro
sudo chmod -R 775 /var/www/edupro/uploads
```

#### 问题：日志文件无法写入
```bash
# 创建日志目录
sudo mkdir -p /var/log/edupro
sudo chown -R $USER:$USER /var/log/edupro

# 设置权限
sudo chmod -R 755 /var/log/edupro
```

### 6. 前端构建问题

#### 问题：前端构建失败
```bash
# 清理并重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build

# 检查构建输出
ls -la dist/
```

#### 问题：前端资源 404
```bash
# 检查 Nginx 配置中的 root 路径
grep -n "root" /etc/nginx/sites-available/edupro

# 确保路径正确
ls -la /var/www/edupro/frontend/dist/

# 重新加载 Nginx
sudo nginx -s reload
```

### 7. 环境变量问题

#### 问题：环境变量未生效
```bash
# 检查 .env 文件是否存在
ls -la backend/.env

# 检查文件内容
cat backend/.env

# 检查文件权限
ls -la backend/.env

# 重启应用使环境变量生效
pm2 restart edupro-backend
```

### 8. 网络连接问题

#### 问题：无法访问应用
```bash
# 检查应用是否在运行
pm2 status
sudo netstat -tlnp | grep :5001

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查防火墙
sudo ufw status

# 测试本地访问
curl http://localhost:5001/health
curl http://localhost/api/health
```

#### 问题：API 请求失败
```bash
# 检查 CORS 配置
grep CORS_ORIGIN backend/.env

# 检查 API 路由
curl -v http://localhost:5001/api/health

# 查看应用日志
pm2 logs edupro-backend
```

## 调试工具

### 1. 日志查看
```bash
# 应用日志
pm2 logs edupro-backend

# Nginx 访问日志
sudo tail -f /var/log/nginx/edupro.access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/edupro.error.log

# 系统日志
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### 2. 网络诊断
```bash
# 检查端口监听
sudo netstat -tlnp

# 检查进程
ps aux | grep -E "(nginx|node|postgres)"

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 3. 配置验证
```bash
# 验证 Nginx 配置
sudo nginx -t

# 验证数据库连接
psql -h localhost -U edupro_user -d edupro_db -c "SELECT 1;"

# 验证环境变量
pm2 show edupro-backend
```

## 紧急恢复

### 1. 快速回滚
```bash
# 停止应用
pm2 stop edupro-backend

# 恢复 Nginx 配置
sudo cp /etc/nginx/sites-available/edupro.backup /etc/nginx/sites-available/edupro
sudo nginx -s reload

# 恢复数据库（如果有备份）
pg_restore -h localhost -U edupro_user -d edupro_db /var/backups/edupro/backup.sql
```

### 2. 完全重置
```bash
# 停止所有服务
pm2 stop all
sudo systemctl stop nginx

# 清理配置
sudo rm -f /etc/nginx/sites-enabled/edupro
sudo rm -f /etc/nginx/sites-available/edupro

# 重新开始部署
# 按照 MANUAL_DEPLOYMENT.md 重新部署
```

## 联系支持

如果问题仍然存在，请提供以下信息：

1. **错误日志**：`pm2 logs edupro-backend`
2. **系统信息**：`uname -a` 和 `lsb_release -a`
3. **服务状态**：`pm2 status` 和 `sudo systemctl status nginx`
4. **网络测试**：`curl -I http://localhost:5001/health`
5. **配置检查**：`sudo nginx -t`

---

**最后更新**：2024年10月
**维护人员**：EduPro 开发团队
