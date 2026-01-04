export interface Book {
  _id: string
  doubanId?: string           // 改为可选
  doubanUrl?: string          // 改为可选
  isbn: string
  title: string
  subtitle?: string
  author: string[]
  press: string
  publishDate: string
  price: string
  priceNumber?: number        // 添加这个
  pages: string
  binding: string
  summary?: string
  authorIntro?: string
  tags: string[]
  rating: string
  ratingCount: string
  reviewCount: string
  coverImage?: {              // 改为可选
    localPath: string
    fileName: string
  }
  attachment?: {              // 添加附件字段（你的模型有）
    localPath: string
    originalName: string
    mimeType: string
    size: number
    uploadedAt: string
  }
  comments?: any[]           // 添加评论字段
  coverImageUrl?: string
  createdAt: string
  updatedAt: string
  source?: string           // 添加来源字段
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface BooksResponse {
  success: boolean
  data: Book[]
  pagination: Pagination
}
