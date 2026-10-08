import { ch6 } from '../../content/chapters/ch6'
import { T } from '../../content/map'
import { Badge, Gauge, Node } from '../../components/diagram'
import { Fig, Txt } from '../../components/fig'
import { RArrow, RLine, RPath, RRect } from '../../components/sketch'
import { at, type Q, type SceneBuild } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'

export { SolutionFig, buildSolution } from './solution'

const F = ch6.figures
// 노드 라벨은 map.ts에서(Ch5 끝 · Ch6 끝 상태)
const N5 = Object.fromEntries(mapStateAt(T.ch5).nodes.map((n) => [n.id, n]))
const N6 = Object.fromEntries(mapStateAt(T.ch6).nodes.map((n) => [n.id, n]))

type P = [number, number]
const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
/**
 * 초기 상태. 타임라인 0초의 set은 첫 스크롤 전에는 그려지지 않으므로 DOM에도 바로 적용한다.
 */
const init = (tl: gsap.core.Timeline, targets: Element[], vars: gsap.TweenVars) => {
  if (!targets.length) return
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}
/** 글자 폭 어림(한글 1em, 라틴 0.6em, 공백 0.3em) */
const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : c === ' ' ? size * 0.3 : size * 0.6), 0)

/** 점 목록을 따라 움직인다. origin = 요소가 그려진 자리(기본은 pts[0]). 끝나는 시각을 돌려준다 */
function flow(tl: gsap.core.Timeline, el: Element | undefined, pts: P[], t: number, dur: number, origin: P = pts[0]) {
  if (!el) return t
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, b) => a + b, 0) || 1
  let tt = t
  pts.slice(1).forEach((p, i) => {
    const d = (dur * seg[i]) / total
    tl.to(el, { x: p[0] - origin[0], y: p[1] - origin[1], duration: d, ease: 'none' }, tt)
    tt += d
  })
  return tt
}

/**
 * 한 요소의 글자를 시각마다 바꾼다(카운터·시계). 값 하나를 공유하는 짧은 트윈을 이어 붙여,
 * 앞뒤로 스크럽해도 그 시각의 값이 된다. seq[0]은 처음 값.
 */
function textSteps(tl: gsap.core.Timeline, el: Element | undefined, fmt: (n: number) => string, seq: [number, number][]) {
  if (!el) return
  const o = { v: seq[0][0] }
  el.textContent = fmt(o.v)
  for (const [v, t] of seq.slice(1)) tl.to(o, { v, duration: 0.02, ease: 'none', onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, t)
}

/** 입자 칩: 강조색 바탕 + 흰 글자(한 줄 또는 두 줄) */
function Chip({ x, y, w, h, lines, el, size = 12.5, faded }: { x: number; y: number; w: number; h: number; lines: string[]; el?: string; size?: number; faded?: boolean }) {
  return (
    <g data-el={el} style={faded ? { opacity: 0.35 } : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={5} style={{ fill: 'var(--accent)' }} />
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 + size * 0.36 + (i - (lines.length - 1) / 2) * (size + 2)}
          textAnchor="middle"
          className="t-sans"
          style={{ fontSize: size, fontWeight: 750, fill: '#fff' }}
        >
          {l}
        </text>
      ))}
    </g>
  )
}

/** 작은 꼬리표: 테두리 둥근 상자 + 글자 */
function Tag({ x, y, text, el, size = 12.5, anchor = 'start', color }: { x: number; y: number; text: string; el?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  const w = tw(text, size) + 16
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w
  return (
    <g data-el={el}>
      <rect x={x0} y={y - size - 4} width={w} height={size + 11} rx={(size + 11) / 2} style={{ fill: 'var(--surface)', stroke: color ?? 'var(--edge)' }} strokeWidth={1.4} />
      <Txt x={x0 + w / 2} y={y} size={size} weight={700} anchor="middle" color={color}>
        {text}
      </Txt>
    </g>
  )
}

const triDown = (cx: number, tip: number, s = 6) => `M ${cx - s} ${tip - s * 1.5} L ${cx + s} ${tip - s * 1.5} L ${cx} ${tip} Z`

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 다음 날 아침에야 아는 일
// ─────────────────────────────────────────────────────────────
const PB = {
  app: { x: 62, y: 64, w: 112 },
  etl: { x: 222, y: 64, w: 132 },
  bi: { x: 380, y: 64, w: 108 },
  nh: 54,
  axisY: 404,
  ax0: 40,
  ax1: 400,
  H: 19,
  wait: { x: 14, y: 132, w: 190, h: 196 },
}
const tx = (h: number) => PB.ax0 + (h / PB.H) * (PB.ax1 - PB.ax0)
const slotY = (k: number) => PB.wait.y + PB.wait.h - 20 - k * 20
const DOT_X = 32
const lumpAt = (k: number): P => [350 + (k % 4) * 15, 114 + Math.floor(k / 4) * 15]
const APP_OUT: P = [PB.app.x, PB.app.y + PB.nh / 2 + 4]
/** step 1에서 커서가 멈추는 자리(화 03:00 바로 앞) */
const CUR1 = 12.9
const BURST = 0.07 // 14:04까지(첫 다섯 건)
const ST = { x: 16, y: 186, cols: [96, 116, 92, 104], hh: 52, rh: 44 }
const stX = (j: number) => ST.x + ST.cols.slice(0, j).reduce((a, b) => a + b, 0)
const ST_W = ST.cols.reduce((a, b) => a + b, 0)

export function ProblemFig() {
  const { app, etl, bi } = N5
  const rowTop = (i: number) => ST.y + ST.hh + i * ST.rh
  return (
    <Fig caption={F.fakeNote} captionEl="cap">
      <g data-el="s12">
        <RArrow x1={PB.app.x + PB.app.w / 2 + 3} y1={PB.app.y} x2={PB.etl.x - PB.etl.w / 2 - 5} y2={PB.etl.y} seed="pb-e1" rough={0.5} />
        <RArrow x1={PB.etl.x + PB.etl.w / 2 + 3} y1={PB.etl.y} x2={PB.bi.x - PB.bi.w / 2 - 5} y2={PB.bi.y} seed="pb-e2" rough={0.5} />
        <Node x={PB.app.x} y={PB.app.y} w={PB.app.w} h={PB.nh} label={app.label} sub={app.sub} kind="source" seed="pb-app" />
        <Node x={PB.etl.x} y={PB.etl.y} w={PB.etl.w} h={PB.nh} label={etl.label} sub={etl.sub} kind="process" seed="pb-etl" el="etl" statuses={['wait', 'ok']} />
        <Node x={PB.bi.x} y={PB.bi.y} w={PB.bi.w} h={PB.nh} label={bi.label} sub={bi.sub} kind="serve" seed="pb-bi" />
        <Tag x={PB.etl.x} y={117} text={F.nextRun} anchor="middle" el="next-run" />
        <g data-el="wait">
          <RRect x={PB.wait.x} y={PB.wait.y} w={PB.wait.w} h={PB.wait.h} seed="pb-wait" rough={0.4} dash="6 5" />
          <Txt x={PB.wait.x + 12} y={PB.wait.y + 20} size={13} weight={700} muted>
            {F.waitBox}
          </Txt>
        </g>
        <Tag x={6} y={117} text={F.shipped} el="shipped" />

        {/* 타임라인 */}
        <RLine x1={26} y1={PB.axisY} x2={414} y2={PB.axisY} seed="pb-axis" rough={0.35} />
        {F.ticks.map((t) => (
          <g key={t.label}>
            <RLine x1={tx(t.h)} y1={PB.axisY - 6} x2={tx(t.h)} y2={PB.axisY + 6} seed={`pb-t${t.h}`} rough={0.2} />
            <Txt x={tx(t.h)} y={PB.axisY + 36} size={13} weight={650} anchor="middle" mono>
              {t.label}
            </Txt>
          </g>
        ))}
        <g data-el="bracket">
          <RPath
            d={`M ${tx(1 / 60)} ${PB.axisY - 14} L ${tx(1 / 60)} ${PB.axisY - 22} L ${tx(PB.H)} ${PB.axisY - 22} L ${tx(PB.H)} ${PB.axisY - 14}`}
            seed="pb-br"
            rough={0.3}
            strokeWidth={2}
          />
        </g>
        <g data-el="bracket-lbl">
          <Txt x={tx(0)} y={PB.axisY - 30} size={12.5} weight={650}>
            {F.happened}
          </Txt>
          <Txt x={(tx(0) + tx(PB.H)) / 2} y={PB.axisY - 30} size={14} weight={800} anchor="middle">
            {F.gap}
          </Txt>
          <Txt x={tx(PB.H)} y={PB.axisY - 30} size={12.5} weight={650} anchor="end">
            {F.found}
          </Txt>
        </g>
        <g data-el="report">
          <RRect x={238} y={146} w={196} h={92} seed="pb-rep" rough={0.45} fill="var(--surface)" />
          <Txt x={252} y={174} size={14.5} weight={800}>
            {F.report[0]}
          </Txt>
          <Txt x={252} y={200} size={13}>
            {F.report[1]}
          </Txt>
          <Txt x={252} y={224} size={13} weight={700}>
            {F.report[2]}
          </Txt>
        </g>
        {F.payments.map((p, k) => (
          <g key={k}>
            <circle
              data-el="pay-dot"
              data-ax={APP_OUT[0] - DOT_X}
              data-ay={APP_OUT[1] - slotY(k)}
              data-lx={lumpAt(k)[0] - DOT_X}
              data-ly={lumpAt(k)[1] - slotY(k)}
              cx={DOT_X}
              cy={slotY(k)}
              r={5.5}
              style={{ fill: 'var(--accent)' }}
            />
            <Txt x={DOT_X + 13} y={slotY(k) + 4.5} size={12.5} mono el="pay-lbl">
              {p.label}
            </Txt>
          </g>
        ))}
        <g data-el="cursor">
          <line x1={tx(0)} y1={PB.axisY - 9} x2={tx(0)} y2={PB.axisY + 9} style={{ stroke: 'var(--ink)' }} strokeWidth={2.4} />
          <path d={`M ${tx(0) - 6} ${PB.axisY + 19} L ${tx(0) + 6} ${PB.axisY + 19} L ${tx(0)} ${PB.axisY + 10} Z`} style={{ fill: 'var(--ink)' }} />
        </g>
      </g>

      {/* step 3: 타임세일 재고 표 */}
      <g data-el="stock">
        <Txt x={ST.x} y={ST.y - 18} size={16} weight={800}>
          {F.stockTitle}
        </Txt>
        <rect x={ST.x} y={ST.y} width={ST_W} height={ST.hh + ST.rh * 3} style={{ fill: 'var(--surface)' }} />
        <rect data-el="towel-hl" x={ST.x} y={rowTop(0)} width={ST_W} height={ST.rh} style={{ fill: 'var(--fail)', fillOpacity: 0.14 }} />
        <RRect x={ST.x} y={ST.y} w={ST_W} h={ST.hh + ST.rh * 3} seed="pb-st" rough={0.4} />
        {[0, 1, 2].map((i) => (
          <RLine key={i} x1={ST.x} y1={rowTop(i)} x2={ST.x + ST_W} y2={rowTop(i)} seed={`pb-st-h${i}`} rough={0.3} strokeWidth={i ? 0.9 : 1.4} />
        ))}
        {[1, 2, 3].map((j) => (
          <RLine key={j} x1={stX(j)} y1={ST.y} x2={stX(j)} y2={ST.y + ST.hh + ST.rh * 3} seed={`pb-st-v${j}`} rough={0.3} strokeWidth={0.9} />
        ))}
        <Txt x={stX(0) + 10} y={ST.y + 31} size={13} weight={750}>
          {F.stockCols.product}
        </Txt>
        {[F.stockCols.screen, F.stockCols.real].map((c, k) => (
          <g key={k}>
            <Txt x={stX(k + 1) + 9} y={ST.y + 23} size={13} weight={750}>
              {c[0]}
            </Txt>
            <Txt x={stX(k + 1) + 9} y={ST.y + 41} size={11.5} muted>
              {c[1]}
            </Txt>
          </g>
        ))}
        {F.stockRows.map((r, i) => (
          <g key={r.name}>
            <Txt x={stX(0) + 10} y={rowTop(i) + 28} size={14} weight={600}>
              {r.name}
            </Txt>
            <Txt x={stX(2) - 16} y={rowTop(i) + 28} size={15} anchor="end" mono>
              {String(r.screen)}
            </Txt>
            <Txt x={stX(3) - 16} y={rowTop(i) + 28} size={15} weight={750} anchor="end" mono el={`real-${i}`}>
              {String(r.screen)}
            </Txt>
          </g>
        ))}
        <g data-el="towel-x">
          <Badge x={stX(3) + 18} y={rowTop(0) + 22} status="fail" r={10} />
          <Txt x={stX(3) + 34} y={rowTop(0) + 18} size={12.5} weight={750}>
            {F.soldOutAd[0]}
          </Txt>
          <Txt x={stX(3) + 34} y={rowTop(0) + 34} size={12.5} weight={750}>
            {F.soldOutAd[1]}
          </Txt>
        </g>
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const dots = o('pay-dot')
  const lbls = o('pay-lbl')
  const cursor = o('cursor')
  const shift = (h: number) => tx(h) - tx(0)
  init(tl, [...o('etl:ok'), ...o('report'), ...o('bracket-lbl'), ...o('shipped'), ...o('cap'), ...o('stock'), ...o('towel-hl'), ...o('towel-x'), ...lbls], { opacity: 0 })
  init(tl, o('etl:wait'), { opacity: 1 })
  const bracket = q('[data-el="bracket"] path')
  init(tl, bracket, { drawSVG: '0%' })

  // step 1: 커서가 월 14:00 → 화 03:00 직전까지. 결제가 생길 때마다 대기 칸에 쌓인다
  const s1 = at(0)
  const tAt = (h: number) => (h <= BURST ? s1 + 0.02 + (h / BURST) * 0.15 : s1 + 0.17 + ((h - BURST) / (CUR1 - BURST)) * 0.6)
  tl.to(cursor, { x: shift(BURST), duration: 0.15, ease: 'none' }, s1 + 0.02)
  tl.to(cursor, { x: shift(CUR1), duration: 0.6, ease: 'none' }, s1 + 0.17)
  let prev = -1
  dots.forEach((d, k) => {
    const el = d as SVGElement
    init(tl, [d], { x: Number(el.dataset.ax), y: Number(el.dataset.ay), opacity: 0 })
    let t = tAt(F.payments[k].h)
    if (t <= prev) t = prev + 0.022
    prev = t
    tl.to(d, { opacity: 1, duration: 0.01 }, t)
    tl.to(d, { x: 0, y: 0, duration: 0.05, ease: 'power2.inOut' }, t)
    tl.to(lbls[k], { opacity: 1, duration: 0.02 }, t + 0.05)
  })

  // step 2: 03:00에 배치가 돌고(⏸ → ✓) 8건이 한 덩어리로 대시보드로. 09:00에 리포트
  const s2 = at(1)
  tl.to(cursor, { x: shift(13), duration: 0.04, ease: 'none' }, s2)
  tl.to(o('etl:wait'), { opacity: 0, duration: 0.02 }, s2 + 0.04)
  tl.to(o('etl:ok'), { opacity: 1, duration: 0.02 }, s2 + 0.05)
  tl.to(o('next-run'), { opacity: 0, duration: 0.05 }, s2 + 0.04)
  tl.to(lbls, { opacity: 0, duration: 0.05 }, s2 + 0.06)
  dots.forEach((d) => {
    const el = d as SVGElement
    tl.to(d, { x: Number(el.dataset.lx), y: Number(el.dataset.ly), duration: 0.18, ease: 'power2.inOut' }, s2 + 0.09)
  })
  tl.to(o('wait'), { opacity: 0, duration: 0.06 }, s2 + 0.24)
  tl.to(o('shipped'), { opacity: 1, duration: 0.06 }, s2 + 0.3)
  tl.to(cursor, { x: shift(PB.H), duration: 0.24, ease: 'none' }, s2 + 0.3)
  tl.to(o('report'), { opacity: 1, duration: 0.06 }, s2 + 0.55)
  tl.to(bracket, { drawSVG: '100%', duration: 0.14, ease: 'none' }, s2 + 0.58)
  tl.to(o('bracket-lbl'), { opacity: 1, duration: 0.06 }, s2 + 0.7)
  tl.to(o('cap'), { opacity: 1, duration: 0.06 }, s2 + 0.62)

  // step 3: 화면 속 재고는 그대로, 실제 재고만 줄어든다
  const s3 = at(2)
  tl.to([...o('s12'), ...o('cap')], { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('stock'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  F.stockRows.forEach((r, i) => {
    const el = o(`real-${i}`)[0]
    if (!el) return
    const v = { n: r.screen }
    tl.to(v, { n: r.real, duration: 0.44, ease: 'none', onUpdate: () => (el.textContent = String(Math.round(v.n))) }, s3 + 0.16)
  })
  tl.to([...o('towel-hl'), ...o('towel-x')], { opacity: 1, duration: 0.05 }, s3 + 0.61)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 배치를 1분마다 돌리면?
// ─────────────────────────────────────────────────────────────
const AT = { rowY: (r: number) => 112 + r * 30, barH: 22, axisY: 252, mx: (m: number) => 72 + m * 63 }
const OVERLAPS: [number, number, number, number][] = [
  [0, 1, 1, 4 / 3],
  [1, 2, 2, 8 / 3],
  [2, 3, 3, 4],
]
const NEEDLE = [0.12, 0.42, 0.64, 0.88]
const GA = { x: 246, y: 358, r: 46 }
const angle = (v: number) => -90 + v * 180
const TAG = { x: 236, y: 64, size: 16 }

export function AttemptFig() {
  const { mobile } = useEnv()
  const oldW = tw(F.scheduleOld, TAG.size)
  const newX = TAG.x + oldW + 34
  return (
    <Fig
      caption={F.microNote}
      captionEl="cap"
    >
      {/* step 1: 배치 노드와 스케줄 */}
      <Node x={112} y={52} w={196} h={60} label={N5.etl.label} kind="process" seed="at-etl" scale={1.12} />
      <Txt x={TAG.x} y={36} size={12.5} weight={650} muted>
        {F.scheduleLabel}
      </Txt>
      <Txt x={TAG.x} y={TAG.y} size={TAG.size} weight={650} mono>
        {F.scheduleOld}
      </Txt>
      <g data-el="strike">
        <line x1={TAG.x - 3} y1={TAG.y - 5.5} x2={TAG.x + oldW + 3} y2={TAG.y - 5.5} style={{ stroke: 'var(--fail)' }} strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <Txt x={TAG.x + oldW + 10} y={TAG.y} size={15} weight={700} el="to-new">
        →
      </Txt>
      <text x={newX} y={TAG.y} className="t-sans" style={{ fontSize: TAG.size, fontWeight: 800 }}>
        {Array.from(F.scheduleNew).map((c, i) => (
          <tspan key={i} data-el="type-ch">
            {c}
          </tspan>
        ))}
      </text>

      {/* 간트 막대 */}
      {F.jobs.map((j, r) => (
        <Txt key={j.label} x={8} y={AT.rowY(r) + 16} size={13} weight={700} el="job-lbl">
          {j.label}
        </Txt>
      ))}
      {F.jobs.map((j, r) => (
        <g key={r} data-el="bar">
          <rect x={AT.mx(j.start)} y={AT.rowY(r)} width={AT.mx(j.end) - AT.mx(j.start)} height={AT.barH} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} />
        </g>
      ))}
      {OVERLAPS.map(([r0, r1, m0, m1], k) => (
        <g key={k} data-el={`hatch-${k}`}>
          {[r0, r1].map((r) => (
            <RRect key={r} x={AT.mx(m0)} y={AT.rowY(r)} w={AT.mx(m1) - AT.mx(m0)} h={AT.barH} seed={`at-h${k}${r}`} rough={0.25} stroke="var(--fail)" fill="var(--fail)" fillStyle="hachure" strokeWidth={1.2} />
          ))}
        </g>
      ))}
      {OVERLAPS.map(([r0, r1, m0, m1], k) => (
        <rect
          key={k}
          data-el={`ovr-${k}`}
          x={AT.mx(m0) - 4}
          y={AT.rowY(r0) - 4}
          width={AT.mx(m1) - AT.mx(m0) + 8}
          height={AT.rowY(r1) + AT.barH - AT.rowY(r0) + 8}
          rx={4}
          style={{ fill: 'none', stroke: 'var(--accent)' }}
          strokeWidth={2.6}
        />
      ))}
      {F.jobs.map((j, r) => {
        const x = AT.mx(j.end) + 6
        const cy = AT.rowY(r) + AT.barH / 2
        return j.took ? (
          <g key={r} data-el="took">
            <Txt x={x} y={cy + 4.5} size={12.5} weight={650}>
              {j.took}
            </Txt>
            <Badge x={x + tw(j.took, 12.5) + 13} y={cy} status="ok" r={9} />
          </g>
        ) : (
          <g key={r} data-el="took">
            <Txt x={AT.mx(4) + 5} y={cy + 4.5} size={12} weight={750} color="var(--fail)">
              {F.timeout}
            </Txt>
            <Badge x={AT.mx(5) + 13} y={cy} status="fail" r={9} />
          </g>
        )
      })}

      {/* 가로축 14:00~14:05 + 1분마다 실행 표시 */}
      <g data-el="axis">
        <RLine x1={60} y1={AT.axisY} x2={AT.mx(5) + 12} y2={AT.axisY} seed="at-axis" rough={0.3} />
        {F.minutes.map((m, i) => (
          <g key={m}>
            <RLine x1={AT.mx(i)} y1={AT.axisY - 5} x2={AT.mx(i)} y2={AT.axisY + 5} seed={`at-tk${i}`} rough={0.2} />
            {(!mobile || F.minutesMobile.includes(i)) && (
              <Txt x={AT.mx(i)} y={AT.axisY + 22} size={12.5} anchor="middle" mono>
                {m}
              </Txt>
            )}
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} data-el="run" d={`M ${AT.mx(i) - 4} ${AT.axisY - 19} L ${AT.mx(i) + 6} ${AT.axisY - 13} L ${AT.mx(i) - 4} ${AT.axisY - 7} Z`} style={{ fill: 'var(--ink)' }} />
        ))}
      </g>

      {/* step 3: 운영 DB와 부하 게이지 */}
      <g data-el="db">
        <Node x={86} y={322} w={150} h={60} label={N5.oltp.label} sub={N5.oltp.sub} kind="store" seed="at-db" />
        <Gauge x={GA.x} y={GA.y} r={GA.r} label={F.load} el="gauge" value={NEEDLE[0]} seed="at-g" />
        <Txt x={GA.x - GA.r - 7} y={GA.y + 14} size={12} anchor="end" muted>
          {F.zones[0]}
        </Txt>
        <Txt x={GA.x} y={GA.y - GA.r - 10} size={12} anchor="middle" muted>
          {F.zones[1]}
        </Txt>
        <Txt x={GA.x + GA.r + 7} y={GA.y + 14} size={12} weight={700} color="var(--fail)">
          {F.zones[2]}
        </Txt>
      </g>
      <g data-el="slow">
        <Badge x={170} y={405} status="fail" r={10} />
        <Txt x={186} y={410} size={13.5} weight={750}>
          {F.slow}
        </Txt>
      </g>
      <g data-el="found">
        <Txt x={338} y={322} size={13.5} weight={700}>
          {F.foundIn[0]}
        </Txt>
        <Txt x={338} y={341} size={13.5} weight={700}>
          {F.foundIn[1]}
        </Txt>
        <Txt x={338} y={374} size={24} weight={800}>
          {F.foundIn[2]}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)
  const chars = o('type-ch')
  const runs = o('run')
  const bars = o('bar')
  const took = o('took')
  const hatches = OVERLAPS.map((_, k) => o(`hatch-${k}`)[0])
  const rings = OVERLAPS.map((_, k) => o(`ovr-${k}`)[0])
  init(tl, [...o('to-new'), ...o('job-lbl'), ...runs, ...took, ...hatches, ...rings, ...o('db'), ...o('slow'), ...o('found'), ...o('cap')], { opacity: 0 })
  init(tl, chars, { fillOpacity: 0 })
  init(tl, q('[data-el="strike"] line'), { drawSVG: '0%' })
  init(tl, bars, { scaleX: 0, transformOrigin: '0% 50%' })
  const needle = o('gauge-needle')[0] as SVGElement | undefined
  const origin = needle?.dataset.origin ?? `${GA.x} ${GA.y}`
  if (needle) init(tl, [needle], { rotation: angle(NEEDLE[0]), svgOrigin: origin })

  // step 1: '매일 03:00'에 취소선, '1분마다'가 한 글자씩. 1분마다 ▶
  const s1 = at(0)
  tl.to(q('[data-el="strike"] line'), { drawSVG: '100%', duration: 0.12, ease: 'none' }, s1 + 0.06)
  tl.to(o('to-new'), { opacity: 1, duration: 0.04 }, s1 + 0.2)
  tl.to(chars, { fillOpacity: 1, duration: 0.01, stagger: 0.06, ease: 'none' }, s1 + 0.24)
  runs.forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.03 }, s1 + 0.48 + i * 0.07))

  // step 2: 막대가 시작 눈금에서 자란다. 다음 막대가 끝나기 전에 시작하면 겹친 구간에 빗금
  const s2 = at(1)
  const tB = (m: number) => s2 + 0.04 + m * 0.13
  tl.to(o('job-lbl'), { opacity: 1, duration: 0.04 }, s2)
  F.jobs.forEach((j, r) => {
    tl.to(bars[r], { scaleX: 1, duration: tB(j.end) - tB(j.start), ease: 'none' }, tB(j.start))
    tl.to(took[r], { opacity: 1, duration: 0.03 }, tB(j.end))
  })
  OVERLAPS.forEach(([, , , m1], k) => tl.to(hatches[k], { opacity: 1, duration: 0.04 }, tB(m1) - 0.02))

  // step 3: 겹쳐 돌 때마다 게이지가 한 칸씩. 끝에 응답 느려짐과 '1분 40초'
  const s3 = at(2)
  tl.to(o('db'), { opacity: 1, duration: 0.08 }, s3)
  tl.to(o('cap'), { opacity: 1, duration: 0.08 }, s3 + 0.04)
  OVERLAPS.forEach((_, k) => {
    const t = s3 + 0.14 + k * 0.14
    tl.to(rings[k], { opacity: 1, duration: 0.03 }, t)
    if (needle) tl.to(needle, { rotation: angle(NEEDLE[k + 1]), svgOrigin: origin, duration: 0.08 }, t + 0.02)
    tl.to(rings[k], { opacity: 0, duration: 0.03 }, t + 0.12)
  })
  tl.to(o('slow'), { opacity: 1, duration: 0.06 }, s3 + 0.6)
  tl.to(o('found'), { opacity: 1, duration: 0.06 }, s3 + 0.68)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 양동이와 수도꼭지, 이벤트 브로커
// ─────────────────────────────────────────────────────────────
const PANEL = [8, 248]
const P1 = { cy: 110, x0: 84, x1: 334, sink: 382, axisY: 196, ax0: 140, ax1: 416 }
const S1 = { t0: 0.04, span: 0.64, end: 0.8 }
const axX = (dt: number) => P1.ax0 + (dt / S1.end) * (P1.ax1 - P1.ax0 - 18)
const dropAt = (k: number): P => [70 + (k % 4) * 15, 144 - Math.floor(k / 4) * 15]
/** 한꺼번에 옮겨진 물방울이 멈추는 자리(쓰는 곳 바로 앞, 정지 그림에도 남는다) */
const lumpAt1 = (k: number): P => [286 + (k % 4) * 10, P1.cy - 10 + Math.floor(k / 4) * 10]

const CELL = { w: 28, h: 34, x0: 20 }
const cellX = (n: number) => CELL.x0 + (n - 1) * CELL.w
const PAY_Y = 176
const CART_Y = 244
const APP_B: P = [360, 78]
const CONS = { y: 362, fraud: 112, lake: 330, w: 196 }
const MK = { fraud: 174, lake: 156 }

const LANE = { y: (i: number) => 150 + i * 60, x: 18, w: 188, h: 32 }
const SLOT_X = (s: number) => 162 - s * 42
const WK = { x: 232, w: 66 }
const ORD = { x: (k: number) => 302 + k * 45, y: 228, w: 36, h: 22 }
/** 레인에 들어오는 순서: [레인, 자리] */
const ARRIVE: [number, number][] = [
  [1, 0],
  [0, 0],
  [2, 0],
  [1, 1],
  [0, 1],
  [1, 2],
]
/** 워커에 닿는 시각(step 시작 기준): 레인마다 제 속도 */
const READ_T: Record<string, number> = { '1-0': 0.44, '0-0': 0.46, '2-0': 0.52, '1-1': 0.54, '0-1': 0.62, '1-2': 0.64 }

function Bucket({ y0 }: { y0: number }) {
  return (
    <g>
      <RPath d={`M 48 ${y0 + 68} Q 90 ${y0 + 26} 132 ${y0 + 68}`} seed="bk-h" rough={0.4} />
      <RPath d={`M 44 ${y0 + 70} L 58 ${y0 + 156} Q 90 ${y0 + 164} 122 ${y0 + 156} L 136 ${y0 + 70}`} seed="bk-b" rough={0.45} />
      <RLine x1={40} y1={y0 + 70} x2={140} y2={y0 + 70} seed="bk-r" rough={0.4} strokeWidth={2} />
    </g>
  )
}

function Tap({ y0 }: { y0: number }) {
  const cy = y0 + P1.cy
  return (
    <g>
      <RLine x1={40} y1={cy - 26} x2={40} y2={cy - 11} seed="tap-s" rough={0.3} strokeWidth={2} />
      <RLine x1={28} y1={cy - 26} x2={52} y2={cy - 26} seed="tap-hd" rough={0.3} strokeWidth={2.4} />
      <RRect x={14} y={cy - 11} w={68} h={22} seed="tap-b" rough={0.4} fill="var(--surface)" />
      <RLine x1={82} y1={cy - 8} x2={P1.x1} y2={cy - 8} seed="pipe-a" rough={0.35} />
      <RLine x1={82} y1={cy + 8} x2={P1.x1} y2={cy + 8} seed="pipe-b" rough={0.35} />
    </g>
  )
}

function Folder({ x, y, w = 22, h = 16, seed }: { x: number; y: number; w?: number; h?: number; seed: string }) {
  return <RPath d={`M ${x} ${y + 3} L ${x + w * 0.4} ${y + 3} L ${x + w * 0.5} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`} seed={seed} rough={0.3} fill="var(--surface)" />
}

function Cell({ n, y, el, show = true }: { n: number; y: number; el: string; show?: boolean }) {
  const x = cellX(n)
  return (
    <g data-el={el} data-n={n} style={show ? undefined : { opacity: 0 }}>
      <rect x={x} y={y} width={CELL.w} height={CELL.h} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.2} />
      <rect x={x + CELL.w / 2 - 5} y={y + 6} width={10} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />
      <text x={x + CELL.w / 2} y={y + 30} textAnchor="middle" style={{ fontSize: 13 }}>
        {n}
      </text>
    </g>
  )
}

function Marker({ el, cx, tip, label }: { el: string; cx: number; tip: number; label: string }) {
  return (
    <g data-el={el}>
      <path d={triDown(cx, tip)} style={{ fill: 'var(--ink)' }} />
      <Txt x={cx - 10} y={tip - 1} size={12.5} weight={750} anchor="end">
        {label}
      </Txt>
    </g>
  )
}

export function BrokerFig() {
  const { mobile } = useEnv()
  const n = mobile ? 4 : 12 // 입자 수 한도(모바일 ≤ 24): 물방울·기차(2n)·도착 점 2줄 = 5n
  const gap = (P1.x1 - P1.x0) / n
  const ids = Array.from({ length: n }, (_, k) => k)
  return (
    <Fig>
      {/* step 1: 양동이와 수도꼭지 */}
      <g data-el="p1">
        {PANEL.map((y0, b) => (
          <g key={b}>
            <RRect x={4} y={y0} w={432} h={226} seed={`pn${b}`} rough={0.3} strokeWidth={1} />
            <Txt x={18} y={y0 + 28} size={16} weight={800}>
              {b ? F.stream : F.batch}
            </Txt>
            <Txt x={18 + tw(b ? F.stream : F.batch, 16) + 12} y={y0 + 28} size={13} muted>
              {b ? F.streamTag : F.batchTag}
            </Txt>
            <Node x={P1.sink} y={y0 + P1.cy} w={92} h={50} label={F.sink} kind="serve" seed={`sink${b}`} />
            <RLine x1={P1.ax0} y1={y0 + P1.axisY} x2={P1.ax1} y2={y0 + P1.axisY} seed={`ax${b}`} rough={0.3} />
            <path d={`M ${P1.ax1 - 7} ${y0 + P1.axisY - 5} L ${P1.ax1} ${y0 + P1.axisY} L ${P1.ax1 - 7} ${y0 + P1.axisY + 5}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} />
            <Txt x={18} y={y0 + P1.axisY + 5} size={13} weight={650} muted>
              {F.arrival}
            </Txt>
          </g>
        ))}
        <Bucket y0={PANEL[0]} />
        <RArrow x1={146} y1={PANEL[0] + P1.cy} x2={P1.sink - 52} y2={PANEL[0] + P1.cy} seed="bk-arrow" rough={0.4} />
        <Tap y0={PANEL[1]} />
        {ids.map((k) => {
          const [x, y] = dropAt(k)
          return <circle key={k} data-el="drop" data-dx={lumpAt1(k)[0] - x} data-dy={lumpAt1(k)[1] - y} cx={x} cy={PANEL[0] + y} r={5} style={{ fill: 'var(--accent)' }} />
        })}
        {Array.from({ length: n * 2 }, (_, j) => (
          <circle key={j} data-el="train" cx={P1.x1 - (j + 0.5) * gap} cy={PANEL[1] + P1.cy} r={5} style={{ fill: 'var(--accent)' }} />
        ))}
        {ids.map((k) => (
          <circle key={k} data-el="arr-b" cx={P1.ax1 - 30 + (k % 6) * 4} cy={PANEL[0] + P1.axisY - (k < 6 ? 0 : 7)} r={3.6} style={{ fill: 'var(--accent)' }} />
        ))}
        {ids.map((k) => (
          <circle key={k} data-el="arr-s" cx={axX(S1.t0 + ((k + 0.5) / n) * S1.span)} cy={PANEL[1] + P1.axisY} r={3.6} style={{ fill: 'var(--accent)' }} />
        ))}
      </g>

      {/* step 2~3: 이벤트 브로커 */}
      <g data-el="p2">
        <Node x={360} y={48} w={140} h={50} label={N5.app.label} sub={N5.app.sub} kind="source" seed="bk-app" />
        <Tag x={282} y={53} text={F.producer} anchor="end" />
        <RArrow x1={APP_B[0]} y1={APP_B[1]} x2={APP_B[0]} y2={104} seed="bk-prod" rough={0.4} />
      </g>
      <g data-el="p2-box">
        <RRect x={8} y={106} w={424} h={196} seed="bk-box" rough={0.45} />
        <Txt x={20} y={130} size={15} weight={800}>
          {F.broker}
        </Txt>
        <Txt x={20} y={157} size={13} weight={750}>
          {F.payTopic}
        </Txt>
      </g>
      {Array.from({ length: 13 }, (_, i) => (
        <Cell key={i} n={i + 1} y={PAY_Y} el="pay-cell" />
      ))}
      <g data-el="cart">
        <Txt x={20} y={CART_Y - 9} size={13} weight={750}>
          {F.cartTopic}
        </Txt>
        {Array.from({ length: 7 }, (_, i) => (
          <Cell key={i} n={i + 1} y={CART_Y} el="cart-cell" />
        ))}
      </g>
      {[11, 12, 13].map((c) => (
        <rect key={c} data-el={`fly-${c}`} x={APP_B[0] - 5} y={APP_B[1] - 5} width={10} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />
      ))}
      <rect data-el="fly-cart" x={APP_B[0] - 5} y={APP_B[1] - 5} width={10} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />

      {/* step 3: 컨슈머 */}
      <g data-el="p3">
        <RArrow x1={CONS.fraud} y1={306} x2={CONS.fraud} y2={CONS.y - 31} seed="bk-c1" rough={0.4} />
        <RArrow x1={CONS.lake} y1={306} x2={CONS.lake} y2={CONS.y - 31} seed="bk-c2" rough={0.4} />
        <Node x={CONS.fraud} y={CONS.y} w={CONS.w} h={54} label={F.consumers.fraud} sub=" " kind="process" seed="bk-fraud" />
        <Node x={CONS.lake} y={CONS.y} w={CONS.w} h={54} label={F.consumers.lake} sub=" " kind="process" seed="bk-lake" />
        <Txt x={CONS.fraud} y={CONS.y + 16} size={12.5} weight={650} anchor="middle" mono el="fr-12">
          {F.readAt(12)}
        </Txt>
        <Txt x={CONS.fraud} y={CONS.y + 16} size={12.5} weight={650} anchor="middle" mono el="fr-13">
          {F.readAt(13)}
        </Txt>
        <Txt x={CONS.lake} y={CONS.y + 16} size={12.5} weight={650} anchor="middle" mono el="lk-7">
          {F.readAt(7)}
        </Txt>
        <Txt x={CONS.lake} y={CONS.y + 16} size={12.5} weight={650} anchor="middle" mono el="lk-13">
          {F.readAt(13)}
        </Txt>
        <Txt x={cellX(13) + CELL.w} y={130} size={12.5} weight={700} anchor="end">
          {F.readMark}
        </Txt>
        <Tag x={cellX(13) + CELL.w} y={PAY_Y + CELL.h + 24} text={F.retention} anchor="end" />
        <Txt x={CONS.lake} y={CONS.y + 50} size={12.5} weight={700} anchor="middle" el="bundle">
          {F.bundle}
        </Txt>
      </g>
      <Marker el="mk-fraud" cx={cellX(12) + CELL.w / 2} tip={MK.fraud} label={F.consumers.fraud} />
      <Marker el="mk-lake" cx={cellX(7) + CELL.w / 2} tip={MK.lake} label={F.consumers.lake} />
      <rect data-el="cp-fraud" x={cellX(13) + CELL.w / 2 - 5} y={PAY_Y + 6} width={10} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />
      {[8, 9, 10, 11, 12, 13].map((c) => (
        <rect key={c} data-el="cp-lake" data-c={c} x={cellX(c) + CELL.w / 2 - 5} y={PAY_Y + 6} width={10} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />
      ))}

      {/* step 4: 파티션(레인) */}
      <g data-el="p4">
        <g>
          <RRect x={196} y={8} w={240} h={94} seed="cmp" rough={0.35} fill="var(--surface)" />
          {[0, 1, 2].map((k) => (
            <Folder key={k} x={210 + k * 28} y={32} seed={`cmp-f${k}`} />
          ))}
          <Txt x={302} y={58} size={26} weight={800} anchor="middle">
            ≠
          </Txt>
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <RLine x1={326} y1={30 + k * 13} x2={424} y2={30 + k * 13} seed={`cmp-l${k}`} rough={0.2} strokeWidth={1.2} />
              {[0, 1].map((d) => (
                <circle key={d} cx={350 + d * 30 + k * 9} cy={30 + k * 13} r={2.8} style={{ fill: 'var(--accent)' }} />
              ))}
            </g>
          ))}
          <Txt x={316} y={88} size={12} weight={750} anchor="middle">
            {F.compare}
          </Txt>
        </g>
        <RRect x={8} y={112} w={206} h={214} seed="bk4-box" rough={0.45} />
        <Txt x={18} y={136} size={13.5} weight={800}>
          {F.payTopic}
        </Txt>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <RRect x={LANE.x} y={LANE.y(i)} w={LANE.w} h={LANE.h} seed={`ln${i}`} rough={0.35} />
            <Txt x={LANE.x + 8} y={LANE.y(i) + 21} size={12.5} weight={650} muted>
              {F.lane(i)}
            </Txt>
            <RArrow x1={LANE.x + LANE.w + 2} y1={LANE.y(i) + LANE.h / 2} x2={WK.x - 4} y2={LANE.y(i) + LANE.h / 2} seed={`ln-a${i}`} rough={0.3} head={6} />
          </g>
        ))}
        <Txt x={LANE.x} y={LANE.y(1) - 9} size={11.5} weight={650} muted>
          {F.noOrder}
        </Txt>
        <RRect x={222} y={112} w={214} h={214} seed="det-box" rough={0.45} />
        <Txt x={232} y={136} size={14} weight={800}>
          {F.consumers.fraud}
        </Txt>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <RRect x={WK.x} y={LANE.y(i)} w={WK.w} h={LANE.h} seed={`wk${i}`} rough={0.35} fill="var(--surface)" />
            <Txt x={WK.x + WK.w / 2} y={LANE.y(i) + 21} size={13} weight={750} anchor="middle">
              {F.worker(i + 1)}
            </Txt>
          </g>
        ))}
        <Txt x={ORD.x(0)} y={ORD.y - 6} size={12} weight={750}>
          {F.received}
        </Txt>
        {/* 빈 자리: 도착한 칩(폭 38)이 테두리까지 덮도록 안쪽으로 그린다 */}
        {[0, 1, 2].map((k) => (
          <rect key={k} x={ORD.x(k) - 0.4} y={ORD.y + 0.6} width={ORD.w + 0.8} height={ORD.h - 1.2} rx={4.4} style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1.2} strokeDasharray="3 3" />
        ))}
        {[0, 1].map((k) => {
          const cx = ORD.x(k) + 40.5
          const cy = ORD.y + ORD.h / 2
          return <path key={k} d={`M ${cx - 3} ${cy} L ${cx + 3} ${cy} M ${cx + 0.5} ${cy - 2.5} L ${cx + 3} ${cy} L ${cx + 0.5} ${cy + 2.5}`} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={1.4} strokeLinecap="round" />
        })}
      </g>
      <Badge x={426} y={ORD.y - 10} status="ok" r={8} el="order-ok" />
      {ARRIVE.map(([lane, s]) => (
        <Chip key={`${lane}-${s}`} el="lane-chip" x={SLOT_X(s)} y={LANE.y(lane) + 5} w={38} h={22} lines={[F.laneCards[lane][s]]} size={13} />
      ))}
      {ARRIVE.map(([lane, s]) => (
        <Chip key={`${lane}-${s}`} el="copy-chip" x={SLOT_X(s)} y={LANE.y(lane) + 5} w={38} h={22} lines={[F.laneCards[lane][s]]} size={13} />
      ))}
    </Fig>
  )
}

export const buildBroker: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const n = mobile ? 4 : 12
  const gap = (P1.x1 - P1.x0) / n

  // ── step 1: 같은 데이터, 다른 도착 방식 ──
  const s1 = at(0)
  const T0 = s1 + S1.t0
  const drops = o('drop')
  const train = o('train')
  const arrB = o('arr-b')
  const arrS = o('arr-s')
  init(tl, [...drops, ...arrB, ...arrS], { opacity: 0 })
  init(tl, drops, { y: -46 })
  train.forEach((p, j) => {
    init(tl, [p], { opacity: j < n ? 1 : 0, x: 0 })
    tl.to(p, { x: n * gap, duration: S1.span, ease: 'none' }, T0)
    const cross = T0 + ((j < n ? j : j - n) + 0.5) / n * S1.span
    if (j < n) {
      tl.to(p, { opacity: 0, duration: 0.012 }, cross - 0.006)
      tl.to(arrS[j], { opacity: 1, duration: 0.012 }, cross)
    } else tl.to(p, { opacity: 1, duration: 0.012 }, cross - 0.006)
  })
  drops.forEach((d, k) => {
    const t = T0 + ((k + 0.5) / n) * S1.span - 0.03
    tl.to(d, { opacity: 1, duration: 0.01 }, t)
    tl.to(d, { y: 0, duration: 0.03, ease: 'power1.in' }, t)
    const el = d as SVGElement
    tl.to(d, { x: Number(el.dataset.dx), y: Number(el.dataset.dy), duration: 0.08, ease: 'power2.inOut' }, s1 + 0.7)
  })
  tl.to(arrB, { opacity: 1, duration: 0.02 }, s1 + 0.79)

  // ── step 2: 브로커는 종류별 통로에 순서대로 덧붙여 기록한다 ──
  const s2 = at(1)
  const payCells = o('pay-cell')
  const cartCells = o('cart-cell')
  const p2 = [...o('p2'), ...o('p2-box'), ...o('cart')]
  init(tl, [...p2, ...payCells, ...o('fly-11'), ...o('fly-12'), ...o('fly-13'), ...o('fly-cart')], { opacity: 0 })
  init(tl, [...payCells.slice(10), cartCells[6]], { opacity: 0 })
  tl.to(o('p1'), { opacity: 0, duration: 0.1 }, s2)
  tl.to([...p2, ...payCells.slice(0, 10)], { opacity: 1, duration: 0.1 }, s2 + 0.08)
  const fly = (el: Element | undefined, cell: Element | undefined, c: number, y: number, t: number) => {
    if (!el) return
    tl.to(el, { opacity: 1, duration: 0.01 }, t)
    tl.to(el, { x: cellX(c) + CELL.w / 2 - APP_B[0], y: y + 11 - APP_B[1], duration: 0.1, ease: 'power2.inOut' }, t)
    if (cell) tl.to(cell, { opacity: 1, duration: 0.02 }, t + 0.1)
    tl.to(el, { opacity: 0, duration: 0.01 }, t + 0.11)
  }
  fly(o('fly-11')[0], payCells[10], 11, PAY_Y, s2 + 0.24)
  fly(o('fly-cart')[0], cartCells[6], 7, CART_Y, s2 + 0.4)
  fly(o('fly-12')[0], payCells[11], 12, PAY_Y, s2 + 0.56)

  // ── step 3: 읽어도 지워지지 않고, 컨슈머마다 읽는 위치가 따로다 ──
  const s3 = at(2)
  const mkF = o('mk-fraud')
  const mkL = o('mk-lake')
  init(tl, [...o('p3'), ...mkF, ...mkL, ...o('fr-13'), ...o('lk-13'), ...o('bundle'), ...o('cp-fraud'), ...o('cp-lake')], { opacity: 0 })
  tl.to(o('cart'), { opacity: 0, duration: 0.08 }, s3)
  tl.to([...o('p3'), ...mkF, ...mkL], { opacity: 1, duration: 0.08 }, s3 + 0.06)
  tl.to([...o('fr-13'), ...o('lk-13'), ...o('bundle')], { opacity: 0, duration: 0.01 }, s3 + 0.06)
  fly(o('fly-13')[0], payCells[12], 13, PAY_Y, s3 + 0.16)
  const cpF = o('cp-fraud')[0]
  tl.to(cpF, { opacity: 1, duration: 0.01 }, s3 + 0.3)
  tl.to(cpF, { x: CONS.fraud - (cellX(13) + CELL.w / 2), y: CONS.y - (PAY_Y + 11), duration: 0.1, ease: 'power2.inOut' }, s3 + 0.3)
  tl.to(cpF, { opacity: 0, duration: 0.01 }, s3 + 0.4)
  tl.to(mkF, { x: CELL.w, duration: 0.06 }, s3 + 0.31)
  tl.to(o('fr-12'), { opacity: 0, duration: 0.02 }, s3 + 0.4)
  tl.to(o('fr-13'), { opacity: 1, duration: 0.02 }, s3 + 0.41)
  o('cp-lake').forEach((c) => {
    const k = Number((c as SVGElement).dataset.c)
    tl.to(c, { opacity: 1, duration: 0.01 }, s3 + 0.54)
    tl.to(c, { x: CONS.lake - 15 + (k - 8) * 6 - (cellX(k) + CELL.w / 2), y: CONS.y - (PAY_Y + 11), duration: 0.12, ease: 'power2.inOut' }, s3 + 0.54)
    tl.to(c, { opacity: 0, duration: 0.01 }, s3 + 0.66)
  })
  tl.to(mkL, { x: CELL.w * 6, duration: 0.08 }, s3 + 0.55)
  tl.to(o('lk-7'), { opacity: 0, duration: 0.02 }, s3 + 0.66)
  tl.to([...o('lk-13'), ...o('bundle')], { opacity: 1, duration: 0.03 }, s3 + 0.67)

  // ── step 4: 레인을 나눠 함께 읽되, 순서는 레인 안에서만 ──
  const s4 = at(3)
  const chips = o('lane-chip')
  const copies = o('copy-chip')
  init(tl, [...o('p4'), ...o('order-ok'), ...chips, ...copies], { opacity: 0 })
  tl.to([...o('p2'), ...o('p2-box'), ...o('p3'), ...payCells, ...mkF, ...mkL], { opacity: 0, duration: 0.1 }, s4)
  tl.to(o('p4'), { opacity: 1, duration: 0.1 }, s4 + 0.06)
  const entry: P = [LANE.x - 4, LANE.y(1) + 5]
  ARRIVE.forEach(([lane, s], i) => {
    const c = chips[i]
    const dx = entry[0] - SLOT_X(s)
    const dy = entry[1] - (LANE.y(lane) + 5)
    init(tl, [c], { x: dx, y: dy })
    const t = s4 + 0.12 + i * 0.045
    tl.to(c, { opacity: 1, duration: 0.01 }, t)
    tl.to(c, { x: 0, y: 0, duration: 0.08, ease: 'power2.inOut' }, t)
    // 복사본이 워커로(원본은 레인에 남는다). 레인 1의 카드 A는 받은 순서 칸에 차례로 놓인다
    const cp = copies[i]
    const rt = s4 + READ_T[`${lane}-${s}`]
    const wx = WK.x + WK.w / 2 - 19 - SLOT_X(s)
    const wy = LANE.y(lane) + 5 - (LANE.y(lane) + 5)
    tl.to(cp, { opacity: 1, duration: 0.01 }, rt - 0.06)
    tl.to(cp, { x: wx, y: wy, duration: 0.06, ease: 'power1.in' }, rt - 0.06)
    if (lane === 1) {
      tl.to(cp, { x: ORD.x(s) - 1 - SLOT_X(s), y: ORD.y - (LANE.y(1) + 5), duration: 0.06, ease: 'power2.out' }, rt)
    } else tl.to(cp, { opacity: 0, duration: 0.02 }, rt)
  })
  tl.to(o('order-ok'), { opacity: 1, duration: 0.04 }, s4 + 0.74)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — CDC, 시간의 상자, 정확히 한 번
// ─────────────────────────────────────────────────────────────
const DB = { x0: 14, y0: 16, w: 220, h: 228 }
const TB = { x: 34, y: 100, cw: [112, 64], hh: 26, rh: 30 }
const tbRow = (i: number) => TB.y + TB.hh + i * TB.rh
const CDC: P = [352, 128]
const CH_Y = 316
const chipW = (s: string) => tw(s, 12.5) + 22
const CH_X = [22, 22 + chipW(F.changes[0]) + 8]
const LANE5 = { x: 14, y: 38, w: 210, h: 40 }
const EXIT: P = [LANE5.x + LANE5.w + 4, LANE5.y + LANE5.h / 2]
const BOX = { y: 146, w: 186, h: 152, x: [20, 234] }
const evRow = (k: number) => BOX.y + 22 + k * 34
const EV_X = 38
const DUP = { y: LANE5.y + 2, w: 86, h: 36, x: [130, 38] }
const DET = { x: 40, y: 126, w: 384, h: 236 }
const PID = { x: 60, w: 180, y: (i: number) => 192 + i * 28, h: 28 }
const SKIP: P = [272, 302]

function Cylinder({ x0, y0, w, h, seed }: { x0: number; y0: number; w: number; h: number; seed: string }) {
  const x1 = x0 + w
  const y1 = y0 + h
  const rx = w / 2
  const ry = 10
  const body = `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry} Z`
  const outline = `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x0} ${y0 + ry} M ${x0} ${y0 + ry} L ${x0} ${y1 - ry} A ${rx} ${ry} 0 0 0 ${x1} ${y1 - ry} L ${x1} ${y0 + ry}`
  return (
    <g>
      <path d={body} style={{ fill: 'var(--surface)' }} />
      <RPath d={outline} seed={seed} rough={0.5} />
    </g>
  )
}

function Clock({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={13} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.8} />
      <path d={`M ${x} ${y - 8} L ${x} ${y} L ${x + 6} ${y + 3}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  )
}

function EventDot({ k, el }: { k: number; el: string }) {
  const e = F.events[k]
  const y = evRow(k)
  return (
    <g>
      <circle data-el={el} cx={EV_X} cy={y} r={6} style={{ fill: 'var(--accent)' }} />
      <g data-el={`${el}-tag`}>
        <Txt x={EV_X + 13} y={y - 2} size={12} weight={700}>
          {F.occurred(F.time(e.at))}
        </Txt>
        <Txt x={EV_X + 13} y={y + 12} size={12} muted>
          {F.got(F.time(e.got))}
        </Txt>
      </g>
    </g>
  )
}

export function WindowFig() {
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-1" className="col-start-1 row-start-1">
            {F.cdcNote}
          </span>
          <span data-el="cap-3" className="col-start-1 row-start-1">
            {F.lateNote}
          </span>
        </span>
      }
    >
      {/* step 1: CDC */}
      <g data-el="w1">
        <Cylinder {...DB} seed="w-db" />
        <Txt x={DB.x0 + DB.w / 2} y={DB.y0 + 44} size={15} weight={800} anchor="middle">
          {N5.oltp.label}
        </Txt>
        <Txt x={TB.x} y={TB.y - 10} size={13} weight={750}>
          {F.stockTable}
        </Txt>
        <rect x={TB.x} y={TB.y} width={TB.cw[0] + TB.cw[1]} height={TB.hh + TB.rh * 3} style={{ fill: 'var(--bg)' }} />
        {[0, 2].map((i) => (
          <rect key={i} data-el={`row-hl-${i}`} x={TB.x} y={tbRow(i)} width={TB.cw[0] + TB.cw[1]} height={TB.rh} style={{ fill: 'var(--accent)', fillOpacity: 0.18 }} />
        ))}
        <RRect x={TB.x} y={TB.y} w={TB.cw[0] + TB.cw[1]} h={TB.hh + TB.rh * 3} seed="w-tb" rough={0.35} />
        <RLine x1={TB.x} y1={TB.y + TB.hh} x2={TB.x + TB.cw[0] + TB.cw[1]} y2={TB.y + TB.hh} seed="w-tb-h" rough={0.3} />
        <RLine x1={TB.x + TB.cw[0]} y1={TB.y} x2={TB.x + TB.cw[0]} y2={TB.y + TB.hh + TB.rh * 3} seed="w-tb-v" rough={0.3} strokeWidth={0.9} />
        <Txt x={TB.x + 10} y={TB.y + 18} size={12.5} weight={750}>
          {F.stockTableCols[0]}
        </Txt>
        <Txt x={TB.x + TB.cw[0] + TB.cw[1] - 10} y={TB.y + 18} size={12.5} weight={750} anchor="end">
          {F.stockTableCols[1]}
        </Txt>
        {F.stockChanges.map((r, i) => (
          <g key={r.name}>
            <Txt x={TB.x + 10} y={tbRow(i) + 20} size={14}>
              {r.name}
            </Txt>
            <Txt x={TB.x + TB.cw[0] + TB.cw[1] - 12} y={tbRow(i) + 20} size={15} weight={700} anchor="end" mono el={r.from !== r.to ? `v-from-${i}` : undefined}>
              {String(r.from)}
            </Txt>
            {r.from !== r.to && (
              <Txt x={TB.x + TB.cw[0] + TB.cw[1] - 12} y={tbRow(i) + 20} size={15} weight={800} anchor="end" mono el={`v-to-${i}`}>
                {String(r.to)}
              </Txt>
            )}
          </g>
        ))}
        <RArrow x1={DB.x0 + DB.w + 4} y1={CDC[1]} x2={CDC[0] - 72} y2={CDC[1]} seed="w-a1" rough={0.4} />
        <Node x={CDC[0]} y={CDC[1]} w={136} h={56} label={N6.cdc.label} sub={N6.cdc.sub} kind="process" seed="w-cdc" />
        <RArrow x1={CDC[0]} y1={CDC[1] + 32} x2={CDC[0]} y2={CH_Y - 12} seed="w-a2" rough={0.4} />
        <Txt x={LANE5.x} y={CH_Y - 14} size={13} weight={750}>
          {F.changeTopic}
        </Txt>
        <RRect x={14} y={CH_Y - 8} w={412} h={44} seed="w-lane1" rough={0.35} />
        {F.changes.map((c, i) => (
          <Chip key={c} el={`chg-${i}`} x={CH_X[i]} y={CH_Y} w={chipW(c)} h={28} lines={[c]} />
        ))}
        {[0, 2].map((i) => (
          <circle key={i} data-el={`chg-dot-${i ? 1 : 0}`} cx={TB.x + TB.cw[0] + TB.cw[1] - 4} cy={tbRow(i) + TB.rh / 2} r={6} style={{ fill: 'var(--accent)' }} />
        ))}
      </g>

      {/* step 2~4: '결제' 토픽 레인 */}
      <g data-el="lane5">
        <Txt x={LANE5.x} y={LANE5.y - 9} size={13} weight={750}>
          {F.payTopic}
        </Txt>
        <RRect x={LANE5.x} y={LANE5.y} w={LANE5.w} h={LANE5.h} seed="w-lane" rough={0.35} />
      </g>
      <g data-el="wbox">
        <Clock x={322} y={50} />
        <Txt x={344} y={42} size={12} weight={650} muted>
          {F.clock}
        </Txt>
        {BOX.x.map((x, b) => (
          <g key={b}>
            <RPath d={`M ${x} ${BOX.y} L ${x} ${BOX.y + BOX.h} L ${x + BOX.w} ${BOX.y + BOX.h} L ${x + BOX.w} ${BOX.y}`} seed={`w-box${b}`} rough={0.45} />
            <Txt x={x + BOX.w / 2} y={BOX.y + BOX.h + 22} size={14} weight={800} anchor="middle" mono>
              {F.windows[b]}
            </Txt>
          </g>
        ))}
        {BOX.x.map((x, b) => (
          <g key={b} data-el={`lid-${b}`} data-origin={b ? `${x + BOX.w} ${BOX.y}` : `${x} ${BOX.y}`}>
            <line x1={x - 2} y1={BOX.y} x2={x + BOX.w + 2} y2={BOX.y} style={{ stroke: 'var(--line)' }} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
      </g>
      <Txt x={344} y={66} size={20} weight={800} mono el="clock-t">
        {F.time(0)}
      </Txt>
      <Txt x={BOX.x[0] + BOX.w / 2} y={BOX.y + BOX.h + 48} size={15} weight={800} anchor="middle" el="cnt-a">
        {F.countA(0)}
      </Txt>
      <Badge x={BOX.x[0] + BOX.w - 6} y={BOX.y + BOX.h + 17} status="wait" r={10} el="b0-wait" />
      <Badge x={BOX.x[0] + BOX.w - 6} y={BOX.y + BOX.h + 17} status="ok" r={10} el="b0-ok" />
      <Txt x={BOX.x[0] + BOX.w / 2} y={BOX.y + BOX.h + 72} size={12.5} weight={700} anchor="middle" el="wait-tag">
        {F.wait}
      </Txt>
      <g data-el="cuts">
        {F.cuts.map((c, i) => {
          const x = i ? 236 : 24
          return (
            <g key={c}>
              <rect x={x} y={400} width={180} height={26} rx={13} style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} strokeWidth={1.4} />
              <Badge x={x + 15} y={413} status={i ? 'ok' : 'wait'} r={8.5} />
              <Txt x={x + 30} y={417.5} size={12.5} weight={700}>
                {c}
              </Txt>
            </g>
          )
        })}
        <Txt x={220} y={418} size={13} weight={700} anchor="middle">
          →
        </Txt>
      </g>
      <Txt x={220} y={454} size={13.5} weight={750} anchor="middle" el="tradeoff">
        {F.tradeoff}
      </Txt>
      {F.events.map((_, k) => (
        <EventDot key={k} k={k} el={`ev-${k}`} />
      ))}

      {/* step 4: 중복 전달과 멱등 처리 */}
      <g data-el="dup">
        <RRect x={DET.x} y={DET.y} w={DET.w} h={DET.h} seed="w-det" rough={0.45} />
        <Txt x={DET.x + 16} y={DET.y + 26} size={15} weight={800}>
          {F.consumers.fraud}
        </Txt>
        <Txt x={PID.x} y={PID.y(0) - 10} size={13} weight={750} muted>
          {F.processed}
        </Txt>
        <rect x={PID.x} y={PID.y(0)} width={PID.w} height={PID.h * 3} style={{ fill: 'var(--surface)' }} />
        <rect data-el="pid-hl" x={PID.x} y={PID.y(2)} width={PID.w} height={PID.h} style={{ fill: 'var(--accent)', fillOpacity: 0.2 }} />
        <RRect x={PID.x} y={PID.y(0)} w={PID.w} h={PID.h * 3} seed="w-pid" rough={0.35} />
        {[1, 2].map((i) => (
          <RLine key={i} x1={PID.x} y1={PID.y(i)} x2={PID.x + PID.w} y2={PID.y(i)} seed={`w-pid${i}`} rough={0.25} strokeWidth={0.9} />
        ))}
        {F.processedIds.map((id, i) => (
          <Txt key={id} x={PID.x + 14} y={PID.y(i) + 19} size={14} weight={650} mono el={i === 2 ? 'pid-2' : undefined}>
            {id}
          </Txt>
        ))}
        <g data-el="skip-x">
          <Badge x={SKIP[0] + 2} y={SKIP[1] - 17} status="fail" r={10} />
          <Txt x={SKIP[0] + 18} y={SKIP[1] - 12} size={13} weight={750} color="var(--fail)">
            {F.skipped}
          </Txt>
        </g>
      </g>
      <Txt x={340} y={212} size={17} weight={800} anchor="middle" el="cnt-d">
        {F.countD(0)}
      </Txt>
      {DUP.x.map((x, i) => (
        <Chip key={i} el={`dup-${i}`} x={x} y={DUP.y} w={DUP.w} h={DUP.h} lines={F.dupChip.split(' · ')} size={12.5} />
      ))}
      {DUP.x.map((x, i) => (
        <Chip key={i} el={`dupc-${i}`} x={x} y={DUP.y} w={DUP.w} h={DUP.h} lines={F.dupChip.split(' · ')} size={12.5} />
      ))}
    </Fig>
  )
}

export const buildWindow: SceneBuild = (q, tl) => {
  const o = pick(q)

  // ── step 1: 행 변경 하나가 이벤트 하나가 된다 ──
  const s1 = at(0)
  init(tl, [...o('row-hl-0'), ...o('row-hl-2'), ...o('v-to-0'), ...o('v-to-2'), ...o('chg-0'), ...o('chg-1'), ...o('chg-dot-0'), ...o('chg-dot-1'), ...o('cap-1'), ...o('cap-3')], { opacity: 0 })
  tl.to(o('cap-1'), { opacity: 1, duration: 0.06 }, s1 + 0.08)
  ;[0, 1].forEach((k) => {
    const row = k ? 2 : 0
    const t = s1 + 0.06 + k * 0.34
    const dot = o(`chg-dot-${k}`)[0]
    const sx = TB.x + TB.cw[0] + TB.cw[1] - 4
    const sy = tbRow(row) + TB.rh / 2
    tl.to(o(`row-hl-${row}`), { opacity: 1, duration: 0.03 }, t)
    tl.to(o(`v-from-${row}`), { opacity: 0, duration: 0.02 }, t + 0.06)
    tl.to(o(`v-to-${row}`), { opacity: 1, duration: 0.02 }, t + 0.07)
    tl.to(dot, { opacity: 1, duration: 0.01 }, t + 0.08)
    flow(tl, dot, [[sx, sy], [sx + 30, sy], CDC, [CDC[0], CH_Y - 16], [CH_X[k] + chipW(F.changes[k]) / 2, CH_Y + 14]], t + 0.08, 0.2)
    tl.to(dot, { opacity: 0, duration: 0.01 }, t + 0.28)
    tl.to(o(`chg-${k}`), { opacity: 1, duration: 0.03 }, t + 0.28)
    tl.to(o(`row-hl-${row}`), { opacity: 0, duration: 0.04 }, t + 0.32)
  })

  // ── step 2: 일어난 시각으로 나눈 상자에 담아서 센다 ──
  const s2 = at(1)
  const ev = F.events.map((_, k) => o(`ev-${k}`)[0])
  const evTag = F.events.map((_, k) => o(`ev-${k}-tag`)[0])
  const lid0 = o('lid-0')[0] as SVGElement | undefined
  const lid1 = o('lid-1')[0] as SVGElement | undefined
  init(tl, [...o('lane5'), ...o('wbox'), ...o('clock-t'), ...o('cnt-a'), ...o('b0-wait'), ...o('b0-ok'), ...o('wait-tag'), ...o('cuts'), ...o('tradeoff'), ...ev, ...evTag], { opacity: 0 })
  if (lid0) init(tl, [lid0], { rotation: -10, svgOrigin: lid0.dataset.origin })
  if (lid1) init(tl, [lid1], { rotation: 10, svgOrigin: lid1.dataset.origin })
  const start: P = [LANE5.x + 10, EXIT[1]]
  ev.forEach((d, k) => init(tl, [d], { x: start[0] - EV_X, y: start[1] - evRow(k) }))
  tl.to([...o('w1'), ...o('cap-1')], { opacity: 0, duration: 0.1 }, s2)
  tl.to([...o('lane5'), ...o('wbox'), ...o('clock-t'), ...o('cnt-a')], { opacity: 1, duration: 0.1 }, s2 + 0.06)
  const clock = o('clock-t')[0]
  const cnt = o('cnt-a')[0]
  const slot = (k: number): P => [EV_X, evRow(k)]
  const lands: number[] = []
  ;[0, 1, 2].forEach((k) => {
    const t = s2 + 0.18 + k * 0.17
    tl.to(ev[k], { opacity: 1, duration: 0.01 }, t)
    const end = flow(tl, ev[k], [start, EXIT, [EXIT[0], 134], [EV_X + 40, 139], slot(k)], t, 0.14, slot(k))
    tl.to(evTag[k], { opacity: 1, duration: 0.02 }, end)
    lands.push(end)
  })
  textSteps(tl, clock, (m) => F.time(m), [
    [0, 0],
    [1, lands[0]],
    [2, lands[1]],
    [3, lands[2]],
    [5, at(2) + 0.08],
    [6, at(2) + 0.22],
    [7, at(2) + 0.58],
  ])

  // ── step 3: 늦게 오는 데이터 때문에 상자를 닫는 시점을 미룬다 ──
  const s3 = at(2)
  tl.to(o('cap-3'), { opacity: 1, duration: 0.06 }, s3 + 0.06)
  tl.to([...o('b0-wait'), ...o('wait-tag')], { opacity: 1, duration: 0.04 }, s3 + 0.14)
  tl.to(ev[3], { opacity: 1, duration: 0.01 }, s3 + 0.22)
  const over: P = [BOX.x[1] + BOX.w / 2, 118]
  const p1 = flow(tl, ev[3], [start, EXIT, [EXIT[0], 104], over], s3 + 0.22, 0.12, slot(3))
  tl.to(ev[3], { x: 40, y: 139 - evRow(3), duration: 0.06, ease: 'power1.inOut' }, p1 + 0.05)
  tl.to(ev[3], { x: 0, y: 0, duration: 0.05, ease: 'power1.in' }, p1 + 0.11)
  tl.to(evTag[3], { opacity: 1, duration: 0.02 }, p1 + 0.16)
  textSteps(tl, cnt, (n) => F.countA(n), [
    [0, 0],
    [1, lands[0]],
    [2, lands[1]],
    [3, lands[2]],
    [4, p1 + 0.16],
  ])
  if (lid0) tl.to(lid0, { rotation: 0, svgOrigin: lid0.dataset.origin, duration: 0.08 }, s3 + 0.6)
  tl.to(o('b0-wait'), { opacity: 0, duration: 0.02 }, s3 + 0.68)
  tl.to(o('b0-ok'), { opacity: 1, duration: 0.02 }, s3 + 0.68)
  tl.to(o('cuts'), { opacity: 1, duration: 0.05 }, s3 + 0.72)
  tl.to(o('tradeoff'), { opacity: 1, duration: 0.05 }, s3 + 0.76)

  // ── step 4: 결제 번호로 중복을 걸러 결과에 한 번만 반영한다 ──
  const s4 = at(3)
  const chips = [o('dup-0')[0], o('dup-1')[0]]
  const copies = [o('dupc-0')[0], o('dupc-1')[0]]
  const cntD = o('cnt-d')[0]
  init(tl, [...o('dup'), ...o('cnt-d'), ...o('pid-2'), ...o('pid-hl'), ...o('skip-x'), ...chips, ...copies], { opacity: 0 })
  tl.to([...o('wbox'), ...o('clock-t'), ...o('cnt-a'), ...o('b0-ok'), ...o('wait-tag'), ...o('cuts'), ...o('tradeoff'), ...ev, ...evTag, ...o('cap-3')], { opacity: 0, duration: 0.1 }, s4)
  tl.to([...o('dup'), ...o('cnt-d')], { opacity: 1, duration: 0.1 }, s4 + 0.06)
  chips.forEach((c, i) => {
    init(tl, [c], { x: LANE5.x + 6 - DUP.x[i] })
    tl.to(c, { opacity: 1, duration: 0.01 }, s4 + 0.1 + i * 0.06)
    tl.to(c, { x: 0, duration: 0.08, ease: 'power1.out' }, s4 + 0.1 + i * 0.06)
  })
  const target: P = [PID.x + 92, PID.y(2) - 4]
  copies.forEach((c, i) => {
    const sx = DUP.x[i]
    const t = s4 + 0.28 + i * 0.22
    tl.to(c, { opacity: 1, duration: 0.01 }, t)
    tl.to(c, { x: EXIT[0] + 8 - sx, y: 96 - DUP.y, duration: 0.05, ease: 'none' }, t)
    tl.to(c, { x: target[0] - sx, y: target[1] - DUP.y, duration: 0.07, ease: 'power1.inOut' }, t + 0.05)
    if (i === 0) {
      tl.to(o('pid-2'), { opacity: 1, duration: 0.02 }, t + 0.12)
      tl.to(c, { opacity: 0, duration: 0.02 }, t + 0.12)
    } else {
      tl.to(o('pid-hl'), { opacity: 1, duration: 0.02 }, t + 0.12)
      tl.to(c, { x: SKIP[0] - sx, y: SKIP[1] - DUP.y, opacity: 0.35, duration: 0.08, ease: 'power1.out' }, t + 0.15)
      tl.to(o('skip-x'), { opacity: 1, duration: 0.03 }, t + 0.22)
    }
  })
  textSteps(tl, cntD, (n) => F.countD(n), [
    [0, 0],
    [1, s4 + 0.42],
  ])
}
