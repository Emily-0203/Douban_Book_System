// src/monitor/middleware.ts - 修复版本
import { EventEmitter } from 'events';
import * as fs from 'fs';  // 添加这行
import * as path from 'path';  // 添加这行
import { config } from '../config';
import { logger } from '../utils/logger';

export interface CrawlerMetrics {
  requests: {
    total: number;
    success: number;
    failed: number;
    rateLimited: number;
  };
  books: {
    crawled: number;
    failed: number;
    total: number;
  };
  timing: {
    averageResponseTime: number;
    totalDuration: number;
  };
  resources: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

/**
 * 爬虫监控器
 */
export class CrawlerMonitor extends EventEmitter {
  private metrics: CrawlerMetrics;
  private startTime: number;
  private requestTimes: number[] = [];
  
  constructor() {
    super();
    this.startTime = Date.now();
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0, rateLimited: 0 },
      books: { crawled: 0, failed: 0, total: 0 },
      timing: { averageResponseTime: 0, totalDuration: 0 },
      resources: { 
        memoryUsage: process.memoryUsage(), 
        cpuUsage: process.cpuUsage() 
      }
    };
  }
  
  /**
   * 记录请求开始
   */
  recordRequestStart(url: string): void {
    this.metrics.requests.total++;
    this.emit('requestStart', { url, timestamp: Date.now() });
  }
  
  /**
   * 记录请求结束
   */
  recordRequestEnd(url: string, success: boolean, duration: number): void {
    this.requestTimes.push(duration);
    
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
    
    this.emit('requestEnd', { 
      url, 
      success, 
      duration,
      metrics: this.getCurrentMetrics()
    });
    
    // 更新平均响应时间
    const avgTime = this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
    this.metrics.timing.averageResponseTime = avgTime;
  }
  
  /**
   * 记录速率限制
   */
  recordRateLimit(url: string, retryAfter: number): void {
    this.metrics.requests.rateLimited++;
    this.emit('rateLimited', { url, retryAfter, timestamp: Date.now() });
  }
  
  /**
   * 记录书籍爬取
   */
  recordBookCrawl(bookId: string, success: boolean): void {
    if (success) {
      this.metrics.books.crawled++;
    } else {
      this.metrics.books.failed++;
    }
    
    this.emit('bookCrawled', { bookId, success, metrics: this.getCurrentMetrics() });
  }
  
  /**
   * 获取当前指标
   */
  getCurrentMetrics(): CrawlerMetrics {
    this.metrics.timing.totalDuration = Date.now() - this.startTime;
    this.metrics.resources.memoryUsage = process.memoryUsage();
    this.metrics.resources.cpuUsage = process.cpuUsage();
    
    return { ...this.metrics };
  }
  
  /**
   * 生成报告
   */
  generateReport(): string {
    const metrics = this.getCurrentMetrics();
    const successRate = metrics.requests.total > 0 
      ? (metrics.requests.success / metrics.requests.total * 100).toFixed(2)
      : '0.00';
    
    return `
📊 爬虫监控报告
====================
📈 请求统计:
  - 总请求数: ${metrics.requests.total}
  - 成功: ${metrics.requests.success}
  - 失败: ${metrics.requests.failed}
  - 被限制: ${metrics.requests.rateLimited}
  - 成功率: ${successRate}%

📚 书籍统计:
  - 已爬取: ${metrics.books.crawled}
  - 失败: ${metrics.books.failed}
  - 总计: ${metrics.books.total}

⏱️ 性能指标:
  - 总时长: ${(metrics.timing.totalDuration / 1000).toFixed(2)}s
  - 平均响应: ${metrics.timing.averageResponseTime.toFixed(2)}ms

💾 资源使用:
  - 内存: ${Math.round(metrics.resources.memoryUsage.heapUsed / 1024 / 1024)}MB
  - RSS: ${Math.round(metrics.resources.memoryUsage.rss / 1024 / 1024)}MB
    `;
  }
  
  /**
   * 保存报告到文件
   */
  saveReport(): void {
    const report = this.generateReport();
    const reportPath = path.join(config.logDir, `monitor_report_${Date.now()}.txt`);
    const dir = path.dirname(reportPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report, 'utf-8');
    logger.info(`监控报告已保存到: ${reportPath}`);
  }
  
  /**
   * 重置监控器
   */
  reset(): void {
    this.startTime = Date.now();
    this.requestTimes = [];
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0, rateLimited: 0 },
      books: { crawled: 0, failed: 0, total: 0 },
      timing: { averageResponseTime: 0, totalDuration: 0 },
      resources: { 
        memoryUsage: process.memoryUsage(), 
        cpuUsage: process.cpuUsage() 
      }
    };
  }
}

// 单例导出
export const crawlerMonitor = new CrawlerMonitor();