const mysql = require('mysql2/promise');

async function checkUserData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Lovepoems52768',
        database: 'sports_booking_system'
    });

    try {
        console.log('检查用户数据...');
        
        // 检查用户表结构
        const [columns] = await connection.execute('DESCRIBE users');
        console.log('用户表结构:', columns);
        
        // 检查所有用户
        const [users] = await connection.execute('SELECT id, username, email, created_at FROM users');
        console.log('所有用户:', users);
        
        // 检查特定用户
        const [lovepoems] = await connection.execute('SELECT * FROM users WHERE username = ?', ['lovepoems']);
        console.log('lovepoems用户:', lovepoems);
        
        // 检查密码哈希
        if (lovepoems.length > 0) {
            console.log('lovepoems密码哈希:', lovepoems[0].password_hash);
        }
        
    } catch (error) {
        console.error('数据库查询错误:', error);
    } finally {
        await connection.end();
    }
}

checkUserData(); 