import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      scope: '/pwa/',
      filename: 'sw.js',
      includeAssets: [
        'favicon-16x16.png', 
        'favicon-32x32.png', 
        'apple-touch-icon.png', 
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'Stock Alerts',
        short_name: 'StockAlerts',
        description: 'Get notified when your stocks hit target prices',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/pwa/',
        scope: '/pwa/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    }),
    {
      name: 'keep-project-landing-independent-from-the-pwa',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler(html, context) {
          if (resolve(context.filename) !== resolve(process.cwd(), 'index.html')) return html
          return html.replace(/<link\s+rel=["']manifest["'][^>]*>\s*/gi, '')
        }
      }
    }
  ],
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        project: resolve(process.cwd(), 'index.html'),
        pwa: resolve(process.cwd(), 'pwa/index.html')
      }
    }
  }
})
