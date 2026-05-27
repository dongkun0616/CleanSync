import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 아래 server 부분을 추가하세요
  server: {
    proxy: {
      '/api': {
        target: 'http://13.124.252.181:3000', // EC2 서버 주소
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // '/api/home' 요청을 '/home'으로 서버에 전달
      }
    }
  }
})