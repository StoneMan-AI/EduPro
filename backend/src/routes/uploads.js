const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
console.log('📂 上传目录路径:', uploadDir);

// 同步创建目录（如果不存在）
try {
  require('fs').mkdirSync(uploadDir, { recursive: true });
  console.log('✅ 上传目录已准备就绪');
} catch (error) {
  console.log('❌ 创建上传目录失败:', error.message);
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF 格式的图片'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 单文件上传
router.post('/image', upload.single('file'), async (req, res, next) => {
  try {
    console.log('📁 文件上传请求:', {
      hasFile: !!req.file,
      fileInfo: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        path: req.file.path
      } : null
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    // 验证文件是否真的保存到了磁盘
    try {
      await fs.access(req.file.path);
      console.log('✅ 文件已成功保存到:', req.file.path);
    } catch (error) {
      console.error('❌ 文件保存失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件保存失败'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        mimetype: req.file.mimetype
      },
      url: fileUrl // 兼容前端组件
    });
  } catch (error) {
    console.error('❌ 文件上传错误:', error);
    next(error);
  }
});

// 批量文件上传
router.post('/batch', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的文件'
      });
    }

    const results = req.files.map(file => ({
      success: true,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `成功上传 ${req.files.length} 个文件`,
      data: results,
      results // 兼容前端组件
    });
  } catch (error) {
    next(error);
  }
});

// 删除文件
router.delete('/file/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error) {
    next(error);
  }
});

// 获取文件信息
router.get('/file/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    try {
      const stats = await fs.stat(filePath);
      
      res.json({
        success: true,
        data: {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${filename}`
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error) {
    next(error);
  }
});

// 获取上传目录的所有文件
router.get('/files', async (req, res, next) => {
  try {
    // 使用已定义的uploadDir
    
    try {
      const files = await fs.readdir(uploadDir);
      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/uploads/${filename}`,
            isImage: /\.(jpg|jpeg|png|gif)$/i.test(filename)
          };
        })
      );

      res.json({
        success: true,
        data: fileInfos,
        total: fileInfos.length
      });
    } catch (error) {
      res.json({
        success: true,
        data: [],
        total: 0
      });
    }
  } catch (error) {
    next(error);
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小不能超过10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '最多只能上传10个文件'
      });
    }
  }

  next(error);
});

module.exports = router;
