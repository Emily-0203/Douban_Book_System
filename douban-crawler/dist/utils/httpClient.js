"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpClient = exports.HttpClient = void 0;
// src/utils/httpClient.ts - 完整修复版
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const errorHandler_1 = require("./errorHandler");
/**
 * 增强的HTTP客户端
 */
class HttpClient {
    constructor() {
        this.currentProxyIndex = 0;
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
        this.client = axios_1.default.create({
            timeout: config_1.config.timeout,
            validateStatus: (status) => status === 200,
        });
        // 请求拦截器 - 使用 any 类型修复类型错误
        this.client.interceptors.request.use((requestConfig) => {
            this.requestCount++;
            this.lastRequestTime = Date.now();
            // 初始化 headers
            requestConfig.headers = requestConfig.headers || {};
            // 随机User-Agent
            if (config_1.config.antiSpider.userAgentList.length > 0) {
                const randomUA = config_1.config.antiSpider.userAgentList[Math.floor(Math.random() * config_1.config.antiSpider.userAgentList.length)];
                requestConfig.headers['User-Agent'] = randomUA;
            }
            // 使用代理
            if (config_1.config.antiSpider.enableProxy && config_1.config.antiSpider.proxyList.length > 0) {
                const proxy = this.getNextProxy();
                const [host, port] = proxy.split(':');
                requestConfig.proxy = {
                    host,
                    port: parseInt(port, 10),
                    protocol: 'http'
                };
            }
            // 添加其他请求头
            requestConfig.headers['Referer'] = 'https://book.douban.com/';
            requestConfig.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
            requestConfig.headers['Accept-Language'] = 'zh-CN,zh;q=0.9,en;q=0.8';
            return requestConfig;
        }, (error) => {
            return Promise.reject(error);
        });
        // 响应拦截器
        this.client.interceptors.response.use((response) => response, (error) => {
            const status = error.response?.status;
            if (status === 429) {
                const retryAfter = error.response?.headers?.['retry-after'];
                return Promise.reject(new errorHandler_1.RateLimitError('请求频率过高', parseInt(retryAfter || '60')));
            }
            if (status === 403) {
                return Promise.reject(new errorHandler_1.NetworkError('访问被拒绝'));
            }
            if (status === 404) {
                return Promise.reject(new errorHandler_1.NetworkError('页面不存在'));
            }
            return Promise.reject(new errorHandler_1.NetworkError(`HTTP ${status || '网络错误'}: ${error.message}`));
        });
    }
    /**
     * 获取下一个代理
     */
    getNextProxy() {
        const proxy = config_1.config.antiSpider.proxyList[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % config_1.config.antiSpider.proxyList.length;
        return proxy;
    }
    /**
     * 发送GET请求
     */
    async get(url) {
        return errorHandler_1.ErrorHandler.handleError(async () => {
            const response = await this.client.get(url, {
                responseType: 'text',
            });
            if (!response.data || !response.data.includes('<html')) {
                throw new errorHandler_1.NetworkError('返回的不是有效的HTML页面');
            }
            return response.data;
        }, `HTTP GET ${url}`, config_1.config.maxRetries);
    }
    /**
     * 获取请求统计
     */
    getStats() {
        return {
            requestCount: this.requestCount,
            lastRequestTime: new Date(this.lastRequestTime).toISOString(),
        };
    }
}
exports.HttpClient = HttpClient;
// 单例模式导出
exports.httpClient = new HttpClient();
