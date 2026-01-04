const fs = require('fs');
const path = require('path');

console.log('🔍 检查 next 调用...\n');

function checkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules') {
      checkDir(fullPath);
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('next(') || line.includes('next()')) {
          console.log(`⚠️  第 ${index + 1} 行: ${fullPath}`);
          console.log(`   ${line.trim()}\n`);
        }
      });
    }
  });
}

checkDir(path.join(__dirname, 'src'));
console.log('✅ 检查完成');