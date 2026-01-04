const Book = require('../models/Book');
const FileHelper = require('../utils/fileHelper');
const path = require('path');

// 获取所有书籍（分页）
exports.getAllBooks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    if (req.query.minRating) {
      query.rating = { $gte: req.query.minRating };
    }

    const total = await Book.countDocuments(query);
    
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const booksWithUrls = books.map(book => {
      const bookObj = book.toObject();
      let coverImageUrl = null;
      
      if (book.coverImage?.localPath) {
        coverImageUrl = FileHelper.getImageUrl(book.coverImage.localPath);
      } else if (book.isbn) {
        coverImageUrl = `/static/images/${book.isbn}.jpg`;
      } else if (book.doubanId) {
        coverImageUrl = `/static/images/${book.doubanId}.jpg`;
      }
      
      return {
        ...bookObj,
        coverImageUrl
      };
    });

    res.json({
      success: true,
      data: booksWithUrls,
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

// 搜索书籍
exports.searchBooks = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }

    // ✅ 关键修改：使用模糊查询，不再依赖全文索引
    const searchQuery = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } },
        { press: { $regex: q, $options: 'i' } }
      ]
    };

    const books = await Book.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    const booksWithUrls = books.map(book => {
      const bookObj = book.toObject();
      let coverImageUrl = null;
      
      if (book.coverImage?.localPath) {
        coverImageUrl 
= FileHelper.getImageUrl(book.coverImage.localPath);
      } else if (book.isbn) {
        coverImageUrl 
= `/static/images/${book.isbn}.jpg`;
      }
      
      return {
        ...bookObj,
        coverImageUrl
      };
    });

    res
.json({
      success: true,
      data: booksWithUrls,
      count: books.
length
    });
  } catch (error) {
    next(error);
  }
};

// 获取单本书籍
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const bookData = book.toObject();
    bookData.coverImageUrl = book.coverImage?.localPath 
      ? FileHelper.getImageUrl(book.coverImage.localPath)
      : null;
      
      // ✅ 新增：结构化评论数据
    const allComments = bookData.comments || [];
    
    // 分离顶级评论和回复
    const topComments = [];
    const repliesMap = {}; // 按 parentId 分组回复
    
    allComments.forEach(comment => {
      if (!comment.parentId) {
        // 顶级评论
        comment.replies = []; // 初始化回复数组
        topComments.push(comment);
      } else {
        // 回复
        const parentIdStr = comment.parentId.toString();
        if (!repliesMap[parentIdStr]) {
          repliesMap[parentIdStr] = [];
        }
        repliesMap[parentIdStr].push(comment);
      }
    });
    
    // 将回复挂载到对应的父评论
    topComments.forEach(comment => {
      const commentId = comment._id.toString();
      if (repliesMap[commentId]) {
        // 按时间排序回复
        comment.replies = repliesMap[commentId].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      }
    });
    
    // 按时间排序顶级评论（最新的在前）
    topComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    bookData.comments = topComments;
    bookData.commentCount = allComments.length;




    res.json({
      success: true,
      data: bookData
    });
  } catch (error) {
    next(error);
  }
};

// 创建新书
exports.createBook = async (req, res, next) => {
  console.log('🚀 === 开始创建图书 ===');
  
  // 1. 打印请求信息
  console.log('📦 请求方法:', req.method);
  console.log('📦 请求体字段:', Object.keys(req.body));
  console.log('📦 请求头 Content-Type:', req.headers['content-type']);
  
  // 详细打印每个字段
  if (Object.keys(req.body).length > 0) {
    console.log('📦 请求体详细内容:');
    Object.entries(req.body).forEach(([key, value]) => {
      console.log(`    ${key}: "${value}" (类型: ${typeof value}, 长度: ${value?.length || 0})`);
    });
  } else {
    console.log('⚠️  请求体为空！可能原因：');
    console.log('   1. 没有使用 uploadImage.single("cover") 中间件');
    console.log('   2. 前端发送的不是 multipart/form-data');
    console.log('   3. 文件太大超过限制');
  }
  
  // 打印文件信息
  if (req.file) {
    console.log('📁 文件信息:');
    console.log('   文件名:', req.file.originalname);
    console.log('   保存为:', req.file.filename);
    console.log('   文件大小:', req.file.size, 'bytes');
    console.log('   MIME类型:', req.file.mimetype);
    console.log('   保存路径:', req.file.path);
  } else {
    console.log('📁 无文件上传');
  }
  
  try {
    // 2. 准备图书数据
    let bookData = { ...req.body };
    
    console.log('🔧 处理前的数据:', JSON.stringify(bookData, null, 2));
    
    // 3. 处理数组字段（字符串转数组）
    if (bookData.author) {
      if (typeof bookData.author === 'string') {
        console.log('🔄 转换 author 字符串为数组:', bookData.author);
        bookData.author = bookData.author
          .split(',')
          .map(a => a.trim())
          .filter(a => a && a.length > 0);
        console.log('✅ 转换后 author:', bookData.author);
      } else if (Array.isArray(bookData.author)) {
        console.log('✅ author 已经是数组:', bookData.author);
      }
    } else {
      console.log('⚠️  author 字段不存在或为空');
      bookData.author = []; // 设为空数组
    }
    
    if (bookData.tags) {
      if (typeof bookData.tags === 'string') {
        console.log('🔄 转换 tags 字符串为数组:', bookData.tags);
        bookData.tags = bookData.tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t && t.length > 0);
        console.log('✅ 转换后 tags:', bookData.tags);
      } else if (Array.isArray(bookData.tags)) {
        console.log('✅ tags 已经是数组:', bookData.tags);
      }
    } else {
      console.log('⚠️  tags 字段不存在或为空');
      bookData.tags = []; // 设为空数组
    }
    
    // 4. 处理封面图片
    if (req.file) {
      console.log('🖼️ 开始处理封面图片...');
      
      try {
        // 确保 FileHelper 已导入
        if (!FileHelper) {
          console.error('❌ FileHelper 未定义！');
          throw new Error('FileHelper 未定义');
        }
        
        // 生成文件名（优先使用ISBN，否则用时间戳）
        const fileName = bookData.isbn 
          ? `${bookData.isbn}.jpg`
          : `book-${Date.now()}.jpg`;
        
        console.log('🖼️ 图片文件名:', fileName);
        
        const processedImage = await FileHelper.processImage(
          req.file.path,
          'static/images',
          fileName
        );
        
        bookData.coverImage = {
          localPath: processedImage.original,
          fileName: req.file.originalname
        };
        
        console.log('✅ 封面图片处理完成:', bookData.coverImage);
      } catch (imageError) {
        console.error('❌ 处理封面图片失败:', imageError.message);
        // 继续执行，不中断创建
        bookData.coverImage = {
          localPath: req.file.path,
          fileName: req.file.originalname
        };
      }
    } else {
      console.log('⚠️  没有封面图片，使用默认封面');
      // 可以设置一个默认封面或留空
    }
    
    // 5. 设置默认值
    const defaults = {
      rating: '0',
      ratingCount: '0',
      reviewCount: '0',
      source: 'manual',
      doubanId: '',
      doubanUrl: '',
      pages: bookData.pages || '',
      binding: bookData.binding || '',
      subtitle: bookData.subtitle || '',
      authorIntro: bookData.authorIntro || ''
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
      if (!bookData[key] || bookData[key] === '') {
        bookData[key] = value;
        console.log(`⚙️  设置默认值 ${key}: ${value}`);
      }
    });
    
    // 6. 验证必需字段
    const requiredFields = ['title', 'isbn', 'press', 'publishDate', 'price', 'summary'];
    const missingFields = requiredFields.filter(field => !bookData[field] || bookData[field].trim() === '');
    
    if (missingFields.length > 0) {
      console.error('❌ 缺少必需字段:', missingFields);
      return res.status(400).json({
        success: false,
        message: `缺少必需字段: ${missingFields.join(', ')}`
      });
    }
    
    console.log('✅ 所有必需字段验证通过');
    
    // 7. 打印最终数据
    console.log('📄 最终创建数据:');
    console.log(JSON.stringify(bookData, null, 2));
    
    // 8. 创建图书
    console.log('🔄 开始创建数据库记录...');
    
    try {
      const book = await Book.create(bookData);
      
      console.log('🎉 图书创建成功！');
      console.log('📚 图书ID:', book._id);
      console.log('📚 书名:', book.title);
      console.log('📚 ISBN:', book.isbn);
      
      // 9. 返回成功响应
      res.status(201).json({
        success: true,
        message: '书籍创建成功',
        data: {
          _id: book._id,
          title: book.title,
          isbn: book.isbn,
          author: book.author,
          press: book.press,
          coverImageUrl: book.coverImage?.localPath 
            ? FileHelper.getImageUrl(book.coverImage.localPath)
            : null
        }
      });
      
    } catch (dbError) {
      console.error('❌ 数据库创建失败:');
      console.error('   错误名称:', dbError.name);
      console.error('   错误信息:', dbError.message);
      
      if (dbError.name === 'ValidationError') {
        console.error('   验证错误详情:');
        Object.entries(dbError.errors || {}).forEach(([field, err]) => {
          console.error(`     ${field}:`, err.message);
        });
        
        return res.status(400).json({
          success: false,
          message: '数据验证失败: ' + Object.values(dbError.errors).map(e => e.message).join(', ')
        });
      }
      
      if (dbError.code === 11000) { // MongoDB 重复键错误
        console.error('   ISBN 重复:', bookData.isbn);
        return res.status(400).json({
          success: false,
          message: `ISBN ${bookData.isbn} 已存在`
        });
      }
      
      throw dbError;
    }
    
  } catch (error) {
    console.error('💥 创建图书过程中发生错误:');
    console.error('   错误:', error.message);
    console.error('   堆栈:', error.stack);
    
    // 10. 错误处理
    next(error);
  } finally {
    console.log('🏁 === 创建图书流程结束 ===\n');
  }
};


// 更新书籍
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    res.json({
      success: true,
      message: '书籍更新成功',
      data: book
    });
  } catch (error) {
    next(error);
  }
};

// 删除书籍
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    if (book.coverImage?.localPath) {
      await FileHelper.deleteFile(book.coverImage.localPath);
    }

    if (book.attachment?.localPath) {
      await FileHelper.deleteFile(book.attachment.localPath);
    }

    await book.deleteOne();

    res.json({
      success: true,
      message: '书籍删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 上传封面
exports.uploadCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择图片文件'
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const processedImage = await FileHelper.processImage(
      req.file.path,
      'static/images',
      `${book.isbn || book._id}.jpg`
    );

    if (book.coverImage?.localPath) {
      await FileHelper.deleteFile(book.coverImage.localPath);
    }

    book.coverImage = {
      localPath: processedImage.original,
      fileName: req.file.originalname
    };
    await book.save();

    res.json({
      success: true,
      message: '封面图片上传成功',
      data: {
        coverImageUrl: FileHelper.getImageUrl(processedImage.original)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 上传附件
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择附件文件'
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    if (book.attachment?.localPath) {
      await FileHelper.deleteFile(book.attachment.localPath);
    }

    book.attachment = {
      localPath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };
    await book.save();

    res.json({
      success: true,
      message: '附件上传成功',
      data: {
        fileName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};

// 下载附件
exports.downloadAttachment = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book || !book.attachment?.localPath) {
      return res.status(404).json({
        success: false,
        message: '附件不存在'
      });
    }

    const filePath = book.attachment.localPath;
    const fileName = book.attachment.originalName || 'attachment';

    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

// 添加评论
exports.addComment = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    const { content, rating } = req.body;
    const user = req.user;

    const newComment = {
      userId: user._id,
      username: user.nickname || user.username,
      avatar: user.avatar,  // 添加用户头像
      content,
      rating: rating ? rating.toString() : '0',
      createdAt: new Date(),
      // 不添加 time 和 location 字段，以区别于豆瓣评论
      // 可选：如果是回复
      parentId: req.body.parentId || null,
      replyTo: req.body.replyTo || '',
      replyToId: req.body.replyToId || null,
      isReply: req.body.parentId ? true : false

    };

    book.comments.push(newComment);
    await book.save();

    res.json({
      success: true,
      message: '评论添加成功',
      data: newComment
    });
  } catch (error) {
    next(error);
  }
};

// 获取评论
exports.getComments = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id)
      .select('comments');
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    res.json({
      success: true,
      data: book.comments || []
    });
  } catch (error) {
    next(error);
  }
};

// 点赞/取消点赞评论
exports.likeComment = async (req, res, next) => {
  try {
    const { bookId, commentId } = req.params;
    const userId = req.user._id;
    
    console.log(`👍 用户 ${userId} 点赞评论 ${commentId}`);
    
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }
    
    const comment = book.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }
    
    // 确保 likedBy 是数组
    if (!comment.likedBy) {
      comment.likedBy = [];
    }
    
    const userIndex = comment.likedBy.indexOf(userId);
    let isLiked = false;
    
    if (userIndex === -1) {
      // 点赞
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
      isLiked = true;
      console.log(`✅ 用户点赞成功，当前点赞数: ${comment.likes}`);
    } else {
      // 取消点赞
      comment.likedBy.splice(userIndex, 1);
      comment.likes = Math.max(0, (comment.likes || 1) - 1);
      isLiked = false;
      console.log(`✅ 用户取消点赞，当前点赞数: ${comment.likes}`);
    }
    
    await book.save();
    
    res.json({
      success: true,
      message: isLiked ? '点赞成功' : '已取消点赞',
      data: {
        isLiked,
        likes: comment.likes,
        likedBy: comment.likedBy
      }
    });
  } catch (error) {
    console.error('点赞失败:', error);
    next(error);
  }
};

// 添加回复
exports.addReply = async (req, res, next) => {
  try {
    const { id: bookId, commentId } = req.params;
    const { content, replyTo, replyToId } = req.body;
    const user = req.user;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    // 检查父评论是否存在
    const parentComment = book.comments.id(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 创建回复
    const newReply = {
      userId: user._id,
      username: user.nickname || user.username,
      avatar: user.avatar,
      content,
      parentId: commentId,
      replyTo: replyTo || parentComment.username,
      replyToId: replyToId || parentComment.userId,
      isReply: true,
      createdAt: new Date()
    };

    // 添加回复到评论数组
    book.comments.push(newReply);
    await book.save();

    // 获取新创建的回复（包含完整 _id）
    const savedReply = book.comments[book.comments.length - 1];

    res.json({
      success: true,
      message: '回复添加成功',
      data: savedReply
    });
  } catch (error) {
    next(error);
  }
};

// 获取评论的回复
exports.getReplies = async (req, res, next) => {
  try {
    const { id: bookId, commentId } = req.params;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    // 找到该评论的所有回复
    const replies = book.comments.filter(comment => 
      comment.parentId && comment.parentId.toString() === commentId
    );

    res.json({
      success: true,
      data: replies
    });
  } catch (error) {
    next(error);
  }
};

// 删除回复
exports.deleteReply = async (req, res, next) => {
  try {
    const { id: bookId, commentId, replyId } = req.params;
    const userId = req.user._id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: '书籍不存在'
      });
    }

    // 找到回复
    const reply = book.comments.id(replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: '回复不存在'
      });
    }

    // 检查权限：只能删除自己的回复
    if (reply.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权删除此回复'
      });
    }

    // 确保这是父评论的回复
    if (reply.parentId.toString() !== commentId) {
      return res.status(400).json({
        success: false,
        message: '回复与评论不匹配'
      });
    }

    // 删除回复
    reply.deleteOne();
    await book.save();

    res.json({
      success: true,
      message: '回复删除成功'
    });
  } catch (error) {
    next(error);
  }
};


// 高级搜索
exports.advancedSearch = async (req, res, next) => {
  try {
    const {
      keyword = '',
      minRating = 0,
      maxRating = 10,
      tags = [],
      press = '',
      page = 1,
      limit = 20,
      minPrice,
      maxPrice
    } = req.body;

    const skip = (page - 1) * limit;
    let query = {};

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { author: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
        { isbn: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (minRating > 0 || maxRating < 10) {
      query.rating = {};
      if (minRating > 0) query.rating.$gte = minRating.toString();
      if (maxRating < 10) query.rating.$lte = maxRating.toString();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.priceNumber = {};
      if (minPrice !== undefined && minPrice > 0) {
        query.priceNumber.$gte = minPrice;
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        query.priceNumber.$lte = maxPrice;
      }
    }

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (press) {
      query.press = { $regex: press, $options: 'i' };
    }

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const booksWithUrls = books.map(book => {
      const bookObj = book.toObject();
      let coverImageUrl = null;
      
      if (book.coverImage?.localPath) {
        coverImageUrl = FileHelper.getImageUrl(book.coverImage.localPath);
      } else if (book.isbn) {
        coverImageUrl = `/static/images/${book.isbn}.jpg`;
      }
      
      return {
        ...bookObj,
        coverImageUrl
      };
    });

    res.json({
      success: true,
      data: booksWithUrls,
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

// 获取统计信息
exports.getBookStats = async (req, res, next) => {
  try {
    const stats = await Book.aggregate([
      {
        $facet: {
          totalBooks: [{ $count: "count" }],
          byTag: [
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          byPress: [
            { $group: { _id: "$press", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          ratingStats: [
            { $match: { rating: { $ne: null, $ne: "" } } },
            {
              $group: {
                _id: null,
                avgRating: { $avg: { $toDouble: "$rating" } },
                maxRating: { $max: { $toDouble: "$rating" } },
                minRating: { $min: { $toDouble: "$rating" } },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};