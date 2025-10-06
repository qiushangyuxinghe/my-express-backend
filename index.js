//导入
const express = require('express')

const app = express()

//导入数据库数据和对应的方法
const list = require('./list')

//导入cors
const cors = require('cors')

app.use(express.json()) // 解析JSON请求体
app.use(express.urlencoded({ extended: true })) // 解析URL编码请求体
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // 明确指定允许的源
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

list.init().then(()=>{
    app.get('/',(req,res)=>{
        list.getUsers().then(users=>{
            console.log('我在这里',users[1]||{})
            res.send(users[1]||{})
        }).catch(err=>{
            res.status(500).send('数据库错误')
        })
    })
})

// 在后端路由中包装数据结构
app.post('/home/getUserData', (req, res) => {
    console.log('收到用户数据请求:', req.body)
    const { page = 1, limit = 10, name = '' } = req.body
    
    console.log(`用户数据请求参数 - page: ${page}, limit: ${limit}, name: "${name}"`);
    
    // 如果有搜索条件，调用搜索接口
    if (name && name.trim() !== '') {
        console.log('检测到搜索条件，调用搜索接口');
        list.getSearch(name, page, limit).then(data => {
            res.json(data);
        }).catch(err => {
            console.error('搜索失败:', err);
            res.status(500).json({
                code: 500,
                message: '搜索失败: ' + err.message
            });
        });
    } else {
        // 没有搜索条件，调用普通分页接口
        list.getUsers(page, limit).then(data => {
            console.log(`用户数据获取成功 - 返回数据: ${data.list.length}条, 总数: ${data.count}`);
            res.json(data);
        }).catch(err => {
            console.error('获取用户数据失败:', err);
            res.status(500).json({
                code: 500,
                message: '获取用户数据失败: ' + err.message
            });
        });
    }
});

app.post('/home/getSearch', (req, res) => {
    console.log('搜索请求数据:', req.body)
    const { uname = '', page = 1, limit = 10 } = req.body
    
    console.log(`搜索参数 - uname: "${uname}", page: ${page}, limit: ${limit}`);
    
    list.getSearch(uname, page, limit).then(data => {
        console.log(`搜索成功 - 返回数据: ${data.list.length}条, 总数: ${data.count}`);
        
        const responseData = {
            list: data.list,
            count: data.count,
            page: data.page,
            pageSize: data.pageSize
        }
        res.json(responseData)
    }).catch(err => {
        console.error('搜索失败:', err)
        res.status(500).json({
            code: 500,
            message: '搜索失败: ' + err.message
        })
    })
})

app.post('/home/updateUser',(req,res)=>{
    console.log('我拿到数据了',req.body)
    const target = {
        username:req.body.name,
        age:req.body.age,
        sex:req.body.sex,
        birthday:req.body.birth,
        address:req.body.addr,
        id:req.body.id
    }
    list.updateUser(target).then((data)=>{
        console.log(data)
        res.send('更改成功')
    })
})

app.post('/home/addUser',(req,res)=>{
    console.log('我已经拿到了新增数据',req.body)
    const target = {
        username:req.body.name,
        age:req.body.age,
        sex:req.body.sex,
        birthday:req.body.birth,
        address:req.body.addr,
        id:req.body.id
    }
    list.addUser(target).then((data)=>{
        console.log('添加成功')
        res.send('添加成功')
    })
})

app.post('/home/deleteUser',(req,res)=>{
    console.log('我已经拿到了数据',req.body)
    const {id} = req.body
    list.deleteUser(id).then((data)=>{
        console.log(data)
        console.log('删除成功')
        res.json({ code: 200, message: '删除成功', data })
    }).catch(err => {
        console.error('删除失败:', err)
        res.status(500).json({ code: 500, message: '删除失败' })
    })
})

app.listen(3002,()=>{
    console.log('Express server running at http://127.0.0.1:3002')
})