const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { uploadImage, uploadAttachment } = require('../config/upload');
const { authenticate } = require('../middlewares/auth')

// 获取所有书籍（分页）
router.get('/', bookController.getAllBooks);

// 搜索书籍（全文检索）
router.get('/search', bookController.searchBooks);

// 获取单本书籍
router.get('/:id', bookController.getBookById);
router.get('/:id/comments', bookController.getComments);
router.post('/:id/comments', authenticate, bookController.addComment)

// 创建新书
//router.post('/', bookController.createBook);
// 修改后：
router.post('/', uploadImage.single('cover'), bookController.createBook);

// 更新书籍信息
router.put('/:id', bookController.updateBook);

// 删除书籍
router.delete('/:id', bookController.deleteBook);

// 上传封面图片
router.post('/:id/cover', uploadImage.single('cover'), bookController.uploadCover);

// 上传附件
router.post('/:id/attachment', uploadAttachment.single('attachment'), bookController.uploadAttachment);

// 下载附件
router.get('/:id/attachment', bookController.downloadAttachment);

// 获取书籍统计
router.get('/stats/summary', bookController.getBookStats);

// 在现有路由后添加
router.post('/search/advanced', bookController.advancedSearch);

// 点赞评论
router.post('/:bookId/comments/:commentId/like', authenticate, bookController.likeComment);

// 在评论路由后添加
// 在评论路由后添加 - 修改这里
router.post('/:id/comments/:commentId/replies', authenticate, bookController.addReply); // ✅ 改为 authenticate
router.get('/:id/comments/:commentId/replies', bookController.getReplies);
router.delete('/:id/comments/:commentId/replies/:replyId', authenticate, bookController.deleteReply); // ✅ 改为 authenticate


module.exports = router;