const express = require('express');
const { query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// 使用可选认证中间件
router.use(optionalAuthMiddleware);

/**
 * 获取场馆列表
 * GET /api/venues
 */
router.get('/', [
    query('sport_type').optional().isIn(['basketball', 'badminton', 'tennis', 'swimming', 'football', 'volleyball', 'table_tennis', 'gym']),
    query('min_price').optional().isFloat({ min: 0 }),
    query('max_price').optional().isFloat({ min: 0 }),
    query('rating').optional().isFloat({ min: 0, max: 5 }),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'rating_desc', 'distance']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res, next) => {
    try {
        // 验证查询参数
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '查询参数验证失败',
                errors: errors.array()
            });
        }

        const {
            sport_type,
            min_price,
            max_price,
            rating,
            sort = 'rating_desc',
            page = 1,
            limit = 10,
            search
        } = req.query;

        // 构建查询条件
        let whereConditions = ['status = "active"'];
        let queryParams = [];

        if (sport_type) {
            whereConditions.push('sport_type = ?');
            queryParams.push(sport_type);
        }

        if (min_price) {
            whereConditions.push('price_per_hour >= ?');
            queryParams.push(parseFloat(min_price));
        }

        if (max_price) {
            whereConditions.push('price_per_hour <= ?');
            queryParams.push(parseFloat(max_price));
        }

        if (rating) {
            whereConditions.push('rating >= ?');
            queryParams.push(parseFloat(rating));
        }

        if (search) {
            whereConditions.push('(name LIKE ? OR description LIKE ? OR address LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // 构建排序
        let orderBy = 'rating DESC';
        switch (sort) {
            case 'price_asc':
                orderBy = 'price_per_hour ASC';
                break;
            case 'price_desc':
                orderBy = 'price_per_hour DESC';
                break;
            case 'rating_desc':
                orderBy = 'rating DESC';
                break;
            case 'distance':
                // 这里可以添加距离排序逻辑
                orderBy = 'rating DESC';
                break;
        }

        // 计算分页
        const offset = (page - 1) * limit;

        // 查询场馆列表
        const venuesQuery = `
            SELECT 
                id, name, sport_type, description, address, 
                latitude, longitude, phone, opening_hours, 
                price_per_hour, capacity, facilities, images, 
                rating, review_count, status, created_at
            FROM venues 
            WHERE status = "active"
            ORDER BY rating DESC
            LIMIT ? OFFSET ?
        `;

        const venues = await db.query(venuesQuery, [parseInt(limit), parseInt(offset)]);

        // 查询总数
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM venues 
            WHERE status = "active"
        `;

        const [{ total }] = await db.query(countQuery);

        // 计算总页数
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                venues,
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
 * 获取热门场馆
 * GET /api/venues/popular
 */
router.get('/popular', async (req, res, next) => {
    try {
        const { limit = 6 } = req.query;

        const popularVenues = await db.query(`
            SELECT 
                id, name, sport_type, description, address, 
                price_per_hour, rating, review_count, images
            FROM venues 
            WHERE status = "active"
            ORDER BY rating DESC, review_count DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json({
            success: true,
            data: popularVenues
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取场馆类型统计
 * GET /api/venues/stats/types
 */
router.get('/stats/types', async (req, res, next) => {
    try {
        const stats = await db.query(`
            SELECT 
                sport_type,
                COUNT(*) as count,
                AVG(price_per_hour) as avg_price,
                AVG(rating) as avg_rating
            FROM venues 
            WHERE status = "active"
            GROUP BY sport_type
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 搜索场馆
 * GET /api/venues/search
 */
router.get('/search', [
    query('q').notEmpty().withMessage('搜索关键词不能为空'),
    query('limit').optional().isInt({ min: 1, max: 20 })
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

        const { q, limit = 10 } = req.query;
        const searchTerm = `%${q}%`;

        const venues = await db.query(`
            SELECT 
                id, name, sport_type, description, address, 
                price_per_hour, rating, review_count, images
            FROM venues 
            WHERE status = "active" 
            AND (name LIKE ? OR description LIKE ? OR address LIKE ?)
            ORDER BY rating DESC
            LIMIT ?
        `, [searchTerm, searchTerm, searchTerm, parseInt(limit)]);

        res.json({
            success: true,
            data: venues
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取场馆详情
 * GET /api/venues/:id
 */
router.get('/:id', [
    query('id').isInt({ min: 1 })
], async (req, res, next) => {
    try {
        const { id } = req.params;

        // 查询场馆详情
        const [venue] = await db.query(`
            SELECT 
                id, name, sport_type, description, address, 
                latitude, longitude, phone, opening_hours, 
                price_per_hour, capacity, facilities, images, 
                rating, review_count, status, created_at
            FROM venues 
            WHERE id = ? AND status = "active"
        `, [id]);

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: '场馆不存在'
            });
        }

        // 查询场馆评价
        const reviews = await db.query(`
            SELECT 
                r.id, r.rating, r.content, r.created_at,
                u.username, u.real_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.venue_id = ? AND r.status = "approved"
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);

        // 查询会员等级信息
        const memberships = await db.query(`
            SELECT level, name, discount_rate, benefits
            FROM memberships
            ORDER BY min_points ASC
        `);

        res.json({
            success: true,
            data: {
                venue,
                reviews,
                memberships
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 