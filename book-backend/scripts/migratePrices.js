// book-backend/scripts/migratePrices.js
const mongoose = require('mongoose');
const Book = require('../src/models/Book');

async function migrate() {
  console.log('🚀 开始迁移价格数据...');
  
  await mongoose.connect('mongodb://localhost:27017/douban_books');
  
  const books = await Book.find({});
  console.log(`📚 找到 ${books.length} 本书`);
  
  let updated = 0;
  let errors = 0;
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    
    try {
      // 计算价格数字
      const priceNum = book.priceNumber;
      
      // 只更新有有效价格的
      if (priceNum > 0) {
        await Book.updateOne(
          { _id: book._id },
          { $set: { priceNum: priceNum } }
        );
        updated++;
      }
      
      // 进度显示
      if ((i + 1) % 100 === 0) {
        console.log(`📊 进度: ${i + 1}/${books.length}`);
      }
      
    } catch (error) {
      errors++;
      console.error(`❌ 错误处理书籍 ${book.title}:`, error.message);
    }
  }
  
  console.log(`
✅ 迁移完成！
📊 统计:
  总书籍: ${books.length}
  成功更新: ${updated}
  错误: ${errors}
  `);
  
  await mongoose.disconnect();
  process.exit();
}

migrate().catch(console.error);