const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class FileHelper {
  // 确保目录存在
  static async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // 处理图片：生成缩略图等
  static async processImage(inputPath, outputDir, fileName) {
    await this.ensureDirectory(outputDir);
    
    const originalPath = path.join(outputDir, fileName);
    const thumbnailPath = path.join(outputDir, `thumb_${fileName}`);
    
    // 复制原图
    await fs.copyFile(inputPath, originalPath);
    
    // 生成缩略图（如果sharp可用）
    try {
      await sharp(inputPath)
        .resize(200, 300, { fit: 'cover' })
        .toFile(thumbnailPath);
    } catch (error) {
      console.warn('缩略图生成失败，使用原图:', error.message);
      // 如果sharp不可用，直接复制
      await fs.copyFile(inputPath, thumbnailPath);
    }
    
    return {
      original: originalPath,
      thumbnail: thumbnailPath,
      fileName: fileName
    };
  }

  // 获取图片URL（用于API响应）
  static getImageUrl(localPath) {
    if (!localPath) return null;
    
    // 将本地路径转换为可访问的URL
    // 移除项目根目录部分
    let relativePath = localPath;
    
    // 如果路径包含static，则相对static目录
    const staticIndex = localPath.indexOf('static');
    if (staticIndex !== -1) {
      relativePath = localPath.substring(staticIndex);
    }
    
    // 标准化路径分隔符
    relativePath = relativePath.replace(/\\/g, '/');
    
    // 确保以/static开头
    if (!relativePath.startsWith('static/')) {
      relativePath = `static/${relativePath}`;
    }
    
    return `/${relativePath}`;
  }

  // 删除文件
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      // 尝试删除缩略图
      const thumbPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
      try {
        await fs.unlink(thumbPath);
      } catch {
        // 忽略缩略图删除错误
      }
      return true;
    } catch {
      return false;
    }
  }

  // 复制爬虫图片到静态目录
  static async copyCrawlerImages(sourceDir, targetDir = 'static/images') {
    await this.ensureDirectory(targetDir);
    
    try {
      const files = await fs.readdir(sourceDir);
      
      for (const file of files) {
        if (file.endsWith('.jpg') || file.endsWith('.png')) {
          const sourcePath = path.join(sourceDir, file);
          const targetPath = path.join(targetDir, file);
          
          try {
            await fs.copyFile(sourcePath, targetPath);
            console.log(`复制图片: ${file}`);
          } catch (error) {
            console.warn(`复制失败 ${file}:`, error.message);
          }
        }
      }
      
      console.log(`图片复制完成: ${files.length} 张`);
    } catch (error) {
      console.error('复制图片目录失败:', error.message);
    }
  }
}

module.exports = FileHelper;