import { ch9, CUSTOMERS, MASKED, type CustomerRow } from '../../content/chapters/ch9'
import { T } from '../../content/map'
import { PEOPLE } from '../../content/people'
import { Badge, Node, rng } from '../../components/diagram'
import { countTo, Fig, Txt } from '../../components/fig'
import { RArrow, REllipse, RLine, RPath, RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import { Band, Box, init, Lock, Meter, needleInit, needleTo, Person, pick, StatusMark, strokes, Tag, WorkCard } from './parts'

const F = ch9.figures
const NODE8 = Object.fromEntries(mapStateAt(T.ch8).nodes.map((n) => [n.id, n]))

/** 청구서 막대 길이(최댓값 대비). 해결 장면의 '다음 달 청구서'와 비교한다 */
export const BILL_NOW = [0.98, 0.47, 0.2]
const BAND_N = 84
const LABELS = { run: F.running, wait: F.paused, ok: '' }

/** 숫자를 단계별로 바꾼다(한 객체를 여러 번 트윈해 되감기에도 맞는 값이 나온다) */
function countSteps(tl: gsap.core.Timeline, el: Element | undefined, fmt: (n: number) => string, from: number, steps: [number, number][], duration = 0.05) {
  if (!el) return
  const o = { v: from }
  el.textContent = fmt(from)
  for (const [v, t] of steps) tl.to(o, { v, duration, ease: 'none', onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, t)
}

/** 띠를 한 번 훑는다: 덮개를 지우고 빛줄기가 지나가며 읽은 칸을 칠한다 */
function sweep(tl: gsap.core.Timeline, beam: Element[], read: Element[], t: number, dur: number, from: number, to: number) {
  tl.set(read, { scaleX: 0, opacity: 1 }, t)
  tl.set(beam, { x: from, opacity: 1 }, t)
  tl.to(beam, { x: to, duration: dur, ease: 'none' }, t)
  tl.to(read, { scaleX: 1, duration: dur, ease: 'none' }, t)
  tl.set(beam, { opacity: 0 }, t + dur)
}

// ── 고객 테이블(장면 2 step 4 · 장면 5 step 3) ──────────────────
type CKey = keyof CustomerRow
const CCOLS: { key: CKey; w: number; mono?: boolean }[] = [
  { key: 'id', w: 60, mono: true },
  { key: 'name', w: 54 },
  { key: 'phone', w: 118, mono: true },
  { key: 'addr', w: 156 },
]
const PII: CKey[] = ['name', 'phone', 'addr']

function CustTable({ x, y, rowH = 26, el, seed, masked }: { x: number; y: number; rowH?: number; el: string; seed: string; masked?: CustomerRow[] }) {
  const xs = CCOLS.reduce<number[]>((a, _c, i) => [...a, i ? a[i - 1] + CCOLS[i - 1].w : x], [])
  const W = CCOLS.reduce((a, c) => a + c.w, 0)
  const H = rowH * (CUSTOMERS.length + 1)
  const cell = (r: CustomerRow, i: number, k: CKey, j: number) => (
    <Txt key={k} x={xs[j] + 8} y={y + rowH * (i + 1) + rowH * 0.66} size={13} weight={k === 'name' ? 650 : 500} style={k === 'phone' || k === 'id' ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
      {r[k]}
    </Txt>
  )
  // 모자이크: 개인정보 세 열을 덮는 격자 무늬(행마다 하나). 짙은 칸·옅은 칸 두 겹
  const mosaic = (i: number) => {
    const s = 6.5
    const x0 = xs[1]
    const top = y + rowH * (i + 1) + 1
    const r = rng(`${seed}-mz${i}`)
    let a = ''
    let b = ''
    for (let yy = 0; yy + s <= rowH - 1; yy += s)
      for (let xx = 0; xx + s <= W - (x0 - x) - 1; xx += s) {
        const d = `M ${(x0 + 1 + xx).toFixed(1)} ${(top + yy).toFixed(1)} h ${s} v ${s} h ${-s} Z `
        if (((xx / s + yy / s) % 2 === 0) !== r() < 0.18) a += d
        else b += d
      }
    return (
      <g key={i} data-el={`${el}-mz${i}`}>
        <path d={a} style={{ fill: 'var(--bg)' }} />
        <path d={b} style={{ fill: 'var(--line)', opacity: 0.16 }} />
      </g>
    )
  }
  return (
    <g data-el={el}>
      <rect x={x} y={y} width={W} height={H} style={{ fill: 'var(--surface)' }} />
      {masked && CUSTOMERS.map((_, i) => mosaic(i))}
      <RRect x={x} y={y} w={W} h={H} rough={0.3} seed={`${seed}-o`} />
      <RLine x1={x} y1={y + rowH} x2={x + W} y2={y + rowH} rough={0.3} seed={`${seed}-h`} />
      {xs.slice(1).map((cx, j) => (
        <RLine key={j} x1={cx} y1={y} x2={cx} y2={y + H} rough={0.2} seed={`${seed}-v${j}`} strokeWidth={0.9} />
      ))}
      {CCOLS.map((c, j) => (
        <Txt key={c.key} x={xs[j] + 8} y={y + rowH * 0.68} size={12.5} weight={800}>
          {F.customerCols[c.key]}
        </Txt>
      ))}
      {CUSTOMERS.map((r, i) => (
        <g key={i}>
          {cell(r, i, 'id', 0)}
          <g data-el={`${el}-o${i}`}>{PII.map((k) => cell(r, i, k, CCOLS.findIndex((c) => c.key === k)))}</g>
          {masked && <g data-el={`${el}-m${i}`}>{PII.map((k) => cell(masked[i], i, k, CCOLS.findIndex((c) => c.key === k)))}</g>}
        </g>
      ))}
    </g>
  )
}

/** 테이블(또는 노드)을 둘러싼 12명: 위 6 · 아래 6. 선은 사람 → 대상 */
function crowd(topHead: number, bottomHead: number, topTarget: number, bottomTarget: number, tx0: number, tdx: number) {
  return F.teams.map((team, k) => {
    const top = k < 6
    const j = k % 6
    const px = 40 + j * 72
    const hy = top ? topHead : bottomHead
    const tx = tx0 + j * tdx
    const a: [number, number] = top ? [px, hy + 52] : [px, hy - 12]
    const b: [number, number] = top ? [tx, topTarget] : [tx, bottomTarget]
    return { team, px, hy, a, b, k }
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 돌아가는 미터기, 열린 문
// ─────────────────────────────────────────────────────────────
const BY = 56
const B1 = { x: 20, y: 304, w: 400, h: 56 }
const B1_UP = 40 - B1.y
const CLK = { x: 284, y: BY + 120, r: 20 }
const M2 = { x: 220, y: 282, r: 100 }
const SH = { y: 206, h: 90 }
const BOX_X = (k: number) => 20 + k * 102
const Y4 = 36
const P4 = crowd(Y4 + 64, Y4 + 336, Y4 + 148, Y4 + 282, 56, 66)

export function ProblemFig() {
  const bi = NODE8.bi
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-2" className="col-start-1 row-start-1">
            {F.billingNote}
          </span>
          <span data-el="cap-4" className="col-start-1 row-start-1">
            {F.fakeNote}
          </span>
        </span>
      }
    >
      {/* step 1: 청구서 · 대시보드 · 시계 */}
      <g data-el="s1">
        <RRect x={12} y={BY} w={222} h={170} seed="p-bill" rough={0.4} fill="var(--surface)" />
        <Txt x={26} y={BY + 28} size={14.5} weight={800}>
          {F.bill.title}
        </Txt>
        <Txt x={26} y={BY + 48} size={13} weight={750}>
          {F.bill.sub}
        </Txt>
        {F.bill.rows.map((r, k) => (
          <g key={r}>
            <Txt x={26} y={BY + 78 + k * 34} size={13} weight={600}>
              {r}
            </Txt>
            <rect x={26} y={BY + 84 + k * 34} width={194 * BILL_NOW[k]} height={12} rx={2} style={{ fill: 'var(--ink)', opacity: 0.85 }} />
          </g>
        ))}
        <Node x={338} y={BY + 30} w={172} h={54} label={bi.label} sub={bi.sub} kind="serve" seed="p-bi" />
        <REllipse cx={CLK.x} cy={CLK.y} w={CLK.r * 2} h={CLK.r * 2} rough={0.3} seed="p-clock" fill="var(--surface)" />
        <RLine x1={CLK.x} y1={CLK.y - CLK.r + 1} x2={CLK.x} y2={CLK.y - CLK.r + 6} rough={0.1} seed="p-tick" strokeWidth={2} />
        <Txt x={CLK.x} y={CLK.y - CLK.r - 7} size={12.5} weight={750} anchor="middle">
          {F.timer}
        </Txt>
        <g data-el="hand" data-origin={`${CLK.x} ${CLK.y}`}>
          <line x1={CLK.x} y1={CLK.y} x2={CLK.x} y2={CLK.y - CLK.r + 6} style={{ stroke: 'var(--ink)' }} strokeWidth={2.4} strokeLinecap="round" />
        </g>
        <circle cx={CLK.x} cy={CLK.y} r={2.6} style={{ fill: 'var(--ink)' }} />
        <Txt x={CLK.x + 30} y={CLK.y - 3} size={14} weight={750}>
          {F.refresh[0]}
        </Txt>
        <Txt x={CLK.x + 30} y={CLK.y + 16} size={12.5} muted>
          {F.refresh[1]}
        </Txt>
        <RArrow x1={408} y1={BY + 62} x2={408} y2={B1.y - 8} seed="p-read" rough={0.4} />
      </g>

      {/* 주문 테이블 띠(step 1~2) */}
      <g data-el="band">
        <Txt x={B1.x} y={B1.y - 12} size={14} weight={750}>
          {F.orders}
        </Txt>
        <Band x={B1.x} y={B1.y} w={B1.w} h={B1.h} n={BAND_N} el="b" seed="p-band" />
        <Txt x={B1.x} y={B1.y + B1.h + 20} size={13} muted>
          {F.bandEnds[0]}
        </Txt>
        <Txt x={B1.x + B1.w} y={B1.y + B1.h + 20} size={13} anchor="end" muted>
          {F.bandEnds[1]}
        </Txt>
      </g>

      {/* step 2: 요금 미터기 */}
      <g data-el="s2">
        <Meter x={M2.x} y={M2.y} r={M2.r} label={F.meterQuery} el="mq" high={F.high} seed="p-mq" />
        <Txt x={M2.x} y={M2.y + 64} size={14} weight={650} anchor="middle">
          {F.calc[0]}
        </Txt>
        <Txt x={M2.x} y={M2.y + 90} size={14} weight={650} anchor="middle">
          {F.calc[1]}
        </Txt>
      </g>

      {/* step 3: 비싼 선반 위 상자 넷 */}
      <g data-el="s3">
        <Txt x={16} y={112} size={16} weight={800}>
          {F.fastShelf}
        </Txt>
        <Tag x={16} y={128} w={26} h={16} lines={[]} seed="p-legend" />
        <Txt x={48} y={141} size={13} muted>
          {F.tagTitle}
        </Txt>
        <Meter x={352} y={150} r={52} label={F.meterStorage} el="ms" value={0.86} high={F.high} seed="p-ms" />
        {F.boxes.map((b, k) => (
          <g key={b}>
            <Box x={BOX_X(k)} y={SH.y} w={92} h={SH.h} label={b} seed={`p-box${k}`} labelY={SH.y + 30} />
            <Tag x={BOX_X(k) + 8} y={SH.y + 40} w={76} h={42} lines={F.lookups[k]} el="tag" seed={`p-tag${k}`} />
          </g>
        ))}
        <RRect x={10} y={SH.y + SH.h + 2} w={420} h={10} rough={0.3} seed="p-plank" fill="var(--surface)" />
        <RLine x1={24} y1={SH.y + SH.h + 12} x2={24} y2={SH.y + SH.h + 72} rough={0.3} seed="p-leg1" />
        <RLine x1={416} y1={SH.y + SH.h + 12} x2={416} y2={SH.y + SH.h + 72} rough={0.3} seed="p-leg2" />
      </g>

      {/* step 4: 전사에 열린 고객 테이블 */}
      <g data-el="s4">
        <Txt x={26} y={Y4 + 14} size={15} weight={800}>
          {F.customerTitle}
        </Txt>
        <Lock x={128} y={Y4 + 8} s={0.7} open seed="p-open" />
        <Txt x={146} y={Y4 + 14} size={13.5} weight={750} color="var(--fail)">
          {F.openAll}
        </Txt>
        <CustTable x={26} y={Y4 + 150} el="ct" seed="p-ct" />
      </g>
      {P4.map((p) => (
        <g key={p.k}>
          <g data-el="p4-line">
            <RLine x1={p.a[0]} y1={p.a[1]} x2={p.b[0]} y2={p.b[1]} rough={0.3} seed={`p4l${p.k}`} strokeWidth={1.3} />
          </g>
          <Person x={p.px} y={p.hy} label={p.team} el="p4" seed={`p4p${p.k}`} />
        </g>
      ))}
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const beam = o('b-beam')
  const read = o('b-read')
  const hand = o('hand')[0] as SVGElement | undefined
  const needle = o('mq-needle')[0]
  init(tl, o('s2', 's3', 's4', 'cap-2', 'cap-4', 'p4'), { opacity: 0 })
  init(tl, beam, { opacity: 0, x: 0 })
  init(tl, read, { scaleX: 0, transformOrigin: '0% 50%' })
  init(tl, o('tag'), { opacity: 0, y: -8 })
  const p4Lines = o('p4-line')
  init(tl, strokes(p4Lines), { drawSVG: '0%' })
  if (hand) init(tl, hand, { rotation: 0, svgOrigin: hand.dataset.origin })
  needleInit(tl, needle, 0.12)
  const span = B1.w - 4

  // step 1: 시계 바늘이 '5분'에 닿을 때마다 빛줄기가 띠 전체를 훑는다(세 번)
  for (let k = 0; k < 3; k++) {
    const c = at(0) + k * 0.27
    if (hand) tl.to(hand, { rotation: 360 * (k + 1), svgOrigin: hand.dataset.origin, duration: 0.1, ease: 'none' }, c)
    sweep(tl, beam, read, c + 0.1, 0.14, 0, span)
  }

  // step 2: 띠가 위로 비키고, 한 번 훑을 때마다 미터기 바늘이 한 칸씩
  const s2 = at(1)
  tl.to(o('s1'), { opacity: 0, duration: 0.12 }, s2)
  tl.to(o('band'), { y: B1_UP, duration: 0.22, ease: 'power2.inOut' }, s2 + 0.04)
  tl.to(o('s2', 'cap-2'), { opacity: 1, duration: 0.1 }, s2 + 0.22)
  ;[0.38, 0.64, 0.9].forEach((v, k) => {
    const t = s2 + 0.3 + k * 0.16
    sweep(tl, beam, read, t, 0.11, 0, span)
    needleTo(tl, needle, v, t + 0.11, 0.04)
  })

  // step 3: 비싼 선반 — 꼬리표가 최근(오른쪽)부터 오래된(왼쪽) 순서로 붙는다
  const s3 = at(2)
  tl.to(o('band', 's2', 'cap-2'), { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('s3'), { opacity: 1, duration: 0.1 }, s3 + 0.12)
  const tags = o('tag')
  ;[3, 2, 1, 0].forEach((k, j) => tl.to(tags[k], { opacity: 1, y: 0, duration: 0.07 }, s3 + 0.3 + j * 0.12))

  // step 4: 사람이 한 명씩 나타나고, 고객 테이블로 선이 하나씩 이어진다
  const s4 = at(3)
  tl.to(o('s3'), { opacity: 0, duration: 0.12 }, s4)
  tl.to(o('s4', 'cap-4'), { opacity: 1, duration: 0.1 }, s4 + 0.12)
  const people = o('p4')
  people.forEach((p, k) => {
    const t = s4 + 0.2 + k * 0.048
    tl.to(p, { opacity: 1, duration: 0.03 }, t)
    tl.to(strokes([p4Lines[k]]), { drawSVG: '100%', duration: 0.05, ease: 'none' }, t + 0.02)
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 일단 전부 잠그기
// ─────────────────────────────────────────────────────────────
const LH = { x: 200, y: 246, w: 170, h: 150 }
const LK = { x: 285, y: 262, s: 2 }
const P3 = crowd(56, 392, LH.y - LH.h / 2 - 4, LH.y + LH.h / 2 + 4, 128, 29)
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const WB = { x: 10, y: 160, top: 172, cols: [18, 110, 212, 422] }
const wbRowH = (n: number) => (n === 1 ? 34 : 52)
const WB_ROWS = F.needs.reduce<number[]>((a, _r, i) => [...a, i ? a[i - 1] + wbRowH(F.needs[i - 1].need.length) : WB.top + 30], [])
const LOCK_SMALL = { scale: 0.5, y: -162, origin: '258 240' }
const CARD3 = (k: number) => 186 + k * 82

export function AttemptFig() {
  const lh = NODE8.lakehouse
  return (
    <Fig>
      {/* step 1: 맵 일부 — 레이크하우스와 자물쇠 */}
      <g data-el="lockppl">
        {P3.map((p) => {
          const m1 = lerp(p.a, p.b, 0.5 - 7 / Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]))
          const m2 = lerp(p.a, p.b, 0.5 + 7 / Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]))
          const m = lerp(p.a, p.b, 0.5)
          return (
            <g key={p.k}>
              <RLine x1={p.a[0]} y1={p.a[1]} x2={m1[0]} y2={m1[1]} rough={0.3} seed={`a-o${p.k}`} strokeWidth={1.3} />
              <g data-el="mid">
                <RLine x1={m1[0]} y1={m1[1]} x2={m2[0]} y2={m2[1]} rough={0.1} seed={`a-m${p.k}`} strokeWidth={1.3} />
              </g>
              <g data-el="inner">
                <RLine x1={m2[0]} y1={m2[1]} x2={p.b[0]} y2={p.b[1]} rough={0.3} seed={`a-i${p.k}`} strokeWidth={1.3} />
              </g>
              <Badge x={m[0]} y={m[1]} status="fail" r={7.5} el="cut" />
              <Person x={p.px} y={p.hy} label={p.team} seed={`a-p${p.k}`} />
            </g>
          )
        })}
      </g>
      <g data-el="lockcore">
        <Node x={LH.x} y={LH.y} w={LH.w} h={LH.h} label={lh.label} kind="store" seed="a-lh" bands={['Bronze', 'Silver', 'Gold']} />
        <Lock x={LK.x} y={LK.y} s={LK.s} open el="lock" seed="a-lock" />
        <Txt x={LK.x + 40} y={LK.y + 6} size={16} weight={800} el="lock-l">
          {F.lockAll}
        </Txt>
      </g>
      <Txt x={258} y={140} size={12.5} weight={650} anchor="middle" muted el="not-yet">
        {F.notYet}
      </Txt>

      {/* step 2: 쏟아지는 메시지, 멈춘 일 */}
      <g data-el="mon">
        <RRect x={110} y={24} w={220} h={122} rough={0.35} seed="a-mon" fill="var(--surface)" />
        <RLine x1={220} y1={146} x2={220} y2={164} rough={0.2} seed="a-stand" />
        <RLine x1={196} y1={165} x2={244} y2={165} rough={0.2} seed="a-base" />
        <Txt x={220} y={96} size={13} weight={650} anchor="middle" muted>
          {F.monitor}
        </Txt>
        <g data-el="msg">
          <rect x={238} y={32} width={84} height={24} rx={12} style={{ fill: 'var(--fail)' }} />
          <Txt x={280} y={49} size={12.5} weight={800} anchor="middle" color="var(--bg)" el="msg-n">
            {F.newMessages(4)}
          </Txt>
        </g>
      </g>
      {F.tasks.map((t, k) => (
        <WorkCard key={t.who} x={40} y={CARD3(k)} w={360} initial={PEOPLE[t.who].name.slice(0, 1)} name={PEOPLE[t.who].name} task={t.task} el={`w${k}`} labels={LABELS} seed={`a-w${k}`} />
      ))}

      {/* step 3: 화이트보드 — 누가, 무슨 일, 어떤 데이터 */}
      <g data-el="wb">
        <RRect x={WB.x} y={WB.y} w={420} h={WB_ROWS[3] + wbRowH(2) - WB.y + 14} rough={0.4} seed="a-wb" fill="var(--surface)" />
        {F.boardCols.map((c, j) => (
          <Txt key={c} x={WB.cols[j]} y={WB.top + 20} size={13} weight={800} muted>
            {c}
          </Txt>
        ))}
        <RLine x1={WB.cols[0] - 4} y1={WB.top + 30} x2={WB.cols[3]} y2={WB.top + 30} rough={0.3} seed="a-wb-h" />
      </g>
      {F.needs.map((r, i) => {
        const y0 = WB_ROWS[i]
        const h = wbRowH(r.need.length)
        const mid = y0 + h / 2 + 5
        return (
          <g key={r.who} data-el="wb-row">
            <Txt x={WB.cols[0]} y={mid} size={13.5} weight={750}>
              {r.who}
            </Txt>
            <Txt x={WB.cols[1]} y={mid} size={13.5}>
              {r.task}
            </Txt>
            {r.need.map((l, k) => (
              <Txt key={k} x={WB.cols[2]} y={y0 + 22 + k * 18} size={k ? 12.5 : 13.5} weight={k ? 500 : 650} muted={k > 0}>
                {l}
              </Txt>
            ))}
            {i < F.needs.length - 1 && <RLine x1={WB.cols[0] - 4} y1={y0 + h} x2={WB.cols[3]} y2={y0 + h} rough={0.2} seed={`a-wbr${i}`} strokeWidth={0.8} stroke="var(--muted)" />}
          </g>
        )
      })}
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)
  const sh = o('lock-sh')
  init(tl, o('cut', 'lock-l', 'not-yet', 'mon', 'msg', 'wb', 'wb-row'), { opacity: 0 })
  init(tl, sh, { y: -9 * LK.s })
  const cards = [0, 1, 2].map((k) => o(`w${k}`))
  init(tl, cards.flat(), { opacity: 0 })
  ;[0, 1, 2].forEach((k) => init(tl, o(`w${k}-grey`, `w${k}-wait`, `w${k}-ok`), { opacity: 0 }))
  init(tl, o('cut'), { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' })

  // step 1: 자물쇠가 닫히는 순간 열두 개의 선이 동시에 끊기고 ✕
  const s1 = at(0)
  tl.to(sh, { y: 0, duration: 0.12, ease: 'power2.in' }, s1 + 0.08)
  tl.to(o('mid'), { opacity: 0, duration: 0.03 }, s1 + 0.2)
  tl.to(o('inner'), { opacity: 0.35, duration: 0.06 }, s1 + 0.2)
  tl.to(o('cut'), { opacity: 1, scale: 1, duration: 0.06 }, s1 + 0.2)
  tl.to(o('lock-l'), { opacity: 1, duration: 0.1 }, s1 + 0.3)

  // step 2: 카드가 하나씩 멈추고, 메시지가 4개씩 쌓인다
  const s2 = at(1)
  tl.to(o('lockppl', 'lockcore'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('mon'), { opacity: 1, duration: 0.1 }, s2 + 0.08)
  tl.to(cards.flat(), { opacity: 1, duration: 0.1 }, s2 + 0.12)
  countSteps(tl, o('msg-n')[0], F.newMessages, 4, [
    [8, s2 + 0.44],
    [12, s2 + 0.6],
  ])
  cards.forEach((_, k) => {
    const t = s2 + 0.28 + k * 0.16
    tl.to(o(`w${k}-run`), { opacity: 0, duration: 0.04 }, t)
    tl.to(o(`w${k}-grey`, `w${k}-wait`), { opacity: 1, duration: 0.05 }, t)
    if (k === 0) tl.to(o('msg'), { opacity: 1, duration: 0.04 }, t)
  })

  // step 3: 자물쇠는 닫힌 채 흐려져 뒤로 물러나고, 화이트보드가 한 줄씩 채워진다
  const s3 = at(2)
  tl.to([...o('mon'), ...cards.flat()], { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('lockcore'), { opacity: 0.35, scale: LOCK_SMALL.scale, y: LOCK_SMALL.y, svgOrigin: LOCK_SMALL.origin, duration: 0.2, ease: 'power2.inOut' }, s3 + 0.06)
  tl.to(o('not-yet'), { opacity: 1, duration: 0.08 }, s3 + 0.22)
  tl.to(o('wb'), { opacity: 1, duration: 0.1 }, s3 + 0.14)
  o('wb-row').forEach((r, i) => {
    init(tl, r, { opacity: 0, y: -6 })
    tl.to(r, { opacity: 1, y: 0, duration: 0.08 }, s3 + 0.3 + i * 0.13)
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 비용: 열어 본 만큼 내는 서랍장
// ─────────────────────────────────────────────────────────────
function drawerLayout(mobile: boolean) {
  // 데스크톱은 나란히, 모바일은 위('전부 열기') · 아래('어제 서랍만')로 쌓는다
  if (mobile)
    return {
      cabs: [
        { x: 8, y: 46, title: [12, 34] as const, paid: [428, 34] as const, anchor: 'start' as const },
        { x: 8, y: 270, title: [12, 258] as const, paid: [428, 258] as const, anchor: 'start' as const },
      ],
      w: 424,
      ch: 26,
      size: 13,
    }
  return {
    cabs: [
      { x: 14, y: 96, title: [112, 80] as const, paid: [112, 324] as const, anchor: 'middle' as const },
      { x: 230, y: 96, title: [328, 80] as const, paid: [328, 324] as const, anchor: 'middle' as const },
    ],
    w: 196,
    ch: 32,
    size: 11.5,
  }
}
const C2B = { x: 20, y: 110, w: 400, h: 44 }
const CW = C2B.w / BAND_N
const SKIP_W = CW * (BAND_N - 7)
const ZOOM = { x: 216, y: 196, w: 204, h: 40 }
const MG = { y: 374, r: 80, xs: [112, 328] }
const SH2 = { top: 160, bottom: 312, h: 70 }

export function CostFig() {
  const { mobile } = useEnv()
  const L = drawerLayout(mobile)
  const cw = (L.w - 12) / 5
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-c2" className="col-start-1 row-start-1">
            {F.pricingNote}
          </span>
          <span data-el="cap-c3" className="col-start-1 row-start-1">
            {F.tierNote}
          </span>
        </span>
      }
    >
      {/* step 1: 서랍장 두 개 */}
      <g data-el="drawers">
        {L.cabs.map((c, ci) => (
          <g key={ci}>
            <Txt x={c.title[0]} y={c.title[1]} size={15} weight={800} anchor={c.anchor}>
              {ci ? F.yesterdayOnly : F.openAllDrawers}
            </Txt>
            <Txt x={c.paid[0]} y={c.paid[1]} size={14.5} weight={800} anchor={mobile ? 'end' : 'middle'} el={`paid${ci}`}>
              {F.paid(0)}
            </Txt>
            <RRect x={c.x} y={c.y} w={L.w} h={12 + L.ch * 6} rough={0.35} seed={`c-cab${ci}`} fill="var(--surface)" />
            {F.days.map((d, i) => {
              const x = c.x + 6 + (i % 5) * cw
              const y = c.y + 6 + Math.floor(i / 5) * L.ch
              return (
                <g key={d}>
                  <rect x={x + 1.5} y={y + 1.5} width={cw - 3} height={L.ch - 3} rx={2} style={{ fill: 'none', stroke: 'var(--line)', opacity: 0.5 }} strokeWidth={1} />
                  <g data-el={`open${ci}`}>
                    <rect x={x + 1.5} y={y + 1.5} width={cw - 3} height={L.ch - 3} rx={2} style={{ fill: 'var(--accent)', fillOpacity: 0.42, stroke: 'var(--accent)' }} strokeWidth={2} />
                  </g>
                  <Txt x={x + cw / 2} y={y + L.ch / 2 + L.size * 0.1} size={L.size} weight={d === F.days[29] ? 800 : 550} anchor="middle">
                    {d}
                  </Txt>
                  <line x1={x + cw / 2 - 5} y1={y + L.ch - 4} x2={x + cw / 2 + 5} y2={y + L.ch - 4} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} strokeLinecap="round" />
                </g>
              )
            })}
          </g>
        ))}
      </g>

      {/* step 2: 같은 질문 두 번 — 풀스캔과 파티션 프루닝 */}
      <g data-el="c2">
        <Band x={C2B.x} y={C2B.y} w={C2B.w} h={C2B.h} n={BAND_N} el="cb" seed="c-band" />
        <g data-el="skip">
          <rect x={C2B.x} y={C2B.y} width={SKIP_W} height={C2B.h} style={{ fill: 'var(--wait)', opacity: 0.5 }} />
          <rect x={C2B.x + SKIP_W / 2 - 34} y={C2B.y + C2B.h / 2 - 12} width={68} height={24} rx={12} style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} />
          <Txt x={C2B.x + SKIP_W / 2} y={C2B.y + C2B.h / 2 + 5} size={13} weight={750} anchor="middle">
            {F.skipped}
          </Txt>
        </g>
        <g data-el="read7">
          <rect x={C2B.x + SKIP_W} y={C2B.y} width={C2B.w - SKIP_W} height={C2B.h} style={{ fill: 'var(--accent)', opacity: 0.85 }} />
        </g>
        <Txt x={C2B.x} y={C2B.y + C2B.h + 18} size={13} muted>
          {F.bandEnds[0]}
        </Txt>
        <Txt x={C2B.x + C2B.w - 8} y={C2B.y + C2B.h + 18} size={13} anchor="end" muted>
          {F.bandEnds[1]}
        </Txt>
        <g data-el="zoom">
          <RLine x1={C2B.x + SKIP_W} y1={C2B.y + C2B.h + 2} x2={ZOOM.x} y2={ZOOM.y} rough={0.2} seed="c-z1" strokeWidth={1} />
          <RLine x1={C2B.x + C2B.w} y1={C2B.y + C2B.h + 2} x2={ZOOM.x + ZOOM.w} y2={ZOOM.y} rough={0.2} seed="c-z2" strokeWidth={1} />
          <rect x={ZOOM.x} y={ZOOM.y} width={ZOOM.w} height={ZOOM.h} style={{ fill: 'var(--accent)', opacity: 0.85 }} />
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1={ZOOM.x + (ZOOM.w / 7) * (i + 1)} y1={ZOOM.y + 4} x2={ZOOM.x + (ZOOM.w / 7) * (i + 1)} y2={ZOOM.y + ZOOM.h - 4} style={{ stroke: 'var(--bg)' }} strokeWidth={1.4} />
          ))}
          <RRect x={ZOOM.x} y={ZOOM.y} w={ZOOM.w} h={ZOOM.h} rough={0.2} seed="c-zb" />
          <Txt x={ZOOM.x + ZOOM.w / 2} y={ZOOM.y + ZOOM.h + 20} size={13.5} weight={750} anchor="middle">
            {F.read7}
          </Txt>
        </g>
        <Meter x={MG.xs[0]} y={MG.y} r={MG.r} label={F.fullScan} el="mf" high={F.high} seed="c-mf" />
        <Meter x={MG.xs[1]} y={MG.y} r={MG.r} label={F.pruning} el="mp" high={F.high} seed="c-mp" />
      </g>
      <g data-el="bubble">
        <RPath d="M 100 22 L 420 22 L 420 74 L 402 74 L 404 96 L 382 74 L 100 74 Z" rough={0.3} seed="c-bub" fill="var(--surface)" />
        <Txt x={116} y={42} size={12.5} weight={650} muted>
          {F.queryWho}
        </Txt>
        <Txt x={116} y={63} size={15} weight={800}>
          {F.cond}
        </Txt>
      </g>

      {/* step 3: 선반 두 층 — 빠른 계층과 보관 계층 */}
      <g data-el="c3">
        <Meter x={352} y={102} r={52} label={F.meterStorage} el="ms2" value={0.86} high={F.high} seed="c-ms" />
        <Txt x={34} y={SH2.top - 22} size={15} weight={800}>
          {F.hotTier}
        </Txt>
        <Txt x={34} y={SH2.bottom - 22} size={15} weight={800}>
          {F.coldTier}
        </Txt>
        {[SH2.top, SH2.bottom].map((y, k) => (
          <RRect key={y} x={10} y={y + SH2.h + 2} w={420} h={10} rough={0.3} seed={`c-plank${k}`} fill="var(--surface)" />
        ))}
        <RLine x1={24} y1={SH2.top + SH2.h + 12} x2={24} y2={SH2.bottom + SH2.h + 2} rough={0.3} seed="c-leg1" />
        <RLine x1={416} y1={SH2.top + SH2.h + 12} x2={416} y2={SH2.bottom + SH2.h + 2} rough={0.3} seed="c-leg2" />
        <g data-el="wait-mark">
          <Badge x={BOX_X(3) + 46} y={SH2.bottom + 16} status="wait" r={11} />
          <Txt x={BOX_X(3) + 46} y={SH2.bottom + 46} size={12.5} weight={700} anchor="middle">
            {F.waitWhile[0]}
          </Txt>
          <Txt x={BOX_X(3) + 46} y={SH2.bottom + 62} size={12.5} weight={700} anchor="middle">
            {F.waitWhile[1]}
          </Txt>
        </g>
        {F.boxes.map((b, k) => (
          <Box key={b} x={BOX_X(k)} y={SH2.top} w={92} h={SH2.h} label={b} el="cbox" seed={`c-box${k}`} />
        ))}
      </g>
    </Fig>
  )
}

export const buildCost: SceneBuild = (q, tl) => {
  const o = pick(q)
  init(tl, o('open0', 'open1', 'c2', 'bubble', 'skip', 'read7', 'zoom', 'c3', 'wait-mark', 'cap-c2', 'cap-c3', 'cb-beam'), { opacity: 0 })
  init(tl, o('cb-read'), { scaleX: 0, transformOrigin: '0% 50%' })
  const nf = o('mf-needle')[0]
  const np = o('mp-needle')[0]
  const ns = o('ms2-needle')[0]
  needleInit(tl, nf, 0.03)
  needleInit(tl, np, 0.03)
  needleInit(tl, ns, 0.86)

  // step 1: 왼쪽은 30칸이 차례로 열리며 1→30, 오른쪽은 '어제' 한 칸에서 1
  const s1 = at(0)
  const open0 = o('open0')
  tl.to(open0, { opacity: 1, duration: 0.02, stagger: 0.6 / 30 }, s1 + 0.1)
  countTo(tl, o('paid0')[0], 0, 30, F.paid, s1 + 0.1, 0.6)
  tl.to(o('open1')[29], { opacity: 1, duration: 0.04 }, s1 + 0.12)
  countTo(tl, o('paid1')[0], 0, 1, F.paid, s1 + 0.12, 0.04)

  // step 2: 같은 질문을 두 번 — 처음엔 전체를, 날짜 조건을 단 뒤엔 오른쪽 7칸만
  const s2 = at(1)
  const beam = o('cb-beam')
  const read = o('cb-read')
  tl.to(o('drawers'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('c2'), { opacity: 1, duration: 0.1 }, s2 + 0.08)
  tl.to(o('cap-c2'), { opacity: 1, duration: 0.1 }, s2 + 0.12)
  sweep(tl, beam, read, s2 + 0.22, 0.16, 0, C2B.w - 4)
  needleTo(tl, nf, 0.95, s2 + 0.22, 0.16, 'none')
  tl.to(read, { opacity: 0, duration: 0.04 }, s2 + 0.4)
  tl.to(o('bubble'), { opacity: 1, duration: 0.06 }, s2 + 0.42)
  tl.set(beam, { x: SKIP_W, opacity: 1 }, s2 + 0.5)
  tl.to(beam, { x: C2B.w - 4, duration: 0.06, ease: 'none' }, s2 + 0.5)
  tl.to(o('read7'), { opacity: 1, duration: 0.06 }, s2 + 0.5)
  needleTo(tl, np, 0.07, s2 + 0.5, 0.06, 'none')
  tl.set(beam, { opacity: 0 }, s2 + 0.56)
  tl.to(o('skip'), { opacity: 1, duration: 0.06 }, s2 + 0.58)
  tl.to(o('zoom'), { opacity: 1, duration: 0.08 }, s2 + 0.64)

  // step 3: 오래된 상자부터 하나씩 아래 선반으로, 그때마다 저장 요금이 조금씩
  const s3 = at(2)
  tl.to(o('c2', 'bubble', 'cap-c2'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('c3', 'cap-c3'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  const boxes = o('cbox')
  ;[0.68, 0.5, 0.32].forEach((v, k) => {
    const t = s3 + 0.24 + k * 0.14
    tl.to(boxes[k], { y: SH2.bottom - SH2.top, duration: 0.1, ease: 'power2.inOut' }, t)
    needleTo(tl, ns, v, t + 0.08, 0.05)
  })
  tl.to(o('wait-mark'), { opacity: 1, duration: 0.06 }, s3 + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 보안: 필요한 문만 열리는 출입증
// ─────────────────────────────────────────────────────────────
const DOOR = { y: 104, h: 150, w: 72, x: (k: number) => 16 + k * 84 }
const CARD_START = 34
const CARD_END = 406
const GRID = { x: 12, head: 100, headH: 52, rowH: 68, c0: 116, cw: 100 }
const gridRowY = (i: number) => GRID.head + GRID.headH + i * GRID.rowH
const gridColX = (j: number) => GRID.x + GRID.c0 + j * GRID.cw
const SLOT = { y: 18, h: 40 }
const SCR = { x: 10, y: 46, w: 420, h: 202 }
const ST = { x: 236, y: 300, w: 184, h: 96 }
const PS = { top: 50, headH: 40, rowH: 36, lx: 14, lw: 120, rx: 196, rcols: [72, 60, 98] }

function Door({ k }: { k: number }) {
  const x = DOOR.x(k)
  const y = DOOR.y
  const open = F.doorOpen[k]
  const cx = x + DOOR.w / 2
  return (
    <g>
      <Txt x={cx} y={y - 12} size={14} weight={750} anchor="middle">
        {F.doors[k]}
      </Txt>
      <RRect x={x} y={y} w={DOOR.w} h={DOOR.h} rough={0.35} seed={`s-door${k}`} fill="var(--surface)" />
      <circle cx={x + DOOR.w - 12} cy={y + DOOR.h / 2 + 6} r={3} style={{ fill: 'currentColor' }} />
      {open ? (
        <g data-el="door-open">
          <rect x={x + 3} y={y + 3} width={DOOR.w - 6} height={DOOR.h - 3} style={{ fill: 'var(--bg)' }} />
          <RPath d={`M ${x + 3} ${y + 3} L ${x + 22} ${y + 16} L ${x + 22} ${y + DOOR.h - 12} L ${x + 3} ${y + DOOR.h}`} rough={0.25} seed={`s-leaf${k}`} fill="var(--surface)" />
        </g>
      ) : (
        <g data-el="door-lock">
          <Lock x={cx} y={y + 66} s={0.8} seed={`s-dl${k}`} />
        </g>
      )}
      <g data-el="door-st">
        <StatusMark x={cx - 16} y={y + DOOR.h + 30} status={open ? 'ok' : 'fail'} text={open ? F.opened : F.locked} />
      </g>
    </g>
  )
}

export function SecurityFig() {
  const sora = PEOPLE.sora.name
  const soraCols = Object.keys(F.soraCols) as (keyof typeof F.soraCols)[]
  const rxs = PS.rcols.reduce<number[]>((a, _w, i) => [...a, i ? a[i - 1] + PS.rcols[i - 1] : PS.rx], [])
  const rW = PS.rcols.reduce((a, b) => a + b, 0)
  const tH = PS.headH + PS.rowH * 4
  return (
    <Fig
      caption={
        <span data-el="cap-s3" className="block">
          {F.maskNote}
        </span>
      }
    >
      {/* step 1: 복도의 문 다섯 개와 출입증 */}
      <g data-el="sec1">
        <RLine x1={8} y1={DOOR.y + DOOR.h + 2} x2={432} y2={DOOR.y + DOOR.h + 2} rough={0.3} seed="s-floor" strokeWidth={2} />
        {F.doors.map((_, k) => (
          <Door key={k} k={k} />
        ))}
        <g data-el="pass">
          <RRect x={CARD_START - 32} y={DOOR.y + DOOR.h + 58} w={64} h={46} rough={0.3} seed="s-pass" fill="var(--surface)" />
          <rect x={CARD_START - 8} y={DOOR.y + DOOR.h + 52} width={16} height={8} rx={2} style={{ fill: 'var(--line)' }} />
          <Txt x={CARD_START} y={DOOR.y + DOOR.h + 76} size={11.5} weight={650} anchor="middle" muted>
            {F.badge}
          </Txt>
          <Txt x={CARD_START} y={DOOR.y + DOOR.h + 95} size={14} weight={800} anchor="middle">
            {sora}
          </Txt>
        </g>
      </g>

      {/* step 2: 역할 × 데이터 격자 */}
      <g data-el="grid">
        <rect x={GRID.x} y={GRID.head} width={GRID.c0 + GRID.cw * 3} height={GRID.headH + GRID.rowH * 4} style={{ fill: 'var(--surface)' }} />
        <RRect x={GRID.x} y={GRID.head} w={GRID.c0 + GRID.cw * 3} h={GRID.headH + GRID.rowH * 4} rough={0.3} seed="s-grid" />
        {[0, 1, 2].map((j) => (
          <g key={j}>
            <RLine x1={gridColX(j)} y1={GRID.head} x2={gridColX(j)} y2={gridRowY(4)} rough={0.2} seed={`s-gv${j}`} strokeWidth={0.9} />
            {F.gridCols[j].map((l, k) => (
              <Txt key={k} x={gridColX(j) + GRID.cw / 2} y={GRID.head + (F.gridCols[j].length === 1 ? 31 : 22 + k * 18)} size={13} weight={800} anchor="middle">
                {l}
              </Txt>
            ))}
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <RLine x1={GRID.x} y1={gridRowY(i)} x2={gridColX(3)} y2={gridRowY(i)} rough={0.2} seed={`s-gh${i}`} strokeWidth={i ? 0.9 : 1.4} />
            <Txt x={GRID.x + 10} y={gridRowY(i) + GRID.rowH / 2 + 5} size={13.5} weight={750}>
              {F.gridRows[i]}
            </Txt>
          </g>
        ))}
        <g>
          <rect x={gridColX(2) + 8} y={GRID.head - 30} width={GRID.cw - 16} height={22} rx={11} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
          <Txt x={gridColX(2) + GRID.cw / 2} y={GRID.head - 14.5} size={12.5} weight={750} anchor="middle">
            {F.columnLevel}
          </Txt>
          <RLine x1={gridColX(2) + GRID.cw / 2} y1={GRID.head - 8} x2={gridColX(2) + GRID.cw / 2} y2={GRID.head} rough={0.1} seed="s-tagl" strokeWidth={1.3} />
        </g>
      </g>
      {F.grid.map((row, i) => (
        <g key={i} data-el={`grow${i}`}>
          {row.map((c, j) => {
            const cx = gridColX(j) + GRID.cw / 2
            const cy = gridRowY(i) + GRID.rowH / 2 - (c.note ? (c.note.length === 2 ? 12 : 8) : 0)
            return (
              <g key={j}>
                <StatusMark x={cx - 22} y={cy} status={c.ok ? 'ok' : 'fail'} text={c.ok ? F.allow : F.deny} />
                {c.note?.map((l, k) => (
                  <Txt key={k} x={cx} y={cy + 22 + k * 15} size={11.5} weight={600} anchor="middle" muted>
                    {l}
                  </Txt>
                ))}
              </g>
            )
          })}
        </g>
      ))}
      {F.needs.map((r, i) => (
        <g key={r.who} data-el="snip">
          <rect x={20} y={SLOT.y} width={400} height={SLOT.h} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--accent)' }} strokeWidth={1.6} />
          <Txt x={34} y={SLOT.y + 25} size={13.5} weight={800}>
            {r.who}
          </Txt>
          <Txt x={134} y={SLOT.y + 25} size={13} weight={600}>
            {r.need[0]}
          </Txt>
          <rect data-el="snip-to" data-dy={gridRowY(i) + GRID.rowH / 2 - (SLOT.y + SLOT.h / 2)} width={0} height={0} />
        </g>
      ))}

      {/* step 3: 마스킹 — 보여 줄 때만 가린다 */}
      <g data-el="sec3">
        <RRect x={SCR.x} y={SCR.y} w={SCR.w} h={SCR.h} rough={0.35} seed="s-scr" fill="var(--surface)" />
        <Txt x={SCR.x + 14} y={SCR.y + 26} size={14} weight={800}>
          {F.maskTitle}
        </Txt>
        <RLine x1={SCR.x} y1={SCR.y + 38} x2={SCR.x + SCR.w} y2={SCR.y + 38} rough={0.2} seed="s-scr-l" />
        <CustTable x={22} y={SCR.y + 50} el="mt" seed="s-mt" masked={MASKED} />
        <RRect x={ST.x} y={ST.y} w={ST.w} h={ST.h} rough={0.35} seed="s-st" fill="var(--surface)" />
        <Lock x={ST.x + 26} y={ST.y + 42} s={0.85} seed="s-st-lock" />
        <Txt x={ST.x + 50} y={ST.y + 30} size={13.5} weight={800}>
          {F.storage[0]}
        </Txt>
        <Txt x={ST.x + 50} y={ST.y + 50} size={13} weight={650}>
          {F.storage[1]}
        </Txt>
        <Txt x={ST.x + 50} y={ST.y + 76} size={12.5} muted style={{ fontVariantNumeric: 'tabular-nums' }}>
          {CUSTOMERS[0].phone}
        </Txt>
        <RArrow x1={ST.x + ST.w / 2} y1={ST.y - 4} x2={ST.x + ST.w / 2} y2={SCR.y + SCR.h + 6} seed="s-st-a" rough={0.3} />
        <Txt x={ST.x + ST.w / 2 - 10} y={(ST.y + SCR.y + SCR.h) / 2 + 5} size={12.5} weight={700} anchor="end">
          {F.maskOnShow}
        </Txt>
      </g>

      {/* step 4: 가명처리 — 고객 키로 '같은 고객'만 */}
      <g data-el="sec4">
        <Txt x={PS.lx} y={PS.top - 12} size={14} weight={800} muted>
          {F.original}
        </Txt>
        <Txt x={PS.rx} y={PS.top - 12} size={14} weight={800}>
          {F.soraTable}
        </Txt>
        {/* 원본은 틀만 흐리게, 글자는 읽혀야 하니 불투명한 muted 색으로 물러나 보이게 */}
        <g style={{ opacity: 0.55 }}>
          <rect x={PS.lx} y={PS.top} width={PS.lw} height={tH} style={{ fill: 'var(--surface)' }} />
          <RRect x={PS.lx} y={PS.top} w={PS.lw} h={tH} rough={0.3} seed="s-ps-l" />
          <RLine x1={PS.lx} y1={PS.top + PS.headH} x2={PS.lx + PS.lw} y2={PS.top + PS.headH} rough={0.2} seed="s-ps-lh" />
        </g>
        {F.originalHead.map((l, k) => (
          <Txt key={k} x={PS.lx + 8} y={PS.top + 17 + k * 16} size={11.5} weight={800} muted>
            {l}
          </Txt>
        ))}
        {CUSTOMERS.map((c, i) => (
          <g key={c.id}>
            <Txt x={PS.lx + 8} y={PS.top + PS.headH + i * PS.rowH + 15} size={12.5} weight={650} muted>
              {`${c.id} ${c.name}`}
            </Txt>
            <Txt x={PS.lx + 8} y={PS.top + PS.headH + i * PS.rowH + 30} size={12} muted style={{ fontVariantNumeric: 'tabular-nums' }}>
              {c.phone}
            </Txt>
          </g>
        ))}
        <RArrow x1={PS.lx + PS.lw + 6} y1={PS.top + tH / 2} x2={PS.rx - 8} y2={PS.top + tH / 2} seed="s-ps-a" rough={0.3} />
        <Txt x={(PS.lx + PS.lw + PS.rx) / 2} y={PS.top + tH / 2 - 10} size={13} weight={800} anchor="middle">
          {F.pseudo}
        </Txt>
        <rect x={PS.rx} y={PS.top} width={rW} height={tH} style={{ fill: 'var(--surface)' }} />
        <RRect x={PS.rx} y={PS.top} w={rW} h={tH} rough={0.3} seed="s-ps-r" />
        <RLine x1={PS.rx} y1={PS.top + PS.headH} x2={PS.rx + rW} y2={PS.top + PS.headH} rough={0.2} seed="s-ps-rh" />
        {rxs.slice(1).map((x, j) => (
          <RLine key={j} x1={x} y1={PS.top} x2={x} y2={PS.top + tH} rough={0.2} seed={`s-ps-v${j}`} strokeWidth={0.9} />
        ))}
        {soraCols.map((k, j) => (
          <Txt key={k} x={rxs[j] + 8} y={PS.top + 25} size={12.5} weight={800}>
            {F.soraCols[k]}
          </Txt>
        ))}
        <g data-el="vault">
          <RLine x1={PS.rx + 36} y1={PS.top + tH + 2} x2={PS.rx + 36} y2={PS.top + tH + 46} rough={0.1} seed="s-ps-dash" dash="4 5" strokeWidth={1.6} />
          <RRect x={PS.rx + 18} y={PS.top + tH + 48} w={36} h={36} rough={0.3} seed="s-vault" fill="var(--surface)" />
          <REllipse cx={PS.rx + 36} cy={PS.top + tH + 66} w={16} h={16} rough={0.2} seed="s-vault-d" />
          <RLine x1={PS.rx + 36} y1={PS.top + tH + 66} x2={PS.rx + 41} y2={PS.top + tH + 61} rough={0.1} seed="s-vault-h" strokeWidth={1.4} />
          {F.vault.map((l, k) => (
            <Txt key={k} x={PS.rx + 64} y={PS.top + tH + 60 + k * 17} size={k ? 12 : 13.5} weight={k ? 550 : 800} muted={k === 2}>
              {l}
            </Txt>
          ))}
          {F.rejoin.map((l, k) => (
            <Txt key={k} x={PS.rx + 26} y={PS.top + tH + 20 + k * 17} size={12.5} weight={750} anchor="end" color="var(--fail)">
              {l}
            </Txt>
          ))}
        </g>
        {F.soraRows.map((r, i) => (
          <g key={r.key}>
            <g data-el="ps-mover" data-dx={PS.rx - PS.lx}>
              <Txt x={PS.lx + 8} y={PS.top + PS.headH + i * PS.rowH + 15} size={12.5} weight={650}>
                {`${CUSTOMERS[i].id} ${CUSTOMERS[i].name}`}
              </Txt>
              <Txt x={PS.lx + 8} y={PS.top + PS.headH + i * PS.rowH + 30} size={12}>
                {CUSTOMERS[i].phone}
              </Txt>
            </g>
            <g data-el="ps-key">
              <Txt x={rxs[0] + 8} y={PS.top + PS.headH + i * PS.rowH + 23} size={13} weight={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.key}
              </Txt>
            </g>
            <g data-el="ps-rest">
              <Txt x={rxs[1] + 8} y={PS.top + PS.headH + i * PS.rowH + 23} size={13}>
                {r.orders}
              </Txt>
              <Txt x={rxs[2] + 8} y={PS.top + PS.headH + i * PS.rowH + 23} size={13}>
                {r.reaction}
              </Txt>
            </g>
          </g>
        ))}
        <g data-el="compare">
          <RRect x={14} y={370} w={412} h={84} rough={0.3} seed="s-cmp" fill="var(--surface)" />
          {F.compare.map(([k, v], i) => (
            <Txt key={k} x={28} y={400 + i * 32} size={13.5}>
              <tspan style={{ fontWeight: 800 }}>{k}</tspan> {v}
            </Txt>
          ))}
        </g>
      </g>
    </Fig>
  )
}

export const buildSecurity: SceneBuild = (q, tl) => {
  const o = pick(q)
  init(tl, o('door-open', 'door-lock', 'door-st', 'grid', 'grow0', 'grow1', 'grow2', 'grow3', 'snip', 'sec3', 'cap-s3', 'sec4', 'vault', 'ps-mover', 'ps-key', 'ps-rest', 'compare'), { opacity: 0 })

  // step 1: 출입증이 복도를 지나며 문마다 ✓ 또는 ✕
  const s1 = at(0)
  const travel = 0.72
  const pass = o('pass')
  tl.to(pass, { x: CARD_END - CARD_START, duration: travel, ease: 'none' }, s1 + 0.04)
  const opens = o('door-open')
  const locks = o('door-lock')
  const sts = o('door-st')
  let no = 0
  let nl = 0
  F.doors.forEach((_, k) => {
    const cx = DOOR.x(k) + DOOR.w / 2
    const t = s1 + 0.04 + (travel * (cx - CARD_START)) / (CARD_END - CARD_START)
    tl.to(F.doorOpen[k] ? opens[no++] : locks[nl++], { opacity: 1, duration: 0.04 }, t)
    tl.to(sts[k], { opacity: 1, duration: 0.04 }, t)
  })

  // step 2: 화이트보드의 줄이 같은 역할 행으로 옮겨지고, 필요한 칸만 ✓
  const s2 = at(1)
  tl.to(o('sec1'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('grid'), { opacity: 1, duration: 0.1 }, s2 + 0.08)
  o('snip').forEach((sn, i) => {
    const dy = num(sn.querySelector('[data-el="snip-to"]'), 'dy')
    const t = s2 + 0.18 + i * 0.15
    tl.to(sn, { opacity: 1, duration: 0.03 }, t)
    tl.to(sn, { y: dy, scale: 0.42, svgOrigin: `20 ${SLOT.y + SLOT.h / 2}`, duration: 0.08, ease: 'power2.inOut' }, t + 0.04)
    tl.to(sn, { opacity: 0, duration: 0.03 }, t + 0.1)
    tl.to(o(`grow${i}`), { opacity: 1, duration: 0.04 }, t + 0.1)
  })

  // step 3: 모자이크가 위에서 아래로 덮이며 가운데 글자가 '*'로
  const s3 = at(2)
  tl.to(o('grid', 'grow0', 'grow1', 'grow2', 'grow3'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('sec3', 'cap-s3'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  CUSTOMERS.forEach((_, i) => {
    const mz = o(`mt-mz${i}`)
    init(tl, mz, { opacity: 0, scaleY: 0, transformOrigin: '50% 0%' })
    init(tl, o(`mt-m${i}`), { opacity: 0 })
    const t = s3 + 0.24 + i * 0.13
    tl.to(mz, { opacity: 1, scaleY: 1, duration: 0.08 }, t)
    tl.to(o(`mt-o${i}`), { opacity: 0, duration: 0.03 }, t + 0.04)
    tl.to(o(`mt-m${i}`), { opacity: 1, duration: 0.03 }, t + 0.06)
  })

  // step 4: 원본 행이 하나씩 오른쪽으로 옮겨지며 고객 키로 — 금고로 이어진 점선은 남는다
  const s4 = at(3)
  tl.to(o('sec3', 'cap-s3'), { opacity: 0, duration: 0.1 }, s4)
  tl.to(o('sec4'), { opacity: 1, duration: 0.1 }, s4 + 0.08)
  tl.to(o('vault'), { opacity: 1, duration: 0.08 }, s4 + 0.16)
  const movers = o('ps-mover')
  const keys = o('ps-key')
  const rest = o('ps-rest')
  movers.forEach((m, i) => {
    const t = s4 + 0.28 + i * 0.1
    tl.to(m, { opacity: 0.8, duration: 0.02 }, t)
    tl.to(m, { x: num(m, 'dx'), duration: 0.07, ease: 'power2.inOut' }, t + 0.01)
    tl.to(m, { opacity: 0, duration: 0.02 }, t + 0.07)
    tl.to(keys[i], { opacity: 1, duration: 0.03 }, t + 0.07)
    tl.to(rest[i], { opacity: 1, duration: 0.03 }, t + 0.08)
  })
  tl.to(o('compare'), { opacity: 1, duration: 0.08 }, s4 + 0.72)
}

function num(el: Element | null, key: string) {
  return Number((el as SVGElement | null)?.dataset[key] ?? 0)
}
