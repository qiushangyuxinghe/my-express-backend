const mysql = require('mysql2')
const Mock = require('mockjs')

const getDbConfig = () => {
  // 如果提供了完整的 DATABASE_URL（如 PlanetScale、Railway）
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  }
  
  // 如果提供了分开的数据库配置
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'xinghe',
    password: process.env.DB_PASSWORD || 'Cqy@2005',
    database: process.env.DB_NAME || 'lists',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
}

const dbConfig = getDbConfig()
const db = dbConfig.uri 
  ? mysql.createPool(dbConfig.uri) 
  : mysql.createPool(dbConfig)

// 测试数据库连接
db.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
    console.log('当前数据库配置:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    })
  } else {
    console.log('数据库连接成功')
    connection.release()
  }
})

const length = 200

function init() {
    return new Promise((resolve, reject) => {
        // 检查是否已有数据
        const sqlStr = 'SELECT COUNT(*) as count FROM users'
        db.query(sqlStr, (err, results) => {
            if (err) {
                reject(err)
                return
            }
            console.log(results)
            const count = results[0].count
            if (count === 0) {
                // 生成模拟数据
                const users = []
                for (let i = 0; i < length; i++) {
                    users.push(Mock.mock({
                        id: i + 1,
                        username: Mock.Random.cname(),
                        address: Mock.Random.county(true),
                        status: 0,
                        sex: Mock.Random.integer(0, 1),
                        'age|18-60': 1,
                        birthday: Mock.Random.date()
                    }))
                }

                // 插入模拟数据
                let completed = 0
                for (let i = 0; i < length; i++) {
                    const sqlStr1 = 'INSERT INTO users (id, username, address, status, sex, age, birthday) VALUES (?, ?, ?, ?, ?, ?, ?)'
                    db.query(sqlStr1, [users[i].id, users[i].username, users[i].address, users[i].status, users[i].sex, users[i].age, users[i].birthday], (err, results) => {
                        if (err) {
                            reject(err)
                            return
                        }
                        completed++
                        if (completed === length) {
                            console.log('初始化数据成功')
                            resolve() // 我们不返回users数组，因为之后从数据库取
                        }
                    })
                }
            } else {
                console.log('数据库中已有数据，跳过初始化')
                resolve()
            }
        })
    })
}

// 导出初始化函数和数据库实例，以及查询方法
module.exports = {
    init,
    db,
    getUsers: function(page = 1, pageSize = 10) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * pageSize;
            // 只查询 status=0 的数据
            const countSql = 'SELECT COUNT(*) as count FROM users WHERE status = 0';
            const dataSql = 'SELECT * FROM users WHERE status = 0 LIMIT ? OFFSET ?';
            console.log(`获取用户数据 - page: ${page}, pageSize: ${pageSize}, offset: ${offset}`);
        
            // 先查询总数
            db.query(countSql, (err, countResults) => {
                if (err) {
                    console.error('查询总数失败:', err);
                    reject(err);
                    return;
                }
            
                const totalCount = countResults[0].count;
                console.log(`用户总记录数: ${totalCount}`);
            
                // 再查询分页数据
                db.query(dataSql, [parseInt(pageSize), parseInt(offset)], (err, results) => {
                    if (err) {
                        console.error('查询数据失败:', err);
                        reject(err);
                    } else {
                        console.log(`返回数据条数: ${results.length}`);
                        resolve({
                            list: results,
                            count: totalCount,
                            page: parseInt(page),
                            pageSize: parseInt(pageSize)
                        });
                    }
                });
            });
        });
    },
    getSearch: function(uname, page = 1, pageSize = 10){
        return new Promise((resolve,reject) => {
            const offset = (page - 1) * pageSize; 
        
            console.log(`搜索参数 - uname: ${uname}, page: ${page}, pageSize: ${pageSize}, offset: ${offset}`);
        
            // 只查询 status=0 的数据
            const countSql = "SELECT COUNT(*) as count FROM users WHERE username LIKE CONCAT('%',?,'%') AND status = 0";
            const dataSql = "SELECT * FROM users WHERE username LIKE CONCAT('%',?,'%') AND status = 0 LIMIT ? OFFSET ?";
            db.query(countSql, [uname], (err, countResults) => {
                if(err) {
                    console.error('查询总数失败:', err);
                    reject(err);
                    return;
                }
            
                const totalCount = countResults[0].count;
                console.log(`搜索到总记录数: ${totalCount}`);
            
                // 再查询分页数据
                db.query(dataSql, [uname, parseInt(pageSize), parseInt(offset)], (err, results) => {
                    if(err) {
                        console.error('查询数据失败:', err);
                     reject(err);
                    } else {
                        console.log(`返回数据条数: ${results.length}`);
                        resolve({
                            list: results,
                            count: totalCount,
                            page: parseInt(page),
                            pageSize: parseInt(pageSize)
                        });
                    }
                });
            });
        })
    },
    updateUser: function(target){
        return new Promise((resolve,reject)=>{
            const sqlStr = "update users set ? where id = ?"
            db.query(sqlStr,[target,target.id],(err,results)=>{
                if(err){
                    reject(err)
                    return
                }
                else resolve(results)
            })
        })
    },
    addUser: function(target){
        return new Promise((resolve,reject)=>{
            const sqlStr = "insert into users set ?"
            db.query(sqlStr,target,(err,results)=>{
                if(err){
                    reject(err)
                    return
                }
                if(results){
                    resolve(results)
                }
            })
        })
    },
    deleteUser: function(target){
        return new Promise((resolve,reject)=>{
            const sqlStr = "update users set status=1 where id = ?"
            db.query(sqlStr,[target,target.id],(err,resultes)=>{
                if(err){
                    reject(err)
                    return
                }
                if(resultes){
                    resolve(resultes)
                }
            })
        })
    }
}
//concat这个函数会把字符串的拼接放到数据库里面，这样会更加安全