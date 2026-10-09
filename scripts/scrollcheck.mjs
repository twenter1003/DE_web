// 전체 페이지를 위에서 아래까지 스크롤하며 점검한다(챕터 지연 마운트 그대로, ?mount=all 없이).
// - 콘솔 에러·경고(hydration 불일치 포함)
// - 화면에 보이는데 비어 있는 장면 그림(장면 그림은 화면에 가까워질 때 그린다 → 못 그리면 여기서 드러난다)
// 사용: 개발 서버를 띄운 뒤
//   node scripts/scrollcheck.mjs                 (1440x900)
//   node scripts/scrollcheck.mjs --mobile        (375x667)
//   node scripts/scrollcheck.mjs --reduced --size 768x1024
// 옵션: --url http://localhost:5288/  --step 0.5(한 번에 화면 높이의 몇 배)  --delay 120(ms)
// 문제가 있으면 종료 코드 1. 환경 변수 PW_CHROMIUM은 shot.mjs와 같다.
import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const opt = { url: 'http://localhost:5288/', step: 0.5, delay: 120 }
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--mobile') opt.mobile = true
  else if (a === '--reduced') opt.reduced = true
  else if (a.startsWith('--')) opt[a.slice(2)] = argv[++i]
}
const [w, h] = (opt.size ?? (opt.mobile ? '375x667' : '1440x900')).split('x').map(Number)

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: opt.mobile ? 2 : 1,
  isMobile: Boolean(opt.mobile),
  hasTouch: Boolean(opt.mobile),
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference',
})
const errors = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`))
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
await page.goto(opt.url, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// 그림 칸: 스크롤 장면(section > 고정 칸 > 그림 틀)과 모션 줄이기의 step별 정지 그림(figure > 그림 틀)
const blanks = new Map()
for (let guard = 0; guard < 5000; guard++) {
  const r = await page.evaluate((frac) => {
    const empty = []
    const slots = [
      ...[...document.querySelectorAll('section[id] > div[aria-hidden="true"] > div')].map((d) => [d.closest('section').id, d]),
      ...[...document.querySelectorAll('li[data-step] figure > div')].map((d) => [`${d.closest('section[id]')?.id} step ${[...d.closest('ol').children].indexOf(d.closest('li')) + 1}`, d]),
    ]
    for (const [id, d] of slots) {
      const rc = d.getBoundingClientRect()
      if (rc.bottom > 0 && rc.top < innerHeight && rc.height > 0 && d.childElementCount === 0) empty.push(id)
    }
    const before = scrollY
    scrollBy(0, Math.round(innerHeight * frac))
    return { empty, moved: scrollY !== before }
  }, Number(opt.step))
  for (const id of r.empty) blanks.set(id, (blanks.get(id) ?? 0) + 1)
  await page.waitForTimeout(Number(opt.delay))
  if (!r.moved) {
    // 맨 아래: 지연 마운트로 페이지가 더 길어졌는지 한 번 더 확인
    await page.waitForTimeout(600)
    if (!(await page.evaluate(() => { const y = scrollY; scrollBy(0, 200); return scrollY !== y }))) break
  }
}

const s = await page.evaluate(() => {
  const drawn = (sel) => [...document.querySelectorAll(sel)].filter((d) => d.childElementCount > 0).length
  return {
    placeholders: document.querySelectorAll('[data-placeholder]').length,
    scenes: `${drawn('section[id] > div[aria-hidden="true"] > div')}/${document.querySelectorAll('section[id] > div[aria-hidden="true"] > div').length}`,
    stills: `${drawn('li[data-step] figure > div')}/${document.querySelectorAll('li[data-step] figure > div').length}`,
  }
})
await browser.close()

console.log(`${w}x${h}${opt.reduced ? ' 모션 줄이기' : ''}: 남은 자리표시 ${s.placeholders}, 그린 장면 ${s.scenes}, 그린 정지 그림 ${s.stills}`)
console.log(blanks.size ? `보이는데 비어 있던 그림: ${[...blanks.keys()].join(', ')}` : '보이는데 비어 있던 그림 없음')
console.log(errors.length ? '콘솔:\n' + errors.join('\n') : '콘솔 에러 없음')
process.exit(errors.length || blanks.size || s.placeholders ? 1 : 0)
