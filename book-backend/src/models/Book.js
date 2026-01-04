const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookSchema = new mongoose.Schema({
  doubanId: String,
  doubanUrl: String,
  isbn: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: String,
  author: [String],
  press: String,
  publishDate: String,
  price: String,
  priceNumber: {
  type: Number,
  get: function() {
    if (!this.price || this.price === '未知价格') return 0;
    
    const str = this.price.toString().trim();
    
    // 尝试多种匹配模式
    const patterns = [
      /¥\s*(\d+\.?\d*)/,     // ¥42.00
      /￥\s*(\d+\.?\d*)/,     // ￥42.00
      /USD\s*(\d+\.?\d*)/,    // USD 20.00
      /\$\s*(\d+\.?\d*)/,     // $20.00
      /(\d+\.?\d*)\s*元/,     // 42.00元
      /(\d+\.?\d*)/           // 纯数字
    ];
    
    for (const pattern of patterns) {
      const match = str.match(pattern);
      if (match) {
        const num = parseFloat(match[1]);
        // 如果数字很小且是美元，转换为人民币
        if ((str.includes('$') || str.includes('USD')) && num < 100) {
          return num * 6.5;
        }
        return num;
      }
    }
    
    return 0;
  }
},
  pages: String,
  binding: String,
  summary: String,
  authorIntro: String,
  tags: [String],
  rating: String,
  ratingCount: String,
  reviewCount: String,
  coverImage: {
    localPath: String,
    fileName: String
  },
  attachment: {
    localPath: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date
  },
  comments: [{
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  username: String,
  content: String,
  rating: { type: String, default: '0' },
  time: String,
  location: String,
  avatar: String,
  likes: { type: Number, default: 0 },
  likedBy: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  // ✅ 新增：回复相关字段
  parentId: { 
    type: Schema.Types.ObjectId, 
    default: null,
    ref: 'Book.comments._id'  // 自引用
  },
  replyTo: { type: String, default: '' },
  replyToId: { 
    type: Schema.Types.ObjectId, 
    default: null,
    ref: 'User' 
  },
  isReply: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'douban' }
}, {
  collection: 'doubanbooks',
  toJSON: { getters: true },
  toObject: { getters: true }
});

BookSchema.index({ title: 'text', summary: 'text', tags: 'text' });
BookSchema.index({ isbn: 1 }, { unique: true });
BookSchema.index({ 'coverImage.localPath': 1 });
BookSchema.index({ priceNumber: 1 });

BookSchema.pre('save', async function() {
  this.updatedAt = Date.now()
  // 不需要调用 next()，async 函数自动处理
})

module.exports = mongoose.model('Book', BookSchema, 'doubanbooks');