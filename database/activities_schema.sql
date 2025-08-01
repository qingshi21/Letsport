-- 活动相关表结构

-- 1. 活动表 (activities)
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '活动标题',
    description TEXT COMMENT '活动描述',
    venue_id INT COMMENT '关联场馆ID',
    activity_type ENUM('tournament', 'training', 'social', 'competition', 'workshop') NOT NULL COMMENT '活动类型',
    sport_type ENUM('basketball', 'badminton', 'tennis', 'swimming', 'football', 'volleyball', 'table_tennis', 'gym') COMMENT '运动类型',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    max_participants INT COMMENT '最大参与人数',
    current_participants INT DEFAULT 0 COMMENT '当前参与人数',
    price DECIMAL(10, 2) DEFAULT 0.00 COMMENT '活动费用',
    location VARCHAR(255) COMMENT '活动地点',
    organizer_id INT COMMENT '组织者ID',
    organizer_name VARCHAR(100) COMMENT '组织者名称',
    contact_phone VARCHAR(20) COMMENT '联系电话',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    images TEXT COMMENT '活动图片URLs，JSON格式',
    status ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft' COMMENT '活动状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activity_type (activity_type),
    INDEX idx_sport_type (sport_type),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_organizer_id (organizer_id)
) COMMENT '活动表';

-- 2. 活动参与表 (activity_participants)
CREATE TABLE activity_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL COMMENT '活动ID',
    user_id INT NOT NULL COMMENT '用户ID',
    status ENUM('registered', 'confirmed', 'attended', 'cancelled') DEFAULT 'registered' COMMENT '参与状态',
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' COMMENT '支付状态',
    payment_amount DECIMAL(10, 2) DEFAULT 0.00 COMMENT '支付金额',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (activity_id, user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) COMMENT '活动参与表';

-- 3. 活动评论表 (activity_comments)
CREATE TABLE activity_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL COMMENT '活动ID',
    user_id INT NOT NULL COMMENT '用户ID',
    parent_id INT COMMENT '父评论ID，用于回复功能',
    content TEXT NOT NULL COMMENT '评论内容',
    rating INT CHECK (rating >= 1 AND rating <= 5) COMMENT '评分(1-5)',
    images TEXT COMMENT '图片URLs，JSON格式',
    likes_count INT DEFAULT 0 COMMENT '点赞数',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '评论状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES activity_comments(id) ON DELETE CASCADE,
    INDEX idx_activity_id (activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) COMMENT '活动评论表';

-- 4. 活动评论点赞表 (activity_comment_likes)
CREATE TABLE activity_comment_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL COMMENT '评论ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (comment_id) REFERENCES activity_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (comment_id, user_id),
    INDEX idx_comment_id (comment_id),
    INDEX idx_user_id (user_id)
) COMMENT '活动评论点赞表'; 