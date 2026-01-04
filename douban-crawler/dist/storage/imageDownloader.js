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
exports.imageDownloader = exports.ImageDownloader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const config_1 = require("../config");
/**
 * 图片下载器
 */
class ImageDownloader {
    /**
     * 下载图片（尝试3次，失败生成占位图）
     */
    async download(imageUrl, filename) {
        const maxRetries = 2;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.downloadAttempt(imageUrl, filename);
            }
            catch (error) {
                console.log(`第${attempt}次失败: ${filename}`);
                if (attempt === maxRetries) {
                    console.log(`生成占位图: ${filename}`);
                    return this.createPlaceholder(filename);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return this.createPlaceholder(filename);
    }
    /**
     * 单次下载尝试
     */
    async downloadAttempt(imageUrl, filename) {
        const filepath = path.join(config_1.config.imagesDir, filename);
        if (fs.existsSync(filepath)) {
            return filepath;
        }
        return new Promise((resolve, reject) => {
            const protocol = imageUrl.startsWith('https') ? https : http;
            protocol.get(imageUrl, {
                headers: {
                    'Referer': 'https://book.douban.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`下载成功: ${filename}`);
                    resolve(filepath);
                });
                fileStream.on('error', (err) => {
                    fs.unlink(filepath, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                reject(err);
            }).on('timeout', () => {
                reject(new Error('请求超时'));
            });
        });
    }
    /**
     * 创建占位图
     */
    createPlaceholder(filename) {
        const filepath = path.join(config_1.config.imagesDir, filename);
        if (fs.existsSync(filepath)) {
            return filepath;
        }
        // 创建简单的占位文件
        const placeholder = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#f0f0f0;width:200px;height:300px;display:flex;align-items:center;justify-content:center;">
  <div style="color:#666;font-family:Arial;">封面图片</div>
</body>
</html>`;
        fs.writeFileSync(filepath, placeholder);
        console.log(`创建占位图: ${filename}`);
        return filepath;
    }
    /**
     * 批量下载图片
     */
    async downloadBatch(images, delayMs = 2000) {
        const results = [];
        for (let i = 0; i < images.length; i++) {
            const { url, filename } = images[i];
            try {
                await this.download(url, filename);
                results.push({ url, filename, success: true });
                console.log(`[${i + 1}/${images.length}] 下载成功: ${filename}`);
                if (i < images.length - 1 && delayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
            catch (error) {
                console.error(`[${i + 1}/${images.length}] 下载失败: ${filename}`);
                results.push({
                    url,
                    filename,
                    success: false,
                    error: error.message
                });
            }
        }
        return results;
    }
    /**
     * 从URL提取文件名
     */
    extractFilenameFromUrl(url, doubanId, isbn) {
        if (isbn)
            return `${isbn}.jpg`;
        if (doubanId)
            return `${doubanId}.jpg`;
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        const match = lastPart.match(/(s\d+)/);
        if (match)
            return `${match[1]}.jpg`;
        return `book_${Date.now()}.jpg`;
    }
}
exports.ImageDownloader = ImageDownloader;
exports.imageDownloader = new ImageDownloader();
