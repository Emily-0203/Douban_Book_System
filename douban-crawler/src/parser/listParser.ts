import { load } from 'cheerio';
import { DoubanBook } from '../types/book';

/**
 * 从列表页解析出的书籍基本信息
 */
export interface BookBasicInfo {
  detailUrl: string;
  title: string;
  coverUrl: string;
  rating?: string;
  pubInfo?: string;
}

/**
 * 列表页解析器
 */
export class ListParser {
  /**
   * 解析列表页HTML
   */
  parse(html: string): BookBasicInfo[] {
    const $ = load(html);
    const books: BookBasicInfo[] = [];
    
    const bookItems = $('ul.subject-list li.subject-item');
    
    bookItems.each((index, element) => {
      try {
        const book = this.parseBookItem($, $(element));
        if (book.detailUrl) {
          books.push(book);
        }
      } catch (error) {
        console.error(`解析第 ${index + 1} 本书时出错:`, error);
      }
    });
    
    console.log(`列表页解析完成，共找到 ${books.length} 本书`);
    return books;
  }
  
  /**
   * 解析单个书籍条目
   */
  private parseBookItem($: any, $item: any): BookBasicInfo {
    // 1. 提取详情页URL
    const detailUrl = $item.find('.info h2 a').attr('href') || '';
    
    // 2. 提取书名
    const title = $item.find('.info h2 a').text().trim();
    
    // 3. 提取封面图片URL
    const coverUrl = $item.find('.pic img').attr('src') || '';
    
    // 4. 提取评分
    const rating = $item.find('.rating_nums').text().trim();
    
    // 5. 提取出版信息
    const pubInfo = $item.find('.pub').text().trim();
    
    return {
      detailUrl,
      title,
      coverUrl,
      rating: rating || undefined,
      pubInfo: pubInfo || undefined,
    };
  }
  
  /**
   * 解析下一页URL
   */
  parseNextPageUrl(html: string): string | null {
    const $ = load(html);
    
    const nextLink = $('span.next a').attr('href') || 
                    $('a.next').attr('href') ||
                    $('a:contains("下一页")').attr('href') ||
                    $('a:contains("后页")').attr('href');
    
    if (nextLink) {
      return nextLink.startsWith('http') 
        ? nextLink 
        : `https://book.douban.com${nextLink}`;
    }
    
    return null;
  }
  
  /**
   * 从URL提取start参数
   */
  getStartFromUrl(url: string): number {
    const match = url.match(/start=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

export const listParser = new ListParser();