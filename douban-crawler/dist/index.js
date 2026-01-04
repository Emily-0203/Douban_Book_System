#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./core/engine");
const jsonWriter_1 = require("./storage/jsonWriter");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const commander_1 = require("commander");
const program = new commander_1.Command();
program
    .name('douban-crawler')
    .description('豆瓣图书爬虫 - 用于课程项目')
    .version('1.0.0');
// start 命令 - 智能继续版本
program
    .command('start')
    .description('开始爬取图书数据（自动从上次位置继续）')
    .option('-n, --number <number>', '爬取数量', '30')
    .action(async (options) => {
    try {
        // 智能计算起始位置
        const existingBooks = jsonWriter_1.jsonWriter.loadAllBooks();
        const existingCount = existingBooks.length;
        const booksPerPage = 20;
        const pagesCrawled = Math.floor(existingCount / booksPerPage);
        const startFrom = pagesCrawled * booksPerPage;
        // 备份并修改配置
        const originalEntryUrl = config_1.config.entryUrl;
        const newEntryUrl = config_1.config.entryUrl.replace(/start=\d+/, `start=${startFrom}`);
        config_1.config.entryUrl = newEntryUrl;
        logger_1.logger.info(`📊 自动继续: 已有 ${existingCount} 本书`);
        logger_1.logger.info(`📄 从第 ${pagesCrawled + 1} 页开始 (start=${startFrom})`);
        logger_1.logger.info(`🎯 目标爬取: ${options.number} 本新书`);
        // 执行爬取
        const maxBooks = parseInt(options.number);
        const books = await engine_1.crawlerEngine.crawl(maxBooks);
        // 恢复配置
        config_1.config.entryUrl = originalEntryUrl;
        logger_1.logger.info(`🎉 爬取完成！新增 ${books.length} 本书`);
        logger_1.logger.info(`📁 数据文件: ${config_1.config.jsonFile}`);
        logger_1.logger.info(`🖼️  图片目录: ${config_1.config.imagesDir}`);
    }
    catch (error) {
        logger_1.logger.error('爬虫执行失败:', error.message);
        process.exit(1);
    }
});
// stats 命令
program
    .command('stats')
    .description('查看统计数据')
    .action(() => {
    try {
        const stats = jsonWriter_1.jsonWriter.getStats();
        console.log('='.repeat(50));
        console.log('📊 图书数据统计');
        console.log('='.repeat(50));
        console.log(`总书籍数: ${stats.totalBooks}`);
        console.log(`独立作者数: ${stats.uniqueAuthors}`);
        console.log(`平均评分: ${stats.ratingStats.average} (${stats.ratingStats.count} 本有评分)`);
        if (Object.keys(stats.tagsCount).length > 0) {
            console.log('\n热门标签:');
            const sortedTags = Object.entries(stats.tagsCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            sortedTags.forEach(([tag, count]) => {
                console.log(`  ${tag.padEnd(15)}: ${count} 本`);
            });
        }
        console.log('='.repeat(50));
    }
    catch (error) {
        logger_1.logger.error('获取统计失败:', error.message);
    }
});
// clear 命令
program
    .command('clear')
    .description('清空所有数据')
    .action(() => {
    const readline = require('readline');
    const confirm = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    confirm.question('⚠️  确定要清空所有数据吗？(yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            jsonWriter_1.jsonWriter.clearAll();
            logger_1.logger.info('所有数据已清空');
        }
        else {
            logger_1.logger.info('操作已取消');
        }
        confirm.close();
    });
});
// 如果没有提供命令，显示帮助
if (process.argv.length <= 2) {
    program.help();
}
program.parse(process.argv);
