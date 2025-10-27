const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `找不到路由 ${req.originalUrl}`
  });
};

module.exports = { notFound };
