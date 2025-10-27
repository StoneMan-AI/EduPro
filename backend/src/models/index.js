const { Sequelize } = require('sequelize');
require('dotenv').config();

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

// 定义关联关系
const defineAssociations = () => {
  // Subject 关联
  Subject.hasMany(Question, { 
    foreignKey: 'subject_id', 
    as: 'questions' 
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
  Grade.hasMany(KnowledgePoint, { 
    foreignKey: 'grade_id', 
    as: 'knowledgePoints' 
  });

  // QuestionType 关联
  QuestionType.hasMany(Question, { 
    foreignKey: 'question_type_id', 
    as: 'questions' 
  });

  // DifficultyLevel 关联
  DifficultyLevel.hasMany(Question, { 
    foreignKey: 'difficulty_id', 
    as: 'questions' 
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
  Question
};
