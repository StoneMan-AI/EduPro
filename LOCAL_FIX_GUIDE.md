# 🔧 本地修复指南

## 问题描述

前端构建失败：`The symbol "questions" has already been declared`

## ✅ 已修复的问题

1. **重复变量声明** - 删除了重复的 `questions` 变量声明
2. **数据安全处理** - 添加了数组类型检查防止 `.map()` 错误

## 🚀 本地修复步骤

### 1. 验证修复
```bash
# 在本地项目目录执行
cd frontend
npm run build
```

### 2. 如果构建成功
```bash
# 构建成功后，将 dist 目录上传到服务器
# 或者使用以下命令同步到服务器（如果配置了 SSH）
scp -r dist/* user@server:/opt/EduPro/frontend/dist/
```

### 3. 如果构建失败
检查是否还有其他语法错误，并修复它们。

## 📋 服务器部署步骤

### 方法 1：手动上传
1. 将本地 `frontend/dist/` 目录内容上传到服务器 `/opt/EduPro/frontend/dist/`
2. 确保文件权限正确：
   ```bash
   sudo chown -R www-data:www-data /opt/EduPro/frontend/dist/
   ```

### 方法 2：Git 部署
1. 提交修复到 Git 仓库
2. 在服务器上拉取更新：
   ```bash
   cd /opt/EduPro
   git pull
   cd frontend
   npm run build
   ```

### 方法 3：直接编辑服务器文件
如果无法本地构建，可以直接在服务器上编辑文件：
```bash
# 在服务器上编辑文件
nano /opt/EduPro/frontend/src/pages/Questions.jsx

# 删除第374行的重复声明：
# const questions = questionsData?.data || []
# const total = questionsData?.total || 0

# 然后重新构建
cd /opt/EduPro/frontend
npm run build
```

## 🔍 验证修复

### 1. 检查构建
```bash
# 在服务器上检查
ls -la /opt/EduPro/frontend/dist/
```

### 2. 测试网站
1. 清除浏览器缓存（Ctrl+Shift+R）
2. 访问 https://edupro.adddesigngroup.com
3. 检查控制台是否还有错误

## 📊 预期结果

修复后应该看到：
- ✅ 前端构建成功
- ✅ 网站正常加载
- ✅ 无 JavaScript 错误
- ✅ 下拉选择框正常显示

---

**修复时间**: 5-10 分钟
**需要操作**: 本地构建 + 服务器部署
