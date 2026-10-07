// 스크린샷 여러 장을 한 장으로 이어 붙인다(검토용). 사용: node scripts/montage.mjs out.png a.png b.png ...
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const [out, ...files] = process.argv.slice(2)
const imgs = files.map((f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 400 * imgs.length, height: 900 } })
await p.setContent(`<body style="margin:0;display:flex;gap:6px;background:#888">${imgs.map((s) => `<img src="${s}" style="width:394px;height:auto">`).join('')}</body>`)
await p.waitForTimeout(200)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log(out)
