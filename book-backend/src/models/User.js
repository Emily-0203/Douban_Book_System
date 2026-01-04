const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  password: { type: String, required: true, minlength: 6 },
  nickname: { type: String, default: function() { return this.username; } },
  avatar: { 
    type: String, 
    default: '/static/avatars/default.png' 
  },
  bio: { type: String, default: '', maxlength: 200 },  // 新增：个人简介
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },  // 新增：性别
  location: { type: String, default: '' },  // 新增：所在地
  website: { type: String, default: '' },  // 新增：个人网站
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: Date
}, { collection: 'users' });

// 密码加密
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
});

// 验证密码
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 获取用户基本信息（公开）
UserSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    nickname: this.nickname,
    avatar: this.avatar,
    bio: this.bio,
    gender: this.gender,
    location: this.location,
    website: this.website,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

module.exports = mongoose.model('User', UserSchema);