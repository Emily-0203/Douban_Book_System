const User = require('../models/User');
const FileHelper = require('../utils/fileHelper');
const fs = require('fs').promises;
const path = require('path');

// 获取用户信息
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
exports.updateProfile = async (req, res, next) => {
  try {
    const { nickname, bio, gender, location, website } = req.body;
    const userId = req.user._id;
    
    // 允许更新的字段
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (bio !== undefined) updateData.bio = bio;
    if (gender !== undefined) updateData.gender = gender;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '资料更新成功',
      data: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// 上传头像
exports.uploadAvatar = async (req, res, next) => {
  console.log('🖼️ 开始处理头像上传...');
  
  try {
    if (!req.file) {
      console.log('❌ 没有收到文件');
      return res.status(400).json({
        success: false,
        message: '请选择图片文件'
      });
    }
    
    console.log('📁 收到文件:', req.file.originalname);
    console.log('📁 文件保存到:', req.file.path);
    console.log('📁 文件大小:', req.file.size, 'bytes');
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ 用户不存在:', userId);
      // 删除上传的文件
      if (req.file.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    console.log('✅ 用户存在:', user.username);
    
    // 生成最终URL路径
    const avatarUrl = `/static/avatars/${req.file.filename}`;
    console.log('🔗 头像URL:', avatarUrl);
    
    // 删除旧头像（如果不是默认头像）
    if (user.avatar && user.avatar !== '/static/avatars/default.png') {
      const oldAvatarPath = user.avatar.startsWith('static/') 
        ? user.avatar 
        : path.join('static', user.avatar.replace('/static/', ''));
      
      try {
        await fs.unlink(oldAvatarPath);
        console.log('🗑️ 删除旧头像:', oldAvatarPath);
      } catch (unlinkError) {
        console.warn('⚠️ 删除旧头像失败:', unlinkError.message);
      }
    }
    
    // 更新用户头像
    user.avatar = avatarUrl;
    await user.save();
    
    console.log('✅ 头像更新成功');
    
    res.json({
      success: true,
      message: '头像上传成功',
      data: {
        avatar: user.avatar
      }
    });
    
  } catch (error) {
    console.error('💥 头像上传失败:', error.message);
    
    // 清理临时文件
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('清理临时文件失败:', cleanupError.message);
      }
    }
    
    next(error);
  }
};

// 获取用户统计信息
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 这里可以添加收藏数、评论数等统计
    // 暂时返回基础统计
    const user = await User.findById(userId);
    const joinedDays = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    
    const stats = {
      joinedDays: joinedDays
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// 修改密码
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请输入当前密码和新密码'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码至少6位'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 验证当前密码
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};