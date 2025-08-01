-- 添加display_name字段到users表
USE sports_booking_system;

-- 添加display_name字段
ALTER TABLE users ADD COLUMN display_name VARCHAR(50) COMMENT '显示名称' AFTER real_name;

-- 为现有用户设置默认显示名称（使用用户名）
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- 添加索引以提高查询性能
CREATE INDEX idx_display_name ON users(display_name); 