-- 修复缺失的 updated_at 字段
-- 执行时间: 2025-10-28

-- 检查并添加 difficulty_levels 表的 updated_at 字段
DO $$
BEGIN
    -- 检查 difficulty_levels 表是否存在 updated_at 字段
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'difficulty_levels' 
        AND column_name = 'updated_at'
    ) THEN
        -- 添加 updated_at 字段
        ALTER TABLE difficulty_levels 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- 更新现有记录的 updated_at 字段
        UPDATE difficulty_levels 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE '已为 difficulty_levels 表添加 updated_at 字段';
    ELSE
        RAISE NOTICE 'difficulty_levels 表的 updated_at 字段已存在';
    END IF;
END $$;

-- 检查并添加其他可能缺失的 updated_at 字段
DO $$
DECLARE
    table_name TEXT;
    tables_to_check TEXT[] := ARRAY['subjects', 'grades', 'question_types', 'knowledge_points', 'questions'];
BEGIN
    FOREACH table_name IN ARRAY tables_to_check
    LOOP
        -- 检查表是否存在 updated_at 字段
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = table_name 
            AND column_name = 'updated_at'
        ) THEN
            -- 添加 updated_at 字段
            EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', table_name);
            
            -- 更新现有记录的 updated_at 字段
            EXECUTE format('UPDATE %I SET updated_at = created_at WHERE updated_at IS NULL', table_name);
            
            RAISE NOTICE '已为 % 表添加 updated_at 字段', table_name;
        ELSE
            RAISE NOTICE '% 表的 updated_at 字段已存在', table_name;
        END IF;
    END LOOP;
END $$;

-- 创建触发器函数，自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加触发器（如果不存在）
DO $$
DECLARE
    table_name TEXT;
    tables_to_update TEXT[] := ARRAY['subjects', 'grades', 'question_types', 'knowledge_points', 'questions', 'difficulty_levels'];
    trigger_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        trigger_name := table_name || '_update_updated_at';
        
        -- 检查触发器是否已存在
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.triggers 
            WHERE trigger_name = trigger_name
        ) THEN
            -- 创建触发器
            EXECUTE format('
                CREATE TRIGGER %I
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()',
                trigger_name, table_name
            );
            
            RAISE NOTICE '已为 % 表创建 updated_at 触发器', table_name;
        ELSE
            RAISE NOTICE '% 表的 updated_at 触发器已存在', table_name;
        END IF;
    END LOOP;
END $$;

-- 验证修复结果
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('subjects', 'grades', 'question_types', 'knowledge_points', 'questions', 'difficulty_levels')
AND column_name = 'updated_at'
ORDER BY table_name;

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新 updated_at 字段的触发器函数';
