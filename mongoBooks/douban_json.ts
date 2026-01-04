// importDoubanData.js
import * as mongoose from "mongoose"
import *  as fs from "fs"
import * as path from "path"

(async () => {
    await mongoose.connect('mongodb://localhost:27017/douban_books')
    .then(() => console.log("✅ MongoDB 连接成功"))
    .catch(err => console.log("❌ 连接失败:", err))

    // 豆瓣数据结构Schema
    const DoubanBookSchema = new mongoose.Schema({
        // 标识信息
        doubanId: String,
        doubanUrl: String,
        isbn: String,
        
        // 核心元数据
        title: String,
        subtitle: String,
        author: [String],  // 数组
        press: String,
        publishDate: String,
        price: String,
        pages: String,
        binding: String,
        
        // 描述与标签
        summary: String,
        authorIntro: String,
        tags: [String],    // 数组
        
        // 评分与互动
        rating: String,
        ratingCount: String,
        reviewCount: String,
        
        // 图像数据
        coverImage: {
            url: String,
            localPath: String
        },
        
        // 用户评论
        comments: [{
            user: String,
            content: String,
            rating: String,
            time: String,
            location: String
        }],
        
        // 模拟附件
        attachment: {
        type: {
            type: String,
            default: 'search_link'
        },
        url: String,
        description: String
    },
        
        // 爬虫元数据
        crawledAt: Date,
        source: { type: String, default: 'douban' }
    })

    // 创建索引
    DoubanBookSchema.index({ title: 'text', summary: 'text', tags: 'text' })
    DoubanBookSchema.index({ isbn: 1 }, { unique: true })

    const DoubanBook = mongoose.model('DoubanBook', DoubanBookSchema)

    // 读取豆瓣数据
    const filePath = path.resolve('./books.json')
    
    fs.readFile(filePath, 'utf8', async (err: Error | null, data: string) => {
        if (err) {
            console.log("❌ 读取文件失败:", err)
            return
        }
        
        try {
            const books = JSON.parse(data)
            console.log(`📚 找到 ${books.length} 本豆瓣图书，开始导入...`)

            let successCount = 0
            let errorCount = 0
            let duplicateCount = 0

            for (let i = 0; i < books.length; i++) {
                const book = books[i]
                
                try {
                    // 检查是否已存在
                    const existing = await DoubanBook.findOne({ isbn: book.isbn })
                    if (existing) {
                        console.log(`⏩ [${i + 1}/${books.length}] 跳过重复: ${book.title}`)
                        duplicateCount++
                        continue
                    }

                    // 直接使用豆瓣数据结构
                    await DoubanBook.create({
                        doubanId: book.doubanId,
                        doubanUrl: book.doubanUrl,
                        isbn: book.isbn,
                        title: book.title,
                        subtitle: book.subtitle,
                        author: book.author,
                        press: book.press,
                        publishDate: book.publishDate,
                        price: book.price,
                        pages: book.pages,
                        binding: book.binding,
                        summary: book.summary,
                        authorIntro: book.authorIntro,
                        tags: book.tags,
                        rating: book.rating,
                        ratingCount: book.ratingCount,
                        reviewCount: book.reviewCount,
                        coverImage: book.coverImage,
                        comments: book.comments,
                        attachment: book.attachment,
                        crawledAt: new Date(book.crawledAt || Date.now()),
                        source: 'douban'
                    })
                    
                    successCount++
                    console.log(`✅ [${i + 1}/${books.length}] 导入: ${book.title}`)
                    
                } catch (error) {
                    errorCount++
                    console.log(`❌ [${i + 1}/${books.length}] 失败: ${book.title}`, String(error))
                }
                
                // 每10本休息一下
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50))
                }
            }
            
            console.log(`\n🎉 豆瓣数据导入完成!`)
            console.log(`📊 统计结果:`)
            console.log(`   成功导入: ${successCount} 本`)
            console.log(`   重复跳过: ${duplicateCount} 本`)
            console.log(`   导入失败: ${errorCount} 本`)

        } catch (parseError) {
            console.log("❌ JSON解析失败:", parseError)
        } finally {
            await mongoose.disconnect()
            console.log("🔌 数据库连接已关闭")
        }
    })
})()