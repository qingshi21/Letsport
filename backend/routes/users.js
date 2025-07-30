const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../../database/db');

const router = express.Router();

/**
 * 获取用户信息
 * GET /api/users/profile
 */
router.get('/profile', async (req, res, next) => {
    try {
        const user_id = req.user.id;

        const [user] = await db.query(`
            SELECT 
                id, username, email, phone, real_name, avatar_url,
                membership_level, points, status, created_at
            FROM users 
            WHERE id = ?
        `, [user_id]);

        // 获取会员等级信息
        const [membership] = await db.query(`
            SELECT name, discount_rate, benefits, min_points
            FROM memberships 
            WHERE level = ?
        `, [user.membership_level]);

        // 获取下一等级信息
        const [nextMembership] = await db.query(`
            SELECT level, name, min_points
            FROM memberships 
            WHERE min_points > ?
            ORDER BY min_points ASC
            LIMIT 1
        `, [user.points]);

        res.json({
            success: true,
            data: {
                user,
                membership,
                nextMembership
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 更新用户信息
 * PUT /api/users/profile
 */
router.put('/profile', [
    body('real_name').optional().isLength({ min: 2, max: 50 }).withMessage('真实姓名长度必须在2-50个字符之间'),
    body('phone').optional().matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号码'),
    body('avatar_url').optional().isURL().withMessage('头像URL格式无效')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { real_name, phone, avatar_url } = req.body;
        const user_id = req.user.id;

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        if (real_name !== undefined) {
            updateFields.push('real_name = ?');
            updateValues.push(real_name);
        }

        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        if (avatar_url !== undefined) {
            updateFields.push('avatar_url = ?');
            updateValues.push(avatar_url);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有需要更新的字段'
            });
        }

        updateValues.push(user_id);

        // 更新用户信息
        await db.update(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // 获取更新后的用户信息
        const [user] = await db.query(`
            SELECT 
                id, username, email, phone, real_name, avatar_url,
                membership_level, points, status, created_at
            FROM users 
            WHERE id = ?
        `, [user_id]);

        res.json({
            success: true,
            message: '用户信息更新成功',
            data: user
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 修改密码
 * PUT /api/users/password
 */
router.put('/password', [
    body('current_password').notEmpty().withMessage('当前密码不能为空'),
    body('new_password').isLength({ min: 6 }).withMessage('新密码长度至少6个字符')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { current_password, new_password } = req.body;
        const user_id = req.user.id;

        // 获取当前用户密码
        const [user] = await db.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [user_id]
        );

        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '当前密码错误'
            });
        }

        // 加密新密码
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

        // 更新密码
        await db.update(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, user_id]
        );

        res.json({
            success: true,
            message: '密码修改成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户统计信息
 * GET /api/users/stats
 */
router.get('/stats', async (req, res, next) => {
    try {
        const user_id = req.user.id;

        // 获取预约统计
        const [bookingStats] = await db.query(`
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                SUM(CASE WHEN payment_status = 'paid' THEN final_price ELSE 0 END) as total_spent
            FROM bookings 
            WHERE user_id = ?
        `, [user_id]);

        // 获取评价统计
        const [reviewStats] = await db.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as avg_rating
            FROM reviews 
            WHERE user_id = ?
        `, [user_id]);

        // 获取本月预约
        const [monthlyBookings] = await db.query(`
            SELECT COUNT(*) as monthly_bookings
            FROM bookings 
            WHERE user_id = ? 
            AND MONTH(created_at) = MONTH(CURRENT_DATE())
            AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `, [user_id]);

        res.json({
            success: true,
            data: {
                bookingStats,
                reviewStats,
                monthlyBookings
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户预约历史
 * GET /api/users/bookings
 */
router.get('/bookings', async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // 查询预约历史
        const bookings = await db.query(`
            SELECT 
                b.*, v.name as venue_name, v.sport_type, v.address as venue_address
            FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [user_id, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM bookings 
            WHERE user_id = ?
        `, [user_id]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户评价历史
 * GET /api/users/reviews
 */
router.get('/reviews', async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        // 查询评价历史
        const reviews = await db.query(`
            SELECT 
                r.*, v.name as venue_name, v.sport_type
            FROM reviews r
            JOIN venues v ON r.venue_id = v.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [user_id, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM reviews 
            WHERE user_id = ?
        `, [user_id]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 