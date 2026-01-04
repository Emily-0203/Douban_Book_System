"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listParser = exports.ListParser = void 0;
const cheerio_1 = require("cheerio");
/**
 * 列表页解析器
 */
class ListParser {
    /**
     * 解析列表页HTML
     */
    parse(html) {
        const $ = (0, cheerio_1.load)(html);
        const books = [];
        const bookItems = $('ul.subject-list li.subject-item');
        bookItems.each((index, element) => {
            try {
                const book = this.parseBookItem($, $(element));
                if (book.detailUrl) {
                    books.push(book);
                }
            }
            catch (error) {
                console.error(`解析第 ${index + 1} 本书时出错:`, error);
            }
        });
        console.log(`列表页解析完成，共找到 ${books.length} 本书`);
        return books;
    }
    /**
     * 解析单个书籍条目
     */
    parseBookItem($, $item) {
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
    parseNextPageUrl(html) {
        const $ = (0, cheerio_1.load)(html);
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
    getStartFromUrl(url) {
        const match = url.match(/start=(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
}
exports.ListParser = ListParser;
exports.listParser = new ListParser();
