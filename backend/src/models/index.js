const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 加载环境变量 - 支持从项目根目录或 backend 目录查找 .env 文件
const envPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');
const envFile = fs.existsSync(backendEnvPath) ? backendEnvPath : envPath;
require('dotenv').config({ path: envFile });

// 调试：输出环境变量加载信息
console.log('📁 环境变量文件路径:', envFile);
console.log('📁 文件是否存在:', fs.existsSync(envFile));
console.log('🔐 数据库配置:', {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'edupro_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ? '***已设置***' : '未设置'
});

// 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'edupro_db',
  process.env.DB_USER || 'postgres', 
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00' // 中国时区
  }
);

// 导入模型
const Subject = require('./Subject')(sequelize);
const Grade = require('./Grade')(sequelize);
const QuestionType = require('./QuestionType')(sequelize);
const DifficultyLevel = require('./DifficultyLevel')(sequelize);
const KnowledgePoint = require('./KnowledgePoint')(sequelize);
const Question = require('./Question')(sequelize);
const LearningVideo = require('./LearningVideo')(sequelize);

// 定义关联关系
const defineAssociations = () => {
  // Subject 关联
  Subject.hasMany(Question, { 
    foreignKey: 'subject_id', 
    as: 'questions' 
  });
  Subject.hasMany(LearningVideo, {
    foreignKey: 'subject_id',
    as: 'learningVideos'
  });
  Subject.hasMany(KnowledgePoint, { 
    foreignKey: 'subject_id', 
    as: 'knowledgePoints' 
  });

  // Grade 关联
  Grade.hasMany(Question, { 
    foreignKey: 'grade_id', 
    as: 'questions' 
  });
  Grade.hasMany(LearningVideo, {
    foreignKey: 'grade_id',
    as: 'learningVideos'
  });
  Grade.hasMany(KnowledgePoint, { 
    foreignKey: 'grade_id', 
    as: 'knowledgePoints' 
  });

  // QuestionType 关联
  QuestionType.hasMany(Question, { 
    foreignKey: 'question_type_id', 
    as: 'questions' 
  });
  QuestionType.hasMany(LearningVideo, {
    foreignKey: 'question_type_id',
    as: 'learningVideos'
  });

  // DifficultyLevel 关联
  DifficultyLevel.hasMany(Question, { 
    foreignKey: 'difficulty_id', 
    as: 'questions' 
  });
  DifficultyLevel.hasMany(LearningVideo, {
    foreignKey: 'difficulty_id',
    as: 'learningVideos'
  });

  // KnowledgePoint 关联
  KnowledgePoint.belongsTo(Subject, { 
    foreignKey: 'subject_id', 
    as: 'subject' 
  });
  KnowledgePoint.belongsTo(Grade, { 
    foreignKey: 'grade_id', 
    as: 'grade' 
  });
  KnowledgePoint.hasMany(Question, { 
    foreignKey: 'knowledge_point_id', 
    as: 'questions' 
  });
  KnowledgePoint.hasMany(LearningVideo, {
    foreignKey: 'knowledge_point_id',
    as: 'learningVideos'
  });
  KnowledgePoint.hasMany(KnowledgePoint, { 
    foreignKey: 'parent_id', 
    as: 'children' 
  });
  KnowledgePoint.belongsTo(KnowledgePoint, { 
    foreignKey: 'parent_id', 
    as: 'parent' 
  });

  // Question 关联
  Question.belongsTo(Subject, { 
    foreignKey: 'subject_id', 
    as: 'subject' 
  });
  Question.belongsTo(Grade, { 
    foreignKey: 'grade_id', 
    as: 'grade' 
  });
  Question.belongsTo(QuestionType, { 
    foreignKey: 'question_type_id', 
    as: 'questionType' 
  });
  Question.belongsTo(DifficultyLevel, { 
    foreignKey: 'difficulty_id', 
    as: 'difficultyLevel' 
  });
  Question.belongsTo(KnowledgePoint, { 
    foreignKey: 'knowledge_point_id', 
    as: 'knowledgePoint' 
  });

  // LearningVideo 关联
  LearningVideo.belongsTo(Subject, {
    foreignKey: 'subject_id',
    as: 'subject'
  });
  LearningVideo.belongsTo(Grade, {
    foreignKey: 'grade_id',
    as: 'grade'
  });
  LearningVideo.belongsTo(KnowledgePoint, {
    foreignKey: 'knowledge_point_id',
    as: 'knowledgePoint'
  });
  LearningVideo.belongsTo(QuestionType, {
    foreignKey: 'question_type_id',
    as: 'questionType'
  });
  LearningVideo.belongsTo(DifficultyLevel, {
    foreignKey: 'difficulty_id',
    as: 'difficultyLevel'
  });
};

// 执行关联定义
defineAssociations();

// 导出所有模型和sequelize实例
module.exports = {
  sequelize,
  Subject,
  Grade,
  QuestionType,
  DifficultyLevel,
  KnowledgePoint,
  Question,
  LearningVideo
};
