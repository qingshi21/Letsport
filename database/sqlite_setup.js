const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建SQLite数据库文件
const dbPath = path.join(__dirname, 'sports_booking_system.db');
const db = new sqlite3.Database(dbPath);

console.log('正在创建SQLite数据库...');

// 创建表结构
const createTables = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    real_name TEXT,
    avatar_url TEXT,
    membership_level TEXT DEFAULT 'bronze',
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 会员等级表
CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    discount_rate DECIMAL(3,2) NOT NULL,
    min_points INTEGER NOT NULL,
    benefits TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 场馆表
CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2) NOT NULL,
    capacity INTEGER NOT NULL,
    facilities TEXT,
    opening_hours TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预约表
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    venue_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours INTEGER NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_rate DECIMAL(3,2) DEFAULT 1.00,
    final_price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (venue_id) REFERENCES venues (id)
);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    venue_id INTEGER NOT NULL,
    booking_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (venue_id) REFERENCES venues (id),
    FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
`;

// 插入初始数据
const insertData = `
-- 插入会员等级数据
INSERT OR IGNORE INTO memberships (level, name, discount_rate, min_points, benefits) VALUES
('bronze', '青铜会员', 1.00, 0, '基础服务'),
('silver', '白银会员', 0.95, 100, '预约优先权,95折优惠'),
('gold', '黄金会员', 0.90, 500, '预约优先权,9折优惠,免费停车'),
('platinum', '铂金会员', 0.80, 1000, '预约优先权,8折优惠,免费停车,专属客服');

-- 插入系统配置
INSERT OR IGNORE INTO system_configs (config_key, config_value, description) VALUES
('site_name', '体育场馆预约系统', '网站名称'),
('contact_email', 'admin@sports.com', '联系邮箱'),
('max_booking_days', '30', '最大预约天数'),
('min_booking_hours', '1', '最小预约小时数'),
('max_booking_hours', '8', '最大预约小时数');

-- 插入测试用户
INSERT OR IGNORE INTO users (username, email, password_hash, phone, real_name, membership_level, points) VALUES
('lovepoems', 'lovepoems@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8JZQK8i', '13800138000', '张三', 'gold', 500),
('testuser', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8JZQK8i', '13800138001', '测试用户', 'silver', 200);

-- 插入场馆数据
INSERT OR IGNORE INTO venues (name, sport_type, address, description, price_per_hour, capacity, facilities, opening_hours) VALUES
('室内篮球场A', 'basketball', '北京市朝阳区体育中心', '标准室内篮球场，木地板，空调，更衣室', 150.00, 20, '篮球架,记分牌,更衣室,淋浴', '09:00-22:00'),
('室内篮球场B', 'basketball', '北京市朝阳区体育中心', '标准室内篮球场，木地板，空调，更衣室', 150.00, 20, '篮球架,记分牌,更衣室,淋浴', '09:00-22:00'),
('羽毛球场1', 'badminton', '北京市海淀区体育馆', '专业羽毛球场，塑胶地板，空调', 80.00, 4, '羽毛球网,记分牌,更衣室', '08:00-23:00'),
('羽毛球场2', 'badminton', '北京市海淀区体育馆', '专业羽毛球场，塑胶地板，空调', 80.00, 4, '羽毛球网,记分牌,更衣室', '08:00-23:00'),
('羽毛球场3', 'badminton', '北京市海淀区体育馆', '专业羽毛球场，塑胶地板，空调', 80.00, 4, '羽毛球网,记分牌,更衣室', '08:00-23:00'),
('网球场A', 'tennis', '北京市西城区网球中心', '专业网球场，硬地，照明设备', 120.00, 4, '网球网,记分牌,更衣室', '07:00-23:00'),
('网球场B', 'tennis', '北京市西城区网球中心', '专业网球场，硬地，照明设备', 120.00, 4, '网球网,记分牌,更衣室', '07:00-23:00'),
('游泳池', 'swimming', '北京市东城区游泳馆', '标准游泳池，25米，恒温', 60.00, 50, '泳道,救生设备,更衣室,淋浴', '06:00-22:00'),
('健身房', 'fitness', '北京市丰台区健身中心', '专业健身房，器械齐全', 40.00, 30, '跑步机,力量器械,瑜伽室', '06:00-24:00'),
('乒乓球室', 'pingpong', '北京市石景山区体育中心', '专业乒乓球室，标准球台', 50.00, 8, '乒乓球台,球拍,更衣室', '09:00-22:00');

-- 插入测试预约数据
INSERT OR IGNORE INTO bookings (user_id, venue_id, booking_date, start_time, end_time, total_hours, base_price, final_price, status, payment_status) VALUES
(1, 1, '2024-01-15', '14:00:00', '16:00:00', 2, 300.00, 270.00, 'confirmed', 'paid'),
(1, 3, '2024-01-16', '19:00:00', '21:00:00', 2, 160.00, 152.00, 'pending', 'unpaid'),
(2, 8, '2024-01-18', '10:00:00', '12:00:00', 2, 120.00, 120.00, 'completed', 'paid');

-- 插入测试评价数据
INSERT OR IGNORE INTO reviews (user_id, venue_id, booking_id, rating, content) VALUES
(1, 1, 1, 5, '场地很好，设施齐全，服务态度也不错！'),
(2, 8, 3, 4, '游泳池水质很好，温度适宜，推荐！');
`;

// 执行创建表和插入数据
db.serialize(() => {
    console.log('创建数据库表...');
    db.exec(createTables, (err) => {
        if (err) {
            console.error('创建表失败:', err);
        } else {
            console.log('表创建成功！');
            
            console.log('插入初始数据...');
            db.exec(insertData, (err) => {
                if (err) {
                    console.error('插入数据失败:', err);
                } else {
                    console.log('数据插入成功！');
                    console.log('SQLite数据库创建完成！');
                    console.log('数据库文件位置:', dbPath);
                }
                db.close();
            });
        }
    });
}); 