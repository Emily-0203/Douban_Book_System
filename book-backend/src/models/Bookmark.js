const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'bookmarks'
});

// 复合唯一索引，防止重复收藏
BookmarkSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);