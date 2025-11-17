# 📁 路径更新总结

## 已更新的文件路径

所有配置文件已从 `/var/www/edupro/` 更新为 `/opt/EduPro/`

### ✅ 已更新的文件

#### 1. Nginx 配置
- `nginx/edupro.conf` - 前端静态文件路径和上传文件路径
- `nginx/multi-project.conf.example` - 多项目配置示例

#### 2. 进程管理
- `ecosystem.config.js` - PM2 工作目录

#### 3. 部署文档
- `MANUAL_DEPLOYMENT.md` - 手动部署指南
- `QUICK_DEPLOY.md` - 快速部署指南  
- `SUBDOMAIN_DEPLOYMENT.md` - 二级域名部署指南

#### 4. Docker 配置
- `docker/Dockerfile` - 容器工作目录
- `docker/docker-compose.prod.yml` - 卷挂载路径

## 🔧 需要手动检查的配置

### 1. 环境变量文件
确保 `backend/.env` 中的路径正确：
```bash
UPLOAD_DIR=/opt/EduPro/uploads
```

### 2. 服务器上的实际路径
确保以下目录存在并具有正确权限：
```bash
# 检查目录是否存在
ls -la /opt/EduPro/

# 设置正确权限
sudo chown -R $USER:$USER /opt/EduPro
sudo chmod -R 755 /opt/EduPro
sudo chmod -R 775 /opt/EduPro/uploads
```

### 3. Nginx 配置部署
```bash
# 复制更新后的 Nginx 配置
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload
```

### 4. PM2 配置更新
```bash
# 如果 PM2 服务正在运行，重启以应用新配置
pm2 restart edupro-backend

# 或者重新启动
pm2 stop edupro-backend
pm2 start ecosystem.config.js --env production
```

## 🚀 验证部署

### 1. 检查服务状态
```bash
# 检查 PM2 状态
pm2 status

# 检查端口监听
netstat -tlnp | grep :5001
```

### 2. 测试 API
```bash
# 测试根路径
curl http://localhost:5001/

# 测试健康检查
curl http://localhost:5001/health
```

### 3. 测试前端
```bash
# 检查前端文件是否存在
ls -la /opt/EduPro/frontend/dist/

# 测试通过 Nginx 访问
curl -I https://edupro.qingsongkao.cn/
```

## 📝 注意事项

1. **权限设置**：确保 `/opt/EduPro` 目录有正确的读写权限
2. **SELinux**：如果启用了 SELinux，可能需要设置适当的上下文
3. **防火墙**：确保端口 5001 和 80/443 已开放
4. **日志目录**：确保 `/var/log/edupro/` 目录存在且有写权限

---

**更新完成时间**：2024年10月28日
**影响范围**：所有部署相关配置文件
