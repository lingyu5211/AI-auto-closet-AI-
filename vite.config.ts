import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  server: {
    proxy: {
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/qwen/, '/api/v1')
      },
      '/api/wanxiang': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/wanxiang/, '/api/v1')
      }
    }
  }
})
