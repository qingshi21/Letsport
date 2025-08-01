const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const venueRoutes = require('./routes/venues');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const activityRoutes = require('./routes/activities');
const activityCommentRoutes = require('./routes/activity-comments');

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet()); // 安全头
app.use(morgan('combined')); // 日志
app.use(cors({
    origin: [
        'http://localhost:8000',
        'http://localhost:8080',
        'http://localhost:63342',
        'http://127.0.0.1:8000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:63342'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-comments', activityCommentRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🔗 API文档: http://localhost:${PORT}/api`);
});

module.exports = app; 