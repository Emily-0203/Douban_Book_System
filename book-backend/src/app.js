const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const connectDB = require('./config/database')
const bookRoutes = require('./routes/bookRoutes')
const authRoutes = require('./routes/authRoutes')
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static', express.static(path.join(__dirname, '../static')))
app.use('/api/users', userRoutes);
connectDB()

app.use('/api/books', bookRoutes)
app.use('/api/auth', authRoutes)

app.use('/api/bookmarks', bookmarkRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ✅ 正确的错误处理中间件（4个参数）
app.use((err, req, res, next) => {
  console.error('全局错误处理:', err.message)
  console.error('错误堆栈:', err.stack)
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || '服务器内部错误'
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务器: http://localhost:${PORT}`)
})