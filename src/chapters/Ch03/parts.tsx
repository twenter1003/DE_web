import type { HistoryRow, JobId, JobStatus } from '../../content/chapters/ch3'
import { ch3 } from '../../content/chapters/ch3'
import { Badge, rng } from '../../components/diagram'
import { Txt } from '../../components/fig'
import { RArrow, REllipse, RLine, RPath, RRect } from '../../components/sketch'
import type { Q } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'

// Ch3 다이어그램 전용 작은 부품: DAG 배치, 작업 노드(상태 아이콘 + 글자), 시계, 휴대폰, 실행 이력 표, 점선 조각.

const F = ch3.figures

/** q 줄임: data-el 이름으로 찾기 */
export const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
export const num = (el: Element | undefined, key: string) => Number((el as SVGElement | undefined)?.dataset[key] ?? 0)
/**
 * 초기 상태. 타임라인 0초의 set은 0초로 되감을 때 되돌려지므로 DOM에도 바로 적용해 둔다.
 */
export const init = (tl: gsap.core.Timeline, targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}

/** 글자 폭 어림(한글 1em, 그 밖 0.6em, 공백 0.3em) */
export const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣①-⑤]/.test(c) ? size : c === ' ' ? size * 0.3 : size * 0.6), 0)

/** 숫자 글자를 타임라인 구간마다 세어 올린다(한 객체를 이어 트윈해서 되감기에도 맞다) */
export function counter(tl: gsap.core.Timeline, el: Element | undefined, fmt: (n: number) => string, from: number, legs: [to: number, at: number, dur: number][]) {
  if (!el) return
  const o = { v: from }
  el.textContent = fmt(from)
  for (const [to, t, d] of legs) tl.to(o, { v: to, duration: d, ease: 'none', onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, t)
}

// ── DAG 배치(장면 4·5 공통): 추출 → 주문 정리·상품 정리 → 매출 집계 → 리포트 ──
export const JOB_IDS: JobId[] = ['extract', 'orders', 'products', 'sales', 'report']
export const DEPS: Record<JobId, JobId[]> = { extract: [], orders: ['extract'], products: ['extract'], sales: ['orders', 'products'], report: ['sales'] }
export const DAG_EDGES: [JobId, JobId][] = JOB_IDS.flatMap((to) => DEPS[to].map((from) => [from, to] as [JobId, JobId]))
export const DCOL: Record<JobId, number> = { extract: 46, orders: 156, products: 156, sales: 278, report: 392 }
export const DROW: Record<JobId, number> = { extract: 0, orders: -58, products: 58, sales: 0, report: 0 }
export const DNW = 84
export const DNH = 50
export const dagPos = (id: JobId, cy: number) => ({ x: DCOL[id], y: cy + DROW[id] })

/** 상자 테두리와 중심선이 만나는 점 */
export function boxEdge(cx: number, cy: number, w: number, h: number, tx: number, ty: number, gap = 5): [number, number] {
  const dx = tx - cx
  const dy = ty - cy
  if (!dx && !dy) return [cx, cy]
  const s = Math.min(Math.abs((w / 2 + gap) / (dx || 1e-9)), Math.abs((h / 2 + gap) / (dy || 1e-9)))
  return [cx + dx * s, cy + dy * s]
}

/** DAG 화살표 한 개(노드 상자 사이) */
export function DagEdge({ a, b, cy, el, seed }: { a: JobId; b: JobId; cy: number; el?: string; seed: string }) {
  const p = dagPos(a, cy)
  const q = dagPos(b, cy)
  const [x1, y1] = boxEdge(p.x, p.y, DNW, DNH, q.x, q.y, 4)
  const [x2, y2] = boxEdge(q.x, q.y, DNW, DNH, p.x, p.y, 6)
  return <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={seed} rough={0.5} head={8} data-el={el} />
}

const STATUS_COLOR: Record<JobStatus, string> = { ok: 'var(--ok)', fail: 'var(--fail)', wait: 'var(--wait)', retry: 'var(--accent)' }

/**
 * 작업 노드: 상자 + 이름 + 상태 글자 + 상태 아이콘(오른쪽 위) + 상태 테두리.
 * 상태마다 미리 그려 두고 켜고 끈다. data-el: `${el}:${st}`(아이콘), `${el}-t:${st}`(글자), `${el}-ring:${st}`(테두리)
 */
export function JobNode({ x, y, label, el, statuses, status, w = DNW, h = DNH }: { x: number; y: number; label: string; el: string; statuses: JobStatus[]; status?: JobStatus; w?: number; h?: number }) {
  const x0 = x - w / 2
  const y0 = y - h / 2
  return (
    <g data-el={el}>
      <rect x={x0} y={y0} width={w} height={h} rx={4} style={{ fill: 'var(--surface)' }} />
      <RRect x={x0} y={y0} w={w} h={h} seed={`jn-${el}`} rough={0.5} />
      {statuses.map((st) => (
        <rect
          key={st}
          data-el={`${el}-ring:${st}`}
          x={x0 - 2}
          y={y0 - 2}
          width={w + 4}
          height={h + 4}
          rx={6}
          style={{ fill: 'none', stroke: STATUS_COLOR[st], opacity: st === status ? 1 : 0 }}
          strokeWidth={st === 'wait' ? 0 : 2.4}
        />
      ))}
      <Txt x={x} y={y - 3} size={14.5} weight={700} anchor="middle">
        {label}
      </Txt>
      {statuses.map((st) => (
        <Txt key={st} x={x} y={y + 15} size={12} weight={600} anchor="middle" muted el={`${el}-t:${st}`} style={{ opacity: st === status ? 1 : 0 }}>
          {F.status[st]}
        </Txt>
      ))}
      {statuses.map((st) => (
        <Badge key={st} x={x0 + w - 2} y={y0 + 2} status={st} r={10.5} el={`${el}:${st}`} visible={st === status} />
      ))}
    </g>
  )
}

/** JobNode의 상태를 시각 t에 바꾼다 */
export function setJob(tl: gsap.core.Timeline, q: Q, el: string, statuses: JobStatus[], st: JobStatus, t: number, dur = 0.04) {
  for (const s of statuses) {
    const els = [`${el}:${s}`, `${el}-t:${s}`, `${el}-ring:${s}`].flatMap((n) => q(`[data-el="${n}"]`))
    tl.to(els, { opacity: s === st ? 1 : 0, duration: dur }, t)
  }
}
/** JobNode의 처음 상태 */
export function initJob(tl: gsap.core.Timeline, q: Q, el: string, statuses: JobStatus[], st: JobStatus) {
  for (const s of statuses) {
    const els = [`${el}:${s}`, `${el}-t:${s}`, `${el}-ring:${s}`].flatMap((n) => q(`[data-el="${n}"]`))
    init(tl, els, { opacity: s === st ? 1 : 0 })
  }
}

// ── 시계 ─────────────────────────────────────────────────────
/** 큰 시계. 바늘은 12시 방향으로 그려 두고 GSAP rotation(svgOrigin)으로 돌린다: `${el}-h`, `${el}-m` */
export function Clock({ cx, cy, r, el }: { cx: number; cy: number; r: number; el: string }) {
  return (
    <g data-el={el}>
      <REllipse cx={cx} cy={cy} w={r * 2} h={r * 2} seed={`${el}-face`} rough={0.4} fill="var(--surface)" />
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2
        const r0 = k % 3 === 0 ? r - 9 : r - 6
        return <line key={k} x1={cx + Math.sin(a) * r0} y1={cy - Math.cos(a) * r0} x2={cx + Math.sin(a) * (r - 3)} y2={cy - Math.cos(a) * (r - 3)} style={{ stroke: 'var(--line)' }} strokeWidth={k % 3 === 0 ? 2.2 : 1.2} />
      })}
      <g data-el={`${el}-h`} data-origin={`${cx} ${cy}`}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.5} style={{ stroke: 'var(--ink)' }} strokeWidth={3.4} strokeLinecap="round" />
      </g>
      <g data-el={`${el}-m`} data-origin={`${cx} ${cy}`}>
        <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.78} style={{ stroke: 'var(--ink)' }} strokeWidth={2.2} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={3} style={{ fill: 'var(--ink)' }} />
    </g>
  )
}

/** 작은 시계 아이콘(예약 표시) */
export function ClockIcon({ x, y, r = 8, el, color = 'var(--line)' }: { x: number; y: number; r?: number; el?: string; color?: string }) {
  return (
    <g data-el={el} style={{ color }}>
      <circle cx={x} cy={y} r={r} style={{ fill: 'var(--surface)', stroke: 'currentColor' }} strokeWidth={1.6} />
      <path d={`M ${x} ${y - r * 0.62} L ${x} ${y} L ${x + r * 0.5} ${y + r * 0.2}`} style={{ fill: 'none', stroke: 'currentColor' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

// ── 책상 덧그림 ──────────────────────────────────────────────
/** 공용 Desk(Lv2·동료 1명, viewBox 20 0 514 300) 위에 겹치는 Ch3 소품: 모니터 화면, 동료 손의 물건, 줄 그은 포스트잇 */
export function DeskPatch({ screen, hold }: { screen: 'card' | 'dag'; hold: 'mug' | 'laptop' }) {
  const dag: [number, number][] = [
    [316, 137],
    [344, 119],
    [344, 155],
    [372, 137],
    [400, 137],
  ]
  const links = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]]
  return (
    <svg viewBox="20 0 514 300" aria-hidden="true" className="diagram pointer-events-none absolute inset-0 h-full w-full">
      <rect x={303} y={103} width={112} height={68} style={{ fill: 'var(--surface)' }} />
      {screen === 'card' ? (
        <g>
          <ClockIcon x={318} y={121} r={8} color="var(--ink)" />
          <Txt x={331} y={126} size={13} weight={750}>
            {F.deskCard[0]}
          </Txt>
          <Txt x={310} y={152} size={12} weight={600}>
            {F.deskCard[1]}
          </Txt>
          {/* 포스트잇 '새벽 3시 실행 알람'에 줄이 그어져 있다 */}
          <RRect x={212} y={156} w={15} h={15} rough={0.4} seed="ch3-sticky" fill="var(--accent)" fillStyle="hachure" />
          <RLine x1={208} y1={167} x2={231} y2={160} rough={0.3} seed="ch3-strike" stroke="var(--ink)" strokeWidth={1.8} />
        </g>
      ) : (
        <g>
          {links.map(([a, b]) => (
            <line key={`${a}${b}`} x1={dag[a][0] + 8} y1={dag[a][1]} x2={dag[b][0] - 8} y2={dag[b][1]} style={{ stroke: 'var(--muted)' }} strokeWidth={1.2} />
          ))}
          {dag.map(([x, y]) => (
            <g key={`${x}${y}`}>
              <rect x={x - 8} y={y - 6} width={16} height={12} rx={2} style={{ fill: 'var(--surface)', stroke: 'var(--ok)' }} strokeWidth={1.4} />
              <path d={`M ${x - 4} ${y} L ${x - 1} ${y + 3} L ${x + 4} ${y - 3}`} style={{ fill: 'none', stroke: 'var(--ok)' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </g>
      )}
      {hold === 'mug' ? (
        <g>
          <RRect x={468} y={166} w={13} h={15} rough={0.4} seed="ch3-mug" fill="var(--surface)" />
          <RPath d="M 468 170 Q 461 173.5 468 177" rough={0.3} seed="ch3-mug-h" />
        </g>
      ) : (
        <RRect x={458} y={158} w={26} h={19} rough={0.4} seed="ch3-laptop" fill="var(--surface)" />
      )}
    </svg>
  )
}

// ── 휴대폰 ───────────────────────────────────────────────────
export function Phone({ x, y, w, h, seed, dark }: { x: number; y: number; w: number; h: number; seed: string; dark?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} style={{ fill: 'var(--surface)' }} />
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.35} />
      <RLine x1={x + w / 2 - 14} y1={y + 10} x2={x + w / 2 + 14} y2={y + 10} seed={`${seed}-spk`} rough={0.2} strokeWidth={2.2} />
      {dark && <rect x={x + 7} y={y + 20} width={w - 14} height={h - 34} rx={4} style={{ fill: 'var(--line)', opacity: 0.82 }} />}
    </g>
  )
}

// ── 실행 이력 표 ─────────────────────────────────────────────
/**
 * 실행 이력(시각 | 작업 | 시도 | 상태). 모바일은 작업 · 시도 · 상태 세 열에 시각을 작업 이름 아래 작은 글씨로.
 * 행 data-el = `${el}-r${i}`
 */
export function HistoryTable({ x, y, rows, mobile, el }: { x: number; y: number; rows: HistoryRow[]; mobile: boolean; el: string }) {
  const C = F.cols
  const cols = mobile
    ? [
        { key: 'job', label: C.job, w: 120 },
        { key: 'attempt', label: C.attempt, w: 86 },
        { key: 'status', label: C.status, w: 74 },
      ]
    : [
        { key: 'time', label: C.time, w: 58 },
        { key: 'job', label: C.job, w: 88 },
        { key: 'attempt', label: C.attempt, w: 82 },
        { key: 'status', label: C.status, w: 68 },
      ]
  const hH = 30
  const rH = mobile ? 42 : 30
  const size = mobile ? 14.5 : 13.5
  const W = cols.reduce((a, c) => a + c.w, 0)
  const H = hH + rH * rows.length
  const cx: number[] = []
  cols.reduce((a, c) => (cx.push(a), a + c.w), x)
  return (
    <g data-el={el}>
      <rect x={x} y={y} width={W} height={H} style={{ fill: 'var(--surface)' }} />
      <RRect x={x} y={y} w={W} h={H} seed={`${el}-o`} rough={0.35} />
      <RLine x1={x} y1={y + hH} x2={x + W} y2={y + hH} seed={`${el}-h`} rough={0.3} />
      {cols.slice(1).map((c, j) => (
        <RLine key={c.key} x1={cx[j + 1]} y1={y} x2={cx[j + 1]} y2={y + H} seed={`${el}-v${j}`} rough={0.25} strokeWidth={0.9} />
      ))}
      {cols.map((c, j) => (
        <Txt key={c.key} x={cx[j] + 8} y={y + 20} size={size * 0.92} weight={700}>
          {c.label}
        </Txt>
      ))}
      {rows.map((r, i) => {
        const top = y + hH + rH * i
        const base = top + (mobile ? 18 : 20)
        return (
          <g key={i} data-el={`${el}-r${i}`}>
            {i > 0 && <line x1={x} y1={top} x2={x + W} y2={top} style={{ stroke: 'var(--edge)' }} strokeWidth={1} />}
            {cols.map((c, j) => {
              if (c.key === 'status')
                return (
                  <g key={c.key}>
                    <Badge x={cx[j] + 16} y={top + rH / 2} status={r.status} r={8.5} />
                    <Txt x={cx[j] + 30} y={top + rH / 2 + 4.5} size={size * 0.92} weight={600}>
                      {F.status[r.status]}
                    </Txt>
                  </g>
                )
              if (c.key === 'job' && mobile)
                return (
                  <g key={c.key}>
                    <Txt x={cx[j] + 8} y={base} size={size} weight={600}>
                      {r.job}
                    </Txt>
                    <Txt x={cx[j] + 8} y={base + 16} size={12} muted mono>
                      {r.time}
                    </Txt>
                  </g>
                )
              return (
                <Txt key={c.key} x={cx[j] + 8} y={c.key === 'time' || !mobile ? top + rH / 2 + 4.5 : base} size={size} mono={c.key === 'time'} weight={c.key === 'job' ? 600 : 500}>
                  {r[c.key as 'time' | 'job' | 'attempt']}
                </Txt>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

// ── 점선 조각(차례로 켜면 '그려지는' 점선) ─────────────────────
export function dashSegments(pts: [number, number][], dash = 7, gap = 6): string[] {
  const L = [0]
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = L[L.length - 1]
  const at = (s: number): [number, number] => {
    let i = 1
    while (i < L.length - 1 && L[i] < s) i++
    const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1)
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]
  }
  const out: string[] = []
  for (let s = 0; s < total - 1; s += dash + gap) {
    const e = Math.min(s + dash, total)
    const pp = [at(s), ...pts.filter((_, i) => L[i] > s && L[i] < e), at(e)]
    out.push('M ' + pp.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '))
  }
  return out
}

/** 2차·3차 베지어를 점으로 */
export function bezier(p: [number, number][], n = 28): [number, number][] {
  return Array.from({ length: n + 1 }, (_, k) => {
    const t = k / n
    if (p.length === 3) {
      const [a, b, c] = p
      return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t ** 2 * c[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t ** 2 * c[1]]
    }
    const [a, b, c, d] = p
    const u = 1 - t
    return [u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]]
  })
}

/**
 * 점선 화살표: 조각마다 data-el=`${el}`, 화살촉 data-el=`${el}-head`.
 * 조각을 차례로 켜면 그려지고(stagger), 끝에서부터 끄면 지워진다.
 */
export function DashArrow({ pts, el, color = 'var(--line)', width = 1.9, dash = 4, gap = 5, head = 8 }: { pts: [number, number][]; el: string; color?: string; width?: number; dash?: number; gap?: number; head?: number }) {
  const [px, py] = pts[pts.length - 2]
  const [ex, ey] = pts[pts.length - 1]
  const a = Math.atan2(ey - py, ex - px)
  const tip = `M ${ex - head * Math.cos(a - 0.45)} ${ey - head * Math.sin(a - 0.45)} L ${ex} ${ey} L ${ex - head * Math.cos(a + 0.45)} ${ey - head * Math.sin(a + 0.45)}`
  return (
    <g>
      {dashSegments(pts, dash, gap).map((d, i) => (
        <path key={i} data-el={el} d={d} style={{ fill: 'none', stroke: color }} strokeWidth={width} strokeLinecap="round" />
      ))}
      <path data-el={`${el}-head`} d={tip} style={{ fill: 'none', stroke: color }} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 12꼭짓점 외곽선. seed가 있으면 구겨진 종이 카드, 없으면 반듯한 상자(꼭짓점 수가 같아 points 트윈으로 모양이 바뀐다) */
export function cardPts(x: number, y: number, w: number, h: number, seed?: string, amp = 3): string {
  const r = seed ? rng(seed) : null
  const j = () => (r ? (r() - 0.5) * 2 * amp : 0)
  const fr = [0, 0.25, 0.5, 0.75, 1]
  const pts: [number, number][] = [...fr.map((f) => [x + w * f, y] as [number, number]), [x + w, y + h / 2], ...[...fr].reverse().map((f) => [x + w * f, y + h] as [number, number]), [x, y + h / 2]]
  return pts.map(([px, py]) => `${(px + j()).toFixed(1)},${(py + j()).toFixed(1)}`).join(' ')
}
