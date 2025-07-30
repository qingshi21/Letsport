// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Lovepoems52768',
    database: 'sports_booking_system',
    charset: 'utf8mb4',
    timezone: '+08:00',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
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