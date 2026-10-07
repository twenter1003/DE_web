import type { OrderRow } from '../../content/chapters/ch2'
import { rng } from '../../components/diagram'
import { RLine, RPath, RRect } from '../../components/sketch'

// Ch2 다이어그램 전용 작은 부품: 데이터 블록(울퉁불퉁 ↔ 반듯), 순서대로 그려지는 점선, 표.

/** 글자 폭 어림(모노 라틴 0.6em, 한글 1em) */
export const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : c === ' ' ? size * 0.3 : size * 0.6), 0)

/**
 * 블록 외곽선 꼭짓점 12개. seed를 주면 울퉁불퉁, 없으면 반듯한 사각형.
 * 꼭짓점 수가 같아서 points 속성을 그대로 트윈하면 '반듯해지는' 모양 변화가 된다(MorphSVG 대신).
 */
export function blockPts(x: number, y: number, w: number, h: number, seed?: string, amp = 3): string {
  const r = seed ? rng(seed) : null
  const j = () => (r ? (r() - 0.5) * 2 * amp : 0)
  const fr = [0, 0.25, 0.5, 0.75, 1]
  const pts: [number, number][] = [...fr.map((f) => [x + w * f, y] as [number, number]), [x + w, y + h / 2], ...[...fr].reverse().map((f) => [x + w * f, y + h] as [number, number]), [x, y + h / 2]]
  return pts.map(([px, py]) => `${(px + j()).toFixed(1)},${(py + j()).toFixed(1)}`).join(' ')
}

/** 데이터 블록 하나(강조색 칩 또는 표의 한 줄 외곽선) */
export function Block({ x, y, w, h, seed, amp, el, fill = 'var(--accent)', stroke }: { x: number; y: number; w: number; h: number; seed?: string; amp?: number; el?: string; fill?: string; stroke?: string }) {
  return (
    <polygon
      data-el={el}
      data-neat={blockPts(x, y, w, h)}
      points={blockPts(x, y, w, h, seed, amp)}
      style={{ fill, stroke: stroke ?? 'none' }}
      strokeWidth={stroke ? 1.5 : 0}
      strokeLinejoin="round"
    />
  )
}

/** 꺾은선을 따라 점선 조각들을 만든다(한 조각 = path 하나). 조각을 차례로 켜면 '그려지는' 점선이 된다 */
export function dashSegments(pts: [number, number][], dash = 8, gap = 6): string[] {
  const L = [0]
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = L[L.length - 1]
  const pointAt = (s: number): [number, number] => {
    let i = 1
    while (i < L.length - 1 && L[i] < s) i++
    const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1)
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]
  }
  const out: string[] = []
  for (let s = 0; s < total - 1; s += dash + gap) {
    const e = Math.min(s + dash, total)
    const pp = [pointAt(s), ...pts.filter((_, i) => L[i] > s && L[i] < e), pointAt(e)]
    out.push('M ' + pp.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '))
  }
  return out
}

export const rectPts = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
  [x, y],
]

export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, n = 48): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
  })

/** 순서대로 켜는 점선(data-el 조각 여러 개) */
export function DashTrace({ pts, el, color = 'currentColor', width = 1.8, dash, gap }: { pts: [number, number][]; el: string; color?: string; width?: number; dash?: number; gap?: number }) {
  return (
    <g>
      {dashSegments(pts, dash, gap).map((d, i) => (
        <path key={i} data-el={el} d={d} style={{ fill: 'none', stroke: color }} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  )
}

// ── 표 ─────────────────────────────────────────────────────────

export type ColKey = keyof OrderRow
export interface TCol {
  key: ColKey
  x: number
  w: number
  end?: boolean
  /** 다른 열 자리에 겹쳐 그리는 열(모바일에서 배송지 ↔ 주문일 교체) */
  overlay?: boolean
}

/**
 * SVG 표. 머리글 data-el=`${el}-h-${key}`, 칸 `${el}-c${i}-${key}`, 행 `${el}-r${i}`, 열 강조 `${el}-hl-${key}`
 */
export function DataTable({
  y,
  cols,
  rows,
  labels,
  el,
  rowH,
  size,
  seed,
}: {
  y: number
  cols: TCol[]
  rows: OrderRow[]
  labels: Record<ColKey, string>
  el: string
  rowH: number
  size: number
  seed: string
}) {
  const main = cols.filter((c) => !c.overlay)
  const x0 = main[0].x
  const x1 = main[main.length - 1].x + main[main.length - 1].w
  const h = rowH * (rows.length + 1)
  const tx = (c: TCol) => (c.end ? c.x + c.w - 8 : c.x + 8)
  return (
    <g data-el={el}>
      <rect x={x0} y={y} width={x1 - x0} height={h} style={{ fill: 'var(--surface)' }} />
      {cols.map((c) => (
        <rect key={c.key} data-el={`${el}-hl-${c.key}`} x={c.x} y={y} width={c.w} height={h} style={{ fill: 'var(--accent)', opacity: 0 }} />
      ))}
      <RRect x={x0} y={y} w={x1 - x0} h={h} seed={`${seed}-o`} rough={0.4} />
      <RLine x1={x0} y1={y + rowH} x2={x1} y2={y + rowH} seed={`${seed}-h`} rough={0.4} />
      {main.slice(1).map((c) => (
        <RLine key={c.key} x1={c.x} y1={y} x2={c.x} y2={y + h} seed={`${seed}-v${c.key}`} rough={0.3} strokeWidth={0.9} />
      ))}
      {cols.map((c) => (
        <text key={c.key} data-el={`${el}-h-${c.key}`} x={tx(c)} y={y + rowH * 0.68} textAnchor={c.end ? 'end' : 'start'} style={{ fontSize: size * 0.92, fontWeight: 700 }}>
          {labels[c.key]}
        </text>
      ))}
      {rows.map((r, i) => (
        <g key={i} data-el={`${el}-r${i}`}>
          {cols.map((c) => (
            <text key={c.key} data-el={`${el}-c${i}-${c.key}`} x={tx(c)} y={y + rowH * (i + 1) + rowH * 0.68} textAnchor={c.end ? 'end' : 'start'} style={{ fontSize: size }}>
              {r[c.key]}
            </text>
          ))}
        </g>
      ))}
    </g>
  )
}

/** 작은 문서 아이콘(CSV 한 장) */
export function DocIcon({ x, y, w = 22, h = 28, seed, el }: { x: number; y: number; w?: number; h?: number; seed: string; el?: string }) {
  const f = 6
  return (
    <g data-el={el}>
      <path d={`M ${x} ${y} L ${x + w - f} ${y} L ${x + w} ${y + f} L ${x + w} ${y + h} L ${x} ${y + h} Z`} style={{ fill: 'var(--surface)' }} />
      <RPath d={`M ${x} ${y} L ${x + w - f} ${y} L ${x + w} ${y + f} L ${x + w} ${y + h} L ${x} ${y + h} Z M ${x + 4} ${y + 11} L ${x + w - 4} ${y + 11} M ${x + 4} ${y + 17} L ${x + w - 4} ${y + 17} M ${x + 4} ${y + 23} L ${x + w - 8} ${y + 23}`} seed={seed} rough={0.35} strokeWidth={1.2} />
    </g>
  )
}
