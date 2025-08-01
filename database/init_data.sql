-- 体育场馆预约系统初始化数据
USE sports_booking_system;

-- 1. 插入会员等级数据
INSERT INTO memberships (level, name, min_points, discount_rate, points_rate, benefits) VALUES
('bronze', '青铜会员', 0, 1.00, 1.00, '["基础预约服务", "标准客服支持"]'),
('silver', '白银会员', 100, 0.95, 1.10, '["优先预约", "专属客服", "生日优惠"]'),
('gold', '黄金会员', 500, 0.90, 1.20, '["VIP预约通道", "专属客服", "生日优惠", "免费取消"]'),
('platinum', '铂金会员', 1000, 0.85, 1.30, '["VIP预约通道", "专属客服", "生日优惠", "免费取消", "专属活动"]');

-- 2. 插入测试用户数据
INSERT INTO users (username, email, password_hash, phone, real_name, membership_level, points) VALUES
('admin', 'admin@sports.com', '$2b$10$rQZ8K9mN2pL1vX3yA4bC5dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z', '13800138000', '系统管理员', 'platinum', 1500),
('zhangsan', 'zhangsan@example.com', '$2b$10$rQZ8K9mN2pL1vX3yA4bC5dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z', '13800138001', '张三', 'gold', 600),
('lisi', 'lisi@example.com', '$2b$10$rQZ8K9mN2pL1vX3yA4bC5dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z', '13800138002', '李四', 'silver', 200),
('wangwu', 'wangwu@example.com', '$2b$10$rQZ8K9mN2pL1vX3yA4bC5dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z', '13800138003', '王五', 'bronze', 50);

-- 3. 插入场馆数据
INSERT INTO venues (name, sport_type, description, address, latitude, longitude, phone, opening_hours, price_per_hour, capacity, facilities, images, rating, review_count) VALUES
('星光篮球馆', 'basketball', '专业室内篮球场，配备标准篮球架和木地板，适合比赛和训练', '北京市朝阳区星光路123号', 39.9042, 116.4074, '010-12345678', '06:00-22:00', 80.00, 20, '["标准篮球架", "木地板", "更衣室", "淋浴设施", "停车场"]', '["venue1_1.jpg", "venue1_2.jpg"]', 4.5, 128),
('羽动羽毛球馆', 'badminton', '专业羽毛球场地，采用国际标准塑胶地板，配备专业照明系统', '北京市海淀区学院路456号', 39.9042, 116.4074, '010-87654321', '08:00-22:00', 60.00, 16, '["标准羽毛球网", "塑胶地板", "专业照明", "空调系统", "休息区"]', '["venue2_1.jpg", "venue2_2.jpg"]', 4.3, 95),
('网球天地', 'tennis', '专业网球场地，采用国际标准硬地材质，配备专业教练服务', '北京市西城区体育路789号', 39.9042, 116.4074, '010-11223344', '07:00-21:00', 120.00, 8, '["标准网球网", "硬地材质", "专业照明", "教练服务", "器材租赁"]', '["venue3_1.jpg", "venue3_2.jpg"]', 4.7, 156),
('蓝海游泳馆', 'swimming', '标准50米泳池，配备恒温系统和专业救生员，提供游泳培训', '北京市东城区海洋路321号', 39.9042, 116.4074, '010-55667788', '06:00-22:00', 100.00, 50, '["50米标准泳池", "恒温系统", "救生员", "更衣室", "淋浴设施"]', '["venue4_1.jpg", "venue4_2.jpg"]', 4.6, 203),
('绿茵足球场', 'football', '标准11人制足球场，采用人工草坪，配备专业照明系统', '北京市丰台区体育中心路654号', 39.9042, 116.4074, '010-99887766', '08:00-22:00', 200.00, 22, '["标准足球门", "人工草坪", "专业照明", "看台", "停车场"]', '["venue5_1.jpg", "venue5_2.jpg"]', 4.4, 87),
('排球之家', 'volleyball', '专业排球场地，采用国际标准木地板，配备专业裁判服务', '北京市石景山区体育路987号', 39.9042, 116.4074, '010-33445566', '09:00-21:00', 90.00, 12, '["标准排球网", "木地板", "专业照明", "裁判服务", "休息区"]', '["venue6_1.jpg", "venue6_2.jpg"]', 4.2, 73),
('乒乓乐园', 'table_tennis', '专业乒乓球场地，配备标准乒乓球台和发球机，提供专业培训', '北京市通州区体育路147号', 39.9042, 116.4074, '010-77889900', '08:00-22:00', 40.00, 20, '["标准乒乓球台", "发球机", "专业照明", "教练服务", "器材租赁"]', '["venue7_1.jpg", "venue7_2.jpg"]', 4.1, 64),
('健身中心', 'gym', '现代化健身中心，配备专业健身器材和私人教练服务', '北京市昌平区健康路258号', 39.9042, 116.4074, '010-11223344', '06:00-24:00', 50.00, 100, '["专业健身器材", "私人教练", "瑜伽室", "桑拿房", "营养咨询"]', '["venue8_1.jpg", "venue8_2.jpg"]', 4.8, 312);

-- 4. 插入系统配置数据
INSERT INTO system_configs (config_key, config_value, description) VALUES
('booking_advance_days', '7', '可提前预约天数'),
('booking_cancel_hours', '24', '可取消预约提前小时数'),
('points_per_booking', '10', '每次预约获得积分'),
('min_booking_hours', '1', '最小预约时长(小时)'),
('max_booking_hours', '4', '最大预约时长(小时)'),
('system_maintenance', 'false', '系统维护状态'),
('welcome_message', '欢迎使用体育场馆预约系统！', '首页欢迎信息'),
('contact_phone', '400-123-4567', '客服电话'),
('contact_email', 'support@sports.com', '客服邮箱');

-- 5. 插入测试预约数据
INSERT INTO bookings (user_id, venue_id, booking_date, start_time, end_time, total_hours, total_price, discount_amount, final_price, status, payment_status, payment_method, notes) VALUES
(2, 1, '2024-01-15', '14:00:00', '16:00:00', 2.00, 160.00, 16.00, 144.00, 'confirmed', 'paid', 'wechat', '周末篮球训练'),
(2, 2, '2024-01-16', '19:00:00', '21:00:00', 2.00, 120.00, 12.00, 108.00, 'confirmed', 'paid', 'alipay', '羽毛球比赛'),
(3, 3, '2024-01-17', '09:00:00', '11:00:00', 2.00, 240.00, 0.00, 240.00, 'pending', 'unpaid', NULL, '网球训练'),
(4, 4, '2024-01-18', '15:00:00', '17:00:00', 2.00, 200.00, 20.00, 180.00, 'confirmed', 'paid', 'card', '游泳健身'),
(2, 5, '2024-01-19', '14:00:00', '16:00:00', 2.00, 400.00, 40.00, 360.00, 'cancelled', 'refunded', 'wechat', '足球比赛');

-- 6. 插入测试评价数据
INSERT INTO reviews (user_id, venue_id, booking_id, rating, content, status) VALUES
(2, 1, 1, 5, '场地很好，木地板质量不错，灯光也很充足，非常适合打篮球！', 'approved'),
(2, 2, 2, 4, '羽毛球场地标准，塑胶地板防滑性好，就是空调温度稍低。', 'approved'),
(3, 3, 3, 5, '网球场地非常专业，教练技术很好，学到了很多技巧。', 'approved'),
(4, 4, 4, 4, '游泳馆水质很好，水温适宜，救生员很负责。', 'approved'),
(2, 5, 5, 3, '足球场草坪质量一般，但场地够大，适合比赛。', 'approved'); 