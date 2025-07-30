const jwt = require('jsonwebtoken');
const db = require('../../database/db');

/**
 * JWT认证中间件
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        // 验证JWT令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 从数据库获取用户信息
        const [user] = await db.query(
            'SELECT id, username, email, real_name, membership_level, points, status FROM users WHERE id = ? AND status = "active"',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 将用户信息添加到请求对象
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '访问令牌已过期'
            });
        }

        console.error('认证中间件错误:', error);
        return res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return next(); // 继续执行，不设置用户信息
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const [user] = await db.query(
            'SELECT id, username, email, real_name, membership_level, points, status FROM users WHERE id = ? AND status = "active"',
            [decoded.userId]
        );

        if (user) {
            req.user = user;
        }
        
        next();
        
    } catch (error) {
        // 可选认证失败时不返回错误，继续执行
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware
}; 