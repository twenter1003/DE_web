import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' → 상대 경로 빌드. GitHub Pages 하위 경로와 Vercel 루트 모두에서 동작.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
