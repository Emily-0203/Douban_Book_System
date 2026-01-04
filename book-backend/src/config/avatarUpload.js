const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保目录存在
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${dir}`);
  }
}

// 创建头像目录
ensureDirectory('static/avatars');

// 头像存储配置
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static/avatars/');  // 直接存到最终目录
  },
  filename: (req, file, cb) => {
    const userId = req.user?._id || 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    
    cb(null, `avatar_${userId}_${uniqueSuffix}${ext}`);
  }
});

// 头像文件过滤器
const avatarFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF 格式的图片'), false);
  }
};

const uploadAvatar = multer({ 
  storage: avatarStorage, 
  fileFilter: avatarFilter,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

module.exports = {
  uploadAvatar
};