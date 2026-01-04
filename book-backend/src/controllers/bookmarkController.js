const Bookmark = require('../models/Bookmark');
const Book = require('../models/Book');

// 收藏/取消收藏
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    // 检查书籍是否存在
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    // 检查是否已收藏
    const existing = await Bookmark.findOne({ userId, bookId });
    
    if (existing) {
      // 取消收藏
      await existing.deleteOne();
      return res.json({
        success: true,
        message: '已取消收藏',
        data: { isBookmarked: false }
      });
    } else {
      // 添加收藏
      const bookmark = await Bookmark.create({ userId, bookId });
      return res.json({
        success: true,
        message: '收藏成功',
        data: { 
          isBookmarked: true,
          bookmark: {
            id: bookmark._id,
            createdAt: bookmark.createdAt
          }
        }
      });
    }
  } catch (error) {
    // 处理唯一索引错误（重复收藏）
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '已收藏过此书'
      });
    }
    next(error);
  }
};

// 检查收藏状态
exports.checkBookmark = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOne({ userId, bookId });
    
    res.json({
      success: true,
      data: { isBookmarked: !!bookmark }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户收藏列表
exports.getUserBookmarks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // 获取收藏记录，并关联书籍信息
    const bookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bookId', 'title author press coverImage rating isbn publishDate')
      .lean();

    // 格式化返回数据
    const formattedBookmarks = bookmarks.map(item => {
      const book = item.bookId;
      return {
        id: item._id,
        bookId: book._id,
        title: book.title,
        author: book.author,
        press: book.press,
        coverImage: book.coverImage,
        coverImageUrl: book.coverImage?.localPath ? `/static/images/${book.isbn}.jpg` : null,
        rating: book.rating,
        isbn: book.isbn,
        publishDate: book.publishDate,
        bookmarkedAt: item.createdAt
      };
    });

    const total = await Bookmark.countDocuments({ userId });

    res.json({
      success: true,
      data: formattedBookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取收藏统计
exports.getBookmarkStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const total = await Bookmark.countDocuments({ userId });
    
    // 最近收藏的书籍
    const recentBookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('bookId', 'title author')
      .select('createdAt');

    res.json({
      success: true,
      data: {
        total,
        recentBookmarks: recentBookmarks.map(item => ({
          id: item._id,
          title: item.bookId.title,
          author: item.bookId.author,
          bookmarkedAt: item.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};