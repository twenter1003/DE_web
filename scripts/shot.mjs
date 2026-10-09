// Playwright 스크린샷 + 콘솔 에러 수집.
// 사용 예:
//   node scripts/shot.mjs --url http://localhost:5288/ --at "#top@0" --at "#prologue@0.3" --name desk
//   node scripts/shot.mjs --mobile --reduced --at "#ch1@0.5"
//   node scripts/shot.mjs --at "[data-step]:nth-of-type(2)@0.4" (선택자@비율: 요소 높이의 비율 지점을 화면 가운데에)
// --click "selector" : 스크린샷 전에 클릭(여러 번 가능)
// 옵션: --out shots  --w 1440 --h 900  --mobile(390x844)  --reduced  --wait 900  --progress '{"v":1,...}'  --full
// 환경 변수 PW_CHROMIUM=/경로/chrome : Playwright가 내려받은 브라우저 대신 쓸 실행 파일
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const argv = process.argv.slice(2)
const opt = { url: 'http://localhost:5288/', out: 'shots', w: 1440, h: 900, wait: 900, name: 'shot', at: [], click: [] }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--mobile') opt.mobile = true
  else if (a === '--reduced') opt.reduced = true
  else if (a === '--full') opt.full = true
  else if (a === '--at') opt.at.push(argv[++i])
  else if (a === '--click') opt.click.push(argv[++i])
  else if (a.startsWith('--')) opt[a.slice(2)] = argv[++i]
}
if (opt.mobile) Object.assign(opt, { w: 390, h: 844 })
if (!opt.at.length) opt.at.push('#top@0')
mkdirSync(opt.out, { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const ctx = await browser.newContext({
  viewport: { width: Number(opt.w), height: Number(opt.h) },
  deviceScaleFactor: opt.mobile ? 2 : 1,
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference',
  isMobile: Boolean(opt.mobile),
  hasTouch: Boolean(opt.mobile),
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

if (opt.progress) {
  await page.addInitScript((p) => localStorage.setItem('de-atoz:progress', p), opt.progress)
}
// 챕터는 평소엔 가까워질 때 마운트된다. 검증용으로는 전부 미리 마운트(?mount=all).
const target = new URL(opt.url)
if (!target.searchParams.has('mount')) target.searchParams.set('mount', 'all')
await page.goto(target.toString(), { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
// 미리 마운트한 챕터가 모두 그려지고(자리표시 없음) 메인 스레드가 한가해질 때까지 기다린다.
// 장면 그림은 화면에 가까워질 때 그리므로, 마운트가 끝나기 전에 스크롤하면 그림이 늦게 나온다.
const idle = () => page.evaluate(() => new Promise((r) => requestIdleCallback(() => r(null), { timeout: 3000 })))
if (target.searchParams.get('mount') === 'all') await page.waitForFunction(() => !document.querySelector('[data-placeholder]'), null, { timeout: 20000 })
await idle()
await page.waitForTimeout(400)
for (const sel of opt.click) {
  await page.click(sel)
  await page.waitForTimeout(300)
}

let n = 0
for (const spec of opt.at) {
  const [sel, fracS] = spec.split('@')
  const frac = Number(fracS ?? 0)
  const ok = await page.evaluate(
    ([sel, frac]) => {
      const el = document.querySelector(sel)
      if (!el) return false
      const r = el.getBoundingClientRect()
      const y = window.scrollY + r.top + r.height * frac - (frac === 0 ? 0 : window.innerHeight / 2)
      window.scrollTo(0, Math.max(0, y))
      return true
    },
    [sel, frac],
  )
  if (!ok) {
    errors.push(`[shot] 선택자를 찾지 못함: ${sel}`)
    continue
  }
  await page.waitForTimeout(Number(opt.wait))
  await idle()
  const file = `${opt.out}/${opt.name}-${String(++n).padStart(2, '0')}${opt.mobile ? '-m' : ''}${opt.reduced ? '-r' : ''}.png`
  await page.screenshot({ path: file, fullPage: Boolean(opt.full) })
  console.log(file)
}
const height = await page.evaluate(() => document.documentElement.scrollHeight)
console.log(`page height: ${height}px`)
if (errors.length) console.log('콘솔:\n' + errors.join('\n'))
else console.log('콘솔 에러 없음')
await browser.close()
