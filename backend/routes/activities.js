const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// 使用可选认证中间件
router.use(optionalAuthMiddleware);

/**
 * 获取活动列表
 * GET /api/activities
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('activity_type').optional().isIn(['tournament', 'training', 'social', 'competition', 'workshop']),
    query('sport_type').optional().isIn(['basketball', 'badminton', 'tennis', 'swimming', 'football', 'volleyball', 'table_tennis', 'gym']),
    query('status').optional().isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
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

        const { page = 1, limit = 10, activity_type, sport_type, status = 'published' } = req.query;

        // 构建查询条件
        let whereConditions = ['a.status = ?'];
        let queryParams = [status];

        if (activity_type) {
            whereConditions.push('a.activity_type = ?');
            queryParams.push(activity_type);
        }

        if (sport_type) {
            whereConditions.push('a.sport_type = ?');
            queryParams.push(sport_type);
        }

        const offset = (page - 1) * limit;

        // 查询活动列表
        const activities = await db.query(`
            SELECT 
                a.*,
                v.name as venue_name,
                v.address as venue_address,
                COUNT(DISTINCT ap.user_id) as participant_count,
                COUNT(DISTINCT ac.id) as comment_count,
                AVG(ac.rating) as avg_rating
            FROM activities a
            LEFT JOIN venues v ON a.venue_id = v.id
            LEFT JOIN activity_participants ap ON a.id = ap.activity_id AND ap.status IN ('confirmed', 'attended')
            LEFT JOIN activity_comments ac ON a.id = ac.activity_id AND ac.status = 'approved'
            WHERE ${whereConditions.join(' AND ')}
            GROUP BY a.id
            ORDER BY a.start_date ASC, a.start_time ASC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM activities a
            WHERE ${whereConditions.join(' AND ')}
        `, queryParams);

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取活动详情
 * GET /api/activities/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // 查询活动详情
        const [activity] = await db.query(`
            SELECT 
                a.*,
                v.name as venue_name,
                v.address as venue_address,
                v.phone as venue_phone,
                u.username as organizer_username,
                u.real_name as organizer_real_name
            FROM activities a
            LEFT JOIN venues v ON a.venue_id = v.id
            LEFT JOIN users u ON a.organizer_id = u.id
            WHERE a.id = ?
        `, [id]);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        // 查询参与人数
        const [{ participant_count }] = await db.query(`
            SELECT COUNT(*) as participant_count
            FROM activity_participants
            WHERE activity_id = ? AND status IN ('confirmed', 'attended')
        `, [id]);

        // 查询评论统计
        const [{ comment_count, avg_rating }] = await db.query(`
            SELECT 
                COUNT(*) as comment_count,
                AVG(rating) as avg_rating
            FROM activity_comments
            WHERE activity_id = ? AND status = 'approved'
        `, [id]);

        // 检查当前用户是否已参与
        let userParticipation = null;
        if (req.user) {
            const [participation] = await db.query(`
                SELECT * FROM activity_participants
                WHERE activity_id = ? AND user_id = ?
            `, [id, req.user.id]);
            userParticipation = participation;
        }

        res.json({
            success: true,
            data: {
                ...activity,
                participant_count,
                comment_count,
                avg_rating: parseFloat(avg_rating || 0).toFixed(1),
                user_participation: userParticipation
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 参与活动
 * POST /api/activities/:id/participate
 */
router.post('/:id/participate', [
    body('notes').optional().isLength({ max: 500 }).withMessage('备注不能超过500字符')
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

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const { id } = req.params;
        const { notes } = req.body;
        const user_id = req.user.id;

        // 检查活动是否存在且可参与
        const [activity] = await db.query(`
            SELECT * FROM activities 
            WHERE id = ? AND status = 'published'
        `, [id]);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在或已结束'
            });
        }

        // 检查是否已参与
        const [existingParticipation] = await db.query(`
            SELECT * FROM activity_participants
            WHERE activity_id = ? AND user_id = ?
        `, [id, user_id]);

        if (existingParticipation) {
            return res.status(400).json({
                success: false,
                message: '您已经参与过这个活动'
            });
        }

        // 检查是否还有名额
        if (activity.max_participants && activity.current_participants >= activity.max_participants) {
            return res.status(400).json({
                success: false,
                message: '活动名额已满'
            });
        }

        // 创建参与记录
        await db.insert(`
            INSERT INTO activity_participants (activity_id, user_id, notes, payment_amount)
            VALUES (?, ?, ?, ?)
        `, [id, user_id, notes, activity.price]);

        // 更新活动参与人数
        await db.update(`
            UPDATE activities 
            SET current_participants = current_participants + 1
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: '活动参与成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 取消参与活动
 * DELETE /api/activities/:id/participate
 */
router.delete('/:id/participate', async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const { id } = req.params;
        const user_id = req.user.id;

        // 检查是否已参与
        const [participation] = await db.query(`
            SELECT * FROM activity_participants
            WHERE activity_id = ? AND user_id = ?
        `, [id, user_id]);

        if (!participation) {
            return res.status(404).json({
                success: false,
                message: '您未参与此活动'
            });
        }

        // 删除参与记录
        await db.delete(`
            DELETE FROM activity_participants
            WHERE activity_id = ? AND user_id = ?
        `, [id, user_id]);

        // 更新活动参与人数
        await db.update(`
            UPDATE activities 
            SET current_participants = current_participants - 1
            WHERE id = ?
        `, [id]);

        res.json({
            success: true,
            message: '已取消参与活动'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 