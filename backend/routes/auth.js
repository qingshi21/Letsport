const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../../database/db');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6个字符'),
    body('phone')
        .optional()
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码')
], async (req, res, next) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, email, password, phone, real_name } = req.body;

        // 检查用户名是否已存在
        const [existingUser] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名或邮箱已存在'
            });
        }

        // 加密密码
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 创建用户
        const result = await db.insert(
            'INSERT INTO users (username, email, password_hash, phone, real_name) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, phone, real_name]
        );

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user: {
                    id: result.insertId,
                    username,
                    email,
                    real_name,
                    membership_level: 'bronze',
                    points: 0
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', [
    body('username')
        .notEmpty()
        .withMessage('用户名不能为空'),
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
], async (req, res, next) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const [user] = await db.query(
            'SELECT id, username, email, password_hash, real_name, membership_level, points, status FROM users WHERE (username = ? OR email = ?) AND status = "active"',
            [username, username]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // 移除密码哈希
        delete user.password_hash;

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
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

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 验证用户是否存在
        const [user] = await db.query(
            'SELECT id FROM users WHERE id = ? AND status = "active"',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 生成新令牌
        const newToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            success: true,
            message: '令牌刷新成功',
            data: {
                token: newToken
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 