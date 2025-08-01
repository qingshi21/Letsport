const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 管理员权限中间件
const adminAuthMiddleware = (req, res, next) => {
    // 先验证用户身份
    authMiddleware(req, res, (err) => {
        if (err) {
            return next(err);
        }
        
        // 检查是否是管理员
        if (!req.user || req.user.username !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '需要管理员权限'
            });
        }
        
        next();
    });
};

// 所有管理员路由都需要管理员权限
router.use(adminAuthMiddleware);

/**
 * 获取用户统计
 * GET /api/admin/users/count
 */
router.get('/users/count', async (req, res, next) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM users');
        
        res.json({
            success: true,
            data: {
                count: result.count
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取场馆统计
 * GET /api/admin/venues/count
 */
router.get('/venues/count', async (req, res, next) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM venues');
        
        res.json({
            success: true,
            data: {
                count: result.count
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取今日预约统计
 * GET /api/admin/bookings/today
 */
router.get('/bookings/today', async (req, res, next) => {
    try {
        const [result] = await db.query(`
            SELECT COUNT(*) as count 
            FROM bookings 
            WHERE DATE(booking_date) = CURDATE()
        `);
        
        res.json({
            success: true,
            data: {
                count: result.count
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 获取待审核评价统计
 * GET /api/admin/reviews/pending
 */
router.get('/reviews/pending', async (req, res, next) => {
    try {
        const [result] = await db.query(`
            SELECT COUNT(*) as count 
            FROM reviews 
            WHERE status = 'pending'
        `);
        
        res.json({
            success: true,
            data: {
                count: result.count
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router; 