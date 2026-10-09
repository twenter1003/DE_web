import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 개발 서버에서도 빌드(scripts/prerender.mjs)처럼 첫 화면 HTML을 미리 그려 넣는다.
 * 그래야 개발 중에도 main.tsx가 hydrateRoot 경로로 돌고, 서버·클라이언트 첫 렌더가 어긋나면 콘솔에 바로 드러난다.
 */
function prerenderInDev(): Plugin {
  return {
    name: 'prerender-in-dev',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      async handler(html, { server, originalUrl }) {
        if (!server || originalUrl?.includes('debug=')) return html
        const { render } = await server.ssrLoadModule('/src/prerender.tsx')
        return html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`)
      },
    },
  }
}

// base './' → 상대 경로 빌드. GitHub Pages 하위 경로와 Vercel 루트 모두에서 동작.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), prerenderInDev()],
})
