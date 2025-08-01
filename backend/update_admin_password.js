const bcrypt = require('bcryptjs');
const db = require('../database/db');

async function updateAdminPassword() {
    try {
        console.log('正在更新管理员密码...');
        
        // 生成新的密码哈希
        const password = 'admin123';
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        console.log('新密码哈希:', passwordHash);
        
        // 更新数据库中的管理员密码
        await db.query(
            'UPDATE users SET password_hash = ? WHERE username = ?',
            [passwordHash, 'admin']
        );
        
        console.log('✅ 管理员密码更新成功！');
        console.log('用户名: admin');
        console.log('密码: admin123');
        
    } catch (error) {
        console.error('❌ 更新管理员密码失败:', error);
    } finally {
        process.exit(0);
    }
}

updateAdminPassword(); 