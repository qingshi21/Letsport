const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// 使用可选认证中间件
router.use(optionalAuthMiddleware);

/**
 * 获取活动评论列表
 * GET /api/activity-comments/activity/:activity_id
 */
router.get('/activity/:activity_id', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('parent_id').optional().isInt({ min: 1 })
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

        const { activity_id } = req.params;
        const { page = 1, limit = 20, parent_id } = req.query;

        // 构建查询条件
        let whereConditions = ['ac.activity_id = ?', 'ac.status = "approved"'];
        let queryParams = [activity_id];

        if (parent_id) {
            whereConditions.push('ac.parent_id = ?');
            queryParams.push(parent_id);
        } else {
            whereConditions.push('ac.parent_id IS NULL');
        }

        const offset = (page - 1) * limit;

        // 查询评论列表
        const comments = await db.query(`
            SELECT 
                ac.*,
                u.username,
                u.real_name,
                u.avatar_url,
                COUNT(acl.id) as likes_count,
                EXISTS(SELECT 1 FROM activity_comment_likes WHERE comment_id = ac.id AND user_id = ?) as is_liked
            FROM activity_comments ac
            JOIN users u ON ac.user_id = u.id
            LEFT JOIN activity_comment_likes acl ON ac.id = acl.comment_id
            WHERE ${whereConditions.join(' AND ')}
            GROUP BY ac.id
            ORDER BY ac.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, req.user?.id || 0, parseInt(limit), offset]);

        // 查询回复数量
        for (let comment of comments) {
            const [{ reply_count }] = await db.query(`
                SELECT COUNT(*) as reply_count
                FROM activity_comments
                WHERE parent_id = ? AND status = 'approved'
            `, [comment.id]);
            comment.reply_count = reply_count;
        }

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM activity_comments ac
            WHERE ${whereConditions.join(' AND ')}
        `, queryParams);

        res.json({
            success: true,
            data: {
                comments,
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
 * 提交活动评论
 * POST /api/activity-comments
 */
router.post('/', [
    body('activity_id').isInt({ min: 1 }).withMessage('活动ID无效'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('评论内容不能为空且不能超过1000字符'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('parent_id').optional().isInt({ min: 1 }).withMessage('父评论ID无效')
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

        const { activity_id, content, rating, parent_id } = req.body;
        const user_id = req.user.id;

        // 检查活动是否存在
        const [activity] = await db.query(
            'SELECT id FROM activities WHERE id = ? AND status IN ("published", "ongoing", "completed")',
            [activity_id]
        );

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        // 如果是回复，检查父评论是否存在
        if (parent_id) {
            const [parentComment] = await db.query(
                'SELECT id FROM activity_comments WHERE id = ? AND activity_id = ? AND status = "approved"',
                [parent_id, activity_id]
            );

            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: '父评论不存在'
                });
            }
        }

        // 检查是否已经评论过（主评论，不包括回复）
        if (!parent_id) {
            const [existingComment] = await db.query(
                'SELECT id FROM activity_comments WHERE activity_id = ? AND user_id = ? AND parent_id IS NULL',
                [activity_id, user_id]
            );

            if (existingComment) {
                return res.status(400).json({
                    success: false,
                    message: '您已经评论过这个活动'
                });
            }
        }

        // 创建评论
        const result = await db.insert(`
            INSERT INTO activity_comments (activity_id, user_id, parent_id, content, rating)
            VALUES (?, ?, ?, ?, ?)
        `, [activity_id, user_id, parent_id || null, content, rating || null]);

        // 获取创建的评论详情
        const [comment] = await db.query(`
            SELECT 
                ac.*,
                u.username,
                u.real_name,
                u.avatar_url
            FROM activity_comments ac
            JOIN users u ON ac.user_id = u.id
            WHERE ac.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: '评论提交成功',
            data: comment
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 点赞/取消点赞评论
 * POST /api/activity-comments/:id/like
 */
router.post('/:id/like', async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const { id } = req.params;
        const user_id = req.user.id;

        // 检查评论是否存在
        const [comment] = await db.query(
            'SELECT id FROM activity_comments WHERE id = ? AND status = "approved"',
            [id]
        );

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }

        // 检查是否已经点赞
        const [existingLike] = await db.query(
            'SELECT id FROM activity_comment_likes WHERE comment_id = ? AND user_id = ?',
            [id, user_id]
        );

        if (existingLike) {
            // 取消点赞
            await db.delete(
                'DELETE FROM activity_comment_likes WHERE comment_id = ? AND user_id = ?',
                [id, user_id]
            );

            res.json({
                success: true,
                message: '已取消点赞',
                data: { liked: false }
            });
        } else {
            // 添加点赞
            await db.insert(
                'INSERT INTO activity_comment_likes (comment_id, user_id) VALUES (?, ?)',
                [id, user_id]
            );

            res.json({
                success: true,
                message: '点赞成功',
                data: { liked: true }
            });
        }

    } catch (error) {
        next(error);
    }
});

/**
 * 删除评论
 * DELETE /api/activity-comments/:id
 */
router.delete('/:id', async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const { id } = req.params;
        const user_id = req.user.id;

        // 检查评论是否存在且属于当前用户
        const [comment] = await db.query(
            'SELECT * FROM activity_comments WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在或无权限删除'
            });
        }

        // 删除评论（级联删除回复和点赞）
        await db.delete(
            'DELETE FROM activity_comments WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: '评论删除成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户的活动评论
 * GET /api/activity-comments/user
 */
router.get('/user', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '请先登录'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '查询参数验证失败',
                errors: errors.array()
            });
        }

        const { page = 1, limit = 20 } = req.query;
        const user_id = req.user.id;
        const offset = (page - 1) * limit;

        // 查询用户的评论
        const comments = await db.query(`
            SELECT 
                ac.*,
                a.title as activity_title,
                a.start_date,
                a.start_time
            FROM activity_comments ac
            JOIN activities a ON ac.activity_id = a.id
            WHERE ac.user_id = ?
            ORDER BY ac.created_at DESC
            LIMIT ? OFFSET ?
        `, [user_id, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM activity_comments 
            WHERE user_id = ?
        `, [user_id]);

        res.json({
            success: true,
            data: {
                comments,
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

module.exports = router; 