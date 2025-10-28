# 图片上传访问问题诊断指南

## 问题描述
图片文件已成功上传到服务器，但通过URL无法访问。

## 诊断步骤

### 1. 检查文件是否存在
```bash
# 检查文件是否存在
ls -la /opt/EduPro/uploads/file-1761640133560-830183509.jpeg

# 检查uploads目录权限
ls -la /opt/EduPro/uploads/

# 检查文件权限
ls -la /opt/EduPro/uploads/file-1761640133560-830183509.jpeg
```

### 2. 检查Nginx配置
```bash
# 检查Nginx配置语法
nginx -t

# 重新加载Nginx配置
nginx -s reload

# 检查Nginx错误日志
tail -f /var/log/nginx/error.log
```

### 3. 测试直接访问
```bash
# 测试后端直接访问
curl -I http://localhost:5001/uploads/file-1761640133560-830183509.jpeg

# 测试Nginx访问
curl -I http://localhost/uploads/file-1761640133560-830183509.jpeg

# 测试域名访问
curl -I https://edupro.adddesigngroup.com/uploads/file-1761640133560-830183509.jpeg
```

### 4. 检查文件权限
```bash
# 确保Nginx用户有读取权限
chmod 644 /opt/EduPro/uploads/file-1761640133560-830183509.jpeg
chmod 755 /opt/EduPro/uploads/
chown -R nginx:nginx /opt/EduPro/uploads/
```

## 解决方案

### 方案1：使用当前配置（推荐）
1. 确保文件权限正确
2. 重新加载Nginx配置
3. 检查Nginx错误日志

### 方案2：使用代理配置
如果静态文件服务有问题，可以替换为代理配置：

```bash
# 备份当前配置
cp /etc/nginx/sites-available/edupro.conf /etc/nginx/sites-available/edupro.conf.backup

# 使用代理配置
cp /opt/EduPro/nginx/edupro-proxy-uploads.conf /etc/nginx/sites-available/edupro.conf

# 重新加载Nginx
nginx -s reload
```

### 方案3：检查路径配置
确保Nginx配置中的路径与实际文件路径一致：

```nginx
location /uploads/ {
    alias /opt/EduPro/uploads/;  # 注意末尾的斜杠
    # ...
}
```

## 常见问题

1. **路径末尾斜杠**：alias指令的路径必须以斜杠结尾
2. **文件权限**：确保Nginx用户有读取权限
3. **SELinux**：如果启用了SELinux，可能需要设置上下文
4. **防火墙**：确保80/443端口开放

## 验证修复
修复后，访问以下URL应该能正常显示图片：
- https://edupro.adddesigngroup.com/uploads/file-1761640133560-830183509.jpeg
