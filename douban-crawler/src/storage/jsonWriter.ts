import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { DoubanBook } from '../types/book';
/**
 * JSON数据写入器
 */
export class JsonWriter {
  private dataPath: string;
  
  constructor(customPath?: string) {
    this.dataPath = customPath || config.jsonFile;
    
    // 确保目录存在
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  /**
   * 保存单本书籍（追加模式）
   */
  saveBook(book: DoubanBook): void {
    const allBooks = this.loadAllBooks();
    const existingIndex = allBooks.findIndex(b => b.isbn === book.isbn || b.doubanId === book.doubanId);
    
    if (existingIndex >= 0) {
      // 更新已存在的书籍
      allBooks[existingIndex] = book;
      console.log(`更新书籍: ${book.title} (ISBN: ${book.isbn})`);
    } else {
      // 添加新书籍
      allBooks.push(book);
      console.log(`添加书籍: ${book.title} (ISBN: ${book.isbn})`);
    }
    
    this.saveAllBooks(allBooks);
  }
  
  /**
   * 批量保存书籍
   */
  saveBooks(books: DoubanBook[]): void {
    if (books.length === 0) {
      console.log('没有书籍需要保存');
      return;
    }
    
    const allBooks = this.loadAllBooks();
    let added = 0;
    let updated = 0;
    
    books.forEach(book => {
      const existingIndex = allBooks.findIndex(b => b.isbn === book.isbn || b.doubanId === book.doubanId);
      
      if (existingIndex >= 0) {
        allBooks[existingIndex] = book;
        updated++;
      } else {
        allBooks.push(book);
        added++;
      }
    });
    
    this.saveAllBooks(allBooks);
    console.log(`保存完成: 新增 ${added} 本, 更新 ${updated} 本, 总计 ${allBooks.length} 本`);
  }
  
  /**
   * 保存所有书籍数据
   */
  private saveAllBooks(books: DoubanBook[]): void {
    try {
      // 按书名排序
      const sortedBooks = books.sort((a, b) => a.title.localeCompare(b.title));
      
      // 格式化JSON（漂亮的缩进）
      const jsonData = JSON.stringify(sortedBooks, null, 2);
      fs.writeFileSync(this.dataPath, jsonData, 'utf-8');
      
      console.log(`数据已保存到: ${this.dataPath} (${books.length} 本书)`);
    } catch (error: any) {
      console.error('保存JSON文件失败:', error.message);
      throw error;
    }
  }
  
  /**
   * 加载所有书籍
   */
  loadAllBooks(): DoubanBook[] {
    try {
      if (!fs.existsSync(this.dataPath)) {
        return [];
      }
      
      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      if (!fileContent.trim()) {
        return [];
      }
      
      const books = JSON.parse(fileContent) as DoubanBook[];
      console.log(`从 ${this.dataPath} 加载了 ${books.length} 本书`);
      return books;
    } catch (error: any) {
      console.error('加载JSON文件失败:', error.message);
      // 如果文件损坏，返回空数组
      return [];
    }
  }
  
  /**
   * 清空所有数据
   */
  clearAll(): void {
    if (fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, '[]', 'utf-8');
      console.log(`已清空数据文件: ${this.dataPath}`);
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalBooks: number;
    uniqueAuthors: number;
    tagsCount: { [tag: string]: number };
    ratingStats: { average: number; count: number };
  } {
    const books = this.loadAllBooks();
    
    if (books.length === 0) {
      return {
        totalBooks: 0,
        uniqueAuthors: 0,
        tagsCount: {},
        ratingStats: { average: 0, count: 0 }
      };
    }
    
    // 统计作者
    const authors = new Set<string>();
    books.forEach(book => {
      book.author.forEach(author => authors.add(author));
    });
    
    // 统计标签
    const tagsCount: { [tag: string]: number } = {};
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
      });
    });
    
    // 统计评分
    const ratings = books
      .filter(book => book.rating)
      .map(book => parseFloat(book.rating!));
    
    const ratingAverage = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;
    
    return {
      totalBooks: books.length,
      uniqueAuthors: authors.size,
      tagsCount,
      ratingStats: {
        average: parseFloat(ratingAverage.toFixed(2)),
        count: ratings.length
      }
    };
  }
  
  /**
   * 导出为其他格式（可选功能）
   */
  exportAs(format: 'csv' | 'txt'): string {
    const books = this.loadAllBooks();
    let content = '';
    
    if (format === 'csv') {
      // CSV格式
      content = '书名,作者,出版社,ISBN,评分,标签\n';
      books.forEach(book => {
        const authors = book.author.join(';');
        const tags = book.tags.join(';');
        content += `"${book.title}","${authors}","${book.press}","${book.isbn}","${book.rating || ''}","${tags}"\n`;
      });
    } else if (format === 'txt') {
      // 文本格式
      books.forEach((book, index) => {
        content += `=== 书籍 ${index + 1} ===\n`;
        content += `书名: ${book.title}\n`;
        content += `作者: ${book.author.join(', ')}\n`;
        content += `出版社: ${book.press}\n`;
        content += `ISBN: ${book.isbn}\n`;
        content += `评分: ${book.rating || '无'}\n`;
        content += `标签: ${book.tags.join(', ')}\n`;
        content += `简介: ${book.summary.substring(0, 100)}...\n\n`;
      });
    }
    
    return content;
  }
}

export const jsonWriter = new JsonWriter();