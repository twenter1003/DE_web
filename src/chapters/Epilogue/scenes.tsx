import { useId, type ReactNode } from 'react'
import { epilogue } from '../../content/chapters/epilogue'
import { CARDS } from '../../content/cards'
import { T } from '../../content/map'
import { LEVELS, PEOPLE, STAT_KEYS, STAT_LABELS, type StatKey } from '../../content/people'
import { tocOf } from '../../content/toc'
import { UI } from '../../content/ui'
import { CHAPTER_IDS, QUIZ_CHAPTERS, type Line } from '../../content/types'
import { Badge, Node } from '../../components/diagram'
import { Desk } from '../../components/Desk'
import { Txt } from '../../components/fig'
import { Avatar } from '../../components/people'
import { RArrow, RRect, StageCtx } from '../../components/sketch'
import { at, DUR, type SceneBuild } from '../../components/StepScene'
import { STAGES, stageVars } from '../../lib/stages'
import { MAP_T_AFTER, mapStateAt, statsOf, type MapEdge } from '../../state/derive'
import { useEnv } from '../../state/env'
import { useProgress } from '../../state/progress'

const c = epilogue
const F = c.figures

// ─────────────────────────────────────────────────────────────
// 공통: 440×480 틀 + 단계별 캡션
// ─────────────────────────────────────────────────────────────
const W = 440
const H = 480

/** SVG 틀. 확대된 설계도가 틀 밖으로 새지 않게 자른다. 캡션은 같은 자리에 겹쳐 두고 step마다 바꾼다 */
function Frame({ children, captions }: { children: ReactNode; captions?: [el: string, text: string][] }) {
  const clip = `epi-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram h-auto max-h-full min-h-0 w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id={clip}>
            <rect width={W} height={H} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>{children}</g>
      </svg>
      {captions && (
        <p className="mt-2 grid max-w-[30rem] text-center text-[0.8125rem] leading-snug text-muted md:text-sm">
          {captions.map(([el, t]) => (
            <span key={el} data-el={el} className="[grid-area:1/1]">
              {t}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

/** 글자 폭 어림(라틴 0.6em, 한글 1em, 공백 0.3em) */
const tw = (s: string, size: number) => Array.from(s).reduce((a, ch) => a + (/[가-힣“”…]/.test(ch) ? size : ch === ' ' ? size * 0.3 : size * 0.6), 0)

// ─────────────────────────────────────────────────────────────
// 설계도: 에필로그 맵(t = 11)의 노드·연결선을 다섯 구역 띠로 놓는다.
// 노드 목록·라벨·연결선·품질 배지는 mapStateAt()에서 파생하고, 여기서는 위치만 정한다.
// (PipelineMap의 배치는 16노드를 이 좁은 세로 틀에 넣으면 글자가 너무 작아진다)
// ─────────────────────────────────────────────────────────────
const MAP = mapStateAt(T.epilogue)
/** 노드 중심·크기 [x, y, w, h] */
const POS: Record<string, [number, number, number, number]> = {
  // 계약 ↔ 앱 약속선이 보이도록 간격을 두고, Zero-ETL 선(oltp → lakehouse)이 kafka 상자 뒤로 지나가지 않게 kafka를 왼쪽에 둔다
  contract: [49, 44, 86, 34],
  app: [162, 44, 96, 34],
  oltp: [274, 44, 88, 34],
  media: [384, 44, 92, 34],
  fraud: [58, 116, 100, 34],
  kafka: [186, 116, 100, 34],
  model: [62, 192, 104, 34],
  lakehouse: [222, 192, 156, 46],
  spark: [386, 192, 100, 34],
  bi: [50, 286, 84, 34],
  reverse: [146, 286, 100, 44],
  ml: [330, 286, 96, 34],
  catalog: [194, 356, 88, 34],
  cost: [290, 356, 88, 34],
  orch: [390, 356, 96, 34],
  alert: [390, 406, 96, 34],
}
/** 구역 라벨 자리 */
const ZONE_AT: [number, number][] = [
  [8, 16],
  [8, 90],
  [8, 166],
  [150, 392],
  [8, 263],
]
/** 첫 스케치 카드(틀의 1/5) */
const CARD = { x: 6, y: 382, s: 5 }

const zoneOf = (id: string) => F.zones.findIndex((z) => z.ids.includes(id))
const NODES = MAP.nodes
  .filter((n) => POS[n.id])
  .map((n) => {
    const [x, y, w, h] = POS[n.id]
    return { ...n, x, y, w, h, label: F.shortLabels[n.id] ?? n.label, z: zoneOf(n.id) }
  })
type BNode = (typeof NODES)[number]
const byId = new Map(NODES.map((n) => [n.id, n]))
/** 바깥 좌표 (부분 확대·축소된 설계도 안의 위치를 바깥 좌표로 바꿀 때 쓴다) */
const nodeAt = (id: string) => byId.get(id)!

/** 노드 상자 테두리와 중심선이 만나는 점(PipelineMap과 같은 방식) */
function edgePoint(n: BNode, tx: number, ty: number, gap = 4): [number, number] {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}
function edgeLine(e: MapEdge) {
  const a = nodeAt(e.from)
  const b = nodeAt(e.to)
  const [x1, y1] = edgePoint(a, b.x, b.y)
  const [x2, y2] = edgePoint(b, a.x, a.y, 6)
  return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 }
}
const EDGES = MAP.edges.filter((e) => byId.has(e.from) && byId.has(e.to)).map((e) => ({ e, ...edgeLine(e), z: Math.max(zoneOf(e.from), zoneOf(e.to)) }))
const edgeById = (id: string) => EDGES.find((x) => x.e.id === id)!
/** 선 라벨(Zero-ETL) 자리: 자기 선 위, 0.13 지점(첫째 줄과 kafka 꼬리표 사이 빈 통로) */
const labelAt = ({ e, x1, y1, x2, y2 }: (typeof EDGES)[number]) => ({ x: x1 + (x2 - x1) * 0.13, y: y1 + (y2 - y1) * 0.13, w: e.label ? tw(e.label, 11.5) + 10 : 0 })

/** 레이크하우스 포커스 링: 노드와 띄운 거리, 굵기 */
const RING = { gap: 5, w: 3 }
/** 꼬리표 자리. 기본은 노드 테두리 바깥 오른쪽 위(tr). 그 자리에 화살표·Zero-ETL 라벨·툴팁이 지나가는 노드만 왼쪽 위(tl)나 아래(bl·br)로 */
const TAG_AT: Record<string, 'tl' | 'bl' | 'br'> = { kafka: 'tl', lakehouse: 'tl', bi: 'bl', reverse: 'bl', alert: 'br' }

/** 챕터 꼬리표: 노드 모서리 바깥에 붙는 탭(테두리·포커스 링을 가리지 않게) */
function ChapterTag({ n }: { n: BNode }) {
  const label = tocOf(n.chapter).label
  const w = label.length * 7.5 + 10
  const at = TAG_AT[n.id] ?? 'tr'
  const x = at[1] === 'l' ? n.x - n.w / 2 : n.x + n.w / 2 - w
  const ring = n.id === 'lakehouse' ? RING.gap + RING.w / 2 : 0
  const y = at[0] === 'b' ? n.y + n.h / 2 + 2 : n.y - n.h / 2 - 18 - ring
  return (
    <g data-el="ctag" data-ord={CHAPTER_IDS.indexOf(n.chapter)}>
      <rect x={x} y={y} width={w} height={16} rx={3} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1} />
      <text x={x + w / 2} y={y + 12} textAnchor="middle" style={{ fontSize: 12.5, fontWeight: 600 }}>
        {label}
      </text>
    </g>
  )
}

/** under: 노드 위·꼬리표 아래에 끼울 그림(포커스 링이 꼬리표를 가리지 않게) */
function Blueprint({ tags = false, under }: { tags?: boolean; under?: ReactNode }) {
  return (
    <g data-el="bp-body">
      {F.zones.map((z, i) => (
        <g key={z.label} data-el="zone" data-z={i}>
          <Txt x={ZONE_AT[i][0]} y={ZONE_AT[i][1]} size={13} weight={700} muted>
            {z.label}
          </Txt>
        </g>
      ))}
      <g>
        {EDGES.map((ed) => {
          const { e, x1, y1, x2, y2, mx, my, z } = ed
          const dash = e.kind === 'control' ? '3 5' : e.kind === 'note' ? '2 4' : undefined
          const { x: lx, y: ly, w: lw } = labelAt(ed)
          return (
            <g key={e.id} data-el="be" data-id={e.id} data-z={z} style={e.kind === 'control' ? { opacity: 0.8 } : undefined}>
              <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={`ep-${e.id}`} dash={dash} head={e.kind === 'note' ? 0 : 8} both={e.from === 'lakehouse' && e.to === 'spark'} />
              {e.label && (
                <g data-el="elabel">
                  <rect x={lx - lw / 2} y={ly - 9} width={lw} height={18} rx={4} style={{ fill: 'var(--bg)' }} />
                  <text x={lx} y={ly + 4} textAnchor="middle" style={{ fontSize: 11.5, fontWeight: 600 }}>
                    {e.label}
                  </text>
                </g>
              )}
              {e.check && (
                <g data-el="bcheck">
                  <Badge x={mx} y={my} status="ok" r={8} />
                </g>
              )}
            </g>
          )
        })}
      </g>
      <g>
        {NODES.map((n) => (
          <g key={n.id} data-el="bn" data-id={n.id} data-z={n.z}>
            <Node x={n.x} y={n.y} w={n.w} h={n.h} label={n.label} sub={n.id === 'lakehouse' || n.id === 'reverse' ? n.sub : undefined} kind={n.kind} seed={`ep-${n.id}`} scale={0.95} />
          </g>
        ))}
      </g>
      {under}
      {tags &&
        [...NODES]
          .sort((a, b) => CHAPTER_IDS.indexOf(a.chapter) - CHAPTER_IDS.indexOf(b.chapter))
          .map((n) => <ChapterTag key={n.id} n={n} />)}
    </g>
  )
}

/** 첫 스케치: 프롤로그 스테이지의 종이·잉크·가장 거친 선. 틀 크기(440×480)로 그리고 카드 자리에 1/5로 넣는다 */
function Paper({ newbie = false }: { newbie?: boolean }) {
  const st = STAGES[0]
  const xs = [80, 220, 360]
  return (
    <StageCtx.Provider value={st}>
      <g style={{ ...(stageVars(st) as React.CSSProperties), color: st.line }}>
        <rect x={0} y={0} width={W} height={H} style={{ fill: 'var(--bg)' }} />
        <g style={{ stroke: 'var(--grid-strong)' }} strokeWidth={1}>
          {Array.from({ length: 17 }, (_, i) => (
            <line key={`v${i}`} x1={i * 28} y1={0} x2={i * 28} y2={H} />
          ))}
          {Array.from({ length: 18 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 28} x2={W} y2={i * 28} />
          ))}
        </g>
        <RRect x={3} y={3} w={W - 6} h={H - 6} seed="ep-paper" rough={0.5} />
        {F.sketch.map((s, i) => (
          <g key={s.label} data-el="pnode" data-i={i}>
            <Node
              x={xs[i]}
              y={240}
              w={118}
              h={66}
              label={i === 2 && newbie ? '' : s.label}
              sub={s.sub}
              kind={i === 1 ? 'doc' : i === 0 ? 'source' : 'serve'}
              seed={`ep-pm${i}`}
            />
            {i === 2 && newbie && (
              <g>
                <g data-el="nb-old">
                  <Txt x={xs[2]} y={245} size={15} weight={650} anchor="middle">
                    {s.label}
                  </Txt>
                </g>
                <g data-el="nb-new">
                  <Txt x={xs[2]} y={245} size={15} weight={650} anchor="middle">
                    {F.newbieNotebook}
                  </Txt>
                </g>
              </g>
            )}
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={i} data-el="parrow">
            <RArrow x1={142 + i * 140} y1={240} x2={156 + i * 140} y2={240} seed={`ep-pa${i}`} />
          </g>
        ))}
        {[149, 289].map((x) => (
          <circle key={x} data-el="pdot" cx={x} cy={240} r={5} style={{ fill: 'var(--accent)' }} />
        ))}
      </g>
    </StageCtx.Provider>
  )
}

/** 설계도 + 왼쪽 아래 첫 스케치 카드 */
function BlueprintWithCard({ tags, newbie, under }: { tags?: boolean; newbie?: boolean; under?: ReactNode }) {
  return (
    <g data-el="bp">
      <Blueprint tags={tags} under={under} />
      <g data-el="card" transform={`translate(${CARD.x} ${CARD.y}) scale(${1 / CARD.s})`}>
        <Paper newbie={newbie} />
      </g>
      <rect data-el="card-f" x={CARD.x} y={CARD.y} width={W / CARD.s} height={H / CARD.s} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.2} />
      <g data-el="card-l">
        <Txt x={CARD.x + W / CARD.s + 8} y={CARD.y + H / CARD.s - 6} size={12} weight={600} mono muted>
          {F.cardLabel}
        </Txt>
      </g>
    </g>
  )
}

// ─────────────────────────────────────────────────────────────
// 장면 1. 줌아웃 — 종이 한 장에서 설계도까지
// ─────────────────────────────────────────────────────────────
const BAR_ROWS = [
  ...QUIZ_CHAPTERS.slice(0, 10).map((id) => ({ label: tocOf(id).label, n: mapStateAt(MAP_T_AFTER[id]).nodes.length, tag: id === 'ch8' ? F.barTags.ch8 : undefined, proposal: false })),
  { label: F.barProposal, n: mapStateAt(T.ch10Proposal).nodes.length, tag: undefined, proposal: true },
  { label: F.barFinal, n: mapStateAt(T.ch10Final).nodes.length, tag: F.barTags.final, proposal: false },
]
const BAR = { x: 96, unit: 11.5, y0: 84, pitch: 30, h: 17 }

function Bars() {
  return (
    <g data-el="bars">
      <rect x={0} y={0} width={W} height={H} style={{ fill: 'var(--bg)', opacity: 0.86 }} />
      <Txt x={8} y={58} size={15} weight={800}>
        {F.barsTitle}
      </Txt>
      {BAR_ROWS.map((r, i) => {
        const y = BAR.y0 + i * BAR.pitch
        const len = r.n * BAR.unit
        const last = i === BAR_ROWS.length - 1
        return (
          <g key={r.label} data-el="brow">
            <Txt x={BAR.x - 8} y={y + 5} size={12.5} weight={600} anchor="end" mono>
              {r.label}
            </Txt>
            <rect
              data-el="bar"
              x={BAR.x}
              y={y - BAR.h / 2}
              width={len}
              height={BAR.h}
              rx={2}
              style={r.proposal ? { fill: 'none', stroke: 'var(--line)', strokeDasharray: '5 4' } : { fill: last ? 'var(--ink)' : 'var(--muted)', opacity: last ? 1 : 0.75 }}
              strokeWidth={1.6}
            />
            <g data-el="bnum">
              <Txt x={BAR.x + len + 7} y={y + 5} size={13} weight={800} mono>
                {r.n}
              </Txt>
              {r.tag && (
                <Txt x={BAR.x + len + 34} y={y + 5} size={12.5} weight={700}>
                  {r.tag}
                </Txt>
              )}
            </g>
          </g>
        )
      })}
    </g>
  )
}

const LH = nodeAt('lakehouse')
const TIP = F.tooltip(tocOf('ch8').label, tocOf('ch8').title)

export function ZoomFig() {
  const tipW = tw(TIP, 13) + 20
  return (
    <Frame
      captions={[
        ['cap-2', F.zoomCaption],
        ['cap-3', F.barsCaption],
        ['cap-4', F.mapBelow],
      ]}
    >
      <BlueprintWithCard
        tags
        under={
          <g data-el="ring">
            <rect x={LH.x - LH.w / 2 - RING.gap} y={LH.y - LH.h / 2 - RING.gap} width={LH.w + RING.gap * 2} height={LH.h + RING.gap * 2} rx={8} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={RING.w} />
          </g>
        }
      />
      <Bars />
      {/* 툴팁은 링 아래로 조금 띄워, 레이크하우스에 닿는 화살촉(카탈로그·비용 모니터)이 보이게 둔다 */}
      <g data-el="tip">
        <rect x={LH.x - tipW / 2} y={LH.y + LH.h / 2 + 14} width={tipW} height={22} rx={6} style={{ fill: 'var(--surface)', stroke: 'var(--accent)' }} strokeWidth={1.5} />
        <Txt x={LH.x} y={LH.y + LH.h / 2 + 29.5} size={13} weight={700} anchor="middle">
          {TIP}
        </Txt>
      </g>
    </Frame>
  )
}

/** 카드가 틀을 채우는 확대 상태(scale s, 카드 왼쪽 위가 원점으로) */
const zoomedIn = (s: number, cx = 0, cy = 0) => ({ svgOrigin: '0 0', scale: s, x: cx - s * CARD.x, y: cy - s * CARD.y })

export const buildZoom: SceneBuild = (q, tl) => {
  const bp = q('[data-el="bp"]')
  const nodes = q('[data-el="bn"]')
  const edges = q('[data-el="be"]')
  const zones = q('[data-el="zone"]')
  const ctags = q('[data-el="ctag"]')
  const pnodes = q('[data-el="pnode"]')
  const pstrokes = q('[data-el="pnode"] path[fill="none"]')
  const plabels = q('[data-el="pnode"] text')
  // 노드 바탕(채우기)도 선과 함께 나타나게: Node의 첫 자식(rect 또는 채우기 path)
  const pfills = pnodes.map((n) => n.querySelector(':scope > g > rect, :scope > g > path')).filter(Boolean) as Element[]
  const parrows = q('[data-el="parrow"]')
  const pdots = q('[data-el="pdot"]')
  const caps = (k: number) => q(`[data-el="cap-${k}"]`)
  const bars = q('[data-el="bars"]')
  const barRects = q('[data-el="bar"]')
  const bnums = q('[data-el="bnum"]')
  const brows = q('[data-el="brow"]')

  tl.set(bp, zoomedIn(CARD.s), 0)
  tl.set([...nodes, ...edges, ...zones, ...ctags, q('[data-el="card-l"]'), q('[data-el="card-f"]'), bars, q('[data-el="ring"]'), q('[data-el="tip"]'), caps(2), caps(3), caps(4)], { opacity: 0 }, 0)
  tl.set(pstrokes, { drawSVG: '0%' }, 0)
  tl.set([...plabels, ...parrows, ...pdots, ...pfills], { opacity: 0 }, 0)

  // step 1: 종이 위에 첫 스케치가 왼쪽부터 다시 그려진다
  const s1 = at(0)
  pnodes.forEach((n, i) => {
    tl.to(n.querySelectorAll('path[fill="none"]'), { drawSVG: '100%', duration: 0.16, ease: 'none' }, s1 + i * 0.17)
    if (pfills[i]) tl.to(pfills[i], { opacity: 1, duration: 0.1 }, s1 + i * 0.17 + 0.06)
    tl.to(n.querySelectorAll('text'), { opacity: 1, duration: 0.06 }, s1 + i * 0.17 + 0.12)
    if (parrows[i]) tl.to(parrows[i], { opacity: 1, duration: 0.05 }, s1 + i * 0.17 + 0.16)
  })
  tl.to(pdots, { opacity: 1, duration: 0.04 }, s1 + 0.5)
  tl.fromTo(pdots, { x: -9 }, { x: 0, duration: 0.25, stagger: 0.05, ease: 'none' }, s1 + 0.5)

  // step 2: 카메라가 물러난다(scale 5 → 1). 종이는 구석 카드가 되고, 종이 밖 노드가 구역 순서대로 나타난다
  const s2 = at(1)
  tl.to(bp, { scale: 1, x: 0, y: 0, duration: DUR, ease: 'power2.inOut' }, s2)
  const order = [0, 1, 2, 3, 4]
  order.forEach((z, k) => {
    const t = s2 + 0.28 + k * 0.07
    tl.to(zones.filter((el) => (el as SVGElement).dataset.z === String(z)), { opacity: 1, duration: 0.08 }, t)
    tl.to(nodes.filter((el) => (el as SVGElement).dataset.z === String(z)), { opacity: 1, duration: 0.08, stagger: 0.015 }, t)
  })
  tl.to(edges, { opacity: 1, duration: 0.1 }, s2 + 0.62)
  tl.to([q('[data-el="card-l"]'), q('[data-el="card-f"]'), caps(2)], { opacity: 1, duration: 0.1 }, s2 + 0.62)

  // step 3: 설계도가 흐려지고 챕터별 노드 수 막대가 왼쪽 위부터 자란다
  const s3 = at(2)
  tl.to(caps(2), { opacity: 0, duration: 0.08 }, s3)
  tl.to(bp, { opacity: 0.15, duration: 0.12 }, s3)
  tl.to(bars, { opacity: 1, duration: 0.1 }, s3 + 0.04)
  tl.set(barRects, { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.set(bnums, { opacity: 0 }, 0)
  tl.set(brows, { opacity: 0 }, 0)
  brows.forEach((r, i) => {
    const t = s3 + 0.1 + i * 0.05
    tl.to(r, { opacity: 1, duration: 0.03 }, t)
    tl.to(barRects[i], { scaleX: 1, duration: i >= brows.length - 2 ? 0.08 : 0.05, ease: 'none' }, t)
    tl.to(bnums[i], { opacity: 1, duration: 0.03 }, t + 0.05)
  })
  tl.to(caps(3), { opacity: 1, duration: 0.08 }, s3 + 0.1)

  // step 4: 설계도가 다시 선명해지고, 챕터 꼬리표가 등장 순서대로 붙는다 → 레이크하우스에 포커스 링·툴팁
  const s4 = at(3)
  tl.to([bars, caps(3)], { opacity: 0, duration: 0.1 }, s4)
  tl.to(bp, { opacity: 1, duration: 0.12 }, s4 + 0.04)
  tl.to(zones, { opacity: 0, duration: 0.08 }, s4)
  const ords = [...new Set(ctags.map((t) => Number((t as SVGElement).dataset.ord)))].sort((a, b) => a - b)
  ords.forEach((o, k) => tl.to(ctags.filter((t) => Number((t as SVGElement).dataset.ord) === o), { opacity: 1, duration: 0.05 }, s4 + 0.16 + k * 0.045))
  tl.to(q('[data-el="ring"]'), { opacity: 1, duration: 0.06 }, s4 + 0.66)
  tl.to(q('[data-el="tip"]'), { opacity: 1, duration: 0.08 }, s4 + 0.7)
  tl.to(caps(4), { opacity: 1, duration: 0.08 }, s4 + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 한 문장 — 데이터 엔지니어가 하는 일
// ─────────────────────────────────────────────────────────────
// 문장 카드는 위(높이 148), 흐려진 설계도는 아래에 0.8배로 둔다(노드 라벨이 읽히는 크기).
// 연결선은 노드 사이 빈 통로로만 다닌다: 왼쪽 띠(x 12), 오른쪽 통로(x 345, oltp|media·lakehouse|spark 사이), 줄 사이 가로 통로.
const MINI = { x: 86.6, y: 137.6, s: 0.8 }
const mini = (x: number, y: number): [number, number] => [MINI.x + x * MINI.s, MINI.y + y * MINI.s]
/** 축소 설계도 속 노드 상자(바깥 좌표) */
const box = (id: string) => {
  const n = nodeAt(id)
  const [cx, cy] = mini(n.x, n.y)
  const w = (n.w * MINI.s) / 2
  const h = (n.h * MINI.s) / 2
  return { cx, cy, l: cx - w, r: cx + w, t: cy - h, b: cy + h }
}
const CARD2 = { y: 4, h: 148 }
const PH = { x: 20, y0: 36, pitch: 26, size: 17.5 }
const phraseY = (i: number) => PH.y0 + i * PH.pitch
const phraseW = (i: number) => tw(F.phrases[i], PH.size * 0.94)
const ulY = (i: number) => phraseY(i) + 6
const LEFT = 12
const RIGHT = 345
/** 카드와 설계도 사이 가로 통로 */
const H0 = (CARD2.y + CARD2.h + box('app').t) / 2

interface TagDef {
  el: string
  text: string
  /** 꼬리표 기준점(바깥 좌표)과 정렬 */
  x: number
  y: number
  anchor: 'start' | 'end' | 'middle'
  /** 꼬리표에서 이어 줄 대상 점(없으면 선 없음) */
  to?: [number, number]
}
const tagW = (t: TagDef) => tw(t.text, 13) + 14
const tagBox = (t: TagDef) => {
  const w = tagW(t)
  const l = t.anchor === 'end' ? t.x - w : t.anchor === 'middle' ? t.x - w / 2 : t.x
  return { l, r: l + w, t: t.y - 15, b: t.y + 6, cx: l + w / 2, cy: t.y - 4.5 }
}
const mb = edgeById('model>bi')
const kf = edgeById('kafka>fraud')
const ze = edgeById('oltp>lakehouse')
const zeL = labelAt(ze)
const B = { bi: box('bi'), rev: box('reverse'), contract: box('contract'), model: box('model'), app: box('app'), alert: box('alert'), orch: box('orch'), cost: box('cost') }
// step 2: 쓰는 사람 꼬리표(BI는 아래, 소라·리아는 노드 위 통로)
const S2_TAGS: TagDef[] = [
  { el: 'utag', text: F.users.bi, x: B.bi.l - 1, y: B.rev.b + 18, anchor: 'start' },
  { el: 'utag', text: F.users.reverse, x: 213, y: B.rev.t - 10, anchor: 'middle' },
  { el: 'utag', text: F.users.ml, x: 356, y: B.bi.t - 12, anchor: 'middle' },
]
// step 3: 이 step에서만 붙는 주석
const S3_TAGS: TagDef[] = [
  { el: 'ttag', text: F.seconds, x: mini(kf.mx, kf.my)[0], y: B.app.b + 20, anchor: 'middle', to: mini(kf.mx, kf.my) },
  { el: 'ttag', text: F.every15, x: 120, y: mini(mb.mx, mb.my)[1] + 5, anchor: 'end', to: mini(mb.mx, mb.my) },
  { el: 'ctag2', text: F.payAsYouGo, x: 350, y: 240, anchor: 'start', to: mini(zeL.x + zeL.w / 2, zeL.y) },
]
const [, tRev, tMl] = S2_TAGS.map(tagBox)
const [tSec, t15, tPay] = S3_TAGS.map(tagBox)

/** 밑줄 → 통로 → 목표. side 'l'은 밑줄 왼쪽 끝에서 카드 왼쪽 여백으로, 'r'은 오른쪽 끝에서 오른쪽 통로로 나간다 */
interface LinkDef {
  el: 'link2' | 'link3'
  i: number
  side: 'l' | 'r'
  via: [number, number][]
}
const H3 = 318 // lakehouse 아래 ~ 넷째 줄 위 가로 통로
const LINKS: LinkDef[] = [
  // '필요한 사람에게' → ML(리아)·Reverse ETL(소라)·BI
  { el: 'link2', i: 0, side: 'r', via: [[RIGHT, tMl.t]] },
  { el: 'link2', i: 0, side: 'r', via: [[RIGHT, H3], [tRev.cx, H3], [tRev.cx, tRev.t]] },
  { el: 'link2', i: 0, side: 'r', via: [[RIGHT, H3], [150, H3], [150, B.bi.t]] },
  // '믿을 수 있는' → 데이터 계약·모델링·지표(한곳의 지표 정의)·모니터링·알림
  { el: 'link2', i: 1, side: 'l', via: [[LEFT, B.contract.cy], [B.contract.l, B.contract.cy]] },
  { el: 'link2', i: 1, side: 'l', via: [[LEFT, B.model.cy], [B.model.l, B.model.cy]] },
  { el: 'link2', i: 1, side: 'l', via: [[LEFT, B.alert.cy], [B.alert.l, B.alert.cy]] },
  // '제때' → 몇 초·15분마다·오케스트레이터
  { el: 'link3', i: 2, side: 'l', via: [[LEFT, H0], [(B.contract.r + B.app.l) / 2, H0], [(B.contract.r + B.app.l) / 2, tSec.t]] },
  { el: 'link3', i: 2, side: 'l', via: [[LEFT, t15.cy], [t15.l, t15.cy]] },
  { el: 'link3', i: 2, side: 'l', via: [[LEFT, (B.orch.b + B.alert.t) / 2], [400, (B.orch.b + B.alert.t) / 2], [400, B.orch.b]] },
  // '감당할 수 있는 비용' → 쓴 만큼 비용·비용 모니터
  { el: 'link3', i: 3, side: 'r', via: [[RIGHT, tPay.cy], [tPay.l, tPay.cy]] },
  { el: 'link3', i: 3, side: 'r', via: [[RIGHT, H3 + 2], [304, H3 + 2], [304, B.cost.t]] },
]
const linkD = (k: number, w = phraseW(LINKS[k].i)) => {
  const { i, side, via } = LINKS[k]
  const y = ulY(i)
  const [x0, x1] = side === 'l' ? [PH.x, LEFT] : [PH.x + w + 2, RIGHT]
  return `M ${x0} ${y} L ${x1} ${y} ${via.map(([x, yy]) => `L ${x} ${yy}`).join(' ')}`
}

function Tag({ t }: { t: TagDef }) {
  const b = tagBox(t)
  return (
    <g data-el={t.el}>
      {t.to && <line x1={b.cx} y1={b.cy} x2={t.to[0]} y2={t.to[1]} style={{ stroke: 'var(--line)' }} strokeWidth={1.2} strokeDasharray="2 3" />}
      <rect x={b.l} y={b.t} width={b.r - b.l} height={21} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.2} />
      <rect data-el="tag-hl" x={b.l - 3} y={b.t - 3} width={b.r - b.l + 6} height={27} rx={6} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.4} />
      <Txt x={b.l + 7} y={t.y} size={13} weight={700}>
        {t.text}
      </Txt>
    </g>
  )
}

/** 프롤로그 수도관 그림의 축소판: 수원지 → 수도관 → 부엌·실험실 */
function PipeInset() {
  return (
    <g data-el="inset">
      <rect x={312} y={26} width={104} height={28} rx={10} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
      <Txt x={364} y={45} size={12} weight={700} anchor="middle">
        {F.inset.source}
      </Txt>
      <path d="M 364 56 L 364 124 M 364 124 L 334 124 L 334 138 M 364 124 L 396 124 L 396 138" style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={6} strokeLinejoin="round" />
      <Txt x={356} y={94} size={11.5} weight={600} anchor="end" muted>
        {F.inset.pipe}
      </Txt>
      {[0, 1, 2].map((i) => (
        <circle key={i} data-el="drip" cx={364} cy={62 + i * 18} r={3.5} style={{ fill: 'var(--accent)' }} />
      ))}
      {[F.inset.kitchen, F.inset.lab].map((t, i) => (
        <g key={t}>
          <rect x={308 + i * 62} y={140} width={52} height={26} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
          <Txt x={334 + i * 62} y={158} size={12} weight={700} anchor="middle">
            {t}
          </Txt>
        </g>
      ))}
    </g>
  )
}

/** 비용 모니터의 요금 미터기(바늘 낮음) */
function MiniMeter({ x, y }: { x: number; y: number }) {
  const r = 12
  const a = Math.PI + 0.22 * Math.PI
  return (
    <g data-el="meter">
      <path d={`M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} />
      <line x1={x} y1={y} x2={x + (r - 3) * Math.cos(a)} y2={y + (r - 3) * Math.sin(a)} style={{ stroke: 'var(--ok)' }} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={2} style={{ fill: 'var(--line)' }} />
    </g>
  )
}

function Judgement() {
  return (
    <g data-el="judge">
      <g data-el="tools">
        <Txt x={10} y={52} size={13} weight={700} muted>
          {F.toolsTitle}
        </Txt>
        {F.tools.map((t, i) => (
          <Txt key={t} x={10} y={86 + i * 30} size={13} muted>
            {t}
          </Txt>
        ))}
      </g>
      <line x1={124} y1={36} x2={124} y2={440} style={{ stroke: 'var(--edge)' }} strokeWidth={1.2} />
      <Txt x={140} y={52} size={16} weight={800}>
        {F.judgeTitle}
      </Txt>
      {F.judges.map((j, i) => {
        const y = 92 + i * 88
        return (
          <g key={j.k} data-el="jrow">
            <Txt x={140} y={y} size={15} weight={800}>
              {j.k}
            </Txt>
            {j.bar !== undefined ? (
              <g>
                {Array.from({ length: 10 }, (_, k) => (
                  <rect key={k} x={140 + k * 13} y={y + 14} width={11} height={14} rx={1.5} style={k < j.bar! ? { fill: 'var(--accent)' } : { fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1.2} />
                ))}
                <Txt x={278} y={y + 26} size={13} weight={600}>
                  {j.v}
                </Txt>
              </g>
            ) : (
              <Txt x={140} y={y + 26} size={13} weight={600}>
                {j.v}
              </Txt>
            )}
          </g>
        )
      })}
    </g>
  )
}

export function SentenceFig() {
  return (
    <Frame
      captions={[
        ['cap-1', F.sentenceCaption],
        ['cap-4', F.judgeCaption],
      ]}
    >
      <g data-el="sent">
        <g data-el="mini" transform={`translate(${MINI.x} ${MINI.y}) scale(${MINI.s})`}>
          <Blueprint />
        </g>
        <MiniMeter x={336} y={B.cost.t - 6} />
        <g data-el="card2">
          <rect x={6} y={CARD2.y} width={W - 12} height={CARD2.h} rx={12} style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
          {F.phrases.map((ph, i) => (
            <text key={ph} data-el="phrase" x={PH.x} y={phraseY(i)} className="t-sans" style={{ fontSize: PH.size, fontWeight: 800 }}>
              {Array.from(ph).map((ch, k) => (
                <tspan key={k} data-ch>
                  {ch}
                </tspan>
              ))}
            </text>
          ))}
          {F.phrases.map((ph, i) => (
            <line key={ph} data-el="ul" data-i={i} x1={PH.x} y1={ulY(i)} x2={PH.x + phraseW(i)} y2={ulY(i)} style={{ stroke: 'var(--accent)' }} strokeWidth={2.4} strokeLinecap="round" />
          ))}
          <g transform="translate(0 -18)">
            <PipeInset />
          </g>
        </g>
        {LINKS.map((l, k) => (
          <path key={k} data-el={l.el} data-k={k} d={linkD(k)} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={1.3} strokeLinejoin="round" />
        ))}
        {S2_TAGS.map((t) => (
          <Tag key={t.text} t={t} />
        ))}
        {S3_TAGS.map((t) => (
          <Tag key={t.text} t={t} />
        ))}
      </g>
      <Judgement />
    </Frame>
  )
}

const S2_LIT = ['bi', 'reverse', 'ml', 'contract', 'model', 'alert']
const S3_LIT = ['orch', 'cost']
const S3_EDGES = ['model>bi', 'kafka>fraud', 'oltp>lakehouse']

export const buildSentence: SceneBuild = (q, tl) => {
  const m = (sel: string) => q(`[data-el="mini"] ${sel}`)
  const node = (id: string) => m(`[data-el="bn"][data-id="${id}"]`)
  const edge = (id: string) => m(`[data-el="be"][data-id="${id}"]`)
  const allNodes = m('[data-el="bn"]')
  const allEdges = m('[data-el="be"]')
  const zones = m('[data-el="zone"]')
  const checks = m('[data-el="bcheck"]')
  const phrases = q('[data-el="phrase"]')
  const uls = q('[data-el="ul"]')
  const link2 = q('[data-el="link2"]')
  const link3 = q('[data-el="link3"]')
  const utags = q('[data-el="utag"]')
  const ttags = [...q('[data-el="ttag"]'), ...q('[data-el="ctag2"]')]
  const hl = q('[data-el="ttag"] [data-el="tag-hl"]')
  const cap = (k: number) => q(`[data-el="cap-${k}"]`)
  const dim = 0.28

  // 밑줄 길이와 연결선 출발점은 실제 글자 폭으로 맞춘다(폰트가 늦게 오면 어림값 그대로)
  const widths = phrases.map((p) => (p as SVGTextElement).getComputedTextLength?.() || 0)
  widths.forEach((w, i) => w > 0 && tl.set(uls[i], { attr: { x2: PH.x + w } }, 0))
  ;[...link2, ...link3].forEach((el) => {
    const k = Number((el as SVGElement).dataset.k)
    const w = widths[LINKS[k].i]
    if (w > 0) tl.set(el, { attr: { d: linkD(k, w) } }, 0)
  })
  tl.set(phrases.flatMap((p) => Array.from(p.querySelectorAll('tspan'))), { fillOpacity: 0 }, 0)
  tl.set(uls, { drawSVG: '0%' }, 0)
  tl.set([...link2, ...link3], { drawSVG: '0%', opacity: 1 }, 0)
  tl.set([...utags, ...ttags, ...q('[data-el="tag-hl"]'), q('[data-el="meter"]'), ...q('[data-el="drip"]'), q('[data-el="judge"]'), cap(1), cap(4), ...zones], { opacity: 0 }, 0)
  tl.set([...allNodes, ...allEdges], { opacity: dim }, 0)

  // step 1: 문장이 구절 단위로 써지고, 마지막 구절에서 수도관에 입자가 흐른다
  const s1 = at(0)
  phrases.forEach((p, i) => {
    const chars = Array.from(p.querySelectorAll('tspan'))
    tl.to(chars, { fillOpacity: 1, duration: 0.01, stagger: 0.1 / chars.length, ease: 'none' }, s1 + i * 0.12)
  })
  const drips = q('[data-el="drip"]')
  tl.to(drips, { opacity: 1, duration: 0.03 }, s1 + 0.5)
  tl.fromTo(drips, { y: 0 }, { y: 30, duration: 0.3, ease: 'none' }, s1 + 0.5)
  tl.to(cap(1), { opacity: 1, duration: 0.08 }, s1 + 0.3)

  // step 2: '필요한 사람에게'·'믿을 수 있는' 밑줄 → 연결선 → 짝 노드만 밝게
  const s2 = at(1)
  tl.to([q('[data-el="inset"]'), cap(1)], { opacity: 0, duration: 0.1 }, s2)
  tl.to([uls[0], uls[1]], { drawSVG: '100%', duration: 0.12, stagger: 0.06 }, s2 + 0.06)
  tl.to(link2, { drawSVG: '100%', duration: 0.24, stagger: 0.03, ease: 'none' }, s2 + 0.22)
  const lit2 = [...S2_LIT.flatMap(node), ...checks.map((c) => c.closest('[data-el="be"]')!).filter(Boolean)]
  tl.to(lit2, { opacity: 1, duration: 0.1 }, s2 + 0.48)
  tl.to(utags, { opacity: 1, duration: 0.08, stagger: 0.03 }, s2 + 0.52)

  // step 3: '제때'·'감당할 수 있는 비용' 밑줄 → 15분마다·몇 초, 오케스트레이터, 비용 모니터, Zero-ETL
  const s3 = at(2)
  tl.to([...link2, ...utags], { opacity: 0, duration: 0.08 }, s3)
  tl.to([uls[0], uls[1]], { drawSVG: '0%', duration: 0.08 }, s3)
  tl.to(lit2, { opacity: dim, duration: 0.08 }, s3)
  tl.to([uls[2], uls[3]], { drawSVG: '100%', duration: 0.12, stagger: 0.06 }, s3 + 0.08)
  tl.to(link3, { drawSVG: '100%', duration: 0.24, stagger: 0.03, ease: 'none' }, s3 + 0.22)
  tl.to([...S3_LIT.flatMap(node), ...S3_EDGES.flatMap(edge)], { opacity: 1, duration: 0.1 }, s3 + 0.46)
  tl.to([...ttags, q('[data-el="meter"]')], { opacity: 1, duration: 0.08, stagger: 0.03 }, s3 + 0.5)
  tl.to(hl, { opacity: 1, duration: 0.08 }, s3 + 0.68)

  // step 4: 문장·설계도가 물러나고, 아는 도구는 한 걸음 뒤로, 판단력 네 줄이 앞으로
  const s4 = at(3)
  tl.to(q('[data-el="sent"]'), { opacity: 0, duration: 0.12 }, s4)
  tl.to(q('[data-el="judge"]'), { opacity: 1, duration: 0.1 }, s4 + 0.1)
  tl.fromTo(q('[data-el="tools"]'), { opacity: 1, x: 0 }, { opacity: 0.72, x: -6, duration: 0.25 }, s4 + 0.2)
  tl.fromTo(q('[data-el="jrow"]'), { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.12, stagger: 0.1 }, s4 + 0.24)
  tl.to(cap(4), { opacity: 1, duration: 0.08 }, s4 + 0.4)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 순환 — 새봄의 CSV
// ─────────────────────────────────────────────────────────────
// Desk(Lv5, 동료 2명, 새봄)의 viewBox: 20 0 (마지막 동료 x + 34 − 20) 300. CSV 아이콘은 x 535 부근
const DESK_VB = { x: 20, w: 625 + 34 - 20 }
const CSV_X = 535
const BACK_ROW = ['ceo', 'seok', 'taeo', 'minjae', 'ria'] as const

function Say({ line, el, recall, className = '' }: { line: Line; el: string; recall?: boolean; className?: string }) {
  return (
    <div data-el={el} className={`absolute flex items-start gap-2 ${className}`}>
      <Avatar who={line.who} mood={line.mood} size={32} />
      <div className={`relative min-w-0 rounded-2xl rounded-tl-sm px-3 py-1.5 ${recall ? 'text-muted' : 'border-[1.5px] border-edge bg-surface'}`}>
        {recall && (
          <StageCtx.Provider value={STAGES[0]}>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="diagram absolute inset-0 h-full w-full [&_path]:[vector-effect:non-scaling-stroke]" aria-hidden="true" style={{ color: 'var(--muted)' }}>
              <RRect x={1.5} y={2} w={97} h={36} seed="ep-recall" rough={0.7} />
            </svg>
          </StageCtx.Provider>
        )}
        <p className="relative font-mono text-[0.6875rem] leading-4 text-muted">{PEOPLE[line.who].name}</p>
        <p className="relative text-[0.875rem] leading-6 md:text-[0.9375rem]">{line.text}</p>
      </div>
    </div>
  )
}

export function CycleFig() {
  const { reduced } = useEnv()
  const st = c.scenes.cycle.steps
  const csvPct = `${((CSV_X - DESK_VB.x) / DESK_VB.w) * 100}%`
  return (
    <div data-el="cy-root" data-still={reduced ? '1' : undefined} className="relative h-full w-full">
      <div data-el="desk-layer" className="absolute inset-0 flex flex-col justify-center">
        {/* 뒤쪽 자리의 동료들(위), 말풍선(가운데), 책상(아래): 새봄 말풍선 꼬리 → 점선 → CSV가 한 줄로 이어진다 */}
        <ul className="flex items-end justify-center gap-4 opacity-80 md:gap-6" aria-hidden="true">
          {BACK_ROW.map((w) => (
            <li key={w} className="flex flex-col items-center">
              <Avatar who={w} size={26} />
              <span className="mt-0.5 font-mono text-[0.6875rem] leading-4 text-muted">{PEOPLE[w].name}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-2 h-[10.5rem] md:h-[11.5rem]">
          <Say el="sb1" line={st[0].lines![0]} className="bottom-4 right-0" />
          <span data-el="sb1" className="absolute bottom-0 h-4 w-3 -translate-x-1/2" style={{ left: csvPct }} aria-hidden="true">
            <svg viewBox="0 0 12 16" className="diagram h-full w-full">
              <path d="M 1 0 L 6 16 L 11 0" style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
            </svg>
          </span>
          <Say el="recall" recall line={{ who: 'juni', mood: 'relaxed', text: F.recall }} className="left-0 top-0" />
          <Say el="juni2" line={st[1].lines![0]} className="left-0 top-[3.5rem]" />
          <Say el="sb2" line={st[1].lines![1]} className="right-0 top-[7rem]" />
        </div>
        <div className="relative mt-1">
          <Desk level={5} mood="relaxed" visitors={2} newbie />
          <svg data-el="sb1" viewBox={`${DESK_VB.x} 0 ${DESK_VB.w} 300`} className="diagram pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <line x1={CSV_X} y1={-8} x2={CSV_X} y2={132} style={{ stroke: 'var(--edge)' }} strokeWidth={2} strokeDasharray="3 4" />
          </svg>
        </div>
        <p className="text-right font-mono text-[0.6875rem] leading-4 text-muted">
          {PEOPLE.daon.name} · {PEOPLE.sora.name}
        </p>
      </div>
      <div data-el="paper-layer" className="absolute inset-0">
        <Frame>
          <g data-el="ghost" style={{ opacity: 0.15 }}>
            <Blueprint />
          </g>
          <BlueprintWithCard newbie />
        </Frame>
      </div>
    </div>
  )
}

export const buildCycle: SceneBuild = (q, tl) => {
  const still = q('[data-still]').length > 0
  const sb1 = q('[data-el="sb1"]')
  const recall = q('[data-el="recall"]')
  const juni = q('[data-el="juni2"]')
  const sb2 = q('[data-el="sb2"]')
  const bp = q('[data-el="bp"]')
  tl.set([...sb1, ...recall, ...juni, ...sb2, q('[data-el="paper-layer"]'), q('[data-el="nb-new"]'), q('[data-el="ghost"]')], { opacity: 0 }, 0)
  tl.set(q('[data-el="bp"] [data-el="bp-body"]'), { opacity: 0.15 }, 0)
  tl.set(q('[data-el="card-l"]'), { opacity: 0.4 }, 0)
  tl.set(bp, { svgOrigin: '0 0', scale: 1, x: 0, y: 0 }, 0)

  // step 1: 새봄의 말풍선, 꼬리는 CSV를 가리킨다
  const s1 = at(0)
  tl.fromTo(sb1, { y: 8 }, { opacity: 1, y: 0, duration: 0.2 }, s1 + 0.1)

  // step 2: 회상 말풍선이 내려와 지금의 질문으로 바뀐다(모션 줄이기: 위아래로 함께)
  const s2 = at(1)
  tl.to(sb1, { opacity: 0, duration: 0.1 }, s2)
  tl.to(recall, { opacity: 0.85, duration: 0.1 }, s2 + 0.06)
  if (still) {
    tl.to(juni, { opacity: 1, duration: 0.1 }, s2 + 0.3)
  } else {
    tl.to(recall, { y: '3.5rem', duration: 0.28, ease: 'power2.inOut' }, s2 + 0.22)
    tl.to(recall, { opacity: 0, duration: 0.14 }, s2 + 0.38)
    tl.to(juni, { opacity: 1, duration: 0.14 }, s2 + 0.38)
  }
  tl.to(sb2, { opacity: 1, duration: 0.12 }, s2 + 0.6)

  // step 3: 줌아웃을 거꾸로 — 맵이 첫 스케치 카드로 다가가고, 노트북 라벨만 새봄의 것으로
  const s3 = at(2)
  tl.to(q('[data-el="desk-layer"]'), { opacity: 0, duration: 0.12 }, s3)
  tl.to(q('[data-el="paper-layer"]'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  const s = 4
  const pw = W / CARD.s
  const ph = H / CARD.s
  tl.to(bp, { ...zoomedIn(s, (W - pw * s) / 2, (H - ph * s) / 2), duration: 0.5, ease: 'power2.inOut' }, s3 + 0.12)
  tl.to(q('[data-el="card-l"]'), { opacity: 0, duration: 0.1 }, s3 + 0.12)
  // 종이 가장자리 밖으로 설계도 전체가 아주 흐린 윤곽으로 남는다
  tl.to(q('[data-el="ghost"]'), { opacity: 0.15, duration: 0.2 }, s3 + 0.42)
  tl.to(q('[data-el="nb-old"]'), { opacity: 0, duration: 0.12 }, s3 + 0.64)
  tl.to(q('[data-el="nb-new"]'), { opacity: 1, duration: 0.12 }, s3 + 0.64)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 도감 완성 — A부터 Z까지
// ─────────────────────────────────────────────────────────────
const TILE = { w: 104, h: 58 }
const GRID = { x: 6, y: 46, gx: 108, gy: 62, cols: 4 }
const STRIP = { y0: 30, pitch: 41, tx: 266, gap: 56, s: 0.5 }
const STRIP_CH = QUIZ_CHAPTERS
const gridPos = (i: number): [number, number] => [GRID.x + (i % GRID.cols) * GRID.gx, GRID.y + Math.floor(i / GRID.cols) * GRID.gy]
const stripPos = (letter: string): [number, number] => {
  const card = CARDS.find((x) => x.letter === letter)!
  const row = STRIP_CH.indexOf(card.chapter as (typeof STRIP_CH)[number])
  const k = Math.max(0, F.dexStrip[row]?.indexOf(letter) ?? 0)
  return [STRIP.tx + k * STRIP.gap, STRIP.y0 + row * STRIP.pitch - (TILE.h * STRIP.s) / 2]
}
/** 긴 용어는 두 줄로 */
const termLines = (t: string) => (t.length > 13 && t.includes(' ') ? [t.slice(0, t.lastIndexOf(' ')), t.slice(t.lastIndexOf(' ') + 1)] : [t])

// 레이더: 바이블 0-5 누적값 11단계
const RC = { x: 220, y: 200, r: 96 }
const STAGES_CUM = STRIP_CH.map((_, k) => statsOf(new Set(STRIP_CH.slice(0, k + 1))))
const FINAL = STAGES_CUM[STAGES_CUM.length - 1]
const TOP2 = [...STAT_KEYS].sort((a, b) => FINAL[b] - FINAL[a]).slice(0, 2)
const ang = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / STAT_KEYS.length
const rpt = (i: number, v: number) => [RC.x + RC.r * (v / 100) * Math.cos(ang(i)), RC.y + RC.r * (v / 100) * Math.sin(ang(i))]
const rpoints = (vals: Record<StatKey, number>) => STAT_KEYS.map((k, i) => rpt(i, Math.min(100, vals[k])).map((n) => n.toFixed(1)).join(',')).join(' ')

function FinalRadar() {
  return (
    <g data-el="radar">
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={STAT_KEYS.map((_, i) => rpt(i, v).join(',')).join(' ')} style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1} />
      ))}
      {STAT_KEYS.map((_, i) => {
        const [x, y] = rpt(i, 100)
        return <line key={i} x1={RC.x} y1={RC.y} x2={x} y2={y} style={{ stroke: 'var(--edge)' }} strokeWidth={1} />
      })}
      <polygon data-el="rpoly" points={rpoints(FINAL)} style={{ fill: 'var(--accent)', fillOpacity: 0.2, stroke: 'var(--accent)' }} strokeWidth={2.6} strokeLinejoin="round" />
      {STAT_KEYS.map((k, i) => {
        const [x, y] = rpt(i, 122)
        const anchor = Math.abs(x - RC.x) < 8 ? 'middle' : x > RC.x ? 'start' : 'end'
        const top = TOP2.includes(k)
        const dy = y < RC.y - 20 ? -14 : y > RC.y + 20 ? 6 : -6
        return (
          <g key={k}>
            <Txt x={x} y={y + dy} size={13.5} weight={top ? 850 : 500} anchor={anchor}>
              {STAT_LABELS[k]}
            </Txt>
            <g data-el="rval">
              <Txt x={x} y={y + dy + 18} size={top ? 16 : 13.5} weight={top ? 850 : 600} anchor={anchor} mono>
                {FINAL[k]}
              </Txt>
            </g>
          </g>
        )
      })}
      <g data-el="lv">
        <rect x={RC.x - 78} y={378} width={156} height={46} rx={10} style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }} strokeWidth={2.4} />
        <Txt x={RC.x} y={408} size={21} weight={850} anchor="middle">
          {UI.hud.level(5, LEVELS[5])}
        </Txt>
      </g>
    </g>
  )
}

export function DexFig() {
  const { cards } = useProgress()
  const n = cards.size
  return (
    <Frame captions={[['cap-3', F.radarNote]]}>
      <g data-el="strip">
        {STRIP_CH.map((id, row) => {
          const t = tocOf(id)
          const y = STRIP.y0 + row * STRIP.pitch
          return (
            <g key={id} data-el="srow">
              <line x1={6} y1={y + STRIP.pitch / 2} x2={W - 6} y2={y + STRIP.pitch / 2} style={{ stroke: 'var(--edge)' }} strokeWidth={1} />
              <Txt x={8} y={y + 5} size={12} weight={600} mono muted>
                {t.label}
              </Txt>
              <Txt x={70} y={y + 5} size={13.5} weight={700}>
                {t.title}
              </Txt>
            </g>
          )
        })}
      </g>
      <g data-el="grid">
        <g data-el="banner">
          <Txt x={W / 2} y={30} size={16} weight={850} anchor="middle">
            {n === 26 ? F.dexDone(26) : F.dexCount(n)}
          </Txt>
        </g>
        {CARDS.map((card, i) => {
          const [x, y] = gridPos(i)
          return (
            <g key={card.letter} data-el="slot">
              <rect x={x} y={y} width={TILE.w} height={TILE.h} rx={6} style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1.2} strokeDasharray="4 4" />
              <Txt x={x + 10} y={y + 27} size={24} weight={800} mono muted>
                {card.letter}
              </Txt>
            </g>
          )
        })}
      </g>
      {CARDS.map((card, i) => {
        const [x, y] = gridPos(i)
        const [sx, sy] = stripPos(card.letter)
        const owned = cards.has(card.letter)
        // 못 모은 칸의 'Prologue에서 얻어요'처럼 긴 문구도 칸을 넘지 않게 두 줄로
        const lines = termLines(owned ? card.term : F.getAt(tocOf(card.chapter).label))
        return (
          <g key={card.letter} data-el="tile" data-gx={x} data-gy={y} data-sx={sx} data-sy={sy}>
            <rect
              x={x}
              y={y}
              width={TILE.w}
              height={TILE.h}
              rx={6}
              style={owned ? { fill: 'var(--surface)', stroke: 'var(--line)' } : { fill: 'var(--bg)', stroke: 'var(--line)', strokeDasharray: '5 4' }}
              strokeWidth={1.6}
            />
            <Txt x={x + 10} y={y + 27} size={24} weight={850} mono muted={!owned}>
              {card.letter}
            </Txt>
            <g data-el="term">
              {lines.map((l, k) => (
                <Txt key={k} x={x + 10} y={y + (lines.length > 1 ? 41 : 47) + k * 12} size={owned && lines.length === 1 ? 12.5 : 11.5} weight={owned ? 650 : 600} muted={!owned}>
                  {l}
                </Txt>
              ))}
            </g>
          </g>
        )
      })}
      <FinalRadar />
    </Frame>
  )
}

export const buildDex: SceneBuild = (q, tl) => {
  const rows = q('[data-el="srow"]')
  const tiles = q('[data-el="tile"]')
  const terms = q('[data-el="term"]')
  const cap3 = q('[data-el="cap-3"]')
  const num = (el: Element, k: string) => Number((el as SVGElement).dataset[k])
  tl.set([...rows, ...tiles, ...terms, q('[data-el="grid"]'), q('[data-el="radar"]'), cap3], { opacity: 0 }, 0)
  tiles.forEach((t) => tl.set(t, { svgOrigin: `${num(t, 'gx')} ${num(t, 'gy')}`, x: num(t, 'sx') - num(t, 'gx'), y: num(t, 'sy') - num(t, 'gy'), scale: STRIP.s }, 0))

  // step 1: 칸마다 챕터 제목(문제)이 먼저, 그다음 그 챕터의 카드
  const s1 = at(0)
  rows.forEach((r, i) => {
    const ch = STRIP_CH[i]
    tl.to(r, { opacity: 1, duration: 0.04 }, s1 + i * 0.058)
    const mine = tiles.filter((_, k) => CARDS[k].chapter === ch)
    tl.to(mine, { opacity: 1, duration: 0.04 }, s1 + i * 0.058 + 0.04)
  })

  // step 2: 카드가 각자 알파벳 칸으로 이동(FLIP, transform만)
  const s2 = at(1)
  tl.to(rows, { opacity: 0, duration: 0.1 }, s2)
  tl.to(q('[data-el="grid"]'), { opacity: 1, duration: 0.1 }, s2 + 0.06)
  tl.to(tiles, { x: 0, y: 0, scale: 1, duration: 0.42, ease: 'power2.inOut', stagger: 0.006 }, s2 + 0.12)
  tl.to(terms, { opacity: 1, duration: 0.1 }, s2 + 0.62)

  // step 3: 격자가 물러나고, 레이더가 챕터 순서대로 자란다(누적 11단계)
  const s3 = at(2)
  tl.to([...tiles, q('[data-el="grid"]')], { opacity: 0, duration: 0.1 }, s3)
  tl.to(q('[data-el="radar"]'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  const poly = q('[data-el="rpoly"]')
  const vals = q('[data-el="rval"]')
  const lv = q('[data-el="lv"]')
  tl.set(poly, { attr: { points: rpoints(STAGES_CUM[0]) } }, 0)
  tl.set([...vals, ...lv], { opacity: 0 }, 0)
  const step = 0.5 / (STAGES_CUM.length - 1)
  STAGES_CUM.slice(1).forEach((v, k) => tl.to(poly, { attr: { points: rpoints(v) }, duration: step, ease: 'none' }, s3 + 0.12 + k * step))
  tl.to(vals, { opacity: 1, duration: 0.08 }, s3 + 0.64)
  tl.to([...lv, ...cap3], { opacity: 1, duration: 0.08 }, s3 + 0.66)
}

