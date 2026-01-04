// src/utils/httpClient.ts - 完整修复版
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../config';
import { ErrorHandler, NetworkError, RateLimitError } from './errorHandler';

/**
 * 增强的HTTP客户端
 */
export class HttpClient {
  private client: AxiosInstance;
  private currentProxyIndex: number = 0;
  private requestCount: number = 0;
  private lastRequestTime: number = Date.now();
  
  constructor() {
    this.client = axios.create({
      timeout: config.timeout,
      validateStatus: (status) => status === 200,
    });
    
    // 请求拦截器 - 使用 any 类型修复类型错误
    this.client.interceptors.request.use(
      (requestConfig: any) => {
        this.requestCount++;
        this.lastRequestTime = Date.now();
        
        // 初始化 headers
        requestConfig.headers = requestConfig.headers || {};
        
        // 随机User-Agent
        if (config.antiSpider.userAgentList.length > 0) {
          const randomUA = config.antiSpider.userAgentList[
            Math.floor(Math.random() * config.antiSpider.userAgentList.length)
          ];
          requestConfig.headers['User-Agent'] = randomUA;
        }
        
        // 使用代理
        if (config.antiSpider.enableProxy && config.antiSpider.proxyList.length > 0) {
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
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'];
          return Promise.reject(new RateLimitError('请求频率过高', parseInt(retryAfter as string || '60')));
        }
        
        if (status === 403) {
          return Promise.reject(new NetworkError('访问被拒绝'));
        }
        
        if (status === 404) {
          return Promise.reject(new NetworkError('页面不存在'));
        }
        
        return Promise.reject(new NetworkError(`HTTP ${status || '网络错误'}: ${error.message}`));
      }
    );
  }
  
  /**
   * 获取下一个代理
   */
  private getNextProxy(): string {
    const proxy = config.antiSpider.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % config.antiSpider.proxyList.length;
    return proxy;
  }
  
  /**
   * 发送GET请求
   */
  async get(url: string): Promise<string> {
    return ErrorHandler.handleError(async () => {
      const response = await this.client.get<string>(url, {
        responseType: 'text',
      });
      
      if (!response.data || !response.data.includes('<html')) {
        throw new NetworkError('返回的不是有效的HTML页面');
      }
      
      return response.data;
    }, `HTTP GET ${url}`, config.maxRetries);
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

// 单例模式导出
export const httpClient = new HttpClient();