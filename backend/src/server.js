const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// 加载环境变量 - 支持从项目根目录或 backend 目录查找 .env 文件
const envPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: fs.existsSync(backendEnvPath) ? backendEnvPath : envPath });

const { sequelize } = require('./models');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5001;

// 信任代理设置 (用于Nginx反向代理)
// 只信任第一个代理（Nginx），而不是所有代理，提高安全性
app.set('trust proxy', 1);

// 速率限制 - 内部系统，默认禁用限流
// 如需启用限流，设置环境变量 RATE_LIMIT_ENABLED=true
const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true';

// 创建一个空的中间件（不限制）
const noLimit = (req, res, next) => next();

// 如果启用限流，则创建限流中间件；否则使用空中间件
const limiter = rateLimitEnabled ? rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10000, // 10000次请求（15分钟内）
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
}) : noLimit;

// 配置类 API 使用相同的限流策略
const configLimiter = limiter;

// 中间件
app.use(helmet()); // 安全头部
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 日志记录
// 注意：限流在路由级别应用，不在全局应用

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// 配置类 API 使用更宽松的限流（先注册，优先匹配）
app.use('/api/config', configLimiter, require('./routes/config'));

// 其他 API 使用通用限流
app.use('/api', limiter, routes);

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
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 服务器运行在 http://${HOST}:${PORT}`);
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
