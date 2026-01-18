import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

const IP_ADDRESS = '192.168.10.5'  // 可修改为实际内网IP

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, `certs/${IP_ADDRESS}-key.pem`)),
      cert: fs.readFileSync(path.resolve(__dirname, `certs/${IP_ADDRESS}-cert.pem`))
    },
    host: IP_ADDRESS,
    port: 5173,
    strictPort: true,
    open: false  // 不自动打开浏览器
  }
})
