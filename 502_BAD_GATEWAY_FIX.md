# 🔧 502 Bad Gateway 错误修复指南

## ❌ 错误信息
```
502 Bad Gateway
https://edupro.qingsongkao.cn/api/config/subjects 502 (Bad Gateway)
```

## 🔍 问题诊断

502 错误通常表示 Nginx 无法连接到后端服务。可能的原因：

1. **后端服务未运行**
2. **后端服务监听地址不正确**
3. **端口不匹配**
4. **防火墙阻止连接**

## 🛠️ 诊断步骤

### 步骤 1: 检查后端服务状态

```bash
# 检查 PM2 进程状态
pm2 status

# 查看后端服务日志
pm2 logs edupro-backend --lines 50

# 检查服务是否在运行
pm2 list | grep edupro-backend
```

### 步骤 2: 检查端口监听

```bash
# 检查 5001 端口是否被监听
sudo netstat -tlnp | grep 5001

# 或者使用 ss 命令
sudo ss -tlnp | grep 5001

# 检查服务监听的地址
# 应该显示 0.0.0.0:5001 或 127.0.0.1:5001
```

### 步骤 3: 测试后端服务直接访问

```bash
# 在服务器上测试本地连接
curl http://127.0.0.1:5001/health

# 或者测试 API 端点
curl http://127.0.0.1:5001/api/config/subjects
```

### 步骤 4: 检查 Nginx 错误日志

```bash
# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 或者查看特定域名的错误日志（如果配置了）
sudo tail -f /var/log/nginx/edupro_error.log
```

## 🔧 解决方案

### 方案 1: 修复后端服务监听地址

**问题**: `server.js` 中的 `app.listen()` 可能只监听 `localhost`，需要监听 `0.0.0.0`。

**修复方法**:

编辑 `backend/src/server.js`，修改 `app.listen()` 调用：

```javascript
// 修改前
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  // ...
});

// 修改后
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
  // ...
});
```

### 方案 2: 更新 PM2 配置路径

**问题**: `ecosystem.config.js` 中的 `cwd` 路径可能不正确。

**修复方法**:

如果项目路径是 `/var/www/EduPro/`，需要更新 `ecosystem.config.js`：

```javascript
cwd: '/var/www/EduPro',  // 从 /opt/EduPro 改为实际路径
```

### 方案 3: 重启后端服务

```bash
# 停止服务
pm2 stop edupro-backend

# 删除服务
pm2 delete edupro-backend

# 重新启动（使用更新后的配置）
cd /var/www/EduPro
pm2 start ecosystem.config.js --env production

# 或者直接启动
pm2 start ./backend/src/server.js --name edupro-backend --env production

# 保存 PM2 配置
pm2 save
```

### 方案 4: 检查环境变量

```bash
# 进入后端目录
cd /var/www/EduPro/backend

# 检查 .env 文件是否存在
ls -la .env

# 检查关键配置
cat .env | grep -E "PORT|HOST|DB_"
```

确保 `.env` 文件中包含：

```bash
PORT=5001
HOST=0.0.0.0
NODE_ENV=production
```

### 方案 5: 检查防火墙

```bash
# 检查防火墙状态
sudo ufw status

# 如果防火墙开启，确保允许本地连接
# 502 错误通常是本地连接问题，不需要开放外部端口
```

## ✅ 验证修复

### 1. 验证后端服务运行

```bash
# 检查 PM2 状态
pm2 status

# 应该显示 edupro-backend 为 online 状态
```

### 2. 验证端口监听

```bash
# 检查端口
sudo netstat -tlnp | grep 5001

# 应该显示类似：
# tcp  0  0  0.0.0.0:5001  0.0.0.0:*  LISTEN  12345/node
```

### 3. 测试本地连接

```bash
# 测试健康检查
curl http://127.0.0.1:5001/health

# 应该返回 JSON 响应
```

### 4. 测试 API 端点

```bash
# 测试配置端点
curl http://127.0.0.1:5001/api/config/subjects

# 应该返回数据
```

### 5. 测试通过 Nginx

```bash
# 测试 HTTPS 访问
curl -I https://edupro.qingsongkao.cn/api/config/subjects

# 应该返回 200 OK
```

## 📝 常见问题

### Q1: PM2 显示服务为 "errored" 状态

**A:** 检查日志找出错误原因：
```bash
pm2 logs edupro-backend --err --lines 100
```

常见原因：
- 数据库连接失败
- 端口被占用
- 环境变量缺失

### Q2: 端口 5001 已被占用

**A:** 查找占用端口的进程并处理：
```bash
# 查找占用端口的进程
sudo lsof -i :5001

# 或者
sudo fuser -k 5001/tcp

# 然后重启服务
pm2 restart edupro-backend
```

### Q3: 数据库连接失败导致服务无法启动

**A:** 参考 `DATABASE_AUTH_FIX.md` 修复数据库连接问题。

### Q4: Nginx 日志显示 "Connection refused"

**A:** 这表示后端服务未运行或未监听正确地址：
1. 检查服务是否运行：`pm2 status`
2. 检查监听地址：`sudo netstat -tlnp | grep 5001`
3. 确保监听 `0.0.0.0:5001` 而不是 `127.0.0.1:5001`

## 🔐 快速修复命令

如果确定是监听地址问题，可以快速修复：

```bash
# 1. 编辑 server.js
cd /var/www/EduPro/backend/src
nano server.js

# 2. 找到 app.listen(PORT, ...) 行
# 3. 修改为：app.listen(PORT, '0.0.0.0', ...)

# 4. 重启服务
pm2 restart edupro-backend

# 5. 验证
curl http://127.0.0.1:5001/health
```

## 📞 需要帮助？

如果以上方案都无法解决问题，请提供：

1. PM2 状态：`pm2 status`
2. 端口监听：`sudo netstat -tlnp | grep 5001`
3. 后端日志：`pm2 logs edupro-backend --lines 100`
4. Nginx 错误日志：`sudo tail -50 /var/log/nginx/error.log`
5. 本地测试结果：`curl http://127.0.0.1:5001/health`

