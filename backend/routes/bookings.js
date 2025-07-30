const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../../database/db');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * 创建预约
 * POST /api/bookings
 */
router.post('/', [
    body('venue_id').isInt({ min: 1 }).withMessage('场馆ID无效'),
    body('booking_date').isISO8601().withMessage('预约日期格式无效'),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('开始时间格式无效'),
    body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('结束时间格式无效'),
    body('notes').optional().isLength({ max: 500 }).withMessage('备注长度不能超过500字符')
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

        const { venue_id, booking_date, start_time, end_time, notes } = req.body;
        const user_id = req.user.id;

        // 验证时间逻辑
        if (start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: '结束时间必须晚于开始时间'
            });
        }

        // 检查预约日期是否在允许范围内
        const today = new Date();
        const bookingDate = new Date(booking_date);
        const daysDiff = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff < 0) {
            return res.status(400).json({
                success: false,
                message: '不能预约过去的日期'
            });
        }

        // 获取系统配置
        const [config] = await db.query(
            'SELECT config_value FROM system_configs WHERE config_key = "booking_advance_days"'
        );
        const maxAdvanceDays = parseInt(config?.config_value || 7);

        if (daysDiff > maxAdvanceDays) {
            return res.status(400).json({
                success: false,
                message: `最多只能提前${maxAdvanceDays}天预约`
            });
        }

        // 检查场馆是否存在且可用
        const [venue] = await db.query(
            'SELECT id, price_per_hour, status FROM venues WHERE id = ? AND status = "active"',
            [venue_id]
        );

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: '场馆不存在或不可用'
            });
        }

        // 检查时间冲突
        const conflictingBookings = await db.query(`
            SELECT id FROM bookings 
            WHERE venue_id = ? 
            AND booking_date = ? 
            AND status IN ('pending', 'confirmed')
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [venue_id, booking_date, start_time, start_time, end_time, end_time, start_time, end_time]);

        if (conflictingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该时间段已被预约'
            });
        }

        // 计算时长和价格
        const startTime = new Date(`2000-01-01 ${start_time}`);
        const endTime = new Date(`2000-01-01 ${end_time}`);
        const totalHours = (endTime - startTime) / (1000 * 60 * 60);
        const totalPrice = totalHours * venue.price_per_hour;

        // 获取用户会员等级和折扣
        const [user] = await db.query(
            'SELECT membership_level FROM users WHERE id = ?',
            [user_id]
        );

        const [membership] = await db.query(
            'SELECT discount_rate FROM memberships WHERE level = ?',
            [user.membership_level]
        );

        const discountRate = membership?.discount_rate || 1.0;
        const discountAmount = totalPrice * (1 - discountRate);
        const finalPrice = totalPrice - discountAmount;

        // 创建预约
        const result = await db.insert(`
            INSERT INTO bookings (
                user_id, venue_id, booking_date, start_time, end_time,
                total_hours, total_price, discount_amount, final_price, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [user_id, venue_id, booking_date, start_time, end_time, totalHours, totalPrice, discountAmount, finalPrice, notes || null]);

        // 获取创建的预约详情
        const [booking] = await db.query(`
            SELECT 
                b.*, v.name as venue_name, v.address as venue_address
            FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE b.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: '预约创建成功',
            data: booking
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 获取用户预约列表
 * GET /api/bookings
 */
router.get('/', [
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const user_id = req.user.id;

        // 构建查询条件
        let whereConditions = ['b.user_id = ?'];
        let queryParams = [user_id];

        if (status) {
            whereConditions.push('b.status = ?');
            queryParams.push(status);
        }

        // 计算分页
        const offset = (page - 1) * limit;

        // 查询预约列表
        const bookings = await db.query(`
            SELECT 
                b.*, v.name as venue_name, v.address as venue_address,
                v.sport_type, v.phone as venue_phone
            FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // 查询总数
        const [{ total }] = await db.query(`
            SELECT COUNT(*) as total 
            FROM bookings b
            WHERE ${whereConditions.join(' AND ')}
        `, queryParams);

        // 计算总页数
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
 * 获取预约详情
 * GET /api/bookings/:id
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [booking] = await db.query(`
            SELECT 
                b.*, v.name as venue_name, v.address as venue_address,
                v.sport_type, v.phone as venue_phone, v.opening_hours
            FROM bookings b
            JOIN venues v ON b.venue_id = v.id
            WHERE b.id = ? AND b.user_id = ?
        `, [id, user_id]);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: '预约不存在'
            });
        }

        res.json({
            success: true,
            data: booking
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 取消预约
 * PUT /api/bookings/:id/cancel
 */
router.put('/:id/cancel', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // 检查预约是否存在且属于当前用户
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: '预约不存在'
            });
        }

        // 检查预约状态
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: '预约已被取消'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: '已完成的预约不能取消'
            });
        }

        // 检查取消时间限制
        const bookingDateTime = new Date(`${booking.booking_date} ${booking.start_time}`);
        const now = new Date();
        const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);

        // 获取系统配置
        const [config] = await db.query(
            'SELECT config_value FROM system_configs WHERE config_key = "booking_cancel_hours"'
        );
        const minCancelHours = parseInt(config?.config_value || 24);

        if (hoursDiff < minCancelHours) {
            return res.status(400).json({
                success: false,
                message: `预约开始前${minCancelHours}小时内不能取消`
            });
        }

        // 取消预约
        await db.update(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: '预约取消成功'
        });

    } catch (error) {
        next(error);
    }
});

/**
 * 支付预约
 * PUT /api/bookings/:id/pay
 */
router.put('/:id/pay', [
    body('payment_method').isIn(['wechat', 'alipay', 'card', 'cash']).withMessage('支付方式无效')
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
        const { payment_method } = req.body;
        const user_id = req.user.id;

        // 检查预约是否存在且属于当前用户
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: '预约不存在'
            });
        }

        if (booking.payment_status === 'paid') {
            return res.status(400).json({
                success: false,
                message: '预约已支付'
            });
        }

        // 更新支付状态
        await db.update(
            'UPDATE bookings SET payment_status = "paid", payment_method = ? WHERE id = ?',
            [payment_method, id]
        );

        // 更新预约状态为已确认
        await db.update(
            'UPDATE bookings SET status = "confirmed" WHERE id = ?',
            [id]
        );

        // 增加用户积分
        const [config] = await db.query(
            'SELECT config_value FROM system_configs WHERE config_key = "points_per_booking"'
        );
        const pointsToAdd = parseInt(config?.config_value || 10);

        await db.update(
            'UPDATE users SET points = points + ? WHERE id = ?',
            [pointsToAdd, user_id]
        );

        res.json({
            success: true,
            message: '支付成功',
            data: {
                points_earned: pointsToAdd
            }
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router; 