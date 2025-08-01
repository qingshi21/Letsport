/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    console.error('错误详情:', err);

    // 数据库错误
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: '数据已存在，请检查输入信息'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: '关联数据不存在'
        });
    }

    // 验证错误
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: err.errors
        });
    }

    // JWT错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的访问令牌'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '访问令牌已过期'
        });
    }

    // 默认错误响应
    const statusCode = err.statusCode || 500;
    const message = err.message || '服务器内部错误';

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    errorHandler,
    AppError
}; 