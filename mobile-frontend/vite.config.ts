import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

const IP_ADDRESS = '192.168.10.5'  // 可修改为实际内网IP

export default defineConfig({
  plugins: [
    uni(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '康复治疗记录',
        short_name: '康复记录',
        description: '虎林市中医医院康复科治疗记录系统',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',  // 独立应用模式，隐藏地址栏
        orientation: 'portrait',  // 竖屏显示
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'  // 适配自适应图标
          }
        ]
      },
      workbox: {
        // 缓存策略
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 天
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources'
            }
          }
        ],
        // 开发环境禁用预缓存
        navigateFallback: null
      },
      // 开发环境禁用 PWA
      devOptions: {
        enabled: false  // 生产环境才启用
      }
    })
  ],
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
