-- 活动相关初始数据

-- 插入活动数据
INSERT INTO activities (title, description, venue_id, activity_type, sport_type, start_date, end_date, start_time, end_time, max_participants, current_participants, price, location, organizer_id, organizer_name, contact_phone, contact_email, status) VALUES
('篮球友谊赛', '周末篮球友谊赛，欢迎所有篮球爱好者参加！', 1, 'social', 'basketball', '2024-01-20', '2024-01-20', '14:00:00', '17:00:00', 20, 12, 50.00, '星光篮球馆', 1, '张三', '13800138001', 'zhangsan@example.com', 'published'),
('羽毛球训练营', '专业羽毛球训练，提升技术水平', 2, 'training', 'badminton', '2024-01-25', '2024-01-25', '19:00:00', '21:00:00', 15, 8, 80.00, '羽动羽毛球馆', 2, '李四', '13800138002', 'lisi@example.com', 'published'),
('网球新手教学', '适合网球初学者的基础教学课程', 3, 'workshop', 'tennis', '2024-01-28', '2024-01-28', '09:00:00', '11:00:00', 10, 5, 100.00, '网球天地', 3, '王五', '13800138003', 'wangwu@example.com', 'published'),
('游泳健身活动', '游泳健身活动，提高身体素质', 4, 'social', 'swimming', '2024-02-01', '2024-02-01', '16:00:00', '18:00:00', 25, 15, 60.00, '蓝海游泳馆', 1, '张三', '13800138001', 'zhangsan@example.com', 'published'),
('足球联赛', '业余足球联赛，每周一场', 5, 'competition', 'football', '2024-02-03', '2024-02-03', '15:00:00', '17:00:00', 22, 18, 40.00, '绿茵足球场', 2, '李四', '13800138002', 'lisi@example.com', 'published');

-- 插入活动参与数据
INSERT INTO activity_participants (activity_id, user_id, status, payment_status, payment_amount) VALUES
(1, 1, 'confirmed', 'paid', 50.00),
(1, 2, 'confirmed', 'paid', 50.00),
(1, 3, 'confirmed', 'paid', 50.00),
(2, 1, 'confirmed', 'paid', 80.00),
(2, 2, 'confirmed', 'paid', 80.00),
(3, 1, 'confirmed', 'paid', 100.00),
(4, 2, 'confirmed', 'paid', 60.00),
(4, 3, 'confirmed', 'paid', 60.00),
(5, 1, 'confirmed', 'paid', 40.00),
(5, 2, 'confirmed', 'paid', 40.00);

-- 插入活动评论数据
INSERT INTO activity_comments (activity_id, user_id, content, rating, status) VALUES
(1, 1, '篮球友谊赛很棒！场地很好，组织得很到位，认识了很多新朋友。', 5, 'approved'),
(1, 2, '活动氛围很好，大家都很友善，希望下次还能参加。', 4, 'approved'),
(1, 3, '比赛很激烈，但是很公平，裁判也很专业。', 5, 'approved'),
(2, 1, '羽毛球训练营很有收获，教练很专业，学到了很多技巧。', 5, 'approved'),
(2, 2, '训练强度适中，适合各个水平的选手。', 4, 'approved'),
(3, 1, '网球新手教学很耐心，从基础开始教起，很适合初学者。', 5, 'approved'),
(4, 2, '游泳活动很放松，水质很好，设施齐全。', 4, 'approved'),
(4, 3, '活动组织得很好，安全措施到位。', 5, 'approved'),
(5, 1, '足球联赛很精彩，比赛很激烈，组织得很专业。', 5, 'approved'),
(5, 2, '联赛水平很高，对手都很强，很有挑战性。', 4, 'approved');

-- 插入评论回复数据
INSERT INTO activity_comments (activity_id, user_id, parent_id, content, status) VALUES
(1, 2, 1, '确实很棒！下次一起参加吧！', 'approved'),
(1, 3, 1, '同意，场地条件很好。', 'approved'),
(2, 1, 4, '教练真的很专业，学到了很多。', 'approved'),
(3, 2, 6, '我也觉得很适合初学者。', 'approved');

-- 插入评论点赞数据
INSERT INTO activity_comment_likes (comment_id, user_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(2, 3),
(4, 2),
(6, 2),
(8, 1),
(9, 2);

-- 更新评论点赞数
UPDATE activity_comments SET likes_count = 2 WHERE id = 1;
UPDATE activity_comments SET likes_count = 2 WHERE id = 2;
UPDATE activity_comments SET likes_count = 1 WHERE id = 4;
UPDATE activity_comments SET likes_count = 1 WHERE id = 6;
UPDATE activity_comments SET likes_count = 1 WHERE id = 8;
UPDATE activity_comments SET likes_count = 1 WHERE id = 9; 