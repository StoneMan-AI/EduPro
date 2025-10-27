const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error(err);

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // Sequelize 唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    const message = `${field} 已存在，请使用其他值`;
    error = {
      message,
      statusCode: 400
    };
  }

  // Sequelize 外键约束错误
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = '关联数据不存在或已被删除';
    error = {
      message,
      statusCode: 400
    };
  }

  // Sequelize 数据库连接错误
  if (err.name === 'SequelizeConnectionError') {
    const message = '数据库连接失败';
    error = {
      message,
      statusCode: 500
    };
  }

  // JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'JSON 格式错误';
    error = {
      message,
      statusCode: 400
    };
  }

  // 默认错误
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
