-- 试题后台管理系统数据库结构
-- 创建时间: 2025-10-27

-- 学科表
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 年级表
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 题型表
CREATE TABLE question_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识点表（用户可自定义）
CREATE TABLE knowledge_points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES knowledge_points(id) ON DELETE CASCADE,
    description TEXT,
    weight INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 难度级别表
CREATE TABLE difficulty_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    level_value INTEGER NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 题目表
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    question_image_url VARCHAR(500), -- 题干图片路径
    answer_image_url VARCHAR(500),   -- 答案图片路径
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    knowledge_point_id INTEGER REFERENCES knowledge_points(id) ON DELETE SET NULL,
    question_type_id INTEGER REFERENCES question_types(id) ON DELETE SET NULL,
    difficulty_id INTEGER REFERENCES difficulty_levels(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT '已发布' CHECK (status IN ('未处理', '已标注', '已审核', '已发布')),
    tags TEXT[], -- 额外标签（数组格式）
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 创建索引提高查询性能
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_grade ON questions(grade_id);
CREATE INDEX idx_questions_knowledge_point ON questions(knowledge_point_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_knowledge_points_subject ON knowledge_points(subject_id);
CREATE INDEX idx_knowledge_points_grade ON knowledge_points(grade_id);
CREATE INDEX idx_knowledge_points_parent ON knowledge_points(parent_id);

-- 学习视频表（与“题目管理”页保持一致的筛选字段）
CREATE TABLE learning_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    cover_image_url VARCHAR(500), -- 封面图路径（展示图）
    video_url VARCHAR(500),       -- 视频文件路径
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE RESTRICT,
    knowledge_point_id INTEGER NOT NULL REFERENCES knowledge_points(id) ON DELETE RESTRICT,
    question_type_id INTEGER REFERENCES question_types(id) ON DELETE SET NULL,
    difficulty_id INTEGER REFERENCES difficulty_levels(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT '已发布' CHECK (status IN ('未处理', '已标注', '已审核', '已发布')),
    tags TEXT[], -- 额外标签（数组格式）
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX idx_learning_videos_subject ON learning_videos(subject_id);
CREATE INDEX idx_learning_videos_grade ON learning_videos(grade_id);
CREATE INDEX idx_learning_videos_knowledge_point ON learning_videos(knowledge_point_id);
CREATE INDEX idx_learning_videos_status ON learning_videos(status);
CREATE INDEX idx_learning_videos_created_at ON learning_videos(created_at);

-- 插入基础数据

-- 学科数据
INSERT INTO subjects (name, code, description) VALUES 
    ('数学', 'MATH', '数学学科'),
    ('语文', 'CHINESE', '语文学科'),
    ('英语', 'ENGLISH', '英语学科'),
    ('物理', 'PHYSICS', '物理学科'),
    ('化学', 'CHEMISTRY', '化学学科'),
    ('生物', 'BIOLOGY', '生物学科'),
    ('历史', 'HISTORY', '历史学科'),
    ('地理', 'GEOGRAPHY', '地理学科'),
    ('政治', 'POLITICS', '政治学科');

-- 年级数据
INSERT INTO grades (name, code, sort_order) VALUES 
    ('小学一年级', 'G1', 1),
    ('小学二年级', 'G2', 2),
    ('小学三年级', 'G3', 3),
    ('小学四年级', 'G4', 4),
    ('小学五年级', 'G5', 5),
    ('小学六年级', 'G6', 6),
    ('初中一年级', 'G7', 7),
    ('初中二年级', 'G8', 8),
    ('初中三年级', 'G9', 9),
    ('高中一年级', 'G10', 10),
    ('高中二年级', 'G11', 11),
    ('高中三年级', 'G12', 12);

-- 题型数据
INSERT INTO question_types (name, code, description) VALUES 
    ('选择题', 'CHOICE', '单选题或多选题'),
    ('填空题', 'BLANK', '填空题'),
    ('解答题', 'SOLVE', '解答题'),
    ('计算题', 'CALC', '计算题'),
    ('证明题', 'PROOF', '证明题'),
    ('应用题', 'APPLICATION', '应用题'),
    ('作文题', 'COMPOSITION', '作文题'),
    ('阅读理解', 'READING', '阅读理解题');

-- 难度级别数据
INSERT INTO difficulty_levels (name, code, level_value, description) VALUES 
    ('简单', 'EASY', 1, '基础难度'),
    ('中等', 'MEDIUM', 2, '中等难度'),
    ('困难', 'HARD', 3, '较高难度'),
    ('极难', 'EXPERT', 4, '高等难度');

-- 示例知识点数据（按年级和学科分类）

-- 小学数学知识点
INSERT INTO knowledge_points (name, subject_id, grade_id, description) VALUES 
    ('数与代数', 1, 1, '小学一年级数与代数'),
    ('图形与几何', 1, 1, '小学一年级图形与几何'),
    ('统计与概率', 1, 2, '小学二年级统计与概率'),
    ('四则运算', 1, 3, '小学三年级四则运算'),
    ('分数小数', 1, 4, '小学四年级分数小数');

-- 初中数学知识点
INSERT INTO knowledge_points (name, subject_id, grade_id, description) VALUES 
    ('有理数', 1, 7, '初中一年级有理数'),
    ('整式', 1, 7, '初中一年级整式'),
    ('一元一次方程', 1, 7, '初中一年级一元一次方程'),
    ('平面图形', 1, 8, '初中二年级平面图形'),
    ('二次函数', 1, 9, '初中三年级二次函数');

-- 高中数学知识点
INSERT INTO knowledge_points (name, subject_id, grade_id, description) VALUES 
    ('集合', 1, 10, '高中一年级集合'),
    ('函数', 1, 10, '高中一年级函数'),
    ('三角函数', 1, 11, '高中二年级三角函数'),
    ('数列', 1, 11, '高中二年级数列'),
    ('导数', 1, 12, '高中三年级导数');

-- 插入子知识点（带年级关联）
INSERT INTO knowledge_points (name, subject_id, grade_id, parent_id, description) VALUES 
    ('自然数', 1, 1, (SELECT id FROM knowledge_points WHERE name='数与代数' AND grade_id=1), '自然数的认识'),
    ('加法减法', 1, 1, (SELECT id FROM knowledge_points WHERE name='数与代数' AND grade_id=1), '10以内加法减法'),
    ('认识图形', 1, 1, (SELECT id FROM knowledge_points WHERE name='图形与几何' AND grade_id=1), '基本图形认识'),
    ('正数负数', 1, 7, (SELECT id FROM knowledge_points WHERE name='有理数' AND grade_id=7), '正数负数概念'),
    ('有理数运算', 1, 7, (SELECT id FROM knowledge_points WHERE name='有理数' AND grade_id=7), '有理数四则运算');

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_question_types_updated_at BEFORE UPDATE ON question_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_knowledge_points_updated_at BEFORE UPDATE ON knowledge_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：题目详情视图（包含所有关联信息）
CREATE VIEW question_details AS
SELECT 
    q.id,
    q.title,
    q.question_image_url,
    q.answer_image_url,
    s.name as subject_name,
    s.code as subject_code,
    g.name as grade_name,
    g.code as grade_code,
    kp.name as knowledge_point_name,
    kp_g.name as knowledge_point_grade_name,
    qt.name as question_type_name,
    dl.name as difficulty_name,
    dl.level_value as difficulty_level,
    q.status,
    q.tags,
    q.remarks,
    q.created_at,
    q.updated_at,
    q.created_by,
    q.updated_by
FROM questions q
LEFT JOIN subjects s ON q.subject_id = s.id
LEFT JOIN grades g ON q.grade_id = g.id
LEFT JOIN knowledge_points kp ON q.knowledge_point_id = kp.id
LEFT JOIN grades kp_g ON kp.grade_id = kp_g.id
LEFT JOIN question_types qt ON q.question_type_id = qt.id
LEFT JOIN difficulty_levels dl ON q.difficulty_id = dl.id;

COMMENT ON TABLE questions IS '题目表，存储试题的基本信息和属性标注';
COMMENT ON TABLE subjects IS '学科表，系统预设的学科分类';
COMMENT ON TABLE grades IS '年级表，学校年级分类';
COMMENT ON TABLE knowledge_points IS '知识点表，可由用户自定义添加和管理';
COMMENT ON TABLE question_types IS '题型表，题目类型分类';
COMMENT ON TABLE difficulty_levels IS '难度级别表，题目难度分级';
COMMENT ON VIEW question_details IS '题目详情视图，包含所有关联的属性信息';
