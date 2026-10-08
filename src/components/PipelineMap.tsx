import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { tocOf } from '../content/toc'
import { UI } from '../content/ui'
import type { ChapterId } from '../content/types'
import { boundsOf, mapStateAt, type Box, type MapEdge, type MapNode } from '../state/derive'
import { useEnv } from '../state/env'
import type { Q } from './StepScene'
import { fs, Node, NodeLabel } from './diagram'
import { RArrow } from './sketch'

// 진화하는 파이프라인 맵. 보일 노드는 시간축 t에서 파생된다(src/content/map.ts).
// from을 주면 from → t 전환용으로 두 시점의 노드를 모두 그리고 data-change 로 표시한다.

type Change = 'stay' | 'enter' | 'exit'

interface Props {
  t: number
  from?: number
  /** 노드를 눌러 챕터로 이동 */
  interactive?: boolean
  onNavigate?: (id: ChapterId) => void
  /** 사라지는 노드를 흐릿하게 남김(Ch10 '걷어냄') */
  ghosts?: boolean
  /** 새로 생긴 노드에 '새로' 표시 */
  tags?: boolean
  className?: string
  /** 강제로 세로(모바일) 배치 */
  vertical?: boolean
  /**
   * 세로 배치일 때 맵을 틀의 폭에 꽉 채우고 높이는 맵 비율대로 둔다(성장 블록처럼 고정 높이 틀이 아닌 곳).
   * 고정 높이 틀에 넣으면 노드가 늘수록 맵이 홀쭉하게 줄어 글자를 읽을 수 없다.
   */
  fit?: boolean
  label?: string
  /**
   * 맵 위에 덧그릴 장면 전용 주석(태그·칩·카드). 지금 배치(가로/세로)에서의 노드 위치를 받아 SVG로 그린다.
   * 예: overlay={(at) => { const b = at('bi'); return b && <text x={b.x} y={b.y - 40}>15분마다</text> }}
   */
  overlay?: (at: (id: string) => { x: number; y: number; w: number; h: number } | undefined) => ReactNode
}

const LAKE_BANDS = ['Bronze', 'Silver', 'Gold']

// ── 모바일: 열(소스→수집→저장→처리→활용)을 위→아래 띠로 바꾼다 ──
const MW = 150
const MH = 50
function verticalLayout(nodes: MapNode[]): MapNode[] {
  const bands = new Map<number, MapNode[]>()
  for (const n of nodes) {
    const col = Math.max(0, Math.min(5, Math.round((n.x - 90) / 200)))
    if (!bands.has(col)) bands.set(col, [])
    bands.get(col)!.push(n)
  }
  const out: MapNode[] = []
  let y = 0
  for (const col of [...bands.keys()].sort((a, b) => a - b)) {
    const list = bands.get(col)!.sort((a, b) => a.y - b.y || a.x - b.x)
    // 원래 맵의 위쪽(이벤트 흐름)과 아래쪽(배치·저장 흐름)을 다른 줄에 둬서,
    // 같은 열에서 이어진 노드(앱 → 운영 DB 등)가 옆자리에 붙지 않고 위아래로 놓이게 한다.
    const groups = [list.filter((n) => n.y < 340), list.filter((n) => n.y >= 340)].filter((g) => g.length)
    for (const g of groups) {
      for (let i = 0; i < g.length; i += 2) {
        const row = g.slice(i, i + 2)
        const h = Math.max(...row.map((n) => (n.h > 100 ? 96 : MH)))
        row.forEach((n, k) => {
          const nh = n.h > 100 ? 96 : MH
          out.push({ ...n, w: MW, h: nh, x: row.length === 1 ? 162 : k === 0 ? 80 : 244, y: y + h / 2 })
        })
        y += h + 24
      }
    }
    y += 22
  }
  return out
}

/** 노드 상자 테두리와 중심선이 만나는 점 */
function edgePoint(n: MapNode, tx: number, ty: number, gap = 5): [number, number] {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}

const vb = (b: Box) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`

function EdgeView({ e, a, b, change, vertical }: { e: MapEdge; a: MapNode; b: MapNode; change: Change; vertical: boolean }) {
  const target: [number, number] = e.toAnchor && !vertical ? [b.x + e.toAnchor[0], b.y + e.toAnchor[1]] : [b.x, b.y]
  const [x1, y1] = edgePoint(a, target[0], target[1])
  const [x2, y2] = e.toAnchor && !vertical ? target : edgePoint(b, a.x, a.y, 7)
  const dash = e.kind === 'control' ? '3 6' : e.kind === 'warn' ? '8 6' : e.kind === 'proposal' ? '7 6' : e.kind === 'note' ? '2 5' : undefined
  const stroke = e.kind === 'warn' ? 'var(--fail)' : e.kind === 'proposal' ? 'var(--muted)' : undefined
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g data-edge={e.id} data-change={change} style={e.kind === 'control' ? { opacity: 0.75 } : undefined}>
      {e.kind === 'note' ? (
        <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={e.id} dash={dash} head={0} rough={0.5} />
      ) : (
        <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={e.id} dash={dash} stroke={stroke} rough={0.5} both={e.from === 'lakehouse' && e.to === 'spark'} />
      )}
      {e.label && (
        <g>
          <rect x={mx - e.label.length * 4.2 - 8} y={my - 11} width={e.label.length * 8.4 + 16} height={20} rx={4} style={{ fill: 'var(--bg)' }} />
          <text x={mx} y={my + 4} textAnchor="middle" style={{ fontSize: fs(11.5), fill: e.kind === 'warn' ? 'var(--fail)' : 'var(--ink)' }}>
            {e.label}
          </text>
        </g>
      )}
      {e.check && (
        <g data-check transform={`translate(${mx} ${my})`}>
          <path d="M0 -10 L9 -6 L8 4 Q5 10 0 12 Q-5 10 -8 4 L-9 -6 Z" style={{ fill: 'var(--surface)', stroke: 'var(--ok)' }} strokeWidth={2} />
          <path d="M-4 1 L-1 4 L4 -3" style={{ stroke: 'var(--ok)', fill: 'none' }} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  )
}

export function PipelineMap({ t, from, interactive, onNavigate, ghosts, tags, className = '', vertical: forceVertical, fit, label, overlay }: Props) {
  const { mobile } = useEnv()
  const vertical = forceVertical ?? mobile
  const fitW = Boolean(fit && vertical)

  const model = useMemo(() => {
    const now = mapStateAt(t)
    const before = from === undefined ? now : mapStateAt(from)
    // 세로 배치는 노드 수에 맞춰 자리를 다시 매긴다. 걷어낸 노드를 흐릿하게 남길 때(ghosts)는 두 시점을 합쳐 한 번만 배치해
    // 남은 노드와 같은 자리에 겹쳐 그려지지 않게 한다(자리만 가져오고 라벨은 각 시점 것을 쓴다).
    const slots = vertical && ghosts ? new Map(verticalLayout([...now.nodes, ...before.nodes.filter((b) => !now.nodes.some((n) => n.id === b.id))]).map((n) => [n.id, n])) : null
    const layout = (ns: MapNode[]) =>
      slots ? ns.map((n) => { const p = slots.get(n.id)!; return { ...n, x: p.x, y: p.y, w: p.w, h: p.h } }) : vertical ? verticalLayout(ns) : ns
    const nowL = layout(now.nodes)
    const beforeL = layout(before.nodes)
    const nowIds = new Set(nowL.map((n) => n.id))
    const beforeMap = new Map(beforeL.map((n) => [n.id, n]))
    const nodes: (MapNode & { change: Change; prev?: MapNode })[] = [
      ...nowL.map((n) => ({ ...n, change: (beforeMap.has(n.id) ? 'stay' : 'enter') as Change, prev: beforeMap.get(n.id) })),
      ...beforeL.filter((n) => !nowIds.has(n.id)).map((n) => ({ ...n, change: 'exit' as Change })),
    ]
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const nowE = new Set(now.edges.map((e) => e.id))
    const beforeE = new Set(before.edges.map((e) => e.id))
    const edges = [
      ...now.edges.map((e) => ({ e, change: (beforeE.has(e.id) ? 'stay' : 'enter') as Change })),
      ...before.edges.filter((e) => !nowE.has(e.id)).map((e) => ({ e, change: 'exit' as Change })),
    ]
    const box = (ns: MapNode[]) => boundsOf(ns, 30, vertical ? 0.62 : 2.4, fitW ? 0 : 1.1)
    return { nodes, edges, byId, boxFrom: box(beforeL), boxTo: box(slots ? nodes : nowL), count: nowL.length }
  }, [t, from, vertical, fitW, ghosts])

  const go = (id: ChapterId) => (ev: MouseEvent) => {
    if (onNavigate) {
      ev.preventDefault()
      onNavigate(id)
    }
  }

  return (
    <svg
      data-el="map"
      data-vb-from={vb(model.boxFrom)}
      data-vb-to={vb(model.boxTo)}
      viewBox={vb(model.boxFrom)}
      className={`diagram w-full ${fitW ? 'h-auto' : 'h-full'} ${className}`}
      style={fitW ? { aspectRatio: `${model.boxTo.w} / ${model.boxTo.h}` } : undefined}
      role={interactive ? 'group' : 'img'}
      aria-label={label ?? UI.map.aria(model.count)}
      preserveAspectRatio="xMidYMid meet"
    >
      <g>
        {model.edges.map(({ e, change }) => {
          const a = model.byId.get(e.from)
          const b = model.byId.get(e.to)
          if (!a || !b) return null
          return <EdgeView key={e.id} e={e} a={a} b={b} change={change} vertical={vertical} />
        })}
      </g>
      <g>
        {model.nodes.map((n) => {
          const labelChanged = n.prev && (n.prev.label !== n.label || n.prev.sub !== n.sub)
          const dx = n.prev ? n.prev.x - n.x : 0
          const dy = n.prev ? n.prev.y - n.y : 0
          const body = (
            <g data-node={n.id} data-change={n.change} data-dx={dx || undefined} data-dy={dy || undefined}>
              <rect className="node-focus" x={n.x - n.w / 2 - 6} y={n.y - n.h / 2 - 6} width={n.w + 12} height={n.h + 12} rx={8} style={{ fill: 'none', stroke: 'var(--accent)', opacity: 0 }} strokeWidth={3} />
              <Node
                x={n.x}
                y={n.y}
                w={n.w}
                h={n.h}
                label={n.label}
                sub={n.sub}
                kind={n.kind}
                seed={`map-${n.id}`}
                labelEl={labelChanged ? 'lbl-new' : undefined}
                bands={n.id === 'lakehouse' ? LAKE_BANDS : undefined}
              />
              {labelChanged && n.prev && <NodeLabel x={n.x} y={n.y} label={n.prev.label} sub={n.prev.sub} el="lbl-old" />}
              {tags && n.change === 'enter' && (
                <g data-el="tag-new">
                  <rect x={n.x - n.w / 2} y={n.y - n.h / 2 - 23} width={42} height={20} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--accent)' }} strokeWidth={2} />
                  <text x={n.x - n.w / 2 + 21} y={n.y - n.h / 2 - 8.5} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700 }} className="t-sans">
                    {UI.growth.newTag}
                  </text>
                </g>
              )}
              {ghosts && n.change === 'exit' && (
                <g data-el="tag-gone" style={{ opacity: 0 }}>
                  <line x1={n.x - n.w / 2} y1={n.y} x2={n.x + n.w / 2} y2={n.y} style={{ stroke: 'var(--fail)' }} strokeWidth={2.5} />
                  <text x={n.x} y={n.y - n.h / 2 - 8} textAnchor="middle" className="t-sans" style={{ fontSize: 12, fontWeight: 700 }}>
                    {UI.growth.goneTag}
                  </text>
                </g>
              )}
            </g>
          )
          if (!interactive || n.change === 'exit') return <g key={n.id}>{body}</g>
          const ch = tocOf(n.chapter)
          return (
            <a key={n.id} href={`#${n.chapter}`} onClick={go(n.chapter)} aria-label={UI.map.goto([n.label, ...(n.id === 'lakehouse' ? LAKE_BANDS : n.sub ? [n.sub] : [])].join(' '), `${ch.label} ${ch.title}`)} className="map-link">
              {body}
            </a>
          )
        })}
      </g>
      {overlay && <g data-el="map-overlay">{overlay((id) => model.byId.get(id))}</g>}
    </svg>
  )
}

/**
 * 맵 전환을 타임라인에 추가한다. 초기 상태(from)는 time 0에 고정된다.
 * 사라짐 → 이동·라벨 교체 → 새 노드 등장 → 뷰박스 줌 순서.
 */
export function mapTransition(q: Q, tl: gsap.core.Timeline, start: number, { dur = 0.8, ghosts = false } = {}) {
  const svg = q('[data-el="map"]')[0] as SVGSVGElement | undefined
  if (!svg) return
  const exitN = q('[data-node][data-change="exit"]')
  const exitE = q('[data-edge][data-change="exit"]')
  const enterN = q('[data-node][data-change="enter"]')
  const enterE = q('[data-edge][data-change="enter"]')
  const moved = q('[data-node][data-dx], [data-node][data-dy]')
  const oldL = q('[data-el="lbl-old"]')
  const newL = q('[data-el="lbl-new"]')
  const tagsNew = q('[data-el="tag-new"]')
  const gone = q('[data-el="tag-gone"]')
  const step = dur / 3

  tl.set([...enterN, ...enterE, ...newL, ...tagsNew], { opacity: 0 }, 0)
  tl.set(svg, { attr: { viewBox: svg.dataset.vbFrom ?? "" } }, 0)
  for (const m of moved) {
    const el = m as SVGGElement
    tl.set(el, { x: Number(el.dataset.dx ?? 0), y: Number(el.dataset.dy ?? 0) }, 0)
  }

  if (exitN.length || exitE.length) {
    if (ghosts) {
      tl.to(exitN, { opacity: 0.35, duration: step }, start)
      tl.to(gone, { opacity: 1, duration: step }, start)
      tl.to(exitE, { opacity: 0, duration: step }, start)
    } else tl.to([...exitN, ...exitE], { opacity: 0, duration: step }, start)
  }
  if (moved.length) tl.to(moved, { x: 0, y: 0, duration: step * 1.4, ease: 'power2.inOut' }, start + step * 0.6)
  if (oldL.length) {
    tl.to(oldL, { opacity: 0, duration: step }, start + step)
    tl.to(newL, { opacity: 1, duration: step }, start + step)
  }
  tl.to(svg, { attr: { viewBox: svg.dataset.vbTo ?? "" }, duration: dur, ease: 'power2.inOut' }, start + step * 0.5)
  if (enterE.length) tl.to(enterE, { opacity: 1, duration: step }, start + step * 1.6)
  if (enterN.length) tl.to(enterN, { opacity: 1, duration: step, stagger: Math.min(0.08, step / enterN.length) }, start + step * 1.4)
  if (tagsNew.length) tl.to(tagsNew, { opacity: 1, duration: step * 0.6 }, start + dur)
}
