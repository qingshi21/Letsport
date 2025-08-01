const path = require('path');

// SQLite数据库配置
const sqliteConfig = {
    database: path.join(__dirname, 'sports_booking_system.db'),
    verbose: false,
    timeout: 30000
};

module.exports = sqliteConfig; 