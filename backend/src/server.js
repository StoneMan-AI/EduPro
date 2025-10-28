const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5001;

// 信任代理设置 (用于Nginx反向代理)
app.set('trust proxy', true);

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 限制每个IP 100次请求
  message: '请求过于频繁，请稍后再试'
});

// 中间件
app.use(helmet()); // 安全头部
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 日志记录
app.use(limiter); // 速率限制

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务 (图片上传目录)
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '试题后台管理系统API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 根路径处理
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduPro 试题管理系统 API 服务',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      questions: '/api/questions',
      knowledgePoints: '/api/knowledge-points',
      config: '/api/config',
      uploads: '/api/uploads'
    }
  });
});

// API 路由
app.use('/api', routes);

// 404 处理
app.use(notFound);

// 错误处理中间件
app.use(errorHandler);

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步数据库模型 (开发环境)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库模型同步完成');
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  数据库: ${process.env.DB_NAME || 'edupro_db'}`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信号，正在优雅关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到 SIGINT 信号，正在优雅关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;
