// vite build 뒤에 실행: 첫 화면을 HTML로 미리 그려 dist/index.html 의 #root 안에 넣는다.
// 사용: node scripts/prerender.mjs [outDir=dist]
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const outDir = process.argv[2] ?? 'dist'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { render } = await vite.ssrLoadModule('/src/prerender.tsx')
  const html = render()
  const file = `${outDir}/index.html`
  const page = readFileSync(file, 'utf8')
  if (!page.includes('<div id="root"></div>')) throw new Error('#root 자리를 찾지 못했어요')
  writeFileSync(file, page.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
  console.log(`prerender: ${file} (${Math.round(html.length / 1024)} KB)`)
} finally {
  await vite.close()
}
