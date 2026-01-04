const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { uploadAvatar } = require('../config/avatarUpload');
const { authenticate } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authenticate);

// 获取用户信息
router.get('/profile', userController.getProfile);

// 更新用户信息
router.put('/profile', userController.updateProfile);

// 上传头像（传统方式）
router.post('/avatar', uploadAvatar.single('avatar'), userController.uploadAvatar);

// 获取用户统计
router.get('/stats', userController.getUserStats);

// 修改密码
router.put('/password', userController.changePassword);

module.exports = router;