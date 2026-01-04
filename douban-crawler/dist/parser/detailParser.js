"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detailParser = exports.DetailParser = void 0;
const cheerio_1 = require("cheerio");
const selectorHelper_1 = require("../utils/selectorHelper");
/**
 * 详情页解析器
 */
class DetailParser {
    /**
     * 解析详情页HTML
     */
    parse(html, detailUrl, coverUrl) {
        const $ = (0, cheerio_1.load)(html);
        const doubanId = selectorHelper_1.SelectorHelper.extractDoubanId(detailUrl);
        const $info = $('#info');
        // 提取核心字段
        const title = $('h1 span[property="v:itemreviewed"]').text().trim();
        const author = this.extractAuthors($, $info);
        const press = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '出版社');
        const publishDate = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '出版年');
        const price = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '定价');
        const pages = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '页数');
        const binding = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '装帧');
        const isbn = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, 'ISBN');
        // 提取丛书信息和副标题
        const series = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '丛书');
        const subtitle = $info.find('span.pl:contains("副标题")').next().text().trim();
        // 评分信息
        const rating = $('.rating_num').text().trim();
        const ratingCount = $('.rating_people span').text().trim();
        // 简介和标签
        const summary = selectorHelper_1.SelectorHelper.extractIntro($, '#link-report .intro p');
        const authorIntro = selectorHelper_1.SelectorHelper.extractIntro($, '.related_info:contains("作者简介") + .indent .intro p');
        const tags = selectorHelper_1.SelectorHelper.extractTags($);
        // 评论
        const comments = selectorHelper_1.SelectorHelper.extractComments($);
        // 封面图片
        const highResCover = $('#mainpic a.nbg').attr('href') || coverUrl || '';
        // 构建书籍对象
        const book = {
            doubanId,
            doubanUrl: detailUrl,
            isbn: isbn || this.generateFallbackIsbn(doubanId),
            title: title || '未知标题',
            subtitle: subtitle || undefined,
            author: author.length > 0 ? author : ['未知作者'],
            press: press || '未知出版社',
            publishDate: publishDate || '未知日期',
            price: price || '未知价格',
            pages: pages || undefined,
            binding: binding || undefined,
            summary: summary || '暂无简介',
            authorIntro: authorIntro || undefined,
            tags: tags.length > 0 ? tags : ['未分类'],
            rating: rating || undefined,
            ratingCount: ratingCount || undefined,
            reviewCount: comments.length.toString(),
            coverImage: {
                url: highResCover,
                localPath: `images/${isbn || doubanId}.jpg`,
            },
            comments: comments,
            attachment: {
                type: 'search_link',
                url: `https://search.douban.com/book/subject_search?search_text=${isbn || doubanId}`,
                description: `豆瓣图书搜索：${title}`,
            },
            crawledAt: new Date().toISOString(),
            source: 'douban',
        };
        return book;
    }
    /**
     * 提取作者信息
     */
    extractAuthors($, $info) {
        const authors = [];
        const $authorLabel = $info.find('span.pl:contains("作者")');
        if ($authorLabel.length > 0) {
            $authorLabel.nextAll('a').each((index, element) => {
                const author = $(element).text().trim();
                if (author && !authors.includes(author)) {
                    authors.push(author);
                }
            });
            if (authors.length === 0) {
                const authorText = selectorHelper_1.SelectorHelper.findValueByLabel($, $info, '作者');
                if (authorText) {
                    const authorList = authorText.split(/[\/／]/).map((a) => a.trim()).filter((a) => a);
                    authors.push(...authorList);
                }
            }
        }
        return authors;
    }
    /**
     * 生成备用的ISBN
     */
    generateFallbackIsbn(doubanId) {
        const paddedId = doubanId.padStart(10, '0');
        return `9${paddedId.substring(0, 12)}`;
    }
    /**
     * 验证解析结果
     */
    isValidBook(book) {
        return !!(book.title && book.title !== '未知标题' &&
            book.author.length > 0 &&
            book.isbn);
    }
}
exports.DetailParser = DetailParser;
exports.detailParser = new DetailParser();
