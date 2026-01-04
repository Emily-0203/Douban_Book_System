import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
// 1. 新增：导入自动导入插件和 Element Plus 解析器
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // 2. 新增：配置 AutoImport，自动导入 Element Plus API
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    // 3. 新增：配置 Components，自动导入 Element Plus 组件 + 图标（核心：resolveIcons: true）
    Components({
      resolvers: [
        ElementPlusResolver({
          resolveIcons: true, // 启用图标自动解析，解决图标无法识别问题
        }),
      ],
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      '/static': {
        target: 'http://localhost:3000',
        changeOrigin: true
     }
   }
  },
  css: {
    postcss: {}
  }
})
