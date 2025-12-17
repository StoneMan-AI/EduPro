const express = require('express');
const router = express.Router();

// 导入路由模块
const questionRoutes = require('./questions');
const knowledgePointRoutes = require('./knowledgePoints');
const configRoutes = require('./config');
const uploadRoutes = require('./uploads');
const videoRoutes = require('./videos');

// 注册路由
router.use('/questions', questionRoutes);
router.use('/knowledge-points', knowledgePointRoutes);
router.use('/config', configRoutes);
router.use('/uploads', uploadRoutes);
router.use('/videos', videoRoutes);

// API 根路径
router.get('/', (req, res) => {
  res.json({
    message: '试题后台管理系统 API',
    version: '1.0.0',
    endpoints: {
      questions: '/api/questions',
      videos: '/api/videos',
      knowledgePoints: '/api/knowledge-points',
      config: '/api/config',
      uploads: '/api/uploads'
    }
  });
});

module.exports = router;
