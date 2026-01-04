// 这是我们的数据蓝图，先把这个确定下来
export interface BookComment {
  user: string;
  content: string;
  rating?: string;
  time: string;
  location?: string;
  usefulCount?: number;
}

export interface DoubanBook {
  // 标识信息
  doubanId: string;
  doubanUrl: string;
  isbn: string;
  
  // 核心元数据
  title: string;
  subtitle?: string;
  author: string[];
  press: string;
  publishDate: string;
  price: string;
  pages?: string;
  binding?: string;
  
  // 描述与标签
  summary: string;
  authorIntro?: string;
  tags: string[];
  
  // 评分与互动
  rating?: string;
  ratingCount?: string;
  reviewCount?: string;
  
  // 图像数据
  coverImage: {
    url: string;
    localPath: string;
  };
  
  // 用户评论
  comments: BookComment[];
  
  // 模拟附件
  attachment: {
    type: 'search_link';
    url: string;
    description: string;
  };
  
  // 爬虫元数据
  crawledAt: string;
  source: 'douban';
}