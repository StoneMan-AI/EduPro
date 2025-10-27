const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuestionType = sequelize.define('QuestionType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '题型名称'
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '题型代码'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '题型描述'
    }
  }, {
    tableName: 'question_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '题型表'
  });

  return QuestionType;
};
