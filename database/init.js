const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { dbConfig } = require('./config');

async function initDatabase() {
    let connection;
    
    try {
        console.log('开始初始化数据库...');
        
        // 连接到MySQL服务器（不指定数据库）
        connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            charset: dbConfig.charset
        });
        
        console.log('✅ 成功连接到MySQL服务器');
        
        // 读取schema.sql文件
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // 执行建表语句
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        
        for (let statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('✅ 执行SQL语句:', statement.substring(0, 50) + '...');
            }
        }
        
        console.log('✅ 数据库表结构创建完成');
        
        // 读取初始化数据
        const dataPath = path.join(__dirname, 'init_data.sql');
        const dataSQL = fs.readFileSync(dataPath, 'utf8');
        
        // 执行数据插入语句
        const dataStatements = dataSQL.split(';').filter(stmt => stmt.trim());
        
        for (let statement of dataStatements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('✅ 插入数据:', statement.substring(0, 50) + '...');
            }
        }
        
        console.log('✅ 初始化数据插入完成');
        console.log('🎉 数据库初始化完成！');
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('数据库初始化脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('数据库初始化脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase }; 