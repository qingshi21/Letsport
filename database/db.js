const mysql = require('mysql2/promise');
const { poolConfig } = require('./config');

// 创建连接池
const pool = mysql.createPool(poolConfig);

class Database {
    constructor() {
        this.pool = pool;
    }

    /**
     * 执行查询
     * @param {string} sql - SQL语句
     * @param {Array} params - 参数数组
     * @returns {Promise<Array>} 查询结果
     */
    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('数据库查询错误:', error);
            throw error;
        }
    }

    /**
     * 执行单条插入
     * @param {string} sql - SQL语句
     * @param {Array} params - 参数数组
     * @returns {Promise<Object>} 插入结果
     */
    async insert(sql, params = []) {
        try {
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('数据库插入错误:', error);
            throw error;
        }
    }

    /**
     * 执行更新
     * @param {string} sql - SQL语句
     * @param {Array} params - 参数数组
     * @returns {Promise<Object>} 更新结果
     */
    async update(sql, params = []) {
        try {
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('数据库更新错误:', error);
            throw error;
        }
    }

    /**
     * 执行删除
     * @param {string} sql - SQL语句
     * @param {Array} params - 参数数组
     * @returns {Promise<Object>} 删除结果
     */
    async delete(sql, params = []) {
        try {
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('数据库删除错误:', error);
            throw error;
        }
    }

    /**
     * 事务执行
     * @param {Function} callback - 事务回调函数
     * @returns {Promise<any>} 事务结果
     */
    async transaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * 获取连接池状态
     * @returns {Object} 连接池状态信息
     */
    getPoolStatus() {
        return {
            threadId: this.pool.threadId,
            connectionLimit: this.pool.config.connectionLimit,
            queueLimit: this.pool.config.queueLimit
        };
    }

    /**
     * 关闭连接池
     */
    async close() {
        await this.pool.end();
    }
}

// 创建数据库实例
const db = new Database();

module.exports = db; 