import type { CSSProperties, ReactNode } from 'react'
import { fs, rng } from './diagram'

// 장면 다이어그램 작성용 작은 도구들.
// 다이어그램은 440×480 안팎의 세로형 좌표계로 그린다(데스크톱·모바일 공용).

export const VB = '0 0 440 480'

/** 다이어그램 틀: SVG + (선택) 아래 캡션. 캡션은 줄바꿈이 필요해서 DOM 글자로 둔다 */
export function Fig({ children, caption, viewBox = VB, captionEl = 'caption' }: { children: ReactNode; caption?: ReactNode; viewBox?: string; captionEl?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <svg viewBox={viewBox} className="diagram h-auto max-h-full min-h-0 w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {children}
      </svg>
      {caption && (
        <p data-el={captionEl} className="mt-2 max-w-[30rem] text-center text-[0.8125rem] leading-snug text-muted md:text-sm">
          {caption}
        </p>
      )}
    </div>
  )
}

interface TxtProps {
  x: number
  y: number
  children: ReactNode
  size?: number
  weight?: number
  anchor?: 'start' | 'middle' | 'end'
  muted?: boolean
  mono?: boolean
  el?: string
  color?: string
  style?: CSSProperties
  /** 이 폭(사용자 단위)에 맞춰 그린다. 글자 수로 폭을 계산한 칩 안의 글자용: 작은 화면에서 글자를 키워도(--fs-lift) 칩을 넘지 않는다 */
  fit?: number
}

/** SVG 글자. 기본은 본문 글꼴 */
export function Txt({ x, y, children, size = 14, weight = 500, anchor = 'start', muted, mono, el, color, style, fit }: TxtProps) {
  return (
    <text
      x={x}
      y={y}
      data-el={el}
      textAnchor={anchor}
      textLength={fit}
      lengthAdjust={fit ? 'spacingAndGlyphs' : undefined}
      className={`${mono ? '' : 't-sans'} ${muted ? 't-muted' : ''}`}
      style={{ fontSize: fs(size), fontWeight: weight, ...(color ? { fill: color } : null), ...style }}
    >
      {children}
    </text>
  )
}

/** 상자 안 무작위(결정적) 점 좌표 */
export function scatter(n: number, seed: string, x: number, y: number, w: number, h: number): [number, number][] {
  const r = rng(seed)
  return Array.from({ length: n }, () => [x + r() * w, y + r() * h])
}

/** 숫자 카운터를 타임라인에 넣는다. 시작 값은 즉시 적용 */
export function countTo(tl: gsap.core.Timeline, el: Element | undefined, from: number, to: number, fmt: (n: number) => string, at: number, duration: number) {
  if (!el) return
  const o = { v: from }
  el.textContent = fmt(from)
  tl.to(o, { v: to, duration, ease: 'none', onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, at)
}

export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
