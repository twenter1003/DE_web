import { Fragment } from 'react'
import type { NodeKind } from '../content/map'
import { seedOf } from '../lib/rough'
import { RLine, RPath, RRect, REllipse } from './sketch'

// 다이어그램 공통 부품. 모두 SVG <g>를 그리고 data-el 로 애니메이션 대상을 표시한다.

export type Status = 'ok' | 'fail' | 'wait' | 'retry'

const STATUS_COLOR: Record<Status, string> = {
  ok: 'var(--ok)',
  fail: 'var(--fail)',
  wait: 'var(--wait)',
  retry: 'var(--accent)',
}
export const STATUS_GLYPH: Record<Status, string> = { ok: '✓', fail: '✕', wait: '⏸', retry: '↻' }

/** 상태 배지: 원 + 기호. 색만으로 구분하지 않도록 기호가 모두 다르다 */
export function Badge({ x, y, status, r = 11, el, visible = true }: { x: number; y: number; status: Status; r?: number; el?: string; visible?: boolean }) {
  return (
    <g data-el={el} style={{ opacity: visible ? 1 : 0 }} transform={`translate(${x} ${y})`}>
      <circle r={r} style={{ fill: 'var(--surface)', stroke: STATUS_COLOR[status] }} strokeWidth={2.2} />
      <text
        y={r * 0.38}
        textAnchor="middle"
        style={{ fill: STATUS_COLOR[status], fontSize: r * 1.15, fontWeight: 700, fontFamily: 'var(--font-sans)' }}
      >
        {STATUS_GLYPH[status]}
      </text>
    </g>
  )
}

interface NodeProps {
  x: number
  y: number
  w?: number
  h?: number
  label: string
  sub?: string
  kind?: NodeKind
  seed?: string
  el?: string
  /** 처음부터 보이는 상태 배지 */
  status?: Status
  /** 미리 그려 두고 타임라인에서 켜고 끌 상태 배지들. data-el = `${el}:${status}` */
  statuses?: Status[]
  /** 라벨 크기 배율 */
  scale?: number
  muted?: boolean
  /** 라벨 텍스트 묶음에 붙일 data-el(라벨 교체 애니메이션용) */
  labelEl?: string
}

/** 파이프라인 노드. 중심 좌표 기준. 저장소는 원통, 파일·문서는 접힌 모서리, 나머지는 상자 */
export function Node({ x, y, w = 160, h = 54, label, sub, kind = 'process', seed, el, status, statuses, scale = 1, muted, labelEl }: NodeProps) {
  const x0 = x - w / 2
  const y0 = y - h / 2
  const x1 = x + w / 2
  const y1 = y + h / 2
  const s = seed ?? `${label}${x},${y}`
  const dash = kind === 'proposal' ? '7 6' : undefined
  let shape
  if (kind === 'store') {
    const rx = w / 2
    const ry = Math.min(9, h * 0.16)
    const body = `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry} Z`
    const outline = `M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x0} ${y0 + ry} M ${x0} ${y0 + ry} L ${x0} ${y1 - ry} A ${rx} ${ry} 0 0 0 ${x1} ${y1 - ry} L ${x1} ${y0 + ry}`
    shape = (
      <>
        <path d={body} style={{ fill: 'var(--surface)' }} />
        <RPath d={outline} seed={s} rough={0.6} />
      </>
    )
  } else if (kind === 'doc') {
    const f = 12
    shape = (
      <>
        <path d={`M ${x0} ${y0} L ${x1 - f} ${y0} L ${x1} ${y0 + f} L ${x1} ${y1} L ${x0} ${y1} Z`} style={{ fill: 'var(--surface)' }} />
        <RPath d={`M ${x0} ${y0} L ${x1 - f} ${y0} L ${x1} ${y0 + f} L ${x1} ${y1} L ${x0} ${y1} Z M ${x1 - f} ${y0} L ${x1 - f} ${y0 + f} L ${x1} ${y0 + f}`} seed={s} rough={0.6} />
      </>
    )
  } else {
    shape = (
      <>
        <rect x={x0} y={y0} width={w} height={h} rx={kind === 'source' ? 14 : 4} style={{ fill: 'var(--surface)' }} />
        <RRect x={x0} y={y0} w={w} h={h} seed={s} rough={0.6} dash={dash} />
      </>
    )
  }
  return (
    <g data-el={el} style={muted || kind === 'proposal' ? { opacity: 0.78 } : undefined}>
      {shape}
      <NodeLabel x={x} y={y} label={label} sub={sub} scale={scale} el={labelEl} />
      {status && <Badge x={x1 - 2} y={y0 + 2} status={status} />}
      {statuses?.map((st) => (
        <Badge key={st} x={x1 - 2} y={y0 + 2} status={st} el={`${el}:${st}`} visible={st === status} />
      ))}
    </g>
  )
}

export function NodeLabel({ x, y, label, sub, scale = 1, el }: { x: number; y: number; label: string; sub?: string; scale?: number; el?: string }) {
  const ly = sub ? y - 3 * scale : y + 5 * scale
  return (
    <g data-el={el}>
      <text x={x} y={ly} textAnchor="middle" className="t-sans" style={{ fontSize: 15 * scale, fontWeight: 650 }}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 15 * scale} textAnchor="middle" className="t-muted" style={{ fontSize: 11.5 * scale }}>
          {sub}
        </text>
      )}
    </g>
  )
}

/** 결정적 난수(같은 seed면 같은 배치) */
export function rng(seed: string | number) {
  let a = typeof seed === 'number' ? seed : seedOf(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 데이터 입자: 강조색 작은 점·사각형. data-el="{el}" 에 개별 인덱스 data-i */
export function Particles({
  n,
  x,
  y,
  w,
  h,
  el = 'p',
  seed = 'p',
  size = 5,
  shape = 'dot',
}: {
  n: number
  x: number
  y: number
  w: number
  h: number
  el?: string
  seed?: string
  size?: number
  shape?: 'dot' | 'square'
}) {
  const r = rng(seed)
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const px = x + r() * w
        const py = y + r() * h
        return shape === 'dot' ? (
          <circle key={i} data-el={el} data-i={i} cx={px} cy={py} r={size / 2} style={{ fill: 'var(--accent)' }} />
        ) : (
          <rect key={i} data-el={el} data-i={i} x={px - size / 2} y={py - size / 2} width={size} height={size} rx={1} style={{ fill: 'var(--accent)' }} />
        )
      })}
    </g>
  )
}

export interface Col {
  key: string
  label: string
  w: number
  align?: 'start' | 'end'
}

/**
 * SVG 표. 행 강조(data-el=`${el}-hl-r{i}`), 열 강조(`${el}-hl-c{key}`), 셀 텍스트(`${el}-c{i}-{key}`), 행 묶음(`${el}-r{i}`)
 */
export function SvgTable({
  x,
  y,
  cols,
  rows,
  el = 't',
  rowH = 28,
  seed = 'table',
  fontSize = 12.5,
}: {
  x: number
  y: number
  cols: Col[]
  rows: Record<string, string | number>[]
  el?: string
  rowH?: number
  seed?: string
  fontSize?: number
}) {
  const width = cols.reduce((a, c) => a + c.w, 0)
  const height = rowH * (rows.length + 1)
  let cx = x
  const colX = cols.map((c) => {
    const v = cx
    cx += c.w
    return v
  })
  return (
    <g data-el={el}>
      <rect x={x} y={y} width={width} height={height} style={{ fill: 'var(--surface)' }} />
      {cols.map((c, j) => (
        <rect key={c.key} data-el={`${el}-hl-c${c.key}`} x={colX[j]} y={y} width={c.w} height={height} style={{ fill: 'var(--accent)', opacity: 0 }} />
      ))}
      {rows.map((_, i) => (
        <rect key={i} data-el={`${el}-hl-r${i}`} x={x} y={y + rowH * (i + 1)} width={width} height={rowH} style={{ fill: 'var(--accent)', opacity: 0 }} />
      ))}
      <RRect x={x} y={y} w={width} h={height} seed={`${seed}-o`} rough={0.4} />
      <RLine x1={x} y1={y + rowH} x2={x + width} y2={y + rowH} seed={`${seed}-h`} rough={0.4} />
      {cols.slice(1).map((c, j) => (
        <RLine key={c.key} x1={colX[j + 1]} y1={y} x2={colX[j + 1]} y2={y + height} seed={`${seed}-v${j}`} rough={0.3} strokeWidth={0.9} />
      ))}
      {cols.map((c, j) => (
        <text
          key={c.key}
          x={c.align === 'end' ? colX[j] + c.w - 8 : colX[j] + 8}
          y={y + rowH * 0.66}
          textAnchor={c.align === 'end' ? 'end' : 'start'}
          style={{ fontSize: fontSize * 0.92, fontWeight: 700 }}
        >
          {c.label}
        </text>
      ))}
      {rows.map((row, i) => (
        <g key={i} data-el={`${el}-r${i}`}>
          {cols.map((c, j) => (
            <text
              key={c.key}
              data-el={`${el}-c${i}-${c.key}`}
              x={c.align === 'end' ? colX[j] + c.w - 8 : colX[j] + 8}
              y={y + rowH * (i + 1) + rowH * 0.66}
              textAnchor={c.align === 'end' ? 'end' : 'start'}
              style={{ fontSize }}
            >
              {row[c.key]}
            </text>
          ))}
        </g>
      ))}
    </g>
  )
}

/** 반원 게이지. 바늘(data-el=`${el}-needle`)을 회전시켜 값을 표시. 0~1 → -90°~90° */
export function Gauge({ x, y, r = 60, label, el = 'gauge', value = 0, seed = 'gauge' }: { x: number; y: number; r?: number; label: string; el?: string; value?: number; seed?: string }) {
  const arc = (a0: number, a1: number, rr: number) => {
    const p = (a: number) => [x + rr * Math.cos(Math.PI + a * Math.PI), y + rr * Math.sin(Math.PI + a * Math.PI)]
    const [sx, sy] = p(a0)
    const [ex, ey] = p(a1)
    return `M ${sx} ${sy} A ${rr} ${rr} 0 0 1 ${ex} ${ey}`
  }
  return (
    <g data-el={el}>
      <RPath d={arc(0, 1, r)} seed={`${seed}-a`} rough={0.4} />
      <path d={arc(0.7, 1, r - 7)} style={{ stroke: 'var(--fail)', fill: 'none' }} strokeWidth={6} strokeLinecap="round" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <RLine
          key={t}
          x1={x + (r - 4) * Math.cos(Math.PI + t * Math.PI)}
          y1={y + (r - 4) * Math.sin(Math.PI + t * Math.PI)}
          x2={x + (r + 5) * Math.cos(Math.PI + t * Math.PI)}
          y2={y + (r + 5) * Math.sin(Math.PI + t * Math.PI)}
          seed={`${seed}-t${t}`}
          rough={0.2}
        />
      ))}
      {/* 회전은 GSAP에서 svgOrigin: `${x} ${y}` 로 */}
      <g data-el={`${el}-needle`} data-origin={`${x} ${y}`} transform={`rotate(${-90 + value * 180} ${x} ${y})`}>
        <line x1={x} y1={y} x2={x} y2={y - r + 12} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </g>
      <circle cx={x} cy={y} r={5} style={{ fill: 'currentColor' }} />
      <text x={x} y={y + 24} textAnchor="middle" className="t-sans" style={{ fontSize: 13, fontWeight: 600 }}>
        {label}
      </text>
    </g>
  )
}

/** 코드 타이핑(DOM). 글자마다 span(data-ch). 스크롤 연동으로 opacity를 켠다 */
export function CodeType({ code, el = 'code', className = '' }: { code: string; el?: string; className?: string }) {
  return (
    <pre data-el={el} className={`whitespace-pre-wrap rounded-lg border-[1.5px] border-edge bg-surface p-4 font-mono text-[0.8125rem] leading-6 md:text-sm ${className}`}>
      <code>
        {code.split('\n').map((line, li) => (
          <Fragment key={li}>
            {li > 0 && '\n'}
            {Array.from(line).map((ch, i) => (
              <span key={i} data-ch>
                {ch}
              </span>
            ))}
          </Fragment>
        ))}
      </code>
    </pre>
  )
}

/** 스케치 원 하나(입자·점 표시용) */
export function Dot({ cx, cy, r = 6, el, seed }: { cx: number; cy: number; r?: number; el?: string; seed?: string }) {
  return <REllipse cx={cx} cy={cy} w={r * 2} h={r * 2} rough={0.3} seed={seed ?? `dot${cx},${cy}`} fill="var(--accent)" data-el={el} />
}
