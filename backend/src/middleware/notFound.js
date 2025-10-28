const notFound = (req, res, next) => {
  // 如果是 API 请求，返回 JSON 格式的错误
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `找不到路由 ${req.originalUrl}`,
      timestamp: new Date().toISOString()
    });
  }
  
  // 其他请求返回 HTML 格式的错误页面
  res.status(404).json({
    success: false,
    message: `找不到路由 ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
};

module.exports = { notFound };
