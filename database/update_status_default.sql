-- 更新题目状态默认值为"已发布"
-- 执行此脚本前请先备份数据库

-- 1. 修改表结构，更新默认值
ALTER TABLE questions ALTER COLUMN status SET DEFAULT '已发布';

-- 2. 更新现有数据（可选：将"未处理"状态的题目改为"已发布"）
-- 注意：这会影响现有数据，请根据实际需求决定是否执行
-- UPDATE questions SET status = '已发布' WHERE status = '未处理';

-- 3. 验证修改结果
SELECT 
    status, 
    COUNT(*) as count 
FROM questions 
GROUP BY status 
ORDER BY status;
