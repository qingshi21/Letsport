// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Lovepoems52768',
    database: 'sports_booking_system',
    charset: 'utf8mb4',
    timezone: '+08:00',
    connectionLimit: 10
};

// 数据库连接池配置
const poolConfig = {
    ...dbConfig,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

module.exports = {
    dbConfig,
    poolConfig
}; 