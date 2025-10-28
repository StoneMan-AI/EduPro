# Nginx 配置文件说明

## 文件结构

- `edupro.conf` - 主要配置文件（HTTP + 基础功能）
- `edupro-https.conf` - HTTPS 配置（SSL 证书获取后使用）
- `multi-project.conf.example` - 多项目配置示例

## 部署步骤

### 1. 初始部署（HTTP 模式）
```bash
# 复制主配置文件
sudo cp nginx/edupro.conf /etc/nginx/sites-available/edupro
sudo ln -s /etc/nginx/sites-available/edupro /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t
sudo nginx -s reload
```

### 2. 获取 SSL 证书
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书（会自动修改配置文件）
sudo certbot --nginx -d edupro.adddesigngroup.com
```

### 3. 验证 HTTPS 配置
```bash
# 检查证书状态
sudo certbot certificates

# 测试 HTTPS 访问
curl -I https://edupro.adddesigngroup.com
```

## 故障排除

### 问题：SSL 证书文件不存在
**错误信息：**
```
cannot load certificate "/etc/letsencrypt/live/edupro.adddesigngroup.com/fullchain.pem": BIO_new_file() failed
```

**解决方案：**
1. 确保先获取 SSL 证书再启用 HTTPS 配置
2. 或者使用 HTTP 配置进行初始部署
3. 使用 `sudo certbot --nginx -d edupro.adddesigngroup.com` 获取证书

### 问题：Nginx 配置测试失败
**检查步骤：**
```bash
# 测试配置语法
sudo nginx -t

# 查看详细错误
sudo nginx -T

# 检查证书文件是否存在
ls -la /etc/letsencrypt/live/edupro.adddesigngroup.com/
```

### 问题：端口冲突
**检查端口占用：**
```bash
# 检查 80 和 443 端口
sudo netstat -tlnp | grep -E ':(80|443)'

# 检查后端端口 5001
sudo netstat -tlnp | grep :5001
```

## 配置说明

### HTTP 配置特点
- 监听 80 端口
- 包含完整的应用功能
- 支持文件上传和 API 代理
- 适合开发和测试环境

### HTTPS 配置特点
- 监听 443 端口
- 包含 SSL 安全配置
- 自动 HTTP 到 HTTPS 重定向
- 适合生产环境

### 多项目配置
参考 `multi-project.conf.example` 了解如何在同一服务器上运行多个项目。
