import { CARDS } from '../content/cards'
import { MAP_EDGES, MAP_NODES, T, type EdgeKind, type NodeKind } from '../content/map'
import { STAT_DELTAS, STAT_KEYS, type Level, type StatKey } from '../content/people'
import type { ChapterId } from '../content/types'

// ── 레벨·역량·카드 ────────────────────────────────────────────

/** 승급 지점: Ch2·Ch4·Ch7 완료, Ch10 클라이맥스 도달 */
export function levelOf(completed: ReadonlySet<ChapterId>, climax: boolean): Level {
  let lv = 1
  if (completed.has('ch2')) lv++
  if (completed.has('ch4')) lv++
  if (completed.has('ch7')) lv++
  if (climax) lv++
  return lv as Level
}

export function statsOf(completed: ReadonlySet<ChapterId>): Record<StatKey, number> {
  const out = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>
  for (const id of completed) {
    const d = STAT_DELTAS[id]
    for (const k of STAT_KEYS) out[k] += d[k] ?? 0
  }
  return out
}

export function cardsOf(completed: ReadonlySet<ChapterId>): Set<string> {
  return new Set(CARDS.filter((c) => completed.has(c.chapter)).map((c) => c.letter))
}

// ── 파이프라인 맵 ─────────────────────────────────────────────

export const NODE_W = 160
export const NODE_H = 54

export interface MapNode {
  id: string
  label: string
  sub?: string
  kind: NodeKind
  x: number
  y: number
  w: number
  h: number
  chapter: ChapterId
}

export interface MapEdge {
  id: string
  from: string
  to: string
  kind: EdgeKind
  label?: string
  check: boolean
  toAnchor?: [number, number]
}

const pick = <V>(list: [number, ...V[]][], t: number): [number, ...V[]] => {
  let cur = list[0]
  for (const e of list) if (e[0] <= t) cur = e
  return cur
}

const visible = (from: number, until: number | undefined, t: number) => from <= t && (until === undefined || t < until)

export function mapStateAt(t: number): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes: MapNode[] = MAP_NODES.filter((n) => visible(n.from, n.until, t)).map((n) => {
    const [, label, sub] = pick(n.labels as [number, string, string?][], t) as [number, string, string | undefined]
    const [, x, y] = pick(n.at, t) as [number, number, number]
    return { id: n.id, label, sub, kind: n.kind, x, y, w: n.w ?? NODE_W, h: n.h ?? NODE_H, chapter: n.chapter }
  })
  const ids = new Set(nodes.map((n) => n.id))
  const edges: MapEdge[] = MAP_EDGES.filter((e) => visible(e.start, e.until, t) && ids.has(e.from) && ids.has(e.to)).map((e) => ({
    id: `${e.from}>${e.to}`,
    from: e.from,
    to: e.to,
    kind: e.kind,
    label: e.label,
    check: Boolean(e.check) && t >= T.ch7,
    toAnchor: e.toAnchor,
  }))
  return { nodes, edges }
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** 노드들을 감싸는 뷰박스. 너무 납작하지 않게 최소 높이를 둔다. */
export function boundsOf(nodes: MapNode[], pad = 36, maxAspect = 2.4): Box {
  if (!nodes.length) return { x: 0, y: 0, w: 400, h: 200 }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const n of nodes) {
    x0 = Math.min(x0, n.x - n.w / 2)
    y0 = Math.min(y0, n.y - n.h / 2)
    x1 = Math.max(x1, n.x + n.w / 2)
    y1 = Math.max(y1, n.y + n.h / 2)
  }
  let w = x1 - x0 + pad * 2
  let h = y1 - y0 + pad * 2
  const minH = w / maxAspect
  let y = y0 - pad
  if (h < minH) {
    y -= (minH - h) / 2
    h = minH
  }
  const minW = h * 1.1
  let x = x0 - pad
  if (w < minW) {
    x -= (minW - w) / 2
    w = minW
  }
  return { x, y, w, h }
}

/** 챕터가 끝났을 때의 맵 시점 */
export const MAP_T_AFTER: Record<ChapterId, number> = {
  prologue: T.prologue,
  ch1: T.ch1,
  ch2: T.ch2,
  ch3: T.ch3,
  ch4: T.ch4,
  ch5: T.ch5,
  ch6: T.ch6,
  ch7: T.ch7,
  ch8: T.ch8,
  ch9: T.ch9,
  ch10: T.ch10Final,
  epilogue: T.epilogue,
}
