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
})
