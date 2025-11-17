# 🔧 数据库修复指南

## 问题描述

API 返回 500 错误，错误信息显示：
- `column difficultyLevel.updated_at does not exist`
- `column "updated_at" does not exist`

这表明数据库表缺少 `updated_at` 字段。

## 🚀 快速修复

### 方法 1：执行修复脚本（推荐）

```bash
# 在服务器上执行
cd /opt/EduPro
psql -h localhost -U edupro_user -d edupro_db -f database/fix_missing_columns.sql
```

### 方法 2：手动修复

```bash
# 连接到数据库
psql -h localhost -U edupro_user -d edupro_db

# 在 psql 中执行以下命令
```

```sql
-- 添加缺失的 updated_at 字段
ALTER TABLE difficulty_levels ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 更新现有记录
UPDATE difficulty_levels SET updated_at = created_at WHERE updated_at IS NULL;

-- 验证修复
\d difficulty_levels
```

### 方法 3：重新导入数据库结构

```bash
# 备份现有数据（可选）
pg_dump -h localhost -U edupro_user -d edupro_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 重新导入修复后的结构
psql -h localhost -U edupro_user -d edupro_db -f database/schema.sql
```

## 🔍 验证修复

### 1. 检查表结构
```sql
-- 检查 difficulty_levels 表结构
\d difficulty_levels

-- 检查所有表的 updated_at 字段
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('subjects', 'grades', 'question_types', 'knowledge_points', 'questions', 'difficulty_levels')
AND column_name = 'updated_at'
ORDER BY table_name;
```

### 2. 测试 API
```bash
# 测试题目列表 API
curl "https://edupro.qingsongkao.cn/api/questions?page=1&page_size=20"

# 测试难度级别 API
curl "https://edupro.qingsongkao.cn/api/config/difficulty-levels"
```

### 3. 重启后端服务
```bash
# 重启 PM2 服务
pm2 restart edupro-backend

# 查看日志确认无错误
pm2 logs edupro-backend --lines 20
```

## 📊 预期结果

修复后，API 应该返回正常数据：

```json
{
  "success": true,
  "data": {
    "questions": [...],
    "pagination": {...}
  }
}
```

## 🚨 如果问题持续存在

### 检查其他可能的问题

1. **检查所有表结构**
```sql
-- 检查所有表是否有 updated_at 字段
SELECT 
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as updated_at_status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.column_name = 'updated_at'
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
```

2. **检查 Sequelize 模型配置**
```bash
# 检查模型文件
grep -r "updatedAt" /opt/EduPro/backend/src/models/
```

3. **完全重建数据库**
```bash
# 删除并重建数据库
sudo -u postgres psql -c "DROP DATABASE IF EXISTS edupro_db;"
sudo -u postgres psql -c "CREATE DATABASE edupro_db;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE edupro_db TO edupro_user;"

# 重新导入结构
psql -h localhost -U edupro_user -d edupro_db -f database/schema.sql
```

## 📝 预防措施

为了避免类似问题，建议：

1. **使用数据库迁移**：使用 Sequelize 的迁移功能管理数据库结构
2. **版本控制**：将数据库结构变更纳入版本控制
3. **测试环境**：在测试环境验证数据库变更
4. **备份策略**：定期备份生产数据库

---

**修复时间**：预计 5-10 分钟
**影响范围**：数据库结构修复，不影响现有数据
