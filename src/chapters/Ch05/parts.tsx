import { Badge } from '../../components/diagram'
import { Txt } from '../../components/fig'
import { REllipse, RLine, RPath, RRect } from '../../components/sketch'
import type { Q } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'

// Ch5 다이어그램 전용 작은 부품: 세로 게이지, 아이콘(말풍선·사진·디스크·메모리·폴더), 꺾은 화살표.

/** q 줄임: data-el 이름으로 찾기 */
export const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
export const num = (el: Element | undefined, key: string) => Number((el as SVGElement | undefined)?.dataset[key] ?? 0)
/** 초기 상태: DOM에도 바로 적용하고 타임라인 0초에도 고정한다 */
export const init = (tl: gsap.core.Timeline, targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
  if (Array.isArray(targets) && !targets.length) return
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}
/** 글자 폭 어림(라틴 0.6em, 한글 1em) */
export const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : c === ' ' ? size * 0.32 : size * 0.6), 0)

// ── 세로 게이지(메모리 사용량) ─────────────────────────────────
// 70%까지 초록 구간, 그 위는 빨간 구간. 채움은 두 조각(data-el `${el}-ok`, `${el}-hot`)을 아래에서 키운다.
export const HOT = 70

export function VGauge({ x, y, w = 28, h, label, el, seed }: { x: number; y: number; w?: number; h: number; label: readonly string[]; el: string; seed: string }) {
  const okH = (h * HOT) / 100
  return (
    <g data-el={el}>
      {label.map((l, i) => (
        <Txt key={l} x={x + w / 2} y={y - 12 - (label.length - 1 - i) * 16} size={13} weight={650} anchor="middle">
          {l}
        </Txt>
      ))}
      <rect x={x} y={y} width={w} height={h} style={{ fill: 'var(--surface)' }} />
      <rect data-el={`${el}-ok`} x={x + 2} y={y + h - okH} width={w - 4} height={okH - 2} style={{ fill: 'var(--ok)', opacity: 0.85 }} />
      <rect data-el={`${el}-hot`} x={x + 2} y={y + 2} width={w - 4} height={h - okH - 2} style={{ fill: 'var(--fail)', opacity: 0.85 }} />
      <RRect x={x} y={y} w={w} h={h} seed={`${seed}-o`} rough={0.35} />
      {/* 구간 띠: 색 + 경계 눈금 */}
      <rect x={x + w + 4} y={y + h - okH} width={4} height={okH} style={{ fill: 'var(--ok)' }} />
      <rect x={x + w + 4} y={y} width={4} height={h - okH} style={{ fill: 'var(--fail)' }} />
      <line x1={x - 4} y1={y + h - okH} x2={x + w + 8} y2={y + h - okH} style={{ stroke: 'var(--line)' }} strokeWidth={1.2} strokeDasharray="3 2" />
    </g>
  )
}

/** 게이지 값을 즉시 그린다(0~100) */
export function drawGauge(q: Q, el: string, v: number, pctEl?: Element, fmt?: (n: number) => string) {
  const ok = q(`[data-el="${el}-ok"]`)
  const hot = q(`[data-el="${el}-hot"]`)
  gsap.set(ok, { scaleY: Math.min(v, HOT) / HOT, transformOrigin: '50% 100%' })
  gsap.set(hot, { scaleY: Math.max(0, v - HOT) / (100 - HOT), transformOrigin: '50% 100%' })
  if (pctEl && fmt) pctEl.textContent = fmt(Math.round(v))
}

/** 게이지 트윈: 프록시 값을 움직이고 매 프레임 그린다. 시작 값은 바로 그린다 */
export function gaugeTo(q: Q, tl: gsap.core.Timeline, el: string, proxy: { v: number }, to: number, start: number, duration: number, pctEl?: Element, fmt?: (n: number) => string) {
  tl.to(proxy, { v: to, duration, ease: 'power1.inOut', onUpdate: () => drawGauge(q, el, proxy.v, pctEl, fmt) }, start)
}

// ── 아이콘 ───────────────────────────────────────────────────
/** 리뷰 말풍선(프롤로그 비정형 입자와 같은 모양) */
export function ReviewIcon({ x, y, s = 1, seed, el, fill = 'var(--surface)' }: { x: number; y: number; s?: number; seed: string; el?: string; fill?: string }) {
  const w = 52 * s
  const h = 30 * s
  return (
    <g data-el={el}>
      <RPath d={`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + 18 * s} ${y + h} L ${x + 9 * s} ${y + h + 10 * s} L ${x + 9 * s} ${y + h} L ${x} ${y + h} Z`} seed={seed} rough={0.4} fill={fill} />
      <RPath d={`M ${x + 8 * s} ${y + 11 * s} L ${x + w - 8 * s} ${y + 11 * s} M ${x + 8 * s} ${y + 20 * s} L ${x + w - 18 * s} ${y + 20 * s}`} seed={`${seed}-l`} rough={0.3} strokeWidth={1.1} />
    </g>
  )
}

/** 상품 이미지(사진 사각형 + 산 모양) */
export function PhotoIcon({ x, y, w = 48, h = 38, seed, el, fill = 'var(--surface)' }: { x: number; y: number; w?: number; h?: number; seed: string; el?: string; fill?: string }) {
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.4} fill={fill} />
      <RPath d={`M ${x + 4} ${y + h - 4} L ${x + w * 0.38} ${y + h * 0.42} L ${x + w * 0.58} ${y + h * 0.68} L ${x + w * 0.74} ${y + h * 0.5} L ${x + w - 4} ${y + h - 4}`} seed={`${seed}-m`} rough={0.3} strokeWidth={1.2} />
      <REllipse cx={x + w * 0.76} cy={y + h * 0.26} w={7} h={7} seed={`${seed}-s`} rough={0.2} />
    </g>
  )
}

/** 표(로그) 아이콘 */
export function TableIcon({ x, y, w = 44, h = 32, seed, el }: { x: number; y: number; w?: number; h?: number; seed: string; el?: string }) {
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.35} fill="var(--surface)" />
      {[1, 2, 3].map((k) => (
        <RLine key={k} x1={x} y1={y + (h / 4) * k} x2={x + w} y2={y + (h / 4) * k} seed={`${seed}-r${k}`} rough={0.2} strokeWidth={1} />
      ))}
      <RLine x1={x + w * 0.4} y1={y} x2={x + w * 0.4} y2={y + h} seed={`${seed}-c`} rough={0.2} strokeWidth={1} />
    </g>
  )
}

/** 디스크(작은 원통) */
export function DiskIcon({ cx, cy, w = 46, h = 32, seed }: { cx: number; cy: number; w?: number; h?: number; seed: string }) {
  const rx = w / 2
  const ry = 6
  const x0 = cx - rx
  const x1 = cx + rx
  const y0 = cy - h / 2
  const y1 = cy + h / 2
  return (
    <g>
      <path d={`M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry} Z`} style={{ fill: 'var(--surface)' }} />
      <RPath
        d={`M ${x0} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y0 + ry} A ${rx} ${ry} 0 0 1 ${x0} ${y0 + ry} M ${x0} ${y0 + ry} L ${x0} ${y1 - ry} A ${rx} ${ry} 0 0 0 ${x1} ${y1 - ry} L ${x1} ${y0 + ry}`}
        seed={seed}
        rough={0.4}
      />
    </g>
  )
}

/** 메모리 칩(사각형 + 다리) */
export function MemIcon({ cx, cy, w = 46, h = 26, seed }: { cx: number; cy: number; w?: number; h?: number; seed: string }) {
  const pins = [0.2, 0.4, 0.6, 0.8]
  return (
    <g>
      <RRect x={cx - w / 2} y={cy - h / 2} w={w} h={h} seed={seed} rough={0.35} fill="var(--surface)" />
      {pins.map((p) => (
        <g key={p}>
          <line x1={cx - w / 2 + w * p} y1={cy - h / 2 - 5} x2={cx - w / 2 + w * p} y2={cy - h / 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
          <line x1={cx - w / 2 + w * p} y1={cy + h / 2} x2={cx - w / 2 + w * p} y2={cy + h / 2 + 5} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
        </g>
      ))}
    </g>
  )
}

/** 닫힌 폴더 */
export function Folder({ x, y, w = 24, h = 18, seed, open }: { x: number; y: number; w?: number; h?: number; seed: string; open?: boolean }) {
  const tab = `M ${x} ${y + 4} L ${x} ${y} L ${x + w * 0.38} ${y} L ${x + w * 0.48} ${y + 4}`
  if (open)
    return (
      <g>
        <RPath d={`${tab} L ${x + w} ${y + 4} L ${x + w} ${y + 7}`} seed={`${seed}-t`} rough={0.3} />
        <RPath d={`M ${x} ${y + 4} L ${x} ${y + h} L ${x + w} ${y + h} L ${x + w + 5} ${y + 8} L ${x + 5} ${y + 8} L ${x} ${y + h}`} seed={seed} rough={0.3} fill="var(--surface)" />
      </g>
    )
  return <RPath d={`${tab} L ${x + w} ${y + 4} L ${x + w} ${y + h} L ${x} ${y + h} Z`} seed={seed} rough={0.3} fill="var(--surface)" />
}

/** 작은 파일 아이콘 */
export function FileIcon({ x, y, seed }: { x: number; y: number; seed: string }) {
  return <RPath d={`M ${x} ${y} L ${x + 10} ${y} L ${x + 15} ${y + 5} L ${x + 15} ${y + 19} L ${x} ${y + 19} Z`} seed={seed} rough={0.3} fill="var(--surface)" />
}

/** 사람(머리 + 어깨) */
export function Person({ cx, top, seed, r = 11 }: { cx: number; top: number; seed: string; r?: number }) {
  return (
    <g>
      <REllipse cx={cx} cy={top + r + 2} w={r * 2} h={r * 2} seed={`${seed}-h`} rough={0.4} fill="var(--surface)" />
      <RPath d={`M ${cx - r * 1.5} ${top + r * 4.2} C ${cx - r * 1.4} ${top + r * 2.9}, ${cx - r * 0.7} ${top + r * 2.6}, ${cx} ${top + r * 2.6} C ${cx + r * 0.7} ${top + r * 2.6}, ${cx + r * 1.4} ${top + r * 2.9}, ${cx + r * 1.5} ${top + r * 4.2}`} seed={`${seed}-b`} rough={0.4} />
    </g>
  )
}

/** 책 더미 */
export function Pile({ cx, y, n = 2, w = 34, seed, el, data }: { cx: number; y: number; n?: number; w?: number; seed: string; el?: string; data?: Record<string, number> }) {
  const props = Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v]))
  return (
    <g data-el={el} {...props}>
      {Array.from({ length: n }, (_, k) => {
        const off = ((k * 37) % 7) - 3
        return <RRect key={k} x={cx - w / 2 + off} y={y + k * 9} w={w - Math.abs(off)} h={8} seed={`${seed}-${k}`} rough={0.3} fill="var(--surface)" strokeWidth={1.2} />
      })}
    </g>
  )
}

/** 상품 입자 모양(색만으로 구분하지 않도록 ● ▲ ■ ◆) */
export function Shape({ kind, x, y, s = 7, el, data, hollow }: { kind: number; x: number; y: number; s?: number; el?: string; data?: Record<string, number>; hollow?: boolean }) {
  const style = hollow ? { fill: 'none', stroke: 'var(--accent)', strokeWidth: 1.6 } : { fill: 'var(--accent)' }
  const props = { 'data-el': el, ...Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v])), style }
  if (kind === 0) return <circle cx={x} cy={y} r={s} {...props} />
  if (kind === 1) return <path d={`M ${x} ${y - s * 1.1} L ${x + s * 1.1} ${y + s * 0.85} L ${x - s * 1.1} ${y + s * 0.85} Z`} {...props} />
  if (kind === 2) return <rect x={x - s * 0.9} y={y - s * 0.9} width={s * 1.8} height={s * 1.8} {...props} />
  return <path d={`M ${x} ${y - s * 1.2} L ${x + s * 1.1} ${y} L ${x} ${y + s * 1.2} L ${x - s * 1.1} ${y} Z`} {...props} />
}

/** 꺾은 화살표(점 목록). 화살촉은 마지막 구간 방향 */
export function PolyArrow({ pts, seed, dash, el, stroke, strokeWidth, head = 9 }: { pts: [number, number][]; seed: string; dash?: string; el?: string; stroke?: string; strokeWidth?: number; head?: number }) {
  const [ax, ay] = pts[pts.length - 2]
  const [bx, by] = pts[pts.length - 1]
  const a = Math.atan2(by - ay, bx - ax)
  const tip = `M ${bx - head * Math.cos(a - 0.45)} ${by - head * Math.sin(a - 0.45)} L ${bx} ${by} L ${bx - head * Math.cos(a + 0.45)} ${by - head * Math.sin(a + 0.45)}`
  return (
    <g data-el={el}>
      <RPath d={'M ' + pts.map((p) => p.join(' ')).join(' L ')} seed={seed} rough={0.5} dash={dash} stroke={stroke} strokeWidth={strokeWidth} data-el="shaft" />
      <RPath d={tip} seed={`${seed}h`} rough={0.2} stroke={stroke} strokeWidth={strokeWidth} data-el="head" />
    </g>
  )
}

/** 상태 배지 + 짧은 글(색만으로 구분하지 않기) */
export function StatusTag({ x, y, status, text, color, size = 13.5, el }: { x: number; y: number; status: Parameters<typeof Badge>[0]['status']; text: string; color?: string; size?: number; el?: string }) {
  return (
    <g data-el={el}>
      <Badge x={x} y={y - size * 0.36} status={status} r={9} />
      <Txt x={x + 14} y={y} size={size} weight={750} color={color}>
        {text}
      </Txt>
    </g>
  )
}
