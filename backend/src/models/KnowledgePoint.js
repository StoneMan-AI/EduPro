const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const KnowledgePoint = sequelize.define('KnowledgePoint', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '知识点名称'
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
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父知识点ID'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '知识点描述'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否激活'
    }
  }, {
    tableName: 'knowledge_points',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '知识点表',
    indexes: [
      {
        fields: ['subject_id']
      },
      {
        fields: ['parent_id']
      }
    ]
  });

  return KnowledgePoint;
};
