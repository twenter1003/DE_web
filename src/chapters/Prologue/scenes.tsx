import { prologue } from '../../content/chapters/prologue'
import { Badge, Node, SvgTable, type Col } from '../../components/diagram'
import { Fig, Txt, countTo, scatter } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { REllipse, RLine, RPath, RRect, RArrow } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { useEnv } from '../../state/env'

const F = prologue.figures

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 행동이 흔적을 남긴다
// ─────────────────────────────────────────────────────────────
const GRID: [number, number][] = Array.from({ length: 100 }, (_, i) => [28 + (i % 10) * 15, 70 + Math.floor(i / 10) * 15])
const PICK = 34
const TRACE_FROM: [number, number][] = [
  [374, 98], // 칫솔 카드
  [335, 151], // 검색창
  [335, 190], // 장바구니 버튼
  [335, 228], // 결제 버튼
]
const TRACE_TO = (i: number): [number, number] => [32, 336 + i * 24]
const PILE = { x: 24, y: 420, w: 392, h: 46 }

function Phone() {
  return (
    <g data-el="phone">
      <RRect x={250} y={20} w={170} h={286} seed="phone" rough={0.5} fill="var(--surface)" />
      <Txt x={335} y={50} size={14} weight={800} anchor="middle">
        {F.shopName}
      </Txt>
      {[
        { x: 262, name: '수세미', price: '3,000원' },
        { x: 340, name: '칫솔', price: '2,000원' },
      ].map((c, i) => (
        <g key={c.name} data-el={`card-${i}`}>
          <RRect x={c.x} y={64} w={68} h={64} seed={`card${i}`} rough={0.4} />
          <RRect x={c.x + 20} y={70} w={28} h={22} seed={`img${i}`} rough={0.3} />
          <Txt x={c.x + 34} y={107} size={11.5} weight={600} anchor="middle">
            {c.name}
          </Txt>
          <Txt x={c.x + 34} y={121} size={10.5} anchor="middle" muted>
            {c.price}
          </Txt>
        </g>
      ))}
      <RRect x={262} y={138} w={146} h={26} seed="search" rough={0.4} />
      <Txt x={274} y={156} size={11.5} muted>
        {F.searchPlaceholder}
      </Txt>
      <RRect x={262} y={176} w={146} h={28} seed="cart" rough={0.4} />
      <Txt x={335} y={195} size={12} weight={600} anchor="middle">
        {F.addCart}
      </Txt>
      <rect x={262} y={214} width={146} height={28} rx={4} style={{ fill: 'var(--ink)' }} />
      <Txt x={335} y={233} size={12} weight={700} anchor="middle" color="var(--bg)">
        {F.pay}
      </Txt>
    </g>
  )
}

export function ProblemFig() {
  const { mobile } = useEnv()
  const n = mobile ? 22 : 48
  const starts = Array.from({ length: n }, (_, i) => GRID[(i * 37) % 100])
  const ends = scatter(n, 'pile', PILE.x, PILE.y, PILE.w, PILE.h)
  const traces = [F.trace.click, F.trace.search, F.trace.cart, F.trace.pay]
  return (
    <Fig>
      <Txt x={28} y={46} size={16} weight={700} el="users">
        {F.users(100)}
      </Txt>
      {GRID.map(([x, y], i) => (
        <circle key={i} data-el="user" cx={x} cy={y} r={4.3} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.3} />
      ))}
      <circle data-el="picked" cx={GRID[PICK][0]} cy={GRID[PICK][1]} r={8.5} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.6} />
      <Phone />
      {traces.map((t, i) => {
        const [x, y] = TRACE_TO(i)
        return (
          <g key={t}>
            <circle data-el="trace-p" data-i={i} cx={x} cy={y} r={6} style={{ fill: 'var(--accent)' }} />
            <Txt x={x + 14} y={y + 5} size={14} weight={600} el="trace-l">
              {t}
            </Txt>
          </g>
        )
      })}
      <Txt x={28} y={240} size={14} weight={600} el="acts">
        {F.actsToday('1,532')}
      </Txt>
      <Txt x={416} y={410} size={13} anchor="end" muted el="pile-l">
        {F.pile}
      </Txt>
      <g>
        {ends.map(([x, y], i) => (
          <circle key={i} data-el="pile-p" data-sx={starts[i][0] - x} data-sy={starts[i][1] - y} cx={x} cy={y} r={4.5} style={{ fill: 'var(--accent)' }} />
        ))}
      </g>
      <g data-el="pile-tags">
        {F.tags.map((t, i) => (
          <g key={t}>
            <rect x={36 + i * 96} y={438} width={t.length * 13 + 12} height={20} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} />
            <Txt x={42 + i * 96} y={452} size={12}>
              {t}
            </Txt>
          </g>
        ))}
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const users = q('[data-el="user"]')
  tl.set(users, { opacity: 0 }, 0)
  tl.set([q('[data-el="picked"]'), q('[data-el="trace-l"]'), q('[data-el="pile-tags"]'), q('[data-el="pile-l"]'), q('[data-el="acts"]')], { opacity: 0 }, 0)
  // step 1: 사용자 100명이 한 줄씩 채워짐
  tl.to(users, { opacity: 1, duration: 0.05, stagger: { each: 0.0065 } }, at(0))
  countTo(tl, q('[data-el="users"]')[0], 0, 100, F.users, at(0), 0.7)

  // step 2: 한 사람의 행동 4번 → 흔적 4개
  tl.to(q('[data-el="picked"]'), { opacity: 1, duration: 0.15 }, at(1))
  q('[data-el="trace-p"]').forEach((el, i) => {
    const [fx, fy] = TRACE_FROM[i]
    const [tx, ty] = TRACE_TO(i)
    tl.set(el, { x: fx - tx, y: fy - ty, opacity: 0 }, 0)
    tl.to(el, { opacity: 1, duration: 0.05 }, at(1) + 0.12 + i * 0.17)
    tl.to(el, { x: 0, y: 0, duration: 0.16, ease: 'power2.inOut' }, at(1) + 0.15 + i * 0.17)
  })
  q('[data-el="trace-l"]').forEach((el, i) => tl.to(el, { opacity: 1, duration: 0.1 }, at(1) + 0.28 + i * 0.17))

  // step 3: 모두의 흔적이 더미로
  const pile = q('[data-el="pile-p"]')
  pile.forEach((el) => tl.set(el, { x: Number((el as SVGElement).dataset.sx), y: Number((el as SVGElement).dataset.sy), opacity: 0 }, 0))
  tl.to(q('[data-el="acts"]'), { opacity: 1, duration: 0.1 }, at(2))
  tl.to(pile, { opacity: 1, duration: 0.05, stagger: 0.008 }, at(2))
  tl.to(pile, { x: 0, y: 0, duration: 0.35, ease: 'power1.in', stagger: 0.008 }, at(2) + 0.02)
  countTo(tl, q('[data-el="acts"]')[0], 0, 1532, (v) => F.actsToday(v.toLocaleString('ko-KR')), at(2), 0.72)
  tl.to([q('[data-el="pile-tags"]'), q('[data-el="pile-l"]')], { opacity: 1, duration: 0.15 }, at(2) + 0.6)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 검색어가 없는 CSV
// ─────────────────────────────────────────────────────────────
const COLS: Col[] = [
  { key: 'id', label: F.csvCols[0], w: 70 },
  { key: 'p', label: F.csvCols[1], w: 74 },
  { key: 'q', label: F.csvCols[2], w: 46, align: 'end' },
  { key: 'a', label: F.csvCols[3], w: 64, align: 'end' },
  { key: 't', label: F.csvCols[4], w: 70 },
]
const ROWS = F.csvRows.map(([id, p, qq, a, t]) => ({ id, p, q: qq, a, t }))
const TX = 18
const TY = 100
// 원본 한 줄의 조각 위치(모노 13px 기준 대략) → 표 첫 행 칸 위치
const RAW = (() => {
  const w = (s: string) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? 13 : 7.8), 0)
  let x = 26
  const out: { text: string; x: number; comma: boolean }[] = []
  F.csvRaw.forEach((t, i) => {
    out.push({ text: t, x, comma: false })
    x += w(t)
    if (i < F.csvRaw.length - 1) {
      out.push({ text: ',', x, comma: true })
      x += 7.8
    }
  })
  return out
})()
const cellX = (j: number) => TX + COLS.slice(0, j).reduce((a, c) => a + c.w, 0) + 8

export function AttemptFig() {
  const { mobile } = useEnv()
  const n = mobile ? 22 : 40
  const pile = scatter(n, 'csvpile', 30, 140, 260, 210)
  return (
    <Fig caption={F.lostNote}>
      <g data-el="laptop">
        <RRect x={8} y={14} w={424} h={322} seed="laptop-scr" rough={0.5} fill="var(--surface)" />
        <RPath d="M -6 352 L 8 336 L 432 336 L 446 352 Z" seed="laptop-base" rough={0.5} />
        <Txt x={24} y={42} size={13} mono weight={700}>
          {F.csvFile}
        </Txt>
        {RAW.map((r, i) => (
          <text key={i} data-el={r.comma ? 'raw-c' : 'raw'} x={r.x} y={74} style={{ fontSize: 13 }}>
            {r.text}
          </text>
        ))}
        <g data-el="find">
          <RRect x={236} y={54} w={190} h={28} seed="find" rough={0.4} fill="var(--bg)" />
          <Txt x={246} y={73} size={12.5} weight={600}>
            {F.findLabel}
          </Txt>
          <g data-el="find-res">
            <Txt x={392} y={73} size={12.5} weight={700} anchor="end">
              {F.findResult}
            </Txt>
            <Badge x={410} y={68} status="fail" r={9} />
          </g>
        </g>
        <g data-el="table">
          <SvgTable x={TX} y={TY} cols={COLS} rows={ROWS} el="csv" rowH={30} seed="csvtable" fontSize={12.5} />
        </g>
        <g data-el="missing">
          <rect data-el="miss-hl" x={348} y={TY} width={76} height={180} style={{ fill: 'var(--fail)', opacity: 0 }} />
          <RRect x={348} y={TY} w={76} h={180} seed="miss" rough={0.4} dash="6 5" />
          <Txt x={386} y={TY + 20} size={12} weight={700} anchor="middle">
            {F.missingCol}
          </Txt>
        </g>
        <Txt x={TX} y={306} size={12.5} muted el="total">
          {F.csvTotal}
        </Txt>
      </g>

      <g data-el="pile2">
        <rect data-el="lost-box" x={20} y={120} width={280} height={240} rx={10} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.5} strokeDasharray="6 6" />
        <Txt x={24} y={108} size={13.5} weight={700} el="lost-l">
          {F.lost}
        </Txt>
        <g data-el="csvdoc">
          <RPath d="M 318 160 L 404 160 L 424 180 L 424 262 L 318 262 Z M 404 160 L 404 180 L 424 180" seed="csvdoc" rough={0.5} fill="var(--surface)" />
          <Txt x={371} y={290} size={13} weight={700} anchor="middle">
            {F.csvKept}
          </Txt>
        </g>
        {pile.map(([x, y], i) => {
          const keep = i < 5
          const tx = 340 + (i % 3) * 22
          const ty = 196 + Math.floor(i / 3) * 24
          return (
            <circle key={i} data-el={keep ? 'keep' : 'lost'} data-dx={keep ? tx - x : 0} data-dy={keep ? ty - y : 0} cx={x} cy={y} r={5} style={{ fill: 'var(--accent)' }} />
          )
        })}
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const rows = [1, 2, 3, 4].map((i) => q(`[data-el="csv-r${i}"]`)[0])
  const row0 = q('[data-el="csv-r0"]')
  const raw = q('[data-el="raw"]')
  tl.set([q('[data-el="table"]'), ...rows, row0, q('[data-el="total"]'), q('[data-el="find"]'), q('[data-el="missing"]'), q('[data-el="find-res"]')], { opacity: 0 }, 0)
  tl.set([q('[data-el="pile2"]'), q('[data-el="caption"]')], { opacity: 0 }, 0)

  // step 1: 쉼표로 나뉜 한 줄 → 다섯 칸
  tl.to(q('[data-el="table"]'), { opacity: 1, duration: 0.2 }, at(0))
  tl.to(q('[data-el="raw-c"]'), { opacity: 0, duration: 0.15 }, at(0) + 0.1)
  raw.forEach((el, j) => {
    const target = COLS[j].align === 'end' ? cellX(j) + COLS[j].w - 16 - tw(F.csvRaw[j]) : cellX(j)
    tl.to(el, { x: target - Number(el.getAttribute('x')), y: TY + 30 + 20 - 74, duration: 0.3, ease: 'power2.inOut' }, at(0) + 0.15)
  })
  tl.to(raw, { opacity: 0, duration: 0.08 }, at(0) + 0.45)
  tl.to(row0, { opacity: 1, duration: 0.08 }, at(0) + 0.45)
  tl.to(rows, { opacity: 1, duration: 0.1, stagger: 0.06 }, at(0) + 0.5)
  tl.to(q('[data-el="total"]'), { opacity: 1, duration: 0.1 }, at(0) + 0.75)

  // step 2: 머리글을 훑어도 '검색어'는 없다
  tl.to(q('[data-el="find"]'), { opacity: 1, duration: 0.1 }, at(1))
  COLS.forEach((c, j) => {
    const hl = q(`[data-el="csv-hl-c${c.key}"]`)
    tl.to(hl, { opacity: 0.2, duration: 0.06 }, at(1) + 0.1 + j * 0.1)
    tl.to(hl, { opacity: 0, duration: 0.06 }, at(1) + 0.18 + j * 0.1)
  })
  tl.to(q('[data-el="missing"]'), { opacity: 1, duration: 0.1 }, at(1) + 0.6)
  tl.to(q('[data-el="miss-hl"]'), { opacity: 0.12, duration: 0.1 }, at(1) + 0.65)
  tl.to(q('[data-el="find-res"]'), { opacity: 1, duration: 0.1 }, at(1) + 0.7)

  // step 3: 남은 것은 결제 5건뿐
  tl.to(q('[data-el="laptop"]'), { opacity: 0, duration: 0.15 }, at(2))
  tl.to(q('[data-el="pile2"]'), { opacity: 1, duration: 0.15 }, at(2) + 0.1)
  tl.set(q('[data-el="lost-box"]'), { opacity: 0 }, 0)
  tl.set([q('[data-el="lost-l"]'), q('[data-el="csvdoc"]')], { opacity: 0 }, 0)
  tl.to(q('[data-el="csvdoc"]'), { opacity: 1, duration: 0.15 }, at(2) + 0.25)
  q('[data-el="keep"]').forEach((el) => {
    const e = el as SVGElement
    tl.to(el, { x: Number(e.dataset.dx), y: Number(e.dataset.dy), duration: 0.3, ease: 'power2.inOut' }, at(2) + 0.35)
  })
  tl.to(q('[data-el="lost"]'), { opacity: 0.22, duration: 0.2 }, at(2) + 0.45)
  tl.to([q('[data-el="lost-box"]'), q('[data-el="lost-l"]'), q('[data-el="caption"]')], { opacity: 1, duration: 0.15 }, at(2) + 0.6)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 영수증과 관찰 메모
// ─────────────────────────────────────────────────────────────
export function EventsFig() {
  return (
    <Fig caption={F.accuracyNote}>
      {/* step 1: 공책과 영수증 */}
      <g data-el="props">
        <g data-el="note">
          <RRect x={14} y={30} w={198} h={220} seed="note" rough={0.5} fill="var(--surface)" />
          {[60, 100, 140, 180, 220].map((y) => (
            <REllipse key={y} cx={14} cy={y} w={10} h={10} rough={0.3} seed={`ring${y}`} fill="var(--bg)" />
          ))}
          <Txt x={30} y={60} size={14.5} weight={700}>
            {F.memoTitle}
          </Txt>
          {F.memo.map((m, i) => (
            <Txt key={m} x={30} y={100 + i * 46} size={12.5} el="memo">
              {m}
            </Txt>
          ))}
          <line data-el="strike" x1={28} y1={142} x2={204} y2={142} style={{ stroke: 'var(--line)' }} strokeWidth={2} />
          <Txt x={30} y={164} size={11.5} muted el="missing-tag">
            {F.memoMissing}
          </Txt>
        </g>
        <g data-el="ok-l">
          <Badge x={52} y={282} status="ok" r={10} />
          <Txt x={70} y={287} size={14} weight={700}>
            {F.shopOk}
          </Txt>
        </g>
        <g data-el="receipt">
          <RPath d="M 228 30 L 426 30 L 426 244 L 414 252 L 402 244 L 390 252 L 378 244 L 366 252 L 354 244 L 342 252 L 330 244 L 318 252 L 306 244 L 294 252 L 282 244 L 270 252 L 258 244 L 246 252 L 234 244 L 228 248 Z" seed="receipt" rough={0.5} fill="var(--surface)" />
          <Txt x={327} y={60} size={14.5} weight={700} anchor="middle" el="rc">
            {F.receiptTitle}
          </Txt>
          <Txt x={244} y={106} size={13} el="rc">
            {F.receiptLine}
          </Txt>
          <line data-el="rc" x1={244} y1={128} x2={412} y2={128} style={{ stroke: 'var(--muted)' }} strokeDasharray="4 4" />
          <Txt x={244} y={160} size={13.5} weight={700} el="rc">
            {F.receiptTotal}
          </Txt>
          <Txt x={412} y={160} size={13.5} weight={700} anchor="end" el="total-ok">
            {F.receiptRight}
          </Txt>
          <Txt x={412} y={160} size={13.5} weight={700} anchor="end" el="total-bad">
            {F.receiptWrong}
          </Txt>
          <line data-el="underline" x1={350} y1={168} x2={414} y2={168} style={{ stroke: 'var(--fail)' }} strokeWidth={2.5} />
        </g>
        <g data-el="bad-l">
          <Badge x={268} y={282} status="fail" r={10} />
          <Txt x={286} y={287} size={14} weight={700}>
            {F.moneyWrong}
          </Txt>
        </g>
      </g>

      {/* step 2~3: 두 상자 */}
      <g data-el="boxes">
        {[
          { x: 14, title: F.eventBox, traits: F.eventTraits, icon: 'note' },
          { x: 228, title: F.txBox, traits: F.txTraits, icon: 'receipt' },
        ].map((b, i) => (
          <g key={b.title} data-el={`box-${i}`}>
            <RRect x={b.x} y={120} w={198} h={210} seed={`ebox${i}`} rough={0.5} fill="var(--surface)" />
            {b.icon === 'note' ? (
              <RRect x={b.x + 14} y={134} w={18} h={22} seed="ico-n" rough={0.3} />
            ) : (
              <RPath d={`M ${b.x + 14} 134 L ${b.x + 32} 134 L ${b.x + 32} 154 L ${b.x + 26} 158 L ${b.x + 20} 154 L ${b.x + 14} 158 Z`} seed="ico-r" rough={0.3} />
            )}
            <Txt x={b.x + 40} y={151} size={15} weight={800}>
              {b.title}
            </Txt>
            {b.traits.map((t, k) => (
              <Txt key={t} x={b.x + 14} y={186 + k * 26} size={12.5} el={`trait-${i}`}>
                {t}
              </Txt>
            ))}
          </g>
        ))}
        {[
          { label: F.tags[0], x: 60 },
          { label: F.tags[1], x: 120 },
          { label: F.tags[2], x: 180 },
          { label: F.tags[3], x: 330 },
        ].map((p, i) => (
          <g key={p.label} data-el={`ep-${i}`}>
            <circle cx={p.x} cy={64} r={7} style={{ fill: 'var(--accent)' }} />
            <Txt x={p.x} y={92} size={12} anchor="middle" el="ep-l">
              {p.label}
            </Txt>
          </g>
        ))}
        <circle data-el="ep-split" cx={330} cy={64} r={7} style={{ fill: 'var(--accent)' }} />
        <Txt x={220} y={364} size={14} weight={700} anchor="middle" el="pay-both">
          {F.payBoth}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildEvents: SceneBuild = (q, tl) => {
  const memo = q('[data-el="memo"]')
  const rc = q('[data-el="rc"]')
  tl.set([...memo, ...rc, q('[data-el="strike"]'), q('[data-el="missing-tag"]'), q('[data-el="ok-l"]'), q('[data-el="total-bad"]'), q('[data-el="underline"]'), q('[data-el="bad-l"]')], { opacity: 0 }, 0)
  tl.set(q('[data-el="strike"]'), { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.set([q('[data-el="boxes"]'), q('[data-el="caption"]')], { opacity: 0 }, 0)

  // step 1: 같은 기록이라도 필요한 정확도가 다르다
  tl.to(memo, { opacity: 1, duration: 0.08, stagger: 0.1 }, at(0))
  tl.to([...rc, q('[data-el="total-ok"]')], { opacity: 1, duration: 0.08, stagger: 0.07 }, at(0))
  tl.to(q('[data-el="strike"]'), { opacity: 1, scaleX: 1, duration: 0.15 }, at(0) + 0.38)
  tl.to(q('[data-el="missing-tag"]'), { opacity: 1, duration: 0.08 }, at(0) + 0.5)
  tl.to(q('[data-el="ok-l"]'), { opacity: 1, duration: 0.1 }, at(0) + 0.55)
  tl.to(q('[data-el="total-ok"]'), { opacity: 0, duration: 0.06 }, at(0) + 0.6)
  tl.to([q('[data-el="total-bad"]'), q('[data-el="underline"]')], { opacity: 1, duration: 0.06 }, at(0) + 0.62)
  tl.to(q('[data-el="bad-l"]'), { opacity: 1, duration: 0.1 }, at(0) + 0.7)

  // step 2: 비유 → 정확한 용어
  tl.to(q('[data-el="props"]'), { opacity: 0, duration: 0.2 }, at(1))
  tl.to(q('[data-el="boxes"]'), { opacity: 1, duration: 0.2 }, at(1) + 0.15)
  const particles = [0, 1, 2, 3].map((i) => q(`[data-el="ep-${i}"]`)[0])
  tl.set([...particles, q('[data-el="ep-split"]'), q('[data-el="pay-both"]')], { opacity: 0 }, 0)
  q('[data-el^="trait-"]').forEach((el, i) => {
    tl.set(el, { opacity: 0 }, 0)
    tl.to(el, { opacity: 1, duration: 0.1 }, at(1) + 0.35 + (i % 2) * 0.12)
  })
  tl.to(q('[data-el="caption"]'), { opacity: 1, duration: 0.15 }, at(1) + 0.6)

  // step 3: 클릭·검색·장바구니 → 이벤트 로그, 결제 → 양쪽
  tl.to(particles, { opacity: 1, duration: 0.1 }, at(2))
  const dest: [number, number][] = [
    [40 - 60, 300 - 64],
    [80 - 120, 300 - 64],
    [120 - 180, 300 - 64],
  ]
  particles.slice(0, 3).forEach((el, i) => tl.to(el, { x: dest[i][0], y: dest[i][1], duration: 0.3, ease: 'power2.inOut' }, at(2) + 0.12 + i * 0.05))
  // 결제: 가운데 갈림길에서 둘로
  tl.to([particles[3], q('[data-el="ep-split"]')], { opacity: 1, x: -110, y: 50, duration: 0.2 }, at(2) + 0.3)
  tl.to(particles[3], { x: 160 - 330, y: 300 - 64, duration: 0.25 }, at(2) + 0.52)
  tl.to(q('[data-el="ep-split"]'), { x: 380 - 330, y: 300 - 64, duration: 0.25 }, at(2) + 0.52)
  tl.to(q('[data-el="pay-both"]'), { opacity: 1, duration: 0.1 }, at(2) + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 정형·반정형·비정형
// ─────────────────────────────────────────────────────────────
const BINS = [14, 153, 292]
const tw = (s: string, size = 13) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : size * 0.6), 0)

export function ShapesFig() {
  const drops = scatter(12, 'drops', 30, 30, 380, 150)
  return (
    <Fig caption={F.schemaNote}>
      <g data-el="bins">
        {BINS.map((x, i) => (
          <g key={i}>
            <RRect x={x} y={250} w={134} h={200} seed={`bin${i}`} rough={0.5} />
            <Txt x={x + 67} y={280} size={15} weight={800} anchor="middle">
              {F.bins[i]}
            </Txt>
          </g>
        ))}
        <g data-el="frag-0">
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={46 + c * 24} y={330 + r * 18} width={24} height={18} style={{ fill: r === 0 ? 'var(--edge)' : 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1} />))}
        </g>
        <g data-el="frag-1">
          <Txt x={220} y={385} size={36} weight={500} anchor="middle" mono>
            {'{ }'}
          </Txt>
        </g>
        <g data-el="frag-2">
          <RPath d="M 306 320 L 380 320 L 380 352 L 334 352 L 324 362 L 324 352 L 306 352 Z" seed="frag-b" rough={0.4} fill="var(--surface)" />
          <RRect x={338} y={372} w={70} h={52} seed="frag-p" rough={0.4} fill="var(--surface)" />
          <RPath d="M 342 418 L 362 396 L 376 408 L 388 392 L 404 418" seed="frag-m" rough={0.4} />
        </g>
        {drops.map(([x, y], i) => {
          const bin = i % 3
          const tx = BINS[bin] + 30 + Math.floor(i / 3) * 24
          const ty = 300
          return <circle key={i} data-el="drop" data-dx={tx - x} data-dy={ty - y} cx={x} cy={y} r={6} style={{ fill: 'var(--accent)' }} />
        })}
      </g>

      {/* 정형: 표와 스키마 */}
      <g data-el="struct">
        <g data-el="schema">
          <RRect x={20} y={30} w={400} h={176} seed="schema" rough={0.5} fill="var(--surface)" />
          <Txt x={40} y={62} size={16} weight={800}>
            {F.schemaTitle}
          </Txt>
          {F.schema.map((s, i) => (
            <Txt key={s} x={40 + (i % 2) * 190} y={98 + Math.floor(i / 2) * 32} size={13.5} mono el="schema-l">
              {s}
            </Txt>
          ))}
        </g>
        <SvgTable x={59} y={260} cols={COLS} rows={ROWS.slice(0, 3)} el="st" rowH={30} seed="st" fontSize={12.5} />
        <g data-el="ghost">
          <rect x={59} y={260} width={322} height={30} style={{ fill: 'var(--accent)', opacity: 0.18 }} />
        </g>
      </g>

      {/* 반정형: JSON 카드 */}
      <g data-el="json">
        {F.json.map((fields, i) => {
          const y = 70 + i * 92
          let x = 44
          return (
            <g key={i} data-el="jcard" data-off={[30, -18, 44][i]}>
              <RRect x={14} y={y} w={414} h={60} seed={`jc${i}`} rough={0.4} fill="var(--surface)" />
              <Txt x={26} y={y + 36} size={18} mono>
                {'{'}
              </Txt>
              {fields.map((f, k) => {
                const w = tw(f, 12) + 8
                const fx = x
                x += w + 6
                return (
                  <g key={f}>
                    {k === 0 ? (
                      <line x1={fx} y1={y + 42} x2={fx + w} y2={y + 42} style={{ stroke: 'var(--accent)' }} strokeWidth={3} />
                    ) : (
                      <rect x={fx - 1} y={y + 16} width={w + 2} height={28} rx={4} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeDasharray="4 3" />
                    )}
                    <Txt x={fx + 4} y={y + 35} size={12} mono>
                      {f}
                    </Txt>
                  </g>
                )
              })}
              <Txt x={x} y={y + 36} size={18} mono>
                {'}'}
              </Txt>
            </g>
          )
        })}
      </g>

      {/* 비정형: 리뷰와 사진 */}
      <g data-el="unst">
        <g data-el="movers">
          <RPath d="M 20 70 L 236 70 L 236 150 L 70 150 L 54 168 L 54 150 L 20 150 Z" seed="rev" rough={0.5} fill="var(--surface)" />
          <Txt x={34} y={102} size={13.5}>
            {F.review.split('. ')[0]}.
          </Txt>
          <Txt x={34} y={128} size={13.5}>
            {F.review.split('. ').slice(1).join('. ')}
          </Txt>
          <RRect x={20} y={190} w={150} h={116} seed="photo" rough={0.5} fill="var(--surface)" />
          <RRect x={56} y={220} w={78} h={52} seed="sponge" rough={0.8} fill="var(--accent)" fillStyle="hachure" />
          <Txt x={95} y={326} size={12} muted anchor="middle">
            {F.photo}
          </Txt>
        </g>
        <RRect x={276} y={90} w={146} h={230} seed="empty" rough={0.4} dash="6 6" />
        <RLine x1={276} y1={130} x2={422} y2={130} seed="e1" rough={0.3} dash="6 6" />
        <RLine x1={349} y1={90} x2={349} y2={320} seed="e2" rough={0.3} dash="6 6" />
        <Txt x={349} y={76} size={14} weight={800} anchor="middle" el="nocol">
          {F.noColumns}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildShapes: SceneBuild = (q, tl) => {
  const frags = [0, 1, 2].map((i) => q(`[data-el="frag-${i}"]`)[0])
  const drops = q('[data-el="drop"]')
  tl.set([...frags, q('[data-el="struct"]'), q('[data-el="json"]'), q('[data-el="unst"]'), q('[data-el="caption"]'), q('[data-el="nocol"]')], { opacity: 0 }, 0)

  // step 1: 입자가 세 칸으로 떨어져 모양이 된다
  drops.forEach((el, i) => {
    const e = el as SVGElement
    tl.to(el, { x: Number(e.dataset.dx), y: Number(e.dataset.dy), duration: 0.35, ease: 'power2.in' }, at(0) + 0.02 * i)
  })
  tl.to(drops, { opacity: 0, duration: 0.1 }, at(0) + 0.55)
  tl.to(frags, { opacity: 1, duration: 0.15, stagger: 0.05 }, at(0) + 0.55)

  // step 2: 정형 — 머리글이 스키마 카드로
  tl.to(q('[data-el="bins"]'), { opacity: 0, duration: 0.15 }, at(1))
  tl.to(q('[data-el="struct"]'), { opacity: 1, duration: 0.15 }, at(1) + 0.1)
  tl.set(q('[data-el="schema"]'), { opacity: 0, y: 30 }, 0)
  tl.set(q('[data-el="schema-l"]'), { opacity: 0 }, 0)
  tl.fromTo(q('[data-el="ghost"]'), { y: 0, opacity: 1 }, { y: -200, opacity: 0, duration: 0.3, ease: 'power2.inOut' }, at(1) + 0.25)
  tl.to(q('[data-el="schema"]'), { opacity: 1, y: 0, duration: 0.25 }, at(1) + 0.4)
  tl.to(q('[data-el="schema-l"]'), { opacity: 1, duration: 0.05, stagger: 0.04 }, at(1) + 0.5)
  tl.to(q('[data-el="caption"]'), { opacity: 1, duration: 0.1 }, at(1) + 0.6)

  // step 3: 반정형 — 왼쪽을 맞추면 event만 줄을 선다
  tl.to([q('[data-el="struct"]'), q('[data-el="caption"]')], { opacity: 0, duration: 0.15 }, at(2))
  const cards = q('[data-el="jcard"]')
  cards.forEach((el) => tl.set(el, { x: Number((el as SVGElement).dataset.off) }, 0))
  tl.to(q('[data-el="json"]'), { opacity: 1, duration: 0.15 }, at(2) + 0.1)
  tl.to(cards, { x: 0, duration: 0.4, ease: 'power2.inOut' }, at(2) + 0.3)

  // step 4: 비정형 — 나눌 칸이 미리 정해져 있지 않다
  tl.to(q('[data-el="json"]'), { opacity: 0, duration: 0.15 }, at(3))
  tl.to(q('[data-el="unst"]'), { opacity: 1, duration: 0.15 }, at(3) + 0.1)
  tl.fromTo(q('[data-el="movers"]'), { x: 0 }, { x: 34, duration: 0.35, ease: 'power2.out' }, at(3) + 0.25)
  tl.to(q('[data-el="nocol"]'), { opacity: 1, duration: 0.12 }, at(3) + 0.6)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 수도관을 놓는 사람, 첫 파이프라인 맵
// ─────────────────────────────────────────────────────────────
const PIPE_MAIN = 'M 100 200 L 220 200'
const PIPE_UP = 'M 220 200 L 240 200 L 240 112 L 262 112'
const PIPE_DOWN = 'M 220 200 L 240 200 L 240 300 L 262 300'

export function SolutionFig() {
  return (
    <Fig>
      <g data-el="city">
        <g data-el="source">
          <RRect x={14} y={160} w={86} h={80} seed="tank" rough={0.6} fill="var(--surface)" />
          <RPath d="M 26 190 Q 42 182 57 190 T 88 190" seed="wave" rough={0.4} stroke="var(--accent)" />
          <Txt x={57} y={264} size={13} weight={700} anchor="middle">
            {F.source}
          </Txt>
        </g>
        <g data-el="pipe">
          <RPath d={PIPE_MAIN} seed="pipe-m" rough={0.6} strokeWidth={7} stroke="var(--edge)" />
        </g>
        <Txt x={160} y={232} size={13} weight={700} anchor="middle" el="role-de">
          {F.pipeRole}
        </Txt>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} data-el="drip" cx={110 + i * 30} cy={200} r={4} style={{ fill: 'var(--accent)' }} />
        ))}
        <g data-el="branches">
          <RPath d={PIPE_UP} seed="pipe-u" rough={0.6} strokeWidth={7} stroke="var(--edge)" />
          <RPath d={PIPE_DOWN} seed="pipe-d" rough={0.6} strokeWidth={7} stroke="var(--edge)" />
        </g>
        <g data-el="kitchen">
          <RRect x={262} y={20} w={168} h={176} seed="kitchen" rough={0.5} fill="var(--surface)" />
          <Txt x={278} y={46} size={14.5} weight={800}>
            {F.kitchen}
          </Txt>
          <RPath d="M 380 32 L 412 32 L 408 52 L 384 52 Z M 376 32 L 416 32" seed="pot" rough={0.4} />
          <Txt x={278} y={72} size={11.5}>
            {F.kitchenAsk}
          </Txt>
          {[0.95, 0.6, 0.4, 0.5].map((v, i) => (
            <rect key={i} data-el="bar" x={284 + i * 32} y={164 - v * 70} width={22} height={v * 70} style={{ fill: 'var(--accent)', opacity: 0.85 }} />
          ))}
          <line x1={278} y1={164} x2={416} y2={164} style={{ stroke: 'var(--line)' }} strokeWidth={1.5} />
          <Txt x={346} y={186} size={12.5} weight={700} anchor="middle">
            {F.analyst}
          </Txt>
        </g>
        <g data-el="lab">
          <RRect x={262} y={212} w={168} h={176} seed="lab" rough={0.5} fill="var(--surface)" />
          <Txt x={278} y={238} size={14.5} weight={800}>
            {F.lab}
          </Txt>
          <RPath d="M 392 224 L 400 224 L 400 236 L 410 252 L 382 252 L 392 236 Z" seed="flask" rough={0.4} />
          <Txt x={278} y={264} size={11.5}>
            {F.labAsk}
          </Txt>
          <RPath d="M 282 350 L 302 336 L 322 342 L 342 322" seed="line" rough={0.3} stroke="var(--accent)" strokeWidth={2.5} />
          <path data-el="forecast" d="M 342 322 L 362 314 L 382 304 L 404 296" style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.5} strokeDasharray="5 5" />
          <line x1={278} y1={358} x2={416} y2={358} style={{ stroke: 'var(--line)' }} strokeWidth={1.5} />
          <Txt x={346} y={380} size={12.5} weight={700} anchor="middle">
            {F.scientist}
          </Txt>
        </g>
      </g>

      {/* 첫 파이프라인 맵(손그림) */}
      <g data-el="paper">
        <RRect x={10} y={60} w={420} h={330} seed="paper" rough={1} fill="var(--surface)" />
        <g data-el="sticky">
          <RRect x={24} y={86} w={150} h={46} seed="sticky" rough={0.6} fill="var(--accent)" fillStyle="hachure" />
          <Txt x={99} y={114} size={12.5} weight={700} anchor="middle">
            {F.sticky}
          </Txt>
        </g>
        {F.mapNodes.map(([l, s], i) => (
          <g key={l} data-el="mnode">
            <Node x={80 + i * 140} y={230} w={120} h={56} label={l} sub={s} kind={i === 1 ? 'doc' : i === 0 ? 'source' : 'serve'} seed={`pm${i}`} scale={0.9} />
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={i} data-el="marrow">
            <RArrow x1={142 + i * 140} y1={230} x2={156 + i * 140} y2={230} seed={`pa${i}`} />
          </g>
        ))}
        {[0, 1, 2].map((i) => (
          <circle key={i} data-el="order" cx={110 + i * 20} cy={268} r={4.5} style={{ fill: 'var(--accent)' }} />
        ))}
        <g data-el="gone">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={40 + i * 22} cy={318} r={5.5} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeDasharray="2 2" strokeWidth={1.6} />
          ))}
          <Txt x={110} y={323} size={12} muted>
            {F.notKept}
          </Txt>
        </g>
      </g>

      {/* step 4: 석 리드에게 */}
      <g data-el="meet">
        <g transform="translate(40 300) scale(0.9)">
          <JuniFace mood="focus" seed="sol-juni" />
        </g>
        <g>
          <REllipse cx={214} cy={342} w={46} h={46} seed="seok-face" rough={0.4} fill="var(--surface)" />
          <Txt x={214} y={348} size={16} weight={800} anchor="middle">
            {F.seokInitial}
          </Txt>
        </g>
        <g data-el="memo2">
          <RRect x={250} y={322} w={110} h={40} seed="memo2" rough={0.5} fill="var(--surface)" />
          <Txt x={305} y={347} size={13.5} weight={800} anchor="middle">
            {F.toSchema}
          </Txt>
        </g>
        <Txt x={420} y={34} size={12} muted anchor="end" el="thumb-l">
          {F.mapThumb}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildSolution: SceneBuild = (q, tl) => {
  const mainPipe = q('[data-el="pipe"] path')
  const branchPaths = q('[data-el="branches"] path')
  tl.set([q('[data-el="role-de"]'), q('[data-el="drip"]')], { opacity: 0 }, 0)
  tl.set([q('[data-el="kitchen"]'), q('[data-el="lab"]')], { opacity: 0.25 }, 0)
  tl.set(mainPipe, { drawSVG: '0%' }, 0)
  tl.set(branchPaths, { drawSVG: '0%' }, 0)
  tl.set(q('[data-el="bar"]'), { scaleY: 0, transformOrigin: '50% 100%' }, 0)
  tl.set(q('[data-el="forecast"]'), { opacity: 0 }, 0)
  tl.set([q('[data-el="paper"]'), q('[data-el="meet"]')], { opacity: 0 }, 0)

  // step 1: 길이 있어야 흐른다
  tl.to(mainPipe, { drawSVG: '100%', duration: 0.35 }, at(0))
  tl.to(q('[data-el="role-de"]'), { opacity: 1, duration: 0.1 }, at(0) + 0.3)
  tl.to(q('[data-el="drip"]'), { opacity: 1, duration: 0.05, stagger: 0.04 }, at(0) + 0.4)
  tl.fromTo(q('[data-el="drip"]'), { x: -10 }, { x: 18, duration: 0.4, ease: 'none' }, at(0) + 0.4)

  // step 2: 같은 물, 다른 쓰임
  tl.to(branchPaths, { drawSVG: '100%', duration: 0.25 }, at(1))
  tl.to([q('[data-el="kitchen"]'), q('[data-el="lab"]')], { opacity: 1, duration: 0.15 }, at(1) + 0.2)
  tl.to(q('[data-el="bar"]'), { scaleY: 1, duration: 0.25, stagger: 0.05 }, at(1) + 0.35)
  tl.fromTo(q('[data-el="forecast"]'), { opacity: 1, drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3 }, at(1) + 0.45)

  // step 3: 첫 파이프라인 그림 — 주문만 흐르고 검색·클릭은 사라진다
  tl.to(q('[data-el="city"]'), { opacity: 0, duration: 0.15 }, at(2))
  tl.to(q('[data-el="paper"]'), { opacity: 1, duration: 0.1 }, at(2) + 0.1)
  const nodes = q('[data-el="mnode"]')
  const arrows = q('[data-el="marrow"]')
  tl.set([...nodes, ...arrows, q('[data-el="order"]'), q('[data-el="sticky"]')], { opacity: 0 }, 0)
  tl.set(q('[data-el="gone"]'), { opacity: 0 }, 0)
  nodes.forEach((n, i) => {
    tl.to(n, { opacity: 1, duration: 0.1 }, at(2) + 0.15 + i * 0.1)
    if (arrows[i]) tl.to(arrows[i], { opacity: 1, duration: 0.08 }, at(2) + 0.22 + i * 0.1)
  })
  tl.to(q('[data-el="order"]'), { opacity: 1, duration: 0.05 }, at(2) + 0.45)
  tl.fromTo(q('[data-el="order"]'), { x: 0 }, { x: 200, duration: 0.3, stagger: 0.04, ease: 'none' }, at(2) + 0.45)
  tl.fromTo(q('[data-el="gone"]'), { opacity: 1 }, { opacity: 0.45, duration: 0.15 }, at(2) + 0.6)
  tl.to(q('[data-el="sticky"]'), { opacity: 1, duration: 0.1 }, at(2) + 0.58)

  // step 4: 이 그림이 앞으로 자랄 맵이 된다
  tl.to(q('[data-el="paper"]'), { scale: 0.42, x: 250, y: -16, transformOrigin: '0% 0%', duration: 0.35, ease: 'power2.inOut' }, at(3))
  tl.to(q('[data-el="meet"]'), { opacity: 1, duration: 0.15 }, at(3) + 0.3)
}
