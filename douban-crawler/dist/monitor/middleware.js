"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerMonitor = exports.CrawlerMonitor = void 0;
// src/monitor/middleware.ts - 修复版本
const events_1 = require("events");
const fs = __importStar(require("fs")); // 添加这行
const path = __importStar(require("path")); // 添加这行
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
/**
 * 爬虫监控器
 */
class CrawlerMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.requestTimes = [];
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
    recordRequestStart(url) {
        this.metrics.requests.total++;
        this.emit('requestStart', { url, timestamp: Date.now() });
    }
    /**
     * 记录请求结束
     */
    recordRequestEnd(url, success, duration) {
        this.requestTimes.push(duration);
        if (success) {
            this.metrics.requests.success++;
        }
        else {
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
    recordRateLimit(url, retryAfter) {
        this.metrics.requests.rateLimited++;
        this.emit('rateLimited', { url, retryAfter, timestamp: Date.now() });
    }
    /**
     * 记录书籍爬取
     */
    recordBookCrawl(bookId, success) {
        if (success) {
            this.metrics.books.crawled++;
        }
        else {
            this.metrics.books.failed++;
        }
        this.emit('bookCrawled', { bookId, success, metrics: this.getCurrentMetrics() });
    }
    /**
     * 获取当前指标
     */
    getCurrentMetrics() {
        this.metrics.timing.totalDuration = Date.now() - this.startTime;
        this.metrics.resources.memoryUsage = process.memoryUsage();
        this.metrics.resources.cpuUsage = process.cpuUsage();
        return { ...this.metrics };
    }
    /**
     * 生成报告
     */
    generateReport() {
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
    saveReport() {
        const report = this.generateReport();
        const reportPath = path.join(config_1.config.logDir, `monitor_report_${Date.now()}.txt`);
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(reportPath, report, 'utf-8');
        logger_1.logger.info(`监控报告已保存到: ${reportPath}`);
    }
    /**
     * 重置监控器
     */
    reset() {
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
exports.CrawlerMonitor = CrawlerMonitor;
// 单例导出
exports.crawlerMonitor = new CrawlerMonitor();
