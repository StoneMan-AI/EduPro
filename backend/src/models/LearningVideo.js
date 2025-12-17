const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LearningVideo = sequelize.define('LearningVideo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '视频标题（可为空）'
    },
    cover_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图片URL（展示图）'
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '视频文件URL'
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '学科ID'
    },
    grade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '年级ID'
    },
    knowledge_point_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '知识点ID'
    },
    // 为了与“题目管理”页面筛选/展示保持一致（可选字段）
    question_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '题型ID（可为空）'
    },
    difficulty_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '难度ID（可为空）'
    },
    status: {
      type: DataTypes.ENUM('未处理', '已标注', '已审核', '已发布'),
      defaultValue: '已发布',
      comment: '处理状态'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: '标签数组'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注信息'
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '创建人'
    },
    updated_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '更新人'
    }
  }, {
    tableName: 'learning_videos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '学习视频表',
    indexes: [
      { fields: ['subject_id'] },
      { fields: ['grade_id'] },
      { fields: ['knowledge_point_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });

  return LearningVideo;
};


