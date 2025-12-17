-- 新增学习视频表
-- 说明：
-- - 学科/年级/知识点为必填
-- - 状态默认：已发布
-- - 文件存储路径：/uploads/xxx（实际文件在 backend/src/uploads）
-- - 为与“题目管理”页面保持一致，保留题型/难度字段（可为空）

CREATE TABLE IF NOT EXISTS learning_videos (
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
    tags TEXT[],
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_learning_videos_subject ON learning_videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_videos_grade ON learning_videos(grade_id);
CREATE INDEX IF NOT EXISTS idx_learning_videos_knowledge_point ON learning_videos(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_learning_videos_status ON learning_videos(status);
CREATE INDEX IF NOT EXISTS idx_learning_videos_created_at ON learning_videos(created_at);


