const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticate } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authenticate);

// 收藏/取消收藏
router.post('/:bookId/toggle', bookmarkController.toggleBookmark);

// 检查收藏状态
router.get('/:bookId/status', bookmarkController.checkBookmark);

// 获取用户收藏列表
router.get('/user/list', bookmarkController.getUserBookmarks);

// 获取收藏统计
router.get('/user/stats', bookmarkController.getBookmarkStats);

module.exports = router;