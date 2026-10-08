import type { ReactNode } from 'react'
import { Txt } from '../../components/fig'
import { RLine, RPath, RRect } from '../../components/sketch'
import type { Q } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'

// Ch7 다이어그램 전용 작은 부품과 타임라인 도구.

export type Els = Element[]
export type P = [number, number]

/** data-el 이름 여러 개로 한꺼번에 찾기 */
export const pick =
  (q: Q) =>
  (...names: string[]): Els =>
    names.flatMap((n) => q(`[data-el="${n}"]`))

/** 초기 상태: DOM에도 바로 적용해 첫 스크롤 전·0초로 되감을 때도 step 1 이전 그림이 되게 한다 */
export const init = (tl: gsap.core.Timeline, targets: Els | Element, vars: gsap.TweenVars) => {
  if (Array.isArray(targets) && !targets.length) return
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}

export const paths = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
export const shafts = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
export const heads = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))

/** 화살표를 선 → 화살촉 순서로 그린다 */
export function drawArrows(tl: gsap.core.Timeline, els: Els, t: number, d = 0.12) {
  if (!els.length) return
  const hs = heads(els)
  init(tl, shafts(els), { drawSVG: '0%' })
  init(tl, hs, { opacity: 0 })
  tl.to(shafts(els), { drawSVG: '100%', duration: d, ease: 'none' }, t)
  if (hs.length) tl.to(hs, { opacity: 1, duration: 0.03 }, t + d - 0.02)
}

/** 첫 점 기준 상대 좌표 문자열(data-pts) */
export const rel = (pts: P[]) =>
  pts
    .slice(1)
    .map(([x, y]) => `${(x - pts[0][0]).toFixed(1)},${(y - pts[0][1]).toFixed(1)}`)
    .join(' ')

/** data-pts를 따라 입자를 옮긴다. 구간 길이에 비례해 시간을 나눈다. 끝나는 시각을 돌려준다(fadeIn=false면 보이기·숨기기는 부르는 쪽이 정한다) */
export function flowAlong(tl: gsap.core.Timeline, el: Element | undefined, t0: number, dur: number, { fadeIn = true, fadeOut = true } = {}) {
  if (!el) return t0
  const pts: P[] = [[0, 0], ...((el as SVGElement).dataset.pts ?? '').split(' ').filter(Boolean).map((s) => s.split(',').map(Number) as P)]
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = lens.reduce((a, b) => a + b, 0) || 1
  init(tl, el, fadeIn ? { x: 0, y: 0, opacity: 0 } : { x: 0, y: 0 })
  if (fadeIn) tl.to(el, { opacity: 1, duration: 0.02 }, t0)
  let t = t0
  pts.slice(1).forEach(([x, y], j) => {
    const d = (dur * lens[j]) / total
    tl.to(el, { x, y, duration: d, ease: 'none' }, t)
    t += d
  })
  if (fadeOut) tl.to(el, { opacity: 0, duration: 0.02 }, t)
  return t
}

/** 글자 폭 어림(본문 글꼴: 한글 0.95em, 라틴·숫자 0.58em, 공백 0.3em) */
export const tw = (s: string, size: number) =>
  Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size * 0.95 : c === ' ' ? size * 0.3 : size * 0.58), 0)
/** 고정폭 글꼴 어림(라틴 0.6em, 한글 1em) */
export const mw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size : size * 0.6), 0)

/** 꺾은선 화살표(선 data-el="shaft", 화살촉 data-el="head"). head=0이면 촉 없음 */
export function PolyArrow({ pts, seed, dash, el, stroke, strokeWidth, head = 9 }: { pts: P[]; seed: string; dash?: string; el?: string; stroke?: string; strokeWidth?: number; head?: number }) {
  const [ax, ay] = pts[pts.length - 2]
  const [bx, by] = pts[pts.length - 1]
  const a = Math.atan2(by - ay, bx - ax)
  const tip = `M ${bx - head * Math.cos(a - 0.45)} ${by - head * Math.sin(a - 0.45)} L ${bx} ${by} L ${bx - head * Math.cos(a + 0.45)} ${by - head * Math.sin(a + 0.45)}`
  return (
    <g data-el={el}>
      <RPath d={'M ' + pts.map((p) => p.join(' ')).join(' L ')} seed={seed} rough={0.4} dash={dash} stroke={stroke} strokeWidth={strokeWidth} data-el="shaft" />
      {head > 0 && <RPath d={tip} seed={`${seed}h`} rough={0.2} stroke={stroke} strokeWidth={strokeWidth} data-el="head" />}
    </g>
  )
}

/** 품질 검사 배지(맵의 검문소 배지와 같은 방패 모양). 기호는 ✓(ok) 또는 ✕(fail) */
export function Shield({ x, y, s = 1, status = 'ok', el }: { x: number; y: number; s?: number; status?: 'ok' | 'fail'; el?: string }) {
  const c = status === 'ok' ? 'var(--ok)' : 'var(--fail)'
  return (
    <g data-el={el} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -10 L9 -6 L8 4 Q5 10 0 12 Q-5 10 -8 4 L-9 -6 Z" style={{ fill: 'var(--surface)', stroke: c }} strokeWidth={2} />
      {status === 'ok' ? (
        <path d="M-4 1 L-1 4 L4 -3" style={{ stroke: c, fill: 'none' }} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M-3.5 -2.5 L3.5 4.5 M3.5 -2.5 L-3.5 4.5" style={{ stroke: c, fill: 'none' }} strokeWidth={2.2} strokeLinecap="round" />
      )}
    </g>
  )
}

/** 검문소: 위→아래로 흐르는 화살표가 지나가는 문(기둥 두 개 + 가로대) + 방패 배지. 배지는 ✓·✕ 둘 다 그려 두고 타임라인에서 바꾼다 */
export function Gate({ x, y, w = 64, h = 46, seed, el }: { x: number; y: number; w?: number; h?: number; seed: string; el: string }) {
  const posts = `M ${x - w / 2} ${y - h / 2} L ${x - w / 2} ${y + h / 2} M ${x + w / 2} ${y - h / 2} L ${x + w / 2} ${y + h / 2}`
  return (
    <g data-el={el}>
      <RPath d={posts} seed={`${seed}-p`} rough={0.3} strokeWidth={2.6} />
      <RRect x={x - w / 2 - 7} y={y - h / 2 - 8} w={w + 14} h={11} seed={`${seed}-b`} rough={0.3} fill="var(--surface)" />
      <Shield x={x} y={y - h / 2 - 3} s={1.55} el={`${el}-ok`} />
      <Shield x={x} y={y - h / 2 - 3} s={1.55} status="fail" el={`${el}-x`} />
    </g>
  )
}

/** 꼬리표: 테두리 있는 작은 칩 + 글. 가운데 정렬 */
export function Chip({ x, y, text, size = 13, el, mono, w, seed }: { x: number; y: number; text: string; size?: number; el?: string; mono?: boolean; w?: number; seed: string }) {
  const width = w ?? (mono ? mw(text, size) : tw(text, size)) + 18
  return (
    <g data-el={el}>
      <RRect x={x - width / 2} y={y - size * 0.95} w={width} h={size * 1.9} seed={seed} rough={0.3} fill="var(--surface)" />
      <Txt x={x} y={y + size * 0.36} size={size} weight={700} anchor="middle" mono={mono}>
        {text}
      </Txt>
    </g>
  )
}

/** 작은 문서 아이콘 + 옆 글 */
export function DocIcon({ x, y, seed, el, label, size = 13, labelEl }: { x: number; y: number; seed: string; el?: string; label?: ReactNode; size?: number; labelEl?: string }) {
  const w = 22
  const h = 28
  const f = 6
  return (
    <g data-el={el}>
      <path d={`M ${x} ${y} L ${x + w - f} ${y} L ${x + w} ${y + f} L ${x + w} ${y + h} L ${x} ${y + h} Z`} style={{ fill: 'var(--surface)' }} />
      <RPath
        d={`M ${x} ${y} L ${x + w - f} ${y} L ${x + w} ${y + f} L ${x + w} ${y + h} L ${x} ${y + h} Z M ${x + 4} ${y + 11} L ${x + w - 4} ${y + 11} M ${x + 4} ${y + 17} L ${x + w - 4} ${y + 17} M ${x + 4} ${y + 23} L ${x + w - 8} ${y + 23}`}
        seed={seed}
        rough={0.3}
        strokeWidth={1.3}
      />
      {label !== undefined && (
        <g data-el={labelEl}>
          <Txt x={x + w + 8} y={y + h / 2 + size * 0.36} size={size} weight={700}>
            {label}
          </Txt>
        </g>
      )}
    </g>
  )
}

/** 시계 아이콘 */
export function ClockIcon({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} />
      <path d={`M ${x} ${y - r * 0.6} L ${x} ${y} L ${x + r * 0.5} ${y + r * 0.25}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  )
}

/** 휴대폰 틀 */
export function Phone({ x, y, w, h, seed }: { x: number; y: number; w: number; h: number; seed: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} style={{ fill: 'var(--surface)' }} />
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.3} />
      <RLine x1={x + w / 2 - 12} y1={y + 9} x2={x + w / 2 + 12} y2={y + 9} seed={`${seed}-spk`} rough={0.2} strokeWidth={2.2} />
    </g>
  )
}

/** 말풍선(꼬리가 아래 왼쪽) */
export function Speech({ x, y, w, h, seed, tail = 'left' }: { x: number; y: number; w: number; h: number; seed: string; tail?: 'left' | 'top' }) {
  const d =
    tail === 'left'
      ? `M ${x + 10} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + 10} ${y + h} L ${x + 10} ${y + h * 0.62} L ${x} ${y + h * 0.5} L ${x + 10} ${y + h * 0.38} Z`
      : `M ${x} ${y} L ${x + w / 2 - 7} ${y} L ${x + w / 2} ${y - 9} L ${x + w / 2 + 7} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
  return (
    <g>
      <path d={d} style={{ fill: 'var(--surface)' }} />
      <RPath d={d} seed={seed} rough={0.3} />
    </g>
  )
}

/** 코드 타이핑(CodeType)의 글자들을 줄 단위로 고른다 */
export function codeChars(q: Q, el: string) {
  const code = q(`[data-el="${el}"] code`)[0]
  if (!code) return [] as HTMLElement[][]
  const lines: HTMLElement[][] = [[]]
  for (const n of Array.from(code.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) for (const c of n.textContent ?? '') c === '\n' && lines.push([])
    else if (n instanceof HTMLElement && n.dataset.ch !== undefined) lines[lines.length - 1].push(n)
  }
  return lines
}

/** 글자들을 차례로 켠다(스크롤 연동 타이핑). 끝나는 시각을 돌려준다 */
export function typeChars(tl: gsap.core.Timeline, chars: Element[], t: number, dur: number) {
  if (!chars.length) return t
  init(tl, chars, { opacity: 0 })
  tl.to(chars, { opacity: 1, duration: 0.001, stagger: dur / chars.length, ease: 'none' }, t)
  return t + dur
}
