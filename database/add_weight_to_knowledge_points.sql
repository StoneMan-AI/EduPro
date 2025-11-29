-- 为知识点表添加权重字段
-- 执行时间：2025-01-XX
-- 说明：为已有数据设置默认权重值为0

-- 1. 添加权重字段
ALTER TABLE knowledge_points 
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 0;

-- 2. 为已有数据设置默认权重值为0
UPDATE knowledge_points 
SET weight = 0 
WHERE weight IS NULL;

-- 3. 确保权重字段不能为NULL
ALTER TABLE knowledge_points 
ALTER COLUMN weight SET DEFAULT 0,
ALTER COLUMN weight SET NOT NULL;

-- 4. 添加注释
COMMENT ON COLUMN knowledge_points.weight IS '知识点权重，用于排序和优先级计算';

