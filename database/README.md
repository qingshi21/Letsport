# 数据库设计文档

## 概述
本目录包含体育场馆预约系统的数据库设计、初始化脚本和相关工具。

## 文件结构
```
database/
├── schema.sql          # 数据库表结构定义
├── init_data.sql       # 初始化数据
├── config.js           # 数据库连接配置
├── init.js             # 数据库初始化脚本
├── db.js               # 数据库操作工具类
└── README.md           # 本文档
```

## 数据库表设计

### 1. 用户表 (users)
- 存储用户基本信息、认证信息和会员等级
- 支持用户名、邮箱、手机号登录
- 包含积分系统和会员等级管理

### 2. 场馆表 (venues)
- 存储场馆基本信息、位置、价格等
- 支持多种运动类型
- 包含评分和评价系统

### 3. 预约表 (bookings)
- 存储用户预约信息
- 支持预约状态管理和支付状态跟踪
- 包含价格计算和优惠系统

### 4. 会员等级表 (memberships)
- 定义不同会员等级的权益
- 包含折扣率和积分倍率配置

### 5. 评价表 (reviews)
- 存储用户对场馆的评价
- 支持评分和文字评价

### 6. 系统配置表 (system_configs)
- 存储系统配置参数
- 支持动态配置管理

### 7. 操作日志表 (operation_logs)
- 记录用户操作日志
- 支持审计和监控

## 安装和配置

### 1. 安装MySQL
确保你的系统已安装MySQL 8.0或更高版本。

### 2. 安装Node.js依赖
```bash
npm install mysql2
```

### 3. 配置数据库连接
编辑 `config.js` 文件，修改数据库连接参数：
```javascript
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password', // 修改为你的MySQL密码
    database: 'sports_booking_system',
    // ... 其他配置
};
```

### 4. 初始化数据库
```bash
node init.js
```

## 使用说明

### 数据库操作工具类
```javascript
const db = require('./database/db');

// 查询数据
const users = await db.query('SELECT * FROM users WHERE status = ?', ['active']);

// 插入数据
const result = await db.insert('INSERT INTO users (username, email) VALUES (?, ?)', ['test', 'test@example.com']);

// 更新数据
await db.update('UPDATE users SET points = ? WHERE id = ?', [100, 1]);

// 删除数据
await db.delete('DELETE FROM users WHERE id = ?', [1]);

// 事务操作
await db.transaction(async (connection) => {
    // 在事务中执行多个操作
    await connection.execute('INSERT INTO bookings ...');
    await connection.execute('UPDATE venues ...');
});
```

## 测试数据

初始化脚本会自动插入以下测试数据：

### 用户数据
- 管理员账户：admin@sports.com
- 测试用户：zhangsan@example.com, lisi@example.com, wangwu@example.com
- 密码哈希：$2b$10$rQZ8K9mN2pL1vX3yA4bC5dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z

### 场馆数据
- 8个不同类型的场馆
- 包含篮球、羽毛球、网球、游泳、足球、排球、乒乓球、健身等类型
- 每个场馆都有完整的基本信息

### 预约数据
- 5条测试预约记录
- 包含不同状态的预约（已确认、待确认、已取消等）

## 注意事项

1. **密码安全**：生产环境中请使用强密码和加密存储
2. **数据备份**：定期备份数据库数据
3. **性能优化**：根据实际使用情况调整连接池配置
4. **权限管理**：为数据库用户设置适当的权限

## 故障排除

### 常见问题

1. **连接失败**
   - 检查MySQL服务是否启动
   - 验证连接参数是否正确
   - 确认防火墙设置

2. **权限错误**
   - 确保数据库用户有足够权限
   - 检查数据库是否存在

3. **字符编码问题**
   - 确保使用utf8mb4字符集
   - 检查数据库和表的字符集设置 