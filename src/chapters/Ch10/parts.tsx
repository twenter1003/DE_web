import type { ReactNode } from 'react'
import { ch10 } from '../../content/chapters/ch10'
import { PEOPLE } from '../../content/people'
import type { Who } from '../../content/types'
import { Badge, NodeLabel, type Status } from '../../components/diagram'
import { Txt } from '../../components/fig'
import { PipelineMap } from '../../components/PipelineMap'
import { REllipse, RPath } from '../../components/sketch'
import type { Q } from '../../components/StepScene'
import { boundsOf, mapStateAt } from '../../state/derive'

// Ch10 다이어그램 전용 작은 부품: 제안 노드(점선 조각), 꼬리표, 맵 썸네일, 노드 수 카운터, 타이핑 글자.

const F = ch10.figures

/** 글자 폭 어림(한글 1em, 라틴 0.6em, 공백 0.3em) */
export const tw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (/[가-힣ㄱ-ㅎ①-⑤「」·…]/.test(c) ? size : c === ' ' ? size * 0.3 : size * 0.6), 0)

/** data-el 이름으로 찾기 */
export const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
export const num = (el: Element, key: string) => Number((el as SVGElement | HTMLElement).dataset[key] ?? 0)
/** 한 요소 아래로 범위를 좁힌 선택자(맵이 둘 이상 있는 장면에서 mapTransition에 넘긴다) */
export const scoped = (root: Element | undefined): Q => (sel) => (root ? Array.from(root.querySelectorAll(sel)) : [])

/** 노드 수 카운터: [값, 시각]마다 숫자가 한 칸씩 바뀐다(스크롤 연동) */
export function stepCount(tl: gsap.core.Timeline, el: Element | undefined, from: number, marks: [number, number][], fmt: (n: number) => string = String) {
  if (!el) return
  const o = { v: from }
  el.textContent = fmt(from)
  for (const [v, t] of marks) tl.to(o, { v, duration: 0.03, ease: 'none', onUpdate: () => (el.textContent = fmt(Math.round(o.v))) }, t)
}

// ── 점선 조각: 차례로 켜면 '그려지는' 점선이 된다 ──
function dashSegments(pts: [number, number][], dash = 8, gap = 6): string[] {
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

function Dashes({ pts, el, color = 'currentColor', width = 1.6 }: { pts: [number, number][]; el: string; color?: string; width?: number }) {
  return (
    <g>
      {dashSegments(pts).map((d, i) => (
        <path key={i} data-el={el} d={d} style={{ fill: 'none', stroke: color }} strokeWidth={width} strokeLinecap="round" />
      ))}
    </g>
  )
}

/** 제안 노드: 점선 테두리 + '제안' 보조 라벨. 테두리 조각 data-el=`${el}-seg`, 글자 `${el}-txt` */
export function PropNode({ x, y, w = 150, h = 52, label, sub, el }: { x: number; y: number; w?: number; h?: number; label: string; sub?: string; el: string }) {
  const x0 = x - w / 2
  const y0 = y - h / 2
  // 왼쪽 가운데에서 시작해 한 바퀴(들어오는 화살표 쪽에서 그려지기 시작한다)
  const pts: [number, number][] = [
    [x0, y],
    [x0, y0],
    [x0 + w, y0],
    [x0 + w, y0 + h],
    [x0, y0 + h],
    [x0, y],
  ]
  return (
    <g data-el={el} style={{ opacity: 0.85 }}>
      <rect data-el={`${el}-bg`} x={x0} y={y0} width={w} height={h} rx={4} style={{ fill: 'var(--surface)' }} />
      <Dashes pts={pts} el={`${el}-seg`} />
      <g data-el={`${el}-txt`}>
        <NodeLabel x={x} y={y} label={label} sub={sub} />
      </g>
    </g>
  )
}

/** 제안 화살표: 흐린 색 점선 + 화살촉. 조각 data-el=`${el}-seg`, 화살촉 `${el}-head` */
export function PropArrow({ x1, y1, x2, y2, el }: { x1: number; y1: number; x2: number; y2: number; el: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const h = 9
  const head = `M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`
  return (
    <g data-el={el}>
      <Dashes
        pts={[
          [x1, y1],
          [x2, y2],
        ]}
        el={`${el}-seg`}
        color="var(--muted)"
      />
      <path data-el={`${el}-head`} d={head} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 꼬리표(알약 모양). status가 있으면 기호를 앞에 붙인다(색만으로 구분하지 않음) */
export function Pill({
  x,
  y,
  text,
  el,
  status,
  size = 13,
  anchor = 'middle',
  strong,
}: {
  x: number
  y: number
  text: string
  el?: string
  status?: Status
  size?: number
  anchor?: 'start' | 'middle' | 'end'
  strong?: boolean
}) {
  const glyph = status ? size + 6 : 0
  const w = tw(text, size) + glyph + 18
  const h = size + 11
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x
  const tone = status === 'ok' ? 'var(--ok)' : status === 'fail' ? 'var(--fail)' : status === 'wait' ? 'var(--wait)' : 'var(--muted)'
  return (
    <g data-el={el}>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={h / 2} style={{ fill: 'var(--surface)', stroke: tone }} strokeWidth={1.4} />
      {status && <Badge x={x0 + 9 + size / 2} y={y} r={size * 0.62} status={status} />}
      <Txt x={x0 + 9 + glyph} y={y + size * 0.36} size={size} weight={strong ? 750 : 600}>
        {text}
      </Txt>
    </g>
  )
}

/** SVG 인물 머리(이름 첫 글자). 사람마다 같은 seed */
export function Initial({ x, y, r = 16, who }: { x: number; y: number; r?: number; who: Who }) {
  return (
    <g>
      <REllipse cx={x} cy={y} w={r * 2} h={r * 2} rough={0.4} seed={`ini-${who}`} fill="var(--surface)" />
      <Txt x={x} y={y + r * 0.36} size={r * 0.95} weight={800} anchor="middle">
        {PEOPLE[who].name.replace(' 리드', '').slice(0, 1)}
      </Txt>
    </g>
  )
}

/** SVG 말풍선 틀(꼬리는 왼쪽 또는 오른쪽) */
export function BubbleBox({ x, y, w, h, side = 'left', seed, children, dash, rough = 0.5 }: { x: number; y: number; w: number; h: number; side?: 'left' | 'right'; seed: string; children?: ReactNode; dash?: string; rough?: number }) {
  const t = side === 'left' ? `M ${x} ${y + 14} L ${x - 10} ${y + 20} L ${x} ${y + 26}` : `M ${x + w} ${y + 14} L ${x + w + 10} ${y + 20} L ${x + w} ${y + 26}`
  const r = 12
  const d = `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
  return (
    <g>
      <path d={d} style={{ fill: 'var(--surface)' }} />
      <RPath d={d} seed={`${seed}-b`} rough={rough} dash={dash} />
      <path d={t} style={{ fill: 'var(--surface)' }} />
      <RPath d={t} seed={`${seed}-t`} rough={rough * 0.8} />
      {children}
    </g>
  )
}

// ── 맵 썸네일 ────────────────────────────────────────────────
// PipelineMap(가로 배치)을 SVG 안에 그대로 넣는다. 안쪽 <svg>는 바깥 viewBox(440×480)만큼 차지하고,
// 그 안에 맵이 가운데 맞춰 그려지므로, 원하는 상자(x, y, 폭)에 맞는 이동·배율을 계산해 <g>에 건다.
const VBW = 440
const VBH = 480
export function thumbFit(t: number, box: { x: number; y: number; w: number }) {
  const b = boundsOf(mapStateAt(t).nodes, 30, 2.4)
  const aspect = b.w / b.h
  const cw = aspect > VBW / VBH ? VBW : VBH * aspect
  const ch = cw / aspect
  const s = box.w / cw
  return { x: box.x - ((VBW - cw) / 2) * s, y: box.y - ((VBH - ch) / 2) * s, scale: s, h: ch * s }
}

/** 썸네일 상자(오른쪽 위) + 그 안의 맵. data-el="thumb"(이동·확대 대상), "thumb-frame", 맵 묶음 "thumb-map" */
export const THUMB = { x: 268, y: 10, w: 162 }
export function MapThumb({ t, from }: { t: number; from?: number }) {
  const f = thumbFit(t, THUMB)
  return (
    <g>
      <rect data-el="thumb-frame" x={THUMB.x - 6} y={THUMB.y - 6} width={THUMB.w + 12} height={f.h + 12} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
      <g data-el="thumb" data-x={f.x} data-y={f.y} data-s={f.scale} transform={thumbTf(f)}>
        <g data-el="thumb-map">
          <PipelineMap t={t} from={from} vertical={false} />
        </g>
      </g>
    </g>
  )
}

/** 썸네일 변환 문자열(attr 트윈으로 숫자만 보간한다 — GSAP 변환 파싱을 거치지 않게) */
export const thumbTf = (f: { x: number; y: number; scale: number }) => `translate(${f.x.toFixed(2)} ${f.y.toFixed(2)}) scale(${f.scale.toFixed(4)})`
export function initThumb(tl: gsap.core.Timeline, el: Element | undefined) {
  if (!el) return
  tl.set(el, { attr: { transform: thumbTf({ x: num(el, 'x'), y: num(el, 'y'), scale: num(el, 's') }) } }, 0)
}

/** 노드 수 카운터(왼쪽 위): 라벨 + 큰 숫자(data-el="cnt") + 작은 'Ch9: 17'(data-el="cnt-ch9") */
export function Counter({ n, ch9 }: { n: number; ch9: number }) {
  return (
    <g data-el="counter">
      <Txt x={14} y={30} size={13} muted weight={600}>
        {F.nodes}
      </Txt>
      <Txt x={14} y={72} size={38} weight={800} el="cnt">
        {n}
      </Txt>
      <Txt x={14} y={98} size={13} muted weight={600} el="cnt-ch9">
        {F.ch9(ch9)}
      </Txt>
    </g>
  )
}

/** 글자마다 span(data-ch) — 스크롤 연동 타이핑용 DOM 글자 */
export function TypeText({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} data-ch>
          {ch}
        </span>
      ))}
    </>
  )
}
