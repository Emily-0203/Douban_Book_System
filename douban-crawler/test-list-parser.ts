// test-list-parser.ts（临时文件，可以放在项目根目录）
import { listParser } from './src/parser/listParser';
import * as fs from 'fs';
import * as path from 'path';

async function testListParser() {
  try {
    // 读取一个保存的列表页HTML（你可以手动保存一页）
    const htmlPath = path.join(__dirname, 'test-data', 'list-page.html');
    
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf-8');
      const books = listParser.parse(html);
      
      console.log('解析结果:');
      books.forEach((book, index) => {
        console.log(`${index + 1}. ${book.title}`);
        console.log(`   链接: ${book.detailUrl}`);
        console.log(`   封面: ${book.coverUrl.substring(0, 50)}...`);
        console.log(`   评分: ${book.rating || '无'}`);
        console.log('---');
      });
      
      const nextUrl = listParser.parseNextPageUrl(html);
      console.log(`下一页URL: ${nextUrl || '无'}`);
    } else {
      console.log('测试文件不存在，请先保存一个列表页HTML到 test-data/list-page.html');
      console.log('你可以：');
      console.log('1. 访问 https://book.douban.com/tag/编程?start=0&type=T');
      console.log('2. 右键 -> 查看页面源代码');
      console.log('3. 复制全部HTML，保存为 list-page.html');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testListParser();
