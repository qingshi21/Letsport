-- 体育场馆预约系统数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS sports_booking_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sports_booking_system;

-- 1. 用户表 (users)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    phone VARCHAR(20) COMMENT '手机号',
    real_name VARCHAR(50) COMMENT '真实姓名',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    membership_level ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' COMMENT '会员等级',
    points INT DEFAULT 0 COMMENT '积分',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '账户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) COMMENT '用户表';

-- 2. 场馆表 (venues)
CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '场馆名称',
    sport_type ENUM('basketball', 'badminton', 'tennis', 'swimming', 'football', 'volleyball', 'table_tennis', 'gym') NOT NULL COMMENT '运动类型',
    description TEXT COMMENT '场馆描述',
    address VARCHAR(255) NOT NULL COMMENT '地址',
    latitude DECIMAL(10, 8) COMMENT '纬度',
    longitude DECIMAL(11, 8) COMMENT '经度',
    phone VARCHAR(20) COMMENT '联系电话',
    opening_hours VARCHAR(100) COMMENT '营业时间',
    price_per_hour DECIMAL(10, 2) NOT NULL COMMENT '每小时价格',
    capacity INT COMMENT '容纳人数',
    facilities TEXT COMMENT '设施描述',
    images TEXT COMMENT '图片URLs，JSON格式',
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT '评分',
    review_count INT DEFAULT 0 COMMENT '评价数量',
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active' COMMENT '场馆状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_sport_type (sport_type),
    INDEX idx_status (status),
    INDEX idx_location (latitude, longitude),
    INDEX idx_price (price_per_hour)
) COMMENT '场馆表';

-- 3. 预约表 (bookings)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    venue_id INT NOT NULL COMMENT '场馆ID',
    booking_date DATE NOT NULL COMMENT '预约日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    total_hours DECIMAL(4, 2) NOT NULL COMMENT '总时长(小时)',
    total_price DECIMAL(10, 2) NOT NULL COMMENT '总价格',
    discount_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '优惠金额',
    final_price DECIMAL(10, 2) NOT NULL COMMENT '最终价格',
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending' COMMENT '预约状态',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' COMMENT '支付状态',
    payment_method ENUM('wechat', 'alipay', 'card', 'cash') COMMENT '支付方式',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_venue_id (venue_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    UNIQUE KEY unique_booking (venue_id, booking_date, start_time, end_time)
) COMMENT '预约表';

-- 4. 会员等级表 (memberships)
CREATE TABLE memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('bronze', 'silver', 'gold', 'platinum') UNIQUE NOT NULL COMMENT '等级名称',
    name VARCHAR(50) NOT NULL COMMENT '等级显示名称',
    min_points INT NOT NULL COMMENT '最低积分要求',
    discount_rate DECIMAL(3, 2) DEFAULT 1.00 COMMENT '折扣率',
    points_rate DECIMAL(3, 2) DEFAULT 1.00 COMMENT '积分倍率',
    benefits TEXT COMMENT '权益描述，JSON格式',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '会员等级表';

-- 5. 评价表 (reviews)
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    venue_id INT NOT NULL COMMENT '场馆ID',
    booking_id INT COMMENT '预约ID',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5) COMMENT '评分(1-5)',
    content TEXT COMMENT '评价内容',
    images TEXT COMMENT '图片URLs，JSON格式',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '评价状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_venue_id (venue_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status)
) COMMENT '评价表';

-- 6. 系统配置表 (system_configs)
CREATE TABLE system_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(255) COMMENT '配置描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '系统配置表';

-- 7. 操作日志表 (operation_logs)
CREATE TABLE operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT COMMENT '用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '目标类型',
    target_id INT COMMENT '目标ID',
    details TEXT COMMENT '操作详情',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) COMMENT '操作日志表'; 