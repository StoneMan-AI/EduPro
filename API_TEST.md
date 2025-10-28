# 🔧 API 测试指南

## 问题诊断

如果您遇到 `{"success":false,"message":"找不到路由 /"}` 错误，请按照以下步骤进行诊断和修复。

## 测试步骤

### 1. 测试后端 API 服务

```bash
# 测试根路径
curl http://localhost:5001/

# 测试健康检查
curl http://localhost:5001/health

# 测试 API 根路径
curl http://localhost:5001/api/

# 测试题目列表
curl http://localhost:5001/api/questions
```

**期望的响应：**

根路径 `/` 应该返回：
```json
{
  "success": true,
  "message": "EduPro 试题管理系统 API 服务",
  "version": "1.0.0",
  "timestamp": "2024-10-28T...",
  "endpoints": {
    "health": "/health",
    "api": "/api",
    "questions": "/api/questions",
    "knowledgePoints": "/api/knowledge-points",
    "config": "/api/config",
    "uploads": "/api/uploads"
  }
}
```

### 2. 测试 Nginx 代理

```bash
# 测试通过 Nginx 访问
curl http://edupro.adddesigngroup.com/

# 测试 API 代理
curl http://edupro.adddesigngroup.com/api/

# 测试健康检查
curl http://edupro.adddesigngroup.com/health
```

### 3. 检查服务状态

```bash
# 检查 PM2 进程
pm2 status

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E ':(80|5001)'
```

## 常见问题及解决方案

### 问题 1：后端服务未启动

**症状：** `curl http://localhost:5001/` 返回连接拒绝

**解决方案：**
```bash
# 启动后端服务
cd /var/www/edupro
pm2 start ecosystem.config.js --env production

# 检查日志
pm2 logs edupro-backend
```

### 问题 2：Nginx 配置错误

**症状：** 直接访问后端正常，通过 Nginx 访问失败

**解决方案：**
```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载 Nginx
sudo nginx -s reload
```

### 问题 3：前端路由问题

**症状：** 访问前端页面时显示 API 错误

**解决方案：**
```bash
# 检查前端构建
ls -la /var/www/edupro/frontend/dist/

# 重新构建前端
cd /var/www/edupro/frontend
npm run build

# 检查 Nginx 静态文件配置
grep -A 5 -B 5 "root" /etc/nginx/sites-available/edupro
```

### 问题 4：端口冲突

**症状：** 服务启动失败或端口被占用

**解决方案：**
```bash
# 检查端口占用
sudo lsof -i :5001

# 如果端口被占用，修改配置
nano ecosystem.config.js
# 修改 PORT: 5002

# 同时修改 Nginx 配置
sudo nano /etc/nginx/sites-available/edupro
# 修改 proxy_pass http://127.0.0.1:5002;
```

## 调试命令

### 查看实时日志
```bash
# 后端日志
pm2 logs edupro-backend --lines 50

# Nginx 访问日志
sudo tail -f /var/log/nginx/edupro.access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/edupro.error.log
```

### 测试网络连接
```bash
# 测试本地连接
telnet localhost 5001

# 测试外部连接
telnet edupro.adddesigngroup.com 80
```

### 检查文件权限
```bash
# 检查应用目录权限
ls -la /var/www/edupro/

# 检查日志目录权限
ls -la /var/log/edupro/
```

## 完整重启流程

如果问题持续存在，可以尝试完整重启：

```bash
# 1. 停止所有服务
pm2 stop all
sudo systemctl stop nginx

# 2. 检查并清理
sudo netstat -tlnp | grep -E ':(80|5001)'

# 3. 重新启动
sudo systemctl start nginx
pm2 start ecosystem.config.js --env production

# 4. 验证服务
curl http://localhost:5001/
curl http://edupro.adddesigngroup.com/
```

## 联系支持

如果问题仍然存在，请提供：

1. **错误日志**：`pm2 logs edupro-backend`
2. **Nginx 日志**：`sudo tail -20 /var/log/nginx/edupro.error.log`
3. **测试结果**：上述 curl 命令的输出
4. **系统信息**：`uname -a` 和 `pm2 status`

---

**最后更新**：2024年10月
