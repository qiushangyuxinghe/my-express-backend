require('dotenv').config();
const express = require('express')
const app = express()

app.use(express.json())

app.use(cors({
    origin: ['http://localhost:5173', 'https://first-project-blue-five.vercel.app'],
    credentials: true
}))

// 简单的测试路由，不连接数据库
app.get('/', (req, res) => {
    res.json({ 
        message: 'API 服务运行正常（测试版）',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    })
})

app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'disconnected' })
})

module.exports = app