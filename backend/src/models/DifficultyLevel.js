const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DifficultyLevel = sequelize.define('DifficultyLevel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '难度名称'
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      comment: '难度代码'
    },
    level_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '难度数值'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '难度描述'
    }
  }, {
    tableName: 'difficulty_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '难度级别表'
  });

  return DifficultyLevel;
};
