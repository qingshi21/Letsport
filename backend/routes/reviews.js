const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// 使用可选认证中间件
router.use(optionalAuthMiddleware);

/**
 * 提交评价
 * POST /api/reviews
 */
router.post('/', [
    body('venue_id').isInt({ min: 1 }).withMessage('场馆ID无效'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('content').optional().isLength({ max: 1000 }).withMessage('评价内容不能超过1000字符'),
    body('booking_id').optional().isInt({ min: 1 }).withMessage('预约ID无效')
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

        const { venue_id, rating, content, booking_id } = req.body;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        // 检查场馆是否存在
        const [venue] = await db.query(
            'SELECT id FROM venues WHERE id = ? AND status = "active"',
            [venue_id]
        );

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: '场馆不存在'
            });
        }

        // 检查是否已经评价过
        const [existingReview] = await db.query(
            'SELECT id FROM reviews WHERE user_id = ? AND venue_id = ?',
            [user_id, venue_id]
        );

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: '您已经评价过这个场馆'
            });
        }

        // 如果提供了预约ID，验证预约是否存在且属于当前用户
        if (booking_id) {
            const [booking] = await db.query(
                'SELECT id FROM bookings WHERE id = ? AND user_id = ? AND status = "completed"',
                [booking_id, user_id]
            );

            if (!booking) {
                return res.status(400).json({
                    success: false,
                    message: '预约不存在或未完成'
                });
            }
        }

        // 创建评价
        const result = await db.insert(`
            INSERT INTO reviews (user_id, venue_id, booking_id, rating, content)
            VALUES (?, ?, ?, ?, ?)
        `, [user_id, venue_id, booking_id || null, rating, content || null]);

        // 更新场馆评分
        await updateVenueRating(venue_id);

        // 获取创建的评价详情
        const [review] = await db.query(`
            SELECT 
                r.*, u.username, u.real_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: '评价提交成功',
            data: review
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取场馆评价列表
 * GET /api/reviews/venue/:venue_id
 */
router.get('/venue/:venue_id', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '查询参数验证失败',
                errors: errors.array()
            });
        }

        const { venue_id } = req.params;
        const { page = 1, limit = 10, rating } = req.query;

        // 构建查询条件
        let whereConditions = ['r.venue_id = ?', 'r.status = "approved"'];
        let queryParams = [venue_id];

        if (rating) {
            whereConditions.push('r.rating = ?');
            queryParams.push(parseInt(rating));
        }

        const offset = (page - 1) * limit;

        // 查询评价列表
        const reviews = await db.query(`
            SELECT 
                r.id, r.rating, r.content, r.created_at,
                u.username, u.real_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM reviews r
            WHERE ${whereConditions.join(' AND ')}
        `, queryParams);

        // 查询评分统计
        const ratingStats = await db.query(`
            SELECT 
                rating,
                COUNT(*) as count
            FROM reviews r
            WHERE r.venue_id = ? AND r.status = "approved"
            GROUP BY rating
            ORDER BY rating DESC
        `, [venue_id]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                reviews,
                ratingStats,
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
 * 获取用户评价列表
 * GET /api/reviews/user
 */
router.get('/user', async (req, res, next) => {
    try {
        const user_id = req.user?.id;
        const { page = 1, limit = 10 } = req.query;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const offset = (page - 1) * limit;

        // 查询用户评价列表
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

/**
 * 更新评价
 * PUT /api/reviews/:id
 */
router.put('/:id', [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('content').optional().isLength({ max: 1000 }).withMessage('评价内容不能超过1000字符')
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

        const { id } = req.params;
        const { rating, content } = req.body;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        // 检查评价是否存在且属于当前用户
        const [review] = await db.query(
            'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评价不存在'
            });
        }

        // 构建更新字段
        const updateFields = [];
        const updateValues = [];

        if (rating !== undefined) {
            updateFields.push('rating = ?');
            updateValues.push(rating);
        }

        if (content !== undefined) {
            updateFields.push('content = ?');
            updateValues.push(content);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有需要更新的字段'
            });
        }

        updateValues.push(id);

        // 更新评价
        await db.update(
            `UPDATE reviews SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // 更新场馆评分
        await updateVenueRating(review.venue_id);

        res.json({
            success: true,
            message: '评价更新成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 删除评价
 * DELETE /api/reviews/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        // 检查评价是否存在且属于当前用户
        const [review] = await db.query(
            'SELECT venue_id FROM reviews WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评价不存在'
            });
        }

        // 删除评价
        await db.delete('DELETE FROM reviews WHERE id = ?', [id]);

        // 更新场馆评分
        await updateVenueRating(review.venue_id);

        res.json({
            success: true,
            message: '评价删除成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 更新场馆评分的辅助函数
 */
async function updateVenueRating(venue_id) {
    try {
        // 计算平均评分和评价数量
        const [stats] = await db.query(`
            SELECT 
                AVG(rating) as avg_rating,
                COUNT(*) as review_count
            FROM reviews 
            WHERE venue_id = ? AND status = "approved"
        `, [venue_id]);

        // 更新场馆评分
        await db.update(`
            UPDATE venues 
            SET rating = ?, review_count = ?
            WHERE id = ?
        `, [stats.avg_rating || 0, stats.review_count || 0, venue_id]);

    } catch (error) {
        console.error('更新场馆评分失败:', error);
    }
}

module.exports = router; 