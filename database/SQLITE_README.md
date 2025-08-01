# SQLite数据库说明

## 📁 文件说明

本项目提供了两种数据库选项：

### 1. MySQL数据库（主要使用）
- `schema.sql` - MySQL数据库结构
- `init_data.sql` - MySQL初始数据
- `config.js` - MySQL连接配置
- `db.js` - MySQL数据库工具类

### 2. SQLite数据库（备用选项）
- `sports_booking_system.db` - **SQLite数据库文件**（已包含完整数据）
- `create_sqlite_db.py` - SQLite数据库创建脚本
- `sqlite_config.js` - SQLite连接配置
- `sqlite_db.js` - SQLite数据库工具类

## 🚀 快速使用SQLite

### 方法一：直接使用现有数据库文件
```bash
# SQLite数据库文件已经创建完成，包含所有表和数据
# 文件位置: database/sports_booking_system.db
```

### 方法二：重新创建数据库
```bash
cd database
python create_sqlite_db.py
```

## 📊 数据库内容

SQLite数据库包含以下数据：

### 用户数据
- **测试账号1**: lovepoems / 123456
- **测试账号2**: testuser / 123456

### 场馆数据
- 10个不同类型的体育场馆
- 包括篮球场、羽毛球场、网球场、游泳池、健身房、乒乓球室

### 预约数据
- 3条测试预约记录

### 评价数据
- 2条测试评价记录

## 🔧 切换到SQLite

如果需要从MySQL切换到SQLite，需要修改后端代码：

1. 安装SQLite依赖：
```bash
npm install sqlite3
```

2. 修改数据库连接：
```javascript
// 在 backend/routes/ 中的文件里
// 将 const db = require('../database/db'); 
// 改为 const db = require('../database/sqlite_db');
```

## 📋 数据库结构

SQLite数据库包含以下表：

1. **users** - 用户表
2. **memberships** - 会员等级表
3. **venues** - 场馆表
4. **bookings** - 预约表
5. **reviews** - 评价表
6. **system_configs** - 系统配置表
7. **operation_logs** - 操作日志表

## 🎯 优势

### SQLite优势
- ✅ 无需安装数据库服务器
- ✅ 单文件数据库，便于部署
- ✅ 零配置，开箱即用
- ✅ 适合小型项目和个人使用

### MySQL优势
- ✅ 支持并发访问
- ✅ 适合大型项目
- ✅ 更好的性能
- ✅ 支持复杂查询

## 📝 注意事项

1. **当前项目使用MySQL**：系统目前配置为使用MySQL数据库
2. **SQLite作为备用**：SQLite数据库文件已准备好，可根据需要切换
3. **数据同步**：两个数据库包含相同的初始数据
4. **部署选择**：可根据部署环境选择合适的数据库

## 🔍 验证数据库

可以使用SQLite命令行工具验证数据库：

```bash
# 进入数据库目录
cd database

# 打开SQLite数据库
sqlite3 sports_booking_system.db

# 查看表
.tables

# 查看用户数据
SELECT * FROM users;

# 查看场馆数据
SELECT * FROM venues;

# 退出
.quit
```

## 📞 技术支持

如果遇到SQLite相关问题：
1. 确保Python环境正常
2. 检查文件权限
3. 验证数据库文件完整性 