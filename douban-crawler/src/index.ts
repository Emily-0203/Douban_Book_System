#!/usr/bin/env node

import { crawlerEngine } from './core/engine';
import { jsonWriter } from './storage/jsonWriter';
import { config } from './config';
import { logger } from './utils/logger';
import { Command } from 'commander';

const program = new Command();

program
  .name('douban-crawler')
  .description('豆瓣图书爬虫 - 用于课程项目')
  .version('1.0.0');

// start 命令 - 智能继续版本
program
  .command('start')
  .description('开始爬取图书数据（自动从上次位置继续）')
  .option('-n, --number <number>', '爬取数量', '30')
  .action(async (options: any) => {
    try {
      // 智能计算起始位置
      const existingBooks = jsonWriter.loadAllBooks();
      const existingCount = existingBooks.length;
      
      const booksPerPage = 20;
      const pagesCrawled = Math.floor(existingCount / booksPerPage);
      //const startFrom = pagesCrawled * booksPerPage;
      let startFrom = 0;  // 默认从0开始
      if (!options.reset) {  // 如果不用reset选项，才从上次位置继续
        const pagesCrawled = Math.floor(existingCount / booksPerPage);
        startFrom = pagesCrawled * booksPerPage;
      }
      
      logger.info(`📊 ${options.reset ? '重置爬取' : '自动继续'}: 已有 ${existingCount} 本书`);
      logger.info(`📄 从第 ${Math.floor(startFrom / booksPerPage) + 1} 页开始 (start=${startFrom})`);

      
      // 备份并修改配置
      const originalEntryUrl = config.entryUrl;
      const newEntryUrl = config.entryUrl.replace(/start=\d+/, `start=${startFrom}`);
      config.entryUrl = newEntryUrl;
      
      logger.info(`📊 自动继续: 已有 ${existingCount} 本书`);
      logger.info(`📄 从第 ${pagesCrawled + 1} 页开始 (start=${startFrom})`);
      logger.info(`🎯 目标爬取: ${options.number} 本新书`);
      
      // 执行爬取
      const maxBooks = parseInt(options.number);
      const books = await crawlerEngine.crawl(maxBooks);
      
      // 恢复配置
      config.entryUrl = originalEntryUrl;
      
      logger.info(`🎉 爬取完成！新增 ${books.length} 本书`);
      logger.info(`📁 数据文件: ${config.jsonFile}`);
      logger.info(`🖼️  图片目录: ${config.imagesDir}`);
      
    } catch (error: any) {
      logger.error('爬虫执行失败:', error.message);
      process.exit(1);
    }
  });

// stats 命令
program
  .command('stats')
  .description('查看统计数据')
  .action(() => {
    try {
      const stats = jsonWriter.getStats();
      
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
      
    } catch (error: any) {
      logger.error('获取统计失败:', error.message);
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
    
    confirm.question('⚠️  确定要清空所有数据吗？(yes/no): ', (answer: string) => {
      if (answer.toLowerCase() === 'yes') {
        jsonWriter.clearAll();
        logger.info('所有数据已清空');
      } else {
        logger.info('操作已取消');
      }
      confirm.close();
    });
  });

// 如果没有提供命令，显示帮助
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);