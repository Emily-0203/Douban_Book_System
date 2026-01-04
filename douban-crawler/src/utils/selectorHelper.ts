import { load } from 'cheerio';

/**
 * 选择器辅助工具
 */
export class SelectorHelper {
  /**
   * 在指定区域内查找包含特定文本的label，然后获取相邻的值
   */
  static findValueByLabel($: any, $container: any, labelText: string): string {
    const $label = $container.find(`span.pl:contains("${labelText}")`);
    
    if ($label.length > 0) {
      // 方案1：尝试获取紧邻的文本节点
      const textNode = $label[0].nextSibling;
      if (textNode && textNode.nodeType === 3) {
        const value = textNode.nodeValue?.trim() || '';
        if (value) return this.cleanValue(value);
      }
      
      // 方案2：尝试获取下一个兄弟元素的文本
      const $nextElement = $label.next();
      if ($nextElement.length > 0) {
        return this.cleanValue($nextElement.text());
      }
      
      // 方案3：获取父元素的所有文本，然后提取label之后的部分
      const parentText = $label.parent().text();
      const regex = new RegExp(`${labelText}:?\\s*(.*?)(?:\\n|$)`);
      const match = parentText.match(regex);
      if (match && match[1]) {
        return this.cleanValue(match[1]);
      }
    }
    
    return '';
  }
  
  /**
   * 清理提取的值
   */
  private static cleanValue(value: string): string {
    return value
      .replace(/^[:：\s]+/, '')
      .replace(/[\s\r\n]+$/, '')
      .replace(/^["'](.*)["']$/, '$1')
      .trim();
  }
  
  /**
   * 提取所有标签
   */
  static extractTags($: any, selector: string = '#db-tags-section .tag'): string[] {
    const tags: string[] = [];
    $(selector).each((index: number, element: any) => {
      const tag = $(element).text().trim();
      if (tag) {
        tags.push(tag);
      }
    });
    return tags;
  }
  
  /**
   * 提取简介文本
   */
  static extractIntro($: any, selector: string = '.intro p'): string {
    const paragraphs: string[] = [];
    $(selector).each((index: number, element: any) => {
      const text = $(element).text().trim();
      if (text) {
        paragraphs.push(text);
      }
    });
    return paragraphs.join('\n\n');
  }
  
  /**
   * 从URL中提取豆瓣ID
   */
  static extractDoubanId(url: string): string {
    const match = url.match(/subject\/(\d+)/);
    return match ? match[1] : '';
  }
  
  /**
   * 提取评论信息
   */
  static extractComments($: any): Array<{
    user: string;
    content: string;
    rating?: string;
    time: string;
    location?: string;
  }> {
    const comments: Array<{
      user: string;
      content: string;
      rating?: string;
      time: string;
      location?: string;
    }> = [];
    
    $('.comment-item').each((index: number, element: any) => {
      const $comment = $(element);
      const user = $comment.find('.comment-info a').first().text().trim();
      const content = $comment.find('.comment-content .short').text().trim();
      const rating = $comment.find('.comment-info .rating').attr('title') || '';
      const time = $comment.find('.comment-time').text().trim();
      const location = $comment.find('.comment-location').text().trim();
      
      if (user && content) {
        comments.push({
          user,
          content,
          rating: rating || undefined,
          time,
          location: location || undefined,
        });
      }
    });
    
    return comments.slice(0, 5); // 只返回前5条评论
  }
}