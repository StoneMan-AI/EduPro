# 图片访问404问题诊断指南

## 问题描述
图片已成功上传到服务器，数据已插入数据库，但通过 `https://edupro.adddesigngroup.com/uploads/filename.jpg` 访问返回404。

## 诊断步骤

### 1. 检查文件是否存在
```bash
# 检查文件是否存在
ls -la /opt/EduPro/uploads/filename.jpg

# 检查uploads目录权限
ls -la /opt/EduPro/uploads/

# 检查文件权限
ls -la /opt/EduPro/uploads/filename.jpg
```

### 2. 检查Nginx配置
```bash
# 检查Nginx配置语法
nginx -t

# 重新加载Nginx配置
nginx -s reload

# 检查Nginx错误日志
tail -f /var/log/nginx/error.log

# 检查Nginx访问日志
tail -f /var/log/nginx/edupro.access.log
```

### 3. 测试直接访问
```bash
# 测试后端直接访问
curl -I http://localhost:5001/uploads/filename.jpg

# 测试Nginx本地访问
curl -I http://localhost/uploads/filename.jpg

# 测试域名访问
curl -I https://edupro.adddesigngroup.com/uploads/filename.jpg
```

### 4. 检查文件权限
```bash
# 确保Nginx用户有读取权限
chmod 644 /opt/EduPro/uploads/filename.jpg
chmod 755 /opt/EduPro/uploads/
chown -R nginx:nginx /opt/EduPro/uploads/

# 或者使用www-data用户（根据系统配置）
chown -R www-data:www-data /opt/EduPro/uploads/
```

### 5. 检查SELinux（如果启用）
```bash
# 检查SELinux状态
sestatus

# 如果启用，设置文件上下文
chcon -R -t httpd_exec_t /opt/EduPro/uploads/
```

## 解决方案

### 方案1：使用简化配置
```bash
# 备份当前配置
cp /etc/nginx/sites-available/edupro.conf /etc/nginx/sites-available/edupro.conf.backup

# 使用简化配置
cp /opt/EduPro/nginx/edupro-simple-uploads.conf /etc/nginx/sites-available/edupro.conf

# 重新加载Nginx
nginx -s reload
```

### 方案2：使用代理配置
```bash
# 使用代理配置（推荐）
cp /opt/EduPro/nginx/edupro-proxy-uploads.conf /etc/nginx/sites-available/edupro.conf

# 重新加载Nginx
nginx -s reload
```

### 方案3：检查路径配置
确保Nginx配置中的路径与实际文件路径完全一致：

```nginx
location /uploads/ {
    alias /opt/EduPro/uploads/;  # 注意末尾的斜杠
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
}
```

## 常见问题

1. **路径末尾斜杠**：`alias` 指令的路径必须以斜杠结尾
2. **文件权限**：确保Nginx用户有读取权限
3. **SELinux**：如果启用了SELinux，需要设置正确的上下文
4. **Nginx配置未重新加载**：修改配置后必须重新加载
5. **防火墙**：确保80/443端口开放

## 验证修复
修复后，访问以下URL应该能正常显示图片：
- https://edupro.adddesigngroup.com/uploads/filename.jpg

## 调试技巧
1. 查看浏览器开发者工具的Network标签
2. 检查Nginx错误日志中的具体错误信息
3. 使用curl命令测试不同层级的访问
4. 检查文件权限和所有者
