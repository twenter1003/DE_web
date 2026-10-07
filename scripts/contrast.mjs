// 모든 스테이지 팔레트의 WCAG 대비를 검증한다.
// 사용: node scripts/contrast.mjs   (실패가 있으면 exit 1)
import { STAGES } from '../src/lib/stages.ts'

const hex = (h) => {
  const v = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// [전경, 배경, 최소 대비, 설명]
const checks = (s) => [
  [s.ink, s.bg, 4.5, '본문/배경'],
  [s.muted, s.bg, 4.5, '보조/배경'],
  [s.ink, s.surface, 4.5, '본문/카드'],
  [s.muted, s.surface, 4.5, '보조/카드'],
  [s.accent, s.bg, 3, '입자/배경'],
  [s.accent, s.surface, 3, '입자/카드'],
  [s.fail, s.bg, 3, '실패/배경'],
  [s.ok, s.bg, 3, '성공/배경'],
  [s.wait, s.bg, 3, '대기/배경'],
  [s.fail, s.surface, 3, '실패/카드'],
  [s.ok, s.surface, 3, '성공/카드'],
  [s.line, s.bg, 3, '선/배경'],
]

let failed = 0
for (const s of STAGES) {
  const row = checks(s).map(([fg, bg, min, label]) => {
    const r = ratio(fg, bg)
    if (r < min) failed++
    return `${label} ${r.toFixed(2)}${r < min ? ' ✕' : ''}`
  })
  console.log(`stage ${String(s.index).padStart(2)}  ${row.join('  ')}`)
}
if (failed) {
  console.error(`\n${failed}개 조합이 기준 미달`)
  process.exit(1)
}
console.log('\n모든 조합 통과')
