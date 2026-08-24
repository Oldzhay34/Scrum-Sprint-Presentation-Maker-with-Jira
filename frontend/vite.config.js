import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: Uygulama Odyssey kabugunun ICINDE /kapasite/ alt yolundan servis
// ediliyor (bkz. Odyssey nginx.conf) - varlik adresleri de bu onekle
// uretilmeli. Derleme sirasinda VITE_BASE_PATH verilir; verilmezse "/" kalir
// ki yerel "npm run dev" ve dogrudan kok erisimi bozulmasin.
// React Router da ayni degeri import.meta.env.BASE_URL uzerinden okur.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  // "npm run dev" icin: production'da Odyssey'in nginx'i /api/auth/* ile
  // /api/* uzerini FARKLI backend'lere (odyssey-auth / capacity-planner)
  // AYNI origin uzerinden proxy'ler (bkz. Odyssey nginx.conf) - yerelde bu
  // yoksa /api/auth/me gibi cagrilar yanlislikla capacity-planner backend'ine
  // (8080) gider ve 401 doner (orada bu uc artik yok). VITE_API_BASE_URL=""
  // (goreceli) ile birlikte kullanilmali; odyssey-auth'u yerelde ayrica
  // calistirmak icin bkz. https://... (odyssey-auth repo README).
  server: {
    proxy: {
      '/api/auth': { target: process.env.VITE_AUTH_BASE_URL || 'http://localhost:8081', changeOrigin: true },
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
