const db = require('../database/db');

async function updateDatabase() {
    try {
        console.log('开始更新数据库...');
        
        // 检查display_name字段是否存在
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'sports_booking_system' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'display_name'
        `);
        
        if (columns.length === 0) {
            console.log('添加display_name字段...');
            await db.update(`
                ALTER TABLE users 
                ADD COLUMN display_name VARCHAR(50) COMMENT '显示名称' AFTER real_name
            `);
            console.log('display_name字段添加成功');
        } else {
            console.log('display_name字段已存在');
        }
        
        // 为现有用户设置默认显示名称
        console.log('更新现有用户的显示名称...');
        await db.update(`
            UPDATE users 
            SET display_name = username 
            WHERE display_name IS NULL
        `);
        console.log('用户显示名称更新完成');
        
        // 添加索引
        console.log('添加索引...');
        try {
            await db.update(`
                CREATE INDEX idx_display_name ON users(display_name)
            `);
            console.log('索引添加成功');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('索引已存在');
            } else {
                throw error;
            }
        }
        
        console.log('数据库更新完成！');
        process.exit(0);
        
    } catch (error) {
        console.error('数据库更新失败:', error);
        process.exit(1);
    }
}

updateDatabase(); 