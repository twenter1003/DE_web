import { createContext, useContext, type SVGProps } from 'react'
import type { Options } from 'roughjs/bin/core'
import { roughPaths, seedOf } from '../lib/rough'
import { STAGES, type Stage } from '../lib/stages'

// 스테이지 컨텍스트: 챕터 섹션이 자기 스테이지(팔레트·선 정밀도)를 내려준다.
export const StageCtx = createContext<Stage>(STAGES[0])
export const useStage = () => useContext(StageCtx)

interface Common {
  seed?: number | string
  /** 선 거칠기 배율(작은 그림은 0.5 정도로 낮춘다) */
  rough?: number
  stroke?: string
  strokeWidth?: number
  fill?: string
  dash?: string
  /** 채우기 스타일(기본 solid). 'hachure'는 연필 빗금 */
  fillStyle?: 'solid' | 'hachure' | 'cross-hatch' | 'zigzag'
  className?: string
  style?: SVGProps<SVGGElement>['style']
  'data-el'?: string
}

// rough.js에 넘기는 표식 색. 렌더 단계에서 진짜 채우기 색(CSS 변수 가능)으로 바꾼다.
const FILL = '#010203'

function useOpts(c: Common, key: string): Options {
  const s = useStage()
  return {
    roughness: s.roughness * (c.rough ?? 1),
    bowing: s.bowing * (c.rough ?? 1),
    strokeWidth: c.strokeWidth ?? s.strokeWidth,
    seed: typeof c.seed === 'number' ? c.seed : seedOf(c.seed ?? key),
    stroke: 'currentColor',
    fill: c.fill ? FILL : undefined, // 실제 색은 렌더할 때 style로 입힌다(CSS 변수 지원)
    fillStyle: c.fillStyle,
    hachureGap: 5,
    fillWeight: 1,
  }
}

function Paths({ paths, c }: { paths: ReturnType<typeof roughPaths>; c: Common }) {
  return (
    <g className={c.className} style={c.style} data-el={c['data-el']}>
      {paths.map((p, i) =>
        p.stroke === 'none' ? (
          <path key={i} d={p.d} style={{ fill: c.fill }} stroke="none" />
        ) : (
          <path
            key={i}
            d={p.d}
            fill="none"
            style={{ stroke: p.stroke === FILL ? c.fill : (c.stroke ?? 'currentColor') }}
            strokeWidth={p.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={c.dash}
          />
        ),
      )}
    </g>
  )
}

export function RRect(props: Common & { x: number; y: number; w: number; h: number }) {
  const { x, y, w, h } = props
  const o = useOpts(props, `r${x},${y},${w},${h}`)
  return <Paths paths={roughPaths({ kind: 'rect', x, y, w, h }, o)} c={props} />
}

export function REllipse(props: Common & { cx: number; cy: number; w: number; h: number }) {
  const { cx, cy, w, h } = props
  const o = useOpts(props, `e${cx},${cy},${w},${h}`)
  return <Paths paths={roughPaths({ kind: 'ellipse', cx, cy, w, h }, o)} c={props} />
}

export function RLine(props: Common & { x1: number; y1: number; x2: number; y2: number }) {
  const { x1, y1, x2, y2 } = props
  const o = useOpts(props, `l${x1},${y1},${x2},${y2}`)
  return <Paths paths={roughPaths({ kind: 'line', x1, y1, x2, y2 }, o)} c={props} />
}

export function RPath(props: Common & { d: string }) {
  const o = useOpts(props, `p${props.d}`)
  return <Paths paths={roughPaths({ kind: 'path', d: props.d }, o)} c={props} />
}

export function RPoly(props: Common & { points: [number, number][] }) {
  const o = useOpts(props, `pl${props.points.join(' ')}`)
  return <Paths paths={roughPaths({ kind: 'linear', points: props.points }, o)} c={props} />
}

/** 화살표: 선 + 화살촉. 끝점에서 살짝 떨어뜨려 노드 테두리와 겹치지 않게 */
export function RArrow(
  props: Common & { x1: number; y1: number; x2: number; y2: number; head?: number; both?: boolean },
) {
  const { x1, y1, x2, y2, head = 9 } = props
  const a = Math.atan2(y2 - y1, x2 - x1)
  const tip = (x: number, y: number, ang: number) =>
    `M ${x - head * Math.cos(ang - 0.45)} ${y - head * Math.sin(ang - 0.45)} L ${x} ${y} L ${x - head * Math.cos(ang + 0.45)} ${y - head * Math.sin(ang + 0.45)}`
  const d = tip(x2, y2, a) + (props.both ? ' ' + tip(x1, y1, a + Math.PI) : '')
  return (
    <g className={props.className} style={props.style} data-el={props['data-el']}>
      <RLine {...props} className={undefined} style={undefined} data-el="shaft" />
      <RPath d={d} seed={props.seed ? `${props.seed}h` : undefined} rough={(props.rough ?? 1) * 0.4} stroke={props.stroke} strokeWidth={props.strokeWidth} data-el="head" />
    </g>
  )
}
