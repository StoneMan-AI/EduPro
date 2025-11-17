# ⚡ 500 错误快速修复

## 🚨 立即执行的修复步骤

### 1. 检查服务状态
```bash
# 检查 PM2 状态
pm2 status

# 如果服务未运行，启动它
pm2 start ecosystem.config.js --env production
```

### 2. 查看错误日志
```bash
# 查看最近的错误日志
pm2 logs edupro-backend --lines 20

# 查看实时日志
pm2 logs edupro-backend --lines 0 -f
```

### 3. 测试本地 API
```bash
# 在服务器上测试
curl http://localhost:5001/health
curl http://localhost:5001/api/questions?page=1&page_size=20
```

### 4. 检查数据库
```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U edupro_user -d edupro_db -c "SELECT 1;"
```

### 5. 重启服务
```bash
# 重启后端服务
pm2 restart edupro-backend

# 重启 Nginx
sudo nginx -s reload
```

## 🔧 如果上述步骤无效

### 完全重启流程
```bash
# 1. 停止所有服务
pm2 stop all
sudo systemctl stop nginx

# 2. 等待 5 秒
sleep 5

# 3. 重新启动
sudo systemctl start nginx
pm2 start ecosystem.config.js --env production

# 4. 验证
curl http://localhost:5001/health
```

### 检查环境变量
```bash
# 检查环境变量文件
cat /opt/EduPro/backend/.env

# 确保包含正确的数据库配置
grep DB_ /opt/EduPro/backend/.env
```

---

**预计修复时间**：5-10 分钟
