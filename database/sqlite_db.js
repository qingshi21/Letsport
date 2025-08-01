const sqlite3 = require('sqlite3').verbose();
const sqliteConfig = require('./sqlite_config');

class SQLiteDatabase {
    constructor() {
        this.db = null;
    }

    // 连接数据库
    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(sqliteConfig.database, (err) => {
                if (err) {
                    console.error('SQLite数据库连接失败:', err);
                    reject(err);
                } else {
                    console.log('SQLite数据库连接成功');
                    resolve();
                }
            });
        });
    }

    // 执行查询
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('SQLite查询错误:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 执行单行查询
    async queryOne(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('SQLite查询错误:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // 执行更新操作
    async update(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('SQLite更新错误:', err);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes
                    });
                }
            });
        });
    }

    // 执行事务
    async transaction(callback) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');
                
                callback(this).then(() => {
                    this.db.run('COMMIT', (err) => {
                        if (err) {
                            this.db.run('ROLLBACK');
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }).catch((err) => {
                    this.db.run('ROLLBACK');
                    reject(err);
                });
            });
        });
    }

    // 关闭数据库连接
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('关闭SQLite连接失败:', err);
                        reject(err);
                    } else {
                        console.log('SQLite连接已关闭');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = SQLiteDatabase; 