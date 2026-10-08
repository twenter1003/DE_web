import type { ReactNode } from 'react'
import { Badge, type Status } from '../../components/diagram'
import { Txt } from '../../components/fig'
import type { Q } from '../../components/StepScene'
import { RArrow, RLine, RPath, RRect } from '../../components/sketch'
import { gsap } from '../../lib/gsap'

// Ch8 다이어그램 전용 작은 부품: 원통 저장소, 파일·표 아이콘, 저장 비용 미터기, 꼬리표, 층 색.

/** q 줄임: data-el 이름으로 찾기 */
export const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
export const num = (el: Element, key: string) => Number((el as SVGElement | HTMLElement).dataset[key] ?? 0)
/**
 * 초기 상태. 타임라인 0초의 set은 첫 스크롤 전에는 그려지지 않으므로 DOM에도 바로 적용한다.
 */
export const init = (tl: gsap.core.Timeline, targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}
export const shafts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
export const heads = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))
/** 화살표를 그리는 순서: 보이기 → 몸통 그리기 → 촉 */
export function drawArrow(tl: gsap.core.Timeline, els: Element[], t: number, d = 0.1) {
  tl.to(els, { opacity: 1, duration: 0.02 }, t)
  tl.to(shafts(els), { drawSVG: '100%', duration: d, ease: 'none' }, t)
  tl.to(heads(els), { opacity: 1, duration: 0.03 }, t + d * 0.9)
}
export function hideArrow(tl: gsap.core.Timeline, els: Element[]) {
  init(tl, els, { opacity: 0 })
  init(tl, shafts(els), { drawSVG: '0%' })
  init(tl, heads(els), { opacity: 0 })
}

/** 글자 폭 어림(모노 라틴 0.6em, 한글 1em) */
export const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : c === ' ' ? size * 0.3 : size * 0.6), 0)

// ── 층 색: 탁한 갈색 → 연한 하늘색 → 맑은 파랑(정수장 비유와 같은 순서) ──
// 스테이지 8은 어두운 블루프린트라 글자색을 층마다 정한다(대비 AA 확인).
export const LAYER = {
  bronze: { fill: '#5B4632', text: '#F3E9DD', edge: '#C9A77C' },
  silver: { fill: '#CFEAF7', text: '#10263F', edge: '#8FC6E6' },
  gold: { fill: '#8ECFFF', text: '#0B2036', edge: '#E8B931' },
} as const
/** 물 입자 색(장면 4): 원수 → 정수 → 생수. 셋 다 카드 바탕(surface) 대비 3:1 이상 */
export const WATER = { raw: '#C49A6C', pure: '#BFE6FA', clear: '#5CB8FF' } as const

/** 원통 외곽선 path */
export function cylPath(x: number, y: number, w: number, h: number, ry: number) {
  const x0 = x - w / 2
  const x1 = x + w / 2
  const y0 = y - h / 2
  const y1 = y + h / 2
  const rx = w / 2
  return {
    body: `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry} Z`,
    outline: `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x0} ${y0 + ry} M ${x0} ${y0 + ry} L ${x0} ${y1 - ry} A ${rx} ${ry} 0 0 0 ${x1} ${y1 - ry} L ${x1} ${y0 + ry}`,
  }
}

/** 원통 저장소: 이름·보조 이름을 위쪽에, 안은 비워 둔다(children) */
export function Cyl({
  x,
  y,
  w,
  h,
  ry = 10,
  label,
  sub,
  size = 15,
  seed,
  el,
  dash,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  ry?: number
  label?: string
  sub?: string
  size?: number
  seed: string
  el?: string
  dash?: string
  children?: ReactNode
}) {
  const p = cylPath(x, y, w, h, ry)
  const top = y - h / 2 + ry * 2
  return (
    <g data-el={el}>
      <path d={p.body} style={{ fill: 'var(--surface)' }} />
      <RPath d={p.outline} seed={seed} rough={0.6} dash={dash} />
      {label && (
        <Txt x={x} y={top + size + 6} size={size} weight={700} anchor="middle">
          {label}
        </Txt>
      )}
      {sub && (
        <Txt x={x} y={top + size + 24} size={size * 0.78} anchor="middle" muted>
          {sub}
        </Txt>
      )}
      {children}
    </g>
  )
}

/** 파일 아이콘(접힌 모서리). 중심 x, 위쪽 y */
export function FileIcon({ x, y, w = 34, h = 44, seed, dash, el, stroke, strokeWidth }: { x: number; y: number; w?: number; h?: number; seed: string; dash?: string; el?: string; stroke?: string; strokeWidth?: number }) {
  const f = Math.round(w * 0.28)
  const x0 = x - w / 2
  const x1 = x + w / 2
  const d = `M ${x0} ${y} L ${x1 - f} ${y} L ${x1} ${y + f} L ${x1} ${y + h} L ${x0} ${y + h} Z M ${x1 - f} ${y} L ${x1 - f} ${y + f} L ${x1} ${y + f}`
  return (
    <g data-el={el}>
      <path d={`M ${x0} ${y} L ${x1 - f} ${y} L ${x1} ${y + f} L ${x1} ${y + h} L ${x0} ${y + h} Z`} style={{ fill: 'var(--surface)' }} />
      <RPath d={d} seed={seed} rough={0.35} dash={dash} stroke={stroke} strokeWidth={strokeWidth} />
      <RPath d={`M ${x0 + 6} ${y + h * 0.45} L ${x1 - 6} ${y + h * 0.45} M ${x0 + 6} ${y + h * 0.62} L ${x1 - 6} ${y + h * 0.62} M ${x0 + 6} ${y + h * 0.79} L ${x1 - 10} ${y + h * 0.79}`} seed={`${seed}-l`} rough={0.2} strokeWidth={1} stroke={stroke ?? 'var(--muted)'} />
    </g>
  )
}

/** '주문' 표 아이콘: 머리글 + 빈 행 n개. 행 채움은 data-el=`${el}-fill` (data-i) */
export function TableIcon({ x, y, w = 84, rows = 4, rowH = 9, label, seed, el }: { x: number; y: number; w?: number; rows?: number; rowH?: number; label: string; seed: string; el: string }) {
  const head = 18
  const h = head + rows * rowH
  const x0 = x - w / 2
  return (
    <g data-el={el}>
      <rect x={x0} y={y} width={w} height={h} style={{ fill: 'var(--bg)' }} />
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} data-el={`${el}-fill`} data-i={i} x={x0 + 4} y={y + head + i * rowH + 2} width={w - 8} height={rowH - 4} rx={1.5} style={{ fill: 'var(--accent)' }} />
      ))}
      <RRect x={x0} y={y} w={w} h={h} seed={seed} rough={0.35} />
      <RLine x1={x0} y1={y + head} x2={x0 + w} y2={y + head} seed={`${seed}-h`} rough={0.25} />
      <RLine x1={x0 + w * 0.42} y1={y + head} x2={x0 + w * 0.42} y2={y + h} seed={`${seed}-v`} rough={0.2} strokeWidth={0.9} />
      <Txt x={x} y={y + 13.5} size={12.5} weight={750} anchor="middle">
        {label}
      </Txt>
    </g>
  )
}

/** 꼬리표(둥근 상자 + 글자). 중심 x, 글자 기준선 y */
export function Tag({ x, y, text, size = 12.5, el, color, fill = 'var(--bg)', anchor = 'middle' }: { x: number; y: number; text: string; size?: number; el?: string; color?: string; fill?: string; anchor?: 'start' | 'middle' }) {
  const w = tw(text, size) + 14
  const x0 = anchor === 'middle' ? x - w / 2 : x
  return (
    <g data-el={el}>
      <rect x={x0} y={y - size - 3} width={w} height={size + 9} rx={4} style={{ fill, stroke: color ?? 'var(--line)' }} strokeWidth={1.3} />
      <Txt x={x0 + w / 2} y={y} size={size} weight={700} anchor="middle" color={color}>
        {text}
      </Txt>
    </g>
  )
}

/** 상태 배지 + 글자 한 줄 */
export function StatusText({ x, y, status, text, size = 13, r = 9, el, weight = 650 }: { x: number; y: number; status: Status; text: string; size?: number; r?: number; el?: string; weight?: number }) {
  return (
    <g data-el={el}>
      <Badge x={x + r} y={y - size * 0.36} status={status} r={r} />
      <Txt x={x + r * 2 + 6} y={y} size={size} weight={weight}>
        {text}
      </Txt>
    </g>
  )
}

export interface MeterSeg {
  len: number
  label: string
  el: string
  fill: string
}

/**
 * 저장 비용 미터기(세로 막대). 구간을 아래에서 위로 쌓고, 바늘(data-el=`${el}-needle`)이 합친 높이를 가리킨다.
 * 구간 data-el=seg.el (scaleY 0 → 1, 아래 기준), 구간 이름 data-el=`${seg.el}-l`
 */
export function Meter({ x, y, h = 120, w = 20, title, segs, el = 'meter', seed = 'meter' }: { x: number; y: number; h?: number; w?: number; title: string; segs: MeterSeg[]; el?: string; seed?: string }) {
  const base = y + h
  let acc = 0
  const total = segs.reduce((a, s) => a + s.len, 0)
  return (
    <g data-el={el}>
      <Txt x={x + w + 16} y={y - 12} size={13.5} weight={750} anchor="end">
        {title}
      </Txt>
      <rect x={x} y={y} width={w} height={h} style={{ fill: 'var(--bg)' }} />
      {segs.map((s) => {
        const top = base - acc - s.len
        acc += s.len
        return (
          <g key={s.el}>
            <rect data-el={s.el} x={x + 2} y={top} width={w - 4} height={s.len} style={{ fill: s.fill }} />
            <RLine x1={x - 4} y1={top} x2={x + w} y2={top} seed={`${seed}-${s.el}`} rough={0.2} strokeWidth={1.1} data-el={`${s.el}-tick`} />
            <Txt x={x - 8} y={top + s.len / 2 + 4.5} size={13} weight={650} anchor="end" el={`${s.el}-l`}>
              {s.label}
            </Txt>
          </g>
        )
      })}
      <RRect x={x} y={y} w={w} h={h} seed={`${seed}-o`} rough={0.3} />
      <g data-el={`${el}-needle`} data-top={base - total} data-base={base}>
        <path d={`M ${x + w + 2} ${base - total} L ${x + w + 13} ${base - total - 6} L ${x + w + 13} ${base - total + 6} Z`} style={{ fill: 'var(--ink)' }} />
        <line x1={x - 2} y1={base - total} x2={x + w + 2} y2={base - total} style={{ stroke: 'var(--ink)' }} strokeWidth={2.4} />
      </g>
    </g>
  )
}

/** 짧은 화살표(라벨 없이) */
export function Arrow({ x1, y1, x2, y2, seed, el, dash, stroke }: { x1: number; y1: number; x2: number; y2: number; seed: string; el?: string; dash?: string; stroke?: string }) {
  return (
    <g data-el={el}>
      <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={seed} rough={0.45} dash={dash} stroke={stroke} />
    </g>
  )
}

/** 작은 카드(둥근 상자) */
export function Card({ x, y, w, h, seed, el, children, fill = 'var(--surface)', stroke }: { x: number; y: number; w: number; h: number; seed: string; el?: string; children?: ReactNode; fill?: string; stroke?: string }) {
  return (
    <g data-el={el}>
      <rect x={x} y={y} width={w} height={h} rx={6} style={{ fill }} />
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.35} stroke={stroke} />
      {children}
    </g>
  )
}

// ── 작은 표 ─────────────────────────────────────────────────────

export interface MCol {
  key: string
  label: string
  w: number
  end?: boolean
}

/** 표 배치: 열의 왼쪽 x, 행의 위쪽 y(마지막 값은 표 아래 끝) */
export function tableLayout(x: number, y: number, cols: MCol[], n: number, headH: number, rowH: number | number[]) {
  const colX: number[] = []
  let cx = x
  for (const c of cols) {
    colX.push(cx)
    cx += c.w
  }
  const tops = [y + headH]
  for (let i = 0; i < n; i++) tops.push(tops[i] + (Array.isArray(rowH) ? rowH[i] : rowH))
  return { colX, tops, width: cx - x, textX: (j: number) => (cols[j].end ? colX[j] + cols[j].w - 8 : colX[j] + 8) }
}
/** 칸 글자 기준선: 행 높이가 커도 위쪽 줄에 둔다 */
export const cellBase = (top: number, h: number, size = 12.5, valign: 'top' | 'middle' = 'middle') =>
  valign === 'top' ? top + Math.min(h, 26) * 0.66 + 1 : top + h / 2 + size * 0.36

/**
 * 작은 SVG 표. 칸 글자 data-el=`${el}-c{i}-{key}`, 행 강조 `${el}-hl{i}`.
 * split을 주면 그 행부터는 따로 묶어(data-el=`${el}-extra`) 나중에 붙는 행으로 그린다.
 */
export function MiniTable({
  x,
  y,
  cols,
  rows,
  headH = 22,
  rowH,
  size = 12.5,
  el,
  seed,
  split,
  valign = 'middle',
}: {
  x: number
  y: number
  cols: MCol[]
  rows: Record<string, string>[]
  headH?: number
  rowH: number | number[]
  size?: number
  el: string
  seed: string
  split?: number
  /** 칸 글자 세로 정렬. 'top'은 높은 행에서도 위쪽 줄에 둔다(아래에 작은 이력을 붙일 때) */
  valign?: 'top' | 'middle'
}) {
  const L = tableLayout(x, y, cols, rows.length, headH, rowH)
  const end = split ?? rows.length
  const mainBottom = L.tops[end]
  const bottom = L.tops[rows.length]
  const W = L.width
  const cells = (from: number, to: number) =>
    rows.slice(from, to).map((r, k) => {
      const i = from + k
      const h = L.tops[i + 1] - L.tops[i]
      return (
        <g key={i}>
          <rect data-el={`${el}-hl${i}`} x={x} y={L.tops[i]} width={W} height={h} style={{ fill: 'var(--accent)', opacity: 0 }} />
          {i > 0 && i !== end && <RLine x1={x} y1={L.tops[i]} x2={x + W} y2={L.tops[i]} seed={`${seed}-r${i}`} rough={0.25} strokeWidth={0.8} />}
          {cols.map((c, j) => (
            <text key={c.key} data-el={`${el}-c${i}-${c.key}`} x={L.textX(j)} y={cellBase(L.tops[i], h, size, valign)} textAnchor={c.end ? 'end' : 'start'} className="t-sans" style={{ fontSize: size }}>
              {r[c.key]}
            </text>
          ))}
        </g>
      )
    })
  return (
    <g data-el={el}>
      <g>
        <rect x={x} y={y} width={W} height={mainBottom - y} style={{ fill: 'var(--surface)' }} />
        {cells(0, end)}
        <RRect x={x} y={y} w={W} h={mainBottom - y} seed={`${seed}-o`} rough={0.35} />
        <RLine x1={x} y1={y + headH} x2={x + W} y2={y + headH} seed={`${seed}-h`} rough={0.3} />
        {cols.slice(1).map((c, j) => (
          <RLine key={c.key} x1={L.colX[j + 1]} y1={y} x2={L.colX[j + 1]} y2={mainBottom} seed={`${seed}-v${j}`} rough={0.25} strokeWidth={0.8} />
        ))}
        {cols.map((c, j) => (
          <text key={c.key} x={L.textX(j)} y={y + headH / 2 + size * 0.34} textAnchor={c.end ? 'end' : 'start'} className="t-sans" style={{ fontSize: size * 0.95, fontWeight: 700 }}>
            {c.label}
          </text>
        ))}
      </g>
      {end < rows.length && (
        <g data-el={`${el}-extra`}>
          <rect x={x} y={mainBottom} width={W} height={bottom - mainBottom} style={{ fill: 'var(--surface)' }} />
          {cells(end, rows.length)}
          <RPath d={`M ${x} ${mainBottom} L ${x} ${bottom} L ${x + W} ${bottom} L ${x + W} ${mainBottom}`} seed={`${seed}-x`} rough={0.35} />
          {cols.slice(1).map((c, j) => (
            <RLine key={c.key} x1={L.colX[j + 1]} y1={mainBottom} x2={L.colX[j + 1]} y2={bottom} seed={`${seed}-xv${j}`} rough={0.25} strokeWidth={0.8} />
          ))}
        </g>
      )}
    </g>
  )
}

/** 꺾은선을 따라 점선 조각들을 만든다(한 조각 = path 하나). 조각을 차례로 켜면 '그려지는' 점선이 된다 */
export function dashSegments(pts: [number, number][], dash = 6, gap = 5): string[] {
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
