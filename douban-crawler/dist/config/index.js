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
exports.config = void 0;
exports.validateConfig = validateConfig;
const path = __importStar(require("path"));
exports.config = {
    entryUrl: 'https://book.douban.com/tag/%E7%BC%96%E7%A8%8B?start=0&type=T',
    // 爬虫配置
    maxBooks: 500,
    booksPerPage: 20,
    maxConcurrent: 2,
    delayRange: [1500, 3000],
    maxRetries: 3, // 新增
    timeout: 15000, // 15秒超时
    // 反爬虫配置
    antiSpider: {
        enableRandomDelay: true,
        enableProxy: false,
        proxyList: [
            'http://proxy1:8080',
            'http://proxy2:8080'
        ],
        userAgentList: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
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
function validateConfig(config) {
    const errors = [];
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
exports.default = exports.config;
