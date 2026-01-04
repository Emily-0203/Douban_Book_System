const jwt = require('jsonwebtoken')
const User = require('../models/User')

const JWT_SECRET = process.env.JWT_SECRET || 'book-system-2025-secret-key'
console.log('🔑 auth.js JWT_SECRET:', JWT_SECRET)  // 添加调试

exports.authenticate = async (req, res, next) => {
  console.log('🔐 认证中间件开始执行')
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      console.log('❌ 无 token')
      return res.status(401).json({
        success: false,
        message: '请先登录'
      })
    }

    console.log('Token 接收:', token.substring(0, 20) + '...')
    
    const decoded = jwt.verify(token, JWT_SECRET)
    console.log('Token 解码成功:', decoded)
    
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      console.log('❌ 用户不存在:', decoded.userId)
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    console.log('✅ 用户认证成功:', user.username)
    req.user = user
    
    // ✅ 关键：调用 next() 继续执行下一个中间件/控制器
    console.log('🔄 调用 next() 继续执行...')
    return next()
    
  } catch (error) {
    console.error('❌ 认证错误详情:', error.message)
    
    // ✅ 返回错误响应，不要调用 next()
    return res.status(401).json({
      success: false,
      message: '认证失败: ' + error.message
    })
  }
}

