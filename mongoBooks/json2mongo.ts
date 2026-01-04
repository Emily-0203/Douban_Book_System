import * as mongoose from "mongoose"
import * as fs from "fs"
import * as path from "path"

(async () => {
    await mongoose.connect('mongodb://localhost:27017/books')
    .then(() => console.log("✅ MongoDB 连接成功"))
    .catch(err => console.log("❌ 连接失败:", err))

    // 创建"图书Book"文档结构 - 根据你的JSON字段名
    const BookSchema = new mongoose.Schema({
        title: String,
        detailUrl: String,
        imgUrl: String,  
        localImgPath: String,
        author: String,
        price: Number,
        isbn: String,
        publishDate: String,
        intro: String
    })

    // 创建模型
    const BookModel = mongoose.model('Book', BookSchema)

    // 读取books.json文件
    const filePath = path.resolve('./books.json')
    
    fs.readFile(filePath, 'utf8', async (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
        console.log("❌ 读取文件失败:", err)
        return
             }
        
        try {
            // 解析JSON数据
            const books = JSON.parse(data)

            console.log(`📚 找到 ${books.length} 本书，开始导入...`)

            let successCount = 0
            let errorCount = 0
            let duplicateCount = 0

            for (let i = 0; i < books.length; i++) {
                const item = books[i]
                
                try {
                    // 检查是否已存在（基于ISBN去重）
                    const existingBook = await BookModel.findOne({ isbn: item.isbn })
                    if (existingBook) {
                        console.log(`⏩ [${i + 1}/${books.length}] 跳过重复: ${item.title}`)
                        duplicateCount++
                        continue
                    }

                    // 创建新文档
                    await BookModel.create({
                        title: item.title,
                        detailUrl: item.detailUrl,
                        imgUrl: item.imgUrl,
                        localImgPath: item.localImgPath,
                        author: item.author,
                        price: item.price,
                        isbn: item.isbn,
                        publishDate: item.publishDate,
                        intro: item.intro
                    })
                    
                    successCount++
                    console.log(`✅ [${i + 1}/${books.length}] 导入成功: ${item.title}`)
                    
                } catch (error) {
                    errorCount++
                    console.log(`❌ [${i + 1}/${books.length}] 导入失败: ${item.title}`, error)
                }
                
                // 每导入10本休息一下，避免数据库压力
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }
            
            console.log(`\n🎉 导入完成!`)
            console.log(`📊 统计结果:`)
            console.log(`   - 成功导入: ${successCount} 本`)
            console.log(`   - 重复跳过: ${duplicateCount} 本`)
            console.log(`   - 导入失败: ${errorCount} 本`)

        } catch (parseError) {
            console.log("❌ JSON解析失败:", parseError)
        } finally {
            // 关闭数据库连接
            await mongoose.disconnect()
            console.log("🔌 数据库连接已关闭")
        }
    })
})()