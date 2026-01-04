import * as path from 'path';

export interface CrawlerConfig {
  // 入口URL
  entryUrl: string;
  
  // 爬虫控制
  maxBooks: number;     //最多爬多少本
  booksPerPage: number;    //豆瓣每页展示的图书，与页面适配
  maxConcurrent: number;    //最大并发数
  delayRange: [number, number];  //每次请求的延时范围
  maxRetries: number; // 请求失败最大请求次数
  timeout: number;    // 请求超时时间
  
  // 反爬虫配置 
  antiSpider: {
    enableRandomDelay: boolean;     //是否启动随机延时
    enableProxy: boolean;      //是否启动代理
    proxyList: string[];   //代理列表，存放代理地址
    userAgentList: string[];   //用户代理列表
  };
  
  // 请求配置 - 增强
  headers: Record<string, string>;
  
  // 存储路径
  dataDir: string;  //图书数据根目录
  imagesDir: string;  //图书封面存储路径
  jsonFile: string;   //图书信息存储的json文件路径
  logDir: string;   //爬虫运行日志存储路径
  
  // 控制页面解析规则
  parsing: {
    maxComments: number;        //最多爬取评论数量
    enableImageDownload: boolean;   //是否下载图书封面
    imageQuality: 'low' | 'medium' | 'high';   //图片质量
  };
}

export const config: CrawlerConfig = {
  //entryUrl: 'https://book.douban.com/tag/%E7%BC%96%E7%A8%8B?start=0&type=T',
  entryUrl: 'https://book.douban.com/tag/%E5%B0%8F%E8%AF%B4?start=0&type=T',
  // 爬虫配置
  maxBooks: 3000,
  booksPerPage: 20,
  maxConcurrent: 1,
  delayRange: [3000, 6000],
  maxRetries: 1,  // 新增
  timeout: 30000, // 15秒超时
  
  // 反爬虫配置
  antiSpider: {
    enableRandomDelay: true,
    enableProxy: false,
    proxyList: [],
    userAgentList: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  },
  
  // 动态生成headers
  get headers() {
    const uaList = this.antiSpider.userAgentList;
    const randomUA = uaList[Math.floor(Math.random() * uaList.length)];
    
    return {
      'User-Agent': randomUA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://book.douban.com/',
      'DNT': '1',
    };
  },
  
  // 存储路径
  dataDir: path.join(__dirname, '../../data'),
  imagesDir: path.join(__dirname, '../../data/images'),
  jsonFile: path.join(__dirname, '../../data/books.json'),
  logDir: path.join(__dirname, '../../logs'),
  
  // 解析配置
  parsing: {
    maxComments: 5,
    enableImageDownload: true,
    imageQuality: 'medium'
  }
};

// 配置验证函数 - 新增
export function validateConfig(config: CrawlerConfig): string[] {
  const errors: string[] = [];
  
  if (!config.entryUrl || !config.entryUrl.startsWith('http')) {
    errors.push('entryUrl必须是一个有效的HTTP/HTTPS URL');
  }
  
  if (config.maxBooks <= 0) {
    errors.push('maxBooks必须大于0');
  }
  
  if (config.maxConcurrent <= 0) {
    errors.push('maxConcurrent必须大于0');
  }
  
  if (config.delayRange[0] < 0 || config.delayRange[1] < config.delayRange[0]) {
    errors.push('delayRange配置无效');
  }
  
  return errors;
}

export default config;