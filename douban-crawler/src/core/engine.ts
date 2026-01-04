import axios, { AxiosResponse } from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config';
import { logger } from '../utils/logger';
import { delay } from '../utils/delay';
import { listParser, BookBasicInfo } from '../parser/listParser';
import { detailParser } from '../parser/detailParser';
import { imageDownloader } from '../storage/imageDownloader';
import { jsonWriter } from '../storage/jsonWriter';
import { DoubanBook } from '../types/book';
import { RequestScheduler } from './scheduler';
import { crawlerMonitor } from '../monitor/middleware';
import { httpClient } from '../utils/httpClient';
import { 
  CrawlerError, 
  NetworkError, 
  ParseError, 
  RateLimitError, 
  ErrorHandler 
} from '../utils/errorHandler';


/**
 * 爬虫引擎（主控制器）
 */
export class CrawlerEngine {
  private visitedUrls: Set<string> = new Set();
  private failedUrls: Map<string, { count: number; lastError: string; lastAttempt: string }> = new Map();
  private totalBooksCrawled: number = 0;
  private startTime: number = 0;
  private isShuttingDown: boolean = false;
  
  /**
   * 主爬取方法
   * @param maxBooks 最大爬取数量
   */
  async crawl(maxBooks?: number): Promise<DoubanBook[]> {
    this.startTime = Date.now();
    const targetBooks = maxBooks || config.maxBooks;
    
    logger.info(`🚀 爬虫启动，目标爬取 ${targetBooks} 本书`);
    logger.info(`入口URL: ${config.entryUrl}`);
    
    // 设置优雅关闭
    this.setupGracefulShutdown();
    
    // 健康检查
    const health = await this.healthCheck();  // 这行必须有，不然 health 变量不存在
    logger.info(`健康检查: ${health.status}`);

    // 判断健康状态
  if (health.status === 'unhealthy') {
    const error = new Error('爬虫健康状况不佳');
    throw new CrawlerError('爬虫健康状况不佳，建议检查配置', 'UNHEALTHY_START', error, health.details);
  }

    try {
      // 1. 从入口URL开始
      let currentListUrl = config.entryUrl;
      let allBooks: DoubanBook[] = [];
      
      // 2. 循环处理列表页，直到达到目标数量
      while (currentListUrl && allBooks.length < targetBooks && !this.isShuttingDown) {
        logger.info(`处理列表页: ${currentListUrl}`);
        
        // 2.1 爬取列表页（使用增强版）
        const listHtml = await this.fetchPageWithRetry(currentListUrl);
        if (!listHtml) {
          logger.error(`列表页获取失败: ${currentListUrl}`);
          break;
        }
        
        // 2.2 解析列表页，获取书籍基本信息
        const basicInfos = listParser.parse(listHtml);
        logger.info(`列表页解析完成，找到 ${basicInfos.length} 本书`);
        
        // 2.3 过滤掉已经爬取过的书籍
        const newBasicInfos = basicInfos.filter(info => 
          !this.visitedUrls.has(info.detailUrl)
        ).slice(0, targetBooks - allBooks.length);
        
        if (newBasicInfos.length === 0) {
          logger.warn('没有新书籍可以爬取');
          break;
        }
        
        // 2.4 并发爬取详情页
        const booksFromThisPage = await this.crawlDetailPages(newBasicInfos);
        allBooks = [...allBooks, ...booksFromThisPage];
        
        // 2.5 保存进度（每页都保存，防止中断）
        if (booksFromThisPage.length > 0) {
          jsonWriter.saveBooks(booksFromThisPage);
          logger.info(`已保存 ${booksFromThisPage.length} 本书，累计 ${allBooks.length}/${targetBooks}`);
        }
        
        // 2.6 获取下一页URL
        const nextUrl = this.getNextListUrl(listHtml, currentListUrl);
        if (nextUrl) {
          currentListUrl = nextUrl;
        } else {
          logger.info('没有下一页，爬取结束');
          break;
        }
        
        // 2.7 达到目标数量则停止
        if (allBooks.length >= targetBooks) {
          logger.info(`已达到目标数量 ${targetBooks}，停止爬取`);
          break;
        }
        
        // 2.8 列表页之间延时
        await delay(2000, 4000);
        
        // 2.9 定期健康检查
        if (allBooks.length % 10 === 0) {
          const health = await this.healthCheck();
          if (health.status === 'unhealthy') {
            logger.warn('爬虫健康状况下降，考虑调整参数');
          }
        }
      }
      
      // 3. 下载所有封面图片
      if (config.parsing.enableImageDownload) {
        await this.downloadAllCoverImages(allBooks);
      }
      
      // 4. 最终统计
      this.printStatistics(allBooks);
      
      // 5. 保存监控报告
      crawlerMonitor.saveReport();
      
      return allBooks;
      
    } catch (error: any) {
      // 使用增强的错误处理
      ErrorHandler.logError(
        new CrawlerError('爬虫执行失败', 'CRAWL_FAILED', error, {
          targetBooks,
          crawledCount: this.totalBooksCrawled,
          visitedUrls: this.visitedUrls.size
        })
      );
      
      // 保存进度
      this.saveProgress();
      throw error;
    }
  }
  
  /**
   * 爬取多个详情页
   */
  private async crawlDetailPages(basicInfos: BookBasicInfo[]): Promise<DoubanBook[]> {
    const books: DoubanBook[] = [];
    
    logger.info(`开始爬取 ${basicInfos.length} 个详情页`);
    
    // 使用调度器控制并发
    const scheduler = new RequestScheduler(config.maxConcurrent, config.delayRange);
    
    // 添加所有详情页任务
    basicInfos.forEach(info => {
      scheduler.addTask({
        url: info.detailUrl,
        priority: 0,
        retryCount: 0
      });
    });
    
    // 执行所有任务
    const results = await scheduler.start(async (url: string) => {
      try {
        const startTime = Date.now();
        crawlerMonitor.recordRequestStart(url);
        
        const book = await this.crawlSingleDetailPage(url);
        const duration = Date.now() - startTime;
        
        if (book) {
          books.push(book);
          this.visitedUrls.add(url);
          this.totalBooksCrawled++;
          crawlerMonitor.recordBookCrawl(book.doubanId || url, true);
          crawlerMonitor.recordRequestEnd(url, true, duration);
          
          // 实时显示进度
          const progress = ((this.totalBooksCrawled / config.maxBooks) * 100).toFixed(1);
          logger.info(`进度: ${this.totalBooksCrawled}/${config.maxBooks} (${progress}%) - ${book.title}`);
        } else {
          crawlerMonitor.recordBookCrawl(url, false);
          crawlerMonitor.recordRequestEnd(url, false, duration);
        }
        
        return book;
      } catch (error) {
        crawlerMonitor.recordRequestEnd(url, false, 0);
        logger.error(`详情页爬取失败: ${url}`, error);
        return null;
      }
    });
    
    const successfulBooks = books.filter(book => book !== null);
    logger.info(`详情页爬取完成，成功 ${successfulBooks.length}/${basicInfos.length}`);
    
    return successfulBooks;
  }
  
  /**
   * 爬取单个详情页
   */
  private async crawlSingleDetailPage(detailUrl: string): Promise<DoubanBook | null> {
    try {
      // 1. 获取详情页HTML
      const detailHtml = await this.fetchPageWithRetry(detailUrl);
      if (!detailHtml) {
        this.recordFailedUrl(detailUrl, '获取页面失败');
        return null;
      }
      
      // 2. 解析详情页
      const book = detailParser.parse(detailHtml, detailUrl);
      
      // 3. 验证书籍信息是否有效
      if (!detailParser.isValidBook(book)) {
        this.recordFailedUrl(detailUrl, '书籍信息不完整');
        logger.warn(`书籍信息不完整: ${book.title}`);
        return null;
      }
      
      // 4. 记录监控数据
      crawlerMonitor.recordBookCrawl(book.doubanId, true);
      
      return book;
      
    } catch (error: any) {
      this.recordFailedUrl(detailUrl, error.message);
      logger.error(`处理详情页失败 ${detailUrl}:`, error.message);
      return null;
    }
  }
  
  /**
   * 下载所有封面图片
   */
  private async downloadAllCoverImages(books: DoubanBook[]): Promise<void> {
    const imageTasks = books
      .filter(book => book.coverImage.url)
      .map(book => ({
        url: book.coverImage.url,
        filename: `${book.isbn || book.doubanId}.jpg`,
        bookId: book.doubanId
      }));
    
    if (imageTasks.length === 0) {
      logger.info('没有封面图片需要下载');
      return;
    }
    
    logger.info(`开始下载 ${imageTasks.length} 张封面图片`);
    
    const results = await imageDownloader.downloadBatch(imageTasks, 1000);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    logger.info(`封面图片下载完成: 成功 ${successCount} 张, 失败 ${failCount} 张`);
    
    // 更新本地路径（如果下载成功）
    results.forEach(result => {
      if (result.success) {
        const book = books.find(b => 
          b.isbn === result.filename.replace('.jpg', '') || 
          b.doubanId === result.filename.replace('.jpg', '')
        );
        if (book) {
          book.coverImage.localPath = `images/${result.filename}`;
        }
      }
    });
  }
  
  /**
   * 获取下一页列表页URL
   */
  private getNextListUrl(html: string, currentUrl: string): string | null {
    const nextUrl = listParser.parseNextPageUrl(html);
    
    if (!nextUrl) {
      // 如果页面没有"下一页"链接，尝试递增start参数
      const currentStart = listParser.getStartFromUrl(currentUrl);
      const nextStart = currentStart + config.booksPerPage;
      
      if (nextStart < config.maxBooks) {
        // 替换URL中的start参数
        return currentUrl.replace(/start=\d+/, `start=${nextStart}`);
      }
    }
    
    return nextUrl;
  }
  
  /**
   * 智能获取页面（包含验证和重试）
   */
 private async fetchPageWithRetry(
  url: string, 
  maxRetries: number = config.maxRetries
): Promise<string | null> {
  return ErrorHandler.handleError(async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`请求页面 (尝试 ${attempt}/${maxRetries}): ${url}`);
        
        // 使用增强的HTTP客户端
        const html = await httpClient.get(url);
        
        // 添加调试信息 - 放在这里
        console.log('=== DEBUG INFO ===');
        console.log('URL:', url);
        console.log('HTML长度:', html.length);
        console.log('包含"豆瓣":', html.includes('豆瓣'));
        console.log('包含"subject-list":', html.includes('subject-list'));
        console.log('=== END DEBUG ===');
        
        // 验证HTML内容
        if (!this.isValidHtml(html)) {
          throw new ParseError('返回的HTML内容无效');
        }
        
        // 检查是否被重定向到登录页或验证页
        //if (this.isBlockedPage(html)) {
         // throw new RateLimitError('页面访问被限制，可能触发了反爬虫');
        //}
        
        logger.debug(`页面获取成功: ${url}`);
        return html;
        
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 根据错误类型决定等待时间
        const waitTime = error instanceof RateLimitError 
          ? (error.context?.retryAfter || 60) * 1000
          : attempt * 3000;
        
        logger.warn(`等待${waitTime}ms后重试...`);
        await delay(waitTime);
      }
    }
    
    return null;
  }, `fetchPage ${url}`, maxRetries);
}
  /**
   * 验证HTML是否有效
   */
  private isValidHtml(html: string): boolean {
    if (!html || html.length < 100) return false;
    
    const requiredElements = ['<html', '<body', '</html>'];
    const hasRequired = requiredElements.every(element => html.includes(element));
    
    // 检查是否包含豆瓣特定的元素
    const hasDoubanElements = html.includes('douban') || 
                              html.includes('豆瓣') || 
                              html.includes('book.douban');
    
    return hasRequired && hasDoubanElements;
  }
  
  /**
   * 检查是否被屏蔽
   */
  private isBlockedPage(html: string): boolean {
    const blockIndicators = [
      '请输入验证码',
      '安全验证',
      '机器人验证',
      '403 Forbidden',
      '访问过于频繁',
      'Sign in to continue',
      'captcha',
      'verify',
      'unusual traffic'
    ];
    
    return blockIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }
  
  /**
   * 记录失败的URL和原因
   */
  private recordFailedUrl(url: string, reason: string): void {
    const existing = this.failedUrls.get(url);
    const count = existing?.count || 0;
    
    this.failedUrls.set(url, {
      count: count + 1,
      lastError: reason,
      lastAttempt: new Date().toISOString()
    });
    
    // 如果失败次数过多，保存记录到文件
    if (count + 1 >= 3) {
      this.saveFailedUrlsToFile();
    }
  }
  
  /**
   * 保存失败记录
   */
  private saveFailedUrlsToFile(): void {
    const failedList = Array.from(this.failedUrls.entries()).map(([url, info]) => ({
      url,
      ...info
    }));
    
    const filePath = path.join(config.logDir, `failed_urls_${Date.now()}.json`);
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(
      filePath,
      JSON.stringify(failedList, null, 2),
      'utf-8'
    );
    
    logger.debug(`失败URL记录已保存到: ${filePath}`);
  }
  
  /**
   * 设置优雅关闭
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`收到${signal}信号，正在优雅关闭...`);
      this.isShuttingDown = true;
      
      // 等待当前请求完成
      await delay(1000);
      
      // 保存当前进度
      this.saveProgress();
      
      // 打印监控报告
      console.log(crawlerMonitor.generateReport());
      
      // 保存监控报告
      crawlerMonitor.saveReport();
      
      logger.info('爬虫已优雅关闭');
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      ErrorHandler.logError(new CrawlerError('未捕获的异常', 'UNCAUGHT_EXCEPTION', error));
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      ErrorHandler.logError(new CrawlerError('未处理的Promise拒绝', 'UNHANDLED_REJECTION', reason as Error));
      shutdown('UNHANDLED_REJECTION');
    });
  }
  
  /**
   * 保存进度
   */
  private saveProgress(): void {
    const progress = {
      timestamp: new Date().toISOString(),
      visitedUrls: Array.from(this.visitedUrls),
      failedUrls: Array.from(this.failedUrls.entries()),
      totalBooksCrawled: this.totalBooksCrawled,
      duration: Date.now() - this.startTime,
      metrics: crawlerMonitor.getCurrentMetrics()
    };
    
    const progressFile = path.join(config.logDir, `progress_${Date.now()}.json`);
    const dir = path.dirname(progressFile);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(
      progressFile,
      JSON.stringify(progress, null, 2),
      'utf-8'
    );
    
    logger.info(`进度已保存到: ${progressFile}`);
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const details = {
      visitedUrls: this.visitedUrls.size,
      failedUrls: this.failedUrls.size,
      totalBooksCrawled: this.totalBooksCrawled,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      isShuttingDown: this.isShuttingDown
    };
    
    // 检查失败率
    const totalAttempts = this.visitedUrls.size + this.failedUrls.size;
    const failureRate = totalAttempts > 0 ? this.failedUrls.size / totalAttempts : 0;
    
    // 检查内存使用
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 500 * 1024 * 1024; // 500MB
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (failureRate > 0.3 || memoryUsage.heapUsed > memoryThreshold || this.isShuttingDown) {
      status = 'unhealthy';
    } else if (failureRate > 0.1) {
      status = 'degraded';
    }
    
    return {
      status,
      details: { ...details, failureRate, memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024) }
    };
  }
  
  /**
   * 打印统计信息
   */
  private printStatistics(books: DoubanBook[]): void {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(1);
    const metrics = crawlerMonitor.getCurrentMetrics();
    
    logger.info('='.repeat(60));
    logger.info('📊 爬虫任务统计');
    logger.info('='.repeat(60));
    logger.info(`总耗时: ${duration} 秒`);
    logger.info(`成功爬取: ${books.length} 本书`);
    logger.info(`访问过的URL: ${this.visitedUrls.size} 个`);
    logger.info(`失败的URL: ${this.failedUrls.size} 个`);
    
    // 请求统计
    logger.info(`\n📈 请求统计:`);
    logger.info(`  总请求数: ${metrics.requests.total}`);
    logger.info(`  成功: ${metrics.requests.success}`);
    logger.info(`  失败: ${metrics.requests.failed}`);
    logger.info(`  被限制: ${metrics.requests.rateLimited}`);
    logger.info(`  成功率: ${metrics.requests.total > 0 ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) : 0}%`);
    
    // 统计分类信息
    const tagsCount: { [tag: string]: number } = {};
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
      });
    });
    
    // 显示前5个热门标签
    const popularTags = Object.entries(tagsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (popularTags.length > 0) {
      logger.info(`\n🏷️ 热门标签:`);
      popularTags.forEach(([tag, count]) => {
        logger.info(`  ${tag.padEnd(15)}: ${count} 本`);
      });
    }
    
    // 显示评分统计
    const ratedBooks = books.filter(book => book.rating);
    if (ratedBooks.length > 0) {
      const totalRating = ratedBooks.reduce((sum, book) => sum + parseFloat(book.rating!), 0);
      const avgRating = (totalRating / ratedBooks.length).toFixed(2);
      logger.info(`\n⭐ 平均评分: ${avgRating} (共 ${ratedBooks.length} 本有评分)`);
    }
    
    // 资源使用
    logger.info(`\n💾 资源使用:`);
    logger.info(`  内存使用: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    logger.info(`  运行时间: ${process.uptime().toFixed(2)} 秒`);
    
    logger.info('='.repeat(60));
    
    // 保存统计信息到文件
    this.saveStatisticsToFile(books, duration);
  }
  
  /**
   * 保存统计信息到文件
   */
  private saveStatisticsToFile(books: DoubanBook[], duration: string): void {
    const stats = {
      crawlTime: new Date().toISOString(),
      duration: `${duration}秒`,
      totalBooks: books.length,
      visitedUrls: this.visitedUrls.size,
      failedUrls: this.failedUrls.size,
      popularTags: this.getPopularTags(books, 10),
      ratingStats: this.getRatingStats(books),
      metrics: crawlerMonitor.getCurrentMetrics()
    };
    
    const statsPath = path.join(config.logDir, `crawl_stats_${Date.now()}.json`);
    const statsDir = path.dirname(statsPath);
    
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      statsPath,
      JSON.stringify(stats, null, 2),
      'utf-8'
    );
    
    logger.info(`统计信息已保存到: ${statsPath}`);
  }
  
  /**
   * 获取热门标签
   */
  private getPopularTags(books: DoubanBook[], limit: number): Array<{ tag: string; count: number }> {
    const tagsCount: { [tag: string]: number } = {};
    books.forEach(book => {
      book.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
  
  /**
   * 获取评分统计
   */
  private getRatingStats(books: DoubanBook[]) {
    const ratedBooks = books.filter(book => book.rating);
    
    if (ratedBooks.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const ratings = ratedBooks.map(book => parseFloat(book.rating!));
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    return {
      average: parseFloat(average.toFixed(2)),
      count: ratings.length,
      min: Math.min(...ratings),
      max: Math.max(...ratings),
      distribution: this.getRatingDistribution(ratings)
    };
  }
  
  /**
   * 获取评分分布
   */
  private getRatingDistribution(ratings: number[]): Record<string, number> {
    const distribution: Record<string, number> = {
      '9-10': 0,
      '8-9': 0,
      '7-8': 0,
      '6-7': 0,
      '5-6': 0,
      '0-5': 0
    };
    
    ratings.forEach(rating => {
      if (rating >= 9) distribution['9-10']++;
      else if (rating >= 8) distribution['8-9']++;
      else if (rating >= 7) distribution['7-8']++;
      else if (rating >= 6) distribution['6-7']++;
      else if (rating >= 5) distribution['5-6']++;
      else distribution['0-5']++;
    });
    
    return distribution;
  }
  
  /**
   * 恢复中断的爬取任务
   */
  async resumeCrawl(): Promise<DoubanBook[]> {
    logger.info('尝试恢复中断的爬取任务...');
    
    // 1. 加载已保存的数据
    const existingBooks = jsonWriter.loadAllBooks();
    logger.info(`找到已保存的 ${existingBooks.length} 本书`);
    
    // 2. 标记已访问的URL
    existingBooks.forEach(book => {
      this.visitedUrls.add(book.doubanUrl);
    });
    
    this.totalBooksCrawled = existingBooks.length;
    
    // 3. 继续爬取剩余的数量
    const remaining = config.maxBooks - existingBooks.length;
    
    if (remaining <= 0) {
      logger.info('已达到目标数量，无需继续爬取');
      return existingBooks;
    }
    
    logger.info(`需要继续爬取 ${remaining} 本书`);
    
    // 4. 继续爬取
    const newBooks = await this.crawl(remaining);
    
    // 5. 合并结果
    const allBooks = [...existingBooks, ...newBooks];
    
    // 6. 重新保存（去重）
    jsonWriter.saveBooks(allBooks);
    
    return allBooks;
  }
  
  /**
   * 重置引擎状态
   */
  reset(): void {
    this.visitedUrls.clear();
    this.failedUrls.clear();
    this.totalBooksCrawled = 0;
    this.startTime = 0;
    this.isShuttingDown = false;
    crawlerMonitor.reset();
    logger.info('爬虫引擎已重置');
  }
  
  /**
   * 导出当前状态
   */
  exportStatus(): any {
    return {
      timestamp: new Date().toISOString(),
      visitedUrls: this.visitedUrls.size,
      failedUrls: this.failedUrls.size,
      totalBooksCrawled: this.totalBooksCrawled,
      isShuttingDown: this.isShuttingDown,
      health: this.healthCheck(),
      metrics: crawlerMonitor.getCurrentMetrics()
    };
  }
}

export const crawlerEngine = new CrawlerEngine();