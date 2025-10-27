const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '题目标题'
    },
    question_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '题干图片URL'
    },
    answer_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '答案图片URL'
    },
    subject_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '学科ID'
    },
    grade_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '年级ID'
    },
    knowledge_point_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '知识点ID'
    },
    question_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '题型ID'
    },
    difficulty_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '难度ID'
    },
    status: {
      type: DataTypes.ENUM('未处理', '已标注', '已审核', '已发布'),
      defaultValue: '未处理',
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
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '题目表',
    indexes: [
      {
        fields: ['subject_id']
      },
      {
        fields: ['grade_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return Question;
};
