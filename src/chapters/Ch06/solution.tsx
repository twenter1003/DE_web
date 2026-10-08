import { ch6 } from '../../content/chapters/ch6'
import { T } from '../../content/map'
import { Badge, Gauge } from '../../components/diagram'
import { Txt } from '../../components/fig'
import { PipelineMap, mapTransition } from '../../components/PipelineMap'
import { RPath, RRect } from '../../components/sketch'
import { at, type Q, type SceneBuild } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'
import { mapStateAt } from '../../state/derive'

// 장면 6. 해결 — 양동이 옆에 수도꼭지
// 야간 ETL 배치의 보조 라벨은 step 1~2 동안 장면 3의 '1분마다'로 바꿔 두고, step 3에서 맵의 원래 라벨(매일 03:00)로 되돌린다.
// 세로 배치 맵(데스크톱·모바일 공용) 위에 덧그린다. Ch6 시점의 세로 배치에서는 여러 연결선이 다른 노드 뒤로
// 지나가므로(예: 앱 → 이벤트 브로커가 CDC를 가로지름), 그런 선은 맵의 선을 숨기고 노드 사이 틈·바깥 통로로 꺾어 다시 그린다.

const F = ch6.figures
type P = [number, number]
type Bx = { x: number; y: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number }
type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined

const NOW = mapStateAt(T.ch6)
const BEFORE = mapStateAt(T.ch5)
const NOW_E = new Set(NOW.edges.map((e) => e.id))
/** 그릴 연결선: Ch6의 선 + Ch5에만 있던 선(앱 → 레이크, step 3에서 지운다) */
const EDGES = [...NOW.edges, ...BEFORE.edges.filter((e) => !NOW_E.has(e.id))]
const KIND = Object.fromEntries(EDGES.map((e) => [e.id, e.kind]))
/** 새 노드가 나타나는 step(0부터) */
const NODE_STEP: Record<string, number> = { kafka: 0, fraud: 0, cdc: 1, stock: 1 }
/** 새 선이 나타나는 step */
const EDGE_STEP: Record<string, number> = { 'app>kafka': 0, 'kafka>fraud': 0, 'oltp>cdc': 1, 'cdc>kafka': 1, 'kafka>stock': 1, 'kafka>lake': 2 }
const GONE = 'app>lake'
const DIM = 0.25

const bx = (n: { x: number; y: number; w: number; h: number }): Bx => ({ ...n, x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 })
const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
const init = (tl: gsap.core.Timeline, targets: Element[], vars: gsap.TweenVars) => {
  if (!targets.length) return
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}

/** 노드 테두리와 중심선이 만나는 점(PipelineMap과 같은 방식) */
function clip(n: Bx, tx: number, ty: number, gap: number): P {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}
const straight = (a: Bx, b: Bx): P[] => [clip(a, b.x, b.y, 5), clip(b, a.x, a.y, 7)]
/** 마지막 점을 앞 점 쪽으로 d만큼 당긴다 */
const trimEnd = (pts: P[], d: number): P[] => {
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const k = Math.min(d, len / 2) / len
  return [...pts.slice(0, -1), [b[0] - (b[0] - a[0]) * k, b[1] - (b[1] - a[1]) * k]]
}

/**
 * 세로 배치(Ch6)에서 다른 노드에 가리는 선의 경로. 오른쪽·왼쪽 바깥 통로(R·L),
 * 분산 처리와 오케스트레이터 사이 틈(이벤트 브로커 → 이상 결제 탐지·실시간 재고 화면 갈래), 행 사이 틈을 쓴다.
 */
function routesOf(N: Record<string, Bx>): Record<string, P[]> {
  const all = Object.values(N)
  const L = Math.min(...all.map((n) => n.x0)) - 14
  const R = Math.max(...all.map((n) => n.x1)) + 14
  const { app, etl, lake, kafka, spark, orch, fraud, stock, warehouse: wh, alert } = N
  const r: Record<string, P[]> = {}
  if (app && kafka) r['app>kafka'] = [[app.x1 + 3, app.y], [R, app.y], [R, kafka.y - 9], [kafka.x1 + 7, kafka.y - 9]]
  if (app && lake) r['app>lake'] = [[app.x1 + 3, app.y], [R, app.y], [R, lake.y], [lake.x1 + 7, lake.y]]
  if (orch && alert) r['orch>alert'] = [[orch.x1 + 3, orch.y], [R, orch.y], [R, alert.y], [alert.x1 + 7, alert.y]]
  if (etl && wh) r['etl>warehouse'] = [[etl.x0 - 3, etl.y], [L, etl.y], [L, wh.y], [wh.x0 - 7, wh.y]]
  if (spark && wh) r['spark>warehouse'] = [[spark.x0 - 3, spark.y], [L, spark.y], [L, wh.y], [wh.x0 - 7, wh.y]]
  if (kafka && spark && fraud && stock) {
    const fork = (spark.y1 + fraud.y0) / 2 + 7
    r['kafka>fraud'] = [[kafka.x, kafka.y1 + 3], [kafka.x, fork], [fraud.x, fork], [fraud.x, fraud.y0 - 7]]
    r['kafka>stock'] = [[kafka.x, kafka.y1 + 3], [kafka.x, fork], [stock.x, fork], [stock.x, stock.y0 - 7]]
  }
  if (orch && spark) {
    const u = orch.y1 + 10
    r['orch>spark'] = [[orch.x - orch.w * 0.3, orch.y1 + 3], [orch.x - orch.w * 0.3, u], [spark.x + spark.w * 0.3, u], [spark.x + spark.w * 0.3, spark.y1 + 7]]
  }
  if (orch && etl) {
    const h = etl.y1 + 14
    r['orch>etl'] = [[orch.x + orch.w * 0.3, orch.y0 - 3], [orch.x + orch.w * 0.3, h], [etl.x + etl.w * 0.27, h], [etl.x + etl.w * 0.27, etl.y1 + 7]]
  }
  if (lake && spark) {
    const h = lake.y1 + 30
    r['lake>spark'] = [[lake.x - lake.w * 0.4, lake.y1 + 3], [lake.x - lake.w * 0.4, h], [spark.x - spark.w * 0.27, h], [spark.x - spark.w * 0.27, spark.y0 - 7]]
  }
  return r
}

function PolyArrow({ pts, seed, el, dash, head = 8 }: { pts: P[]; seed: string; el: string; dash?: string; head?: number }) {
  const d = 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const hd = `M ${b[0] - head * Math.cos(ang - 0.45)} ${b[1] - head * Math.sin(ang - 0.45)} L ${b[0]} ${b[1]} L ${b[0] - head * Math.cos(ang + 0.45)} ${b[1] - head * Math.sin(ang + 0.45)}`
  return (
    <g data-el={el}>
      <RPath d={d} seed={seed} rough={0.5} dash={dash} data-el="shaft" />
      <RPath d={hd} seed={`${seed}h`} rough={0.2} data-el="head" />
    </g>
  )
}

const rel = (pts: P[]) => pts.map(([x, y]) => `${(x - pts[0][0]).toFixed(1)},${(y - pts[0][1]).toFixed(1)}`).join(' ')
const box = (x0: number, y0: number, x1: number, y1: number) => `${x0.toFixed(1)} ${y0.toFixed(1)} ${(x1 - x0).toFixed(1)} ${(y1 - y0).toFixed(1)}`

const LIVE_ROW = (i: number) => 72 + i * 22
const STOCK_LABEL = NOW.nodes.find((n) => n.id === 'stock')?.label ?? ''

function SolOverlay({ at: pos }: { at: At }) {
  const N: Record<string, Bx> = {}
  for (const n of NOW.nodes) {
    const r = pos(n.id)
    if (r) N[n.id] = bx(r)
  }
  const { app, oltp, cdc, etl, lake, kafka, fraud, stock, bi } = N
  if (!app || !oltp || !cdc || !etl || !lake || !kafka || !fraud || !stock || !bi) return null
  const routes = routesOf(N)
  const ids = Object.keys(routes)
  const all = Object.values(N)
  const minX = Math.min(...all.map((n) => n.x0)) - 22
  const maxX = Math.max(...all.map((n) => n.x1)) + 22
  const card = { x0: stock.x0 - 4, x1: stock.x1 + 8, y0: stock.y0 - 2, y1: stock.y0 + 126 }
  // 바늘 게이지: 양옆 구간 라벨(13)이 운영 DB에 닿지 않는 자리
  const g = { x: oltp.x0 - 70, y: oltp.y + 10, r: 34 }
  const gMin = g.x - g.r - 34

  // 입자 경로: 앱 → 브로커 → 이상 결제 탐지 / 운영 DB → CDC → 브로커 → 실시간 재고 화면 / 브로커 → 레이크
  const toFraud: P[] = [...(routes['app>kafka'] ?? straight(app, kafka)), [kafka.x, kafka.y], ...(routes['kafka>fraud'] ?? straight(kafka, fraud))]
  const toStock: P[] = [...straight(oltp, cdc), [cdc.x, cdc.y], ...straight(cdc, kafka), [kafka.x, kafka.y], ...(routes['kafka>stock'] ?? straight(kafka, stock))]
  // 레이크 쪽 입자는 끝에 남으므로 화살촉에서 조금 떨어진 자리에서 멈춘다(레이크 라벨을 가리지 않게)
  const toLake = trimEnd(routes['kafka>lake'] ?? straight(kafka, lake), 14)

  return (
    <g>
      <rect
        data-el="cams"
        data-c1={box(minX, app.y0 - 18, maxX, card.y1 + 14)}
        data-c2={box(minX, app.y0 - 18, maxX, card.y1 + 14)}
        data-c3={box(gMin - 8, app.y0 - 18, maxX, bi.y1 + 18)}
        data-m1={box(minX, app.y0 - 14, maxX, stock.y1 + 14)}
        data-m2={box(minX, oltp.y0 - 14, maxX, card.y1 + 12)}
        data-m3={box(gMin - 6, app.y0 - 14, maxX, kafka.y1 + 24)}
        data-rr={ids.join(',')}
        x={minX}
        y={app.y0}
        width={0}
        height={0}
        style={{ fill: 'none' }}
      />
      {ids.map((id) => (
        <g key={id} style={KIND[id] === 'control' ? { opacity: 0.75 } : undefined}>
          <PolyArrow pts={routes[id]} seed={`s6-${id}`} el={`rr-${id}`} dash={KIND[id] === 'control' ? '3 6' : undefined} />
        </g>
      ))}

      {/* 이벤트 브로커 안의 가는 레인 3줄 */}
      <g data-el="k-lanes">
        {[-10, 0, 10].map((dy, i) =>
          [kafka.x0 + 6, kafka.x1 - 24].map((x, j) => (
            <g key={`${i}${j}`}>
              <line x1={x} y1={kafka.y + dy} x2={x + 18} y2={kafka.y + dy} style={{ stroke: 'var(--line)' }} strokeWidth={1} />
              <circle cx={x + 5 + ((i + j) % 2) * 8} cy={kafka.y + dy} r={1.9} style={{ fill: 'var(--accent)' }} />
            </g>
          )),
        )}
      </g>

      {/* step 1: 결제 보류 알림(실시간 재고 화면 자리는 step 2에 채워진다) */}
      <g data-el="hold">
        <path d={`M ${stock.x0 - 1} ${fraud.y - 8} L ${fraud.x1 + 3} ${fraud.y} L ${stock.x0 - 1} ${fraud.y + 8} Z`} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.4} strokeLinejoin="round" />
        <rect x={stock.x0 - 2} y={stock.y - 28} width={stock.w + 8} height={56} rx={10} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} />
        <rect x={stock.x0} y={fraud.y - 6.5} width={3} height={13} style={{ fill: 'var(--surface)' }} />
        <Badge x={stock.x0 + 16} y={stock.y - 10} status="wait" r={9} />
        <Txt x={stock.x0 + 31} y={stock.y - 5} size={13} weight={800}>
          {F.hold[0]}
        </Txt>
        <Txt x={stock.x0 + 31} y={stock.y + 16} size={12.5} weight={650}>
          {F.hold[1]}
        </Txt>
      </g>

      {/* step 2: 실시간 재고 화면이 미니 표를 펼친다 */}
      <g data-el="stock-card">
        <RRect x={card.x0} y={card.y0} w={card.x1 - card.x0} h={card.y1 - card.y0} seed="s6-card" rough={0.5} fill="var(--surface)" />
        <Txt x={(card.x0 + card.x1) / 2} y={card.y0 + 24} size={15} weight={650} anchor="middle">
          {STOCK_LABEL}
        </Txt>
        <line x1={card.x0 + 10} y1={card.y0 + 40} x2={card.x1 - 10} y2={card.y0 + 40} style={{ stroke: 'var(--edge)' }} strokeWidth={1.2} />
        {F.liveStock.map((r, i) => (
          <g key={r.name}>
            <Txt x={card.x0 + 12} y={card.y0 + LIVE_ROW(i)} size={13} weight={600}>
              {r.name}
            </Txt>
            <Txt x={card.x0 + 104} y={card.y0 + LIVE_ROW(i)} size={14} weight={800} anchor="end" mono el={i === 0 ? 'live-0' : undefined}>
              {String(r.from)}
            </Txt>
          </g>
        ))}
        <g data-el="sold-out">
          <Badge x={card.x0 + 121} y={card.y0 + LIVE_ROW(0) - 4.5} status="fail" r={8} />
          <Txt x={card.x0 + 133} y={card.y0 + LIVE_ROW(0)} size={12.5} weight={800} color="var(--fail)">
            {F.soldOut}
          </Txt>
        </g>
      </g>

      {/* step 3: 야간 ETL 배치는 다시 매일 03:00, 운영 DB 부하는 보통 */}
      <Txt x={etl.x} y={etl.y + 15} size={11.5} anchor="middle" muted el="etl-1m">
        {F.scheduleNew}
      </Txt>
      <Badge x={etl.x1 - 2} y={etl.y0 + 2} status="ok" r={10} el="etl-ok" />
      <g data-el="g-wrap">
        <Gauge x={g.x} y={g.y} r={g.r} label={F.dbLoad} el="s6g" value={0.88} seed="s6-g" />
        <Txt x={g.x - g.r - 5} y={g.y + 5} size={13} anchor="end" muted>
          {F.zones[0]}
        </Txt>
        <Txt x={g.x} y={g.y - g.r - 9} size={13} weight={700} anchor="middle">
          {F.zones[1]}
        </Txt>
        <Txt x={g.x + g.r + 5} y={g.y + 5} size={13} muted>
          {F.zones[2]}
        </Txt>
      </g>

      {/* 입자 */}
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} data-el="p-fraud" data-pts={rel(toFraud)} cx={toFraud[0][0]} cy={toFraud[0][1]} r={5.5} style={{ fill: 'var(--accent)' }} />
      ))}
      {[0, 1, 2].map((k) => (
        <circle key={k} data-el="p-stock" data-pts={rel(toStock)} cx={toStock[0][0]} cy={toStock[0][1]} r={5.5} style={{ fill: 'var(--accent)' }} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <circle key={k} data-el="p-lake" data-pts={rel(toLake)} cx={toLake[0][0] + ((k % 3) - 1) * 7} cy={toLake[0][1] + ((k % 3) - 1) * 4} r={5} style={{ fill: 'var(--accent)' }} />
      ))}
    </g>
  )
}

export function SolutionFig() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <PipelineMap t={T.ch6} from={T.ch5} vertical overlay={(a) => <SolOverlay at={a} />} />
      </div>
      <p className="mt-2 grid text-center text-[0.8125rem] leading-snug text-muted md:text-sm">
        <span data-el="cap-rule" className="col-start-1 row-start-1">
          {F.ruleNote}
        </span>
        <span data-el="count" className="col-start-1 row-start-1 font-mono font-bold text-ink">
          {F.nodes(BEFORE.nodes.length, NOW.nodes.length)}
        </span>
      </p>
    </div>
  )
}

const parseBox = (s: string | undefined) => {
  const [x, y, w, h] = (s ?? '0 0 100 100').split(' ').map(Number)
  return { x, y, w, h }
}
/** 영역 r을 화면 비율(aspect) 뷰에 맞춘다. 가로가 남으면 가운데, 세로가 남으면 아래로 */
const fitBox = (r: { x: number; y: number; w: number; h: number }, aspect: number) => {
  const h = Math.max(r.h, r.w / aspect)
  const w = h * aspect
  return `${(r.x + r.w / 2 - w / 2).toFixed(1)} ${r.y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

/** data-pts(시작점 기준 상대 좌표)를 따라 움직인다. keep이면 끝에 남는다(정지 그림에서 도착한 자리를 보여 준다). 끝 시각을 돌려준다 */
function flowAlong(tl: gsap.core.Timeline, el: Element | undefined, t: number, dur: number, keep = false) {
  if (!el) return t
  const pts = ((el as SVGElement).dataset.pts ?? '').split(' ').map((s) => s.split(',').map(Number) as P)
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]))
  const total = seg.reduce((a, b) => a + b, 0) || 1
  let tt = t
  tl.to(el, { opacity: 1, duration: 0.01 }, t)
  pts.slice(1).forEach(([x, y], i) => {
    const d = (dur * seg[i]) / total
    tl.to(el, { x, y, duration: d, ease: 'none' }, tt)
    tt += d
  })
  if (!keep) tl.to(el, { opacity: 0, duration: 0.01 }, tt)
  return tt
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const svg = o('map')[0] as SVGSVGElement | undefined
  const cams = o('cams')[0] as SVGElement | undefined
  if (!svg || !cams) return
  const rect = svg.getBoundingClientRect()
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.8
  const d = cams.dataset
  const cam = [1, 2, 3].map((i) => fitBox(parseBox(d[`${mobile ? 'm' : 'c'}${i}`]), aspect))

  // 남는 노드는 처음부터 지금 자리에(Ch5 → Ch6 사이 세로 배치가 달라 미끄러지면 연결선과 어긋난다)
  q('[data-node][data-dx], [data-node][data-dy]').forEach((el) => {
    delete (el as SVGElement).dataset.dx
    delete (el as SVGElement).dataset.dy
  })
  // 앱 → 레이크 직접 선은 step 3에서 지운다(mapTransition이 미리 지우지 않게)
  q(`[data-edge="${GONE}"]`).forEach((el) => el.setAttribute('data-change', 'stay'))
  svg.dataset.vbFrom = cam[0]
  svg.dataset.vbTo = cam[0]
  gsap.set(svg, { attr: { viewBox: cam[0] } })
  mapTransition(q, tl, at(0), { dur: 0.6 })

  const rr = new Set((d.rr ?? '').split(',').filter(Boolean))
  const nodeEls = (id: string) => q(`[data-node="${id}"] > :not(.node-focus)`)
  const edgeEls = (id: string) => (rr.has(id) ? o(`rr-${id}`) : q(`[data-edge="${id}"] > *`))
  const shafts = (id: string) => (rr.has(id) ? q(`[data-el="rr-${id}"] [data-el="shaft"] path`) : q(`[data-edge="${id}"] [data-el="shaft"] path`))
  const heads = (id: string) => (rr.has(id) ? q(`[data-el="rr-${id}"] [data-el="head"]`) : q(`[data-edge="${id}"] [data-el="head"]`))
  // 다시 그린 선은 맵의 원래 선을 숨긴다
  init(tl, [...rr].flatMap((id) => q(`[data-edge="${id}"] > *`)), { opacity: 0 })

  // ── 진하게 보일 노드 ──
  // 데스크톱: step 1~2는 Ch5의 노드 11개를 흐리게, 새 노드와 새 연결선만 진하게(스토리보드). step 3은 모두 진하게.
  // 모바일: 그 step의 노드와 바로 이어진 노드만 진하게(모바일 메모).
  const bold: (Set<string> | null)[] = mobile
    ? [new Set(['app', 'kafka', 'fraud']), new Set(['oltp', 'cdc', 'kafka', 'stock']), new Set(['kafka', 'lake', 'etl', 'oltp'])]
    : [new Set(['kafka', 'fraud']), new Set(['kafka', 'fraud', 'cdc', 'stock']), null]
  const isBold = (i: number, id: string) => bold[i] === null || bold[i]!.has(id)
  const opNode = (i: number, id: string) => ((NODE_STEP[id] ?? -1) > i ? 0 : isBold(i, id) ? 1 : DIM)
  const opEdge = (i: number, id: string) => {
    if (id === GONE && i >= 2) return 0
    const s = EDGE_STEP[id] ?? -1
    if (s > i) return 0
    if (!mobile && s >= 0) return 1
    const [a, b] = id.split('>')
    return isBold(i, a) && isBold(i, b) ? 1 : DIM
  }
  const nodeIds = NOW.nodes.map((n) => n.id)
  const edgeIds = EDGES.map((e) => e.id)

  // 처음 상태: Ch5의 맵 그대로(새 노드·선은 아직 없음)
  const newNodes = nodeIds.filter((id) => id in NODE_STEP)
  const newEdges = edgeIds.filter((id) => id in EDGE_STEP)
  init(tl, newNodes.flatMap(nodeEls), { opacity: 0 })
  init(
    tl,
    newNodes.flatMap((id) => q(`[data-node="${id}"] path`)),
    { drawSVG: '0%' },
  )
  init(
    tl,
    newNodes.flatMap((id) => q(`[data-node="${id}"] text`)),
    { opacity: 0 },
  )
  init(tl, newEdges.flatMap(edgeEls), { opacity: 0 })
  init(tl, newEdges.flatMap(shafts), { drawSVG: '0%' })
  init(tl, newEdges.flatMap(heads), { opacity: 0 })
  init(tl, [...o('k-lanes'), ...o('hold'), ...o('stock-card'), ...o('sold-out'), ...o('etl-ok'), ...o('g-wrap'), ...o('p-fraud'), ...o('p-stock'), ...o('p-lake'), ...o('cap-rule'), ...o('count')], { opacity: 0 })
  // 야간 ETL 배치의 보조 라벨: 처음엔 '1분마다'(장면 3에서 바꾼 스케줄)
  const etlSub = q('[data-node="etl"] text.t-muted')
  const etl1m = o('etl-1m')
  init(tl, etlSub, { opacity: 0 })
  const needle = o('s6g-needle')[0] as SVGElement | undefined
  const origin = needle?.dataset.origin ?? '0 0'
  if (needle) init(tl, [needle], { rotation: -90 + 0.88 * 180, svgOrigin: origin })

  /** step i로 넘어갈 때 진하기 바꾸기(새로 나타나는 것은 따로 그린다) */
  const restyle = (i: number, t: number) => {
    for (const id of nodeIds) {
      const prev = i === 0 ? ((NODE_STEP[id] ?? -1) >= 0 ? 0 : 1) : opNode(i - 1, id)
      const next = opNode(i, id)
      if (next !== prev && NODE_STEP[id] !== i) tl.to(nodeEls(id), { opacity: next, duration: 0.12 }, t)
    }
    for (const id of edgeIds) {
      if (id === GONE && i === 2) continue
      const prev = i === 0 ? ((EDGE_STEP[id] ?? -1) >= 0 ? 0 : 1) : opEdge(i - 1, id)
      const next = opEdge(i, id)
      if (next !== prev && EDGE_STEP[id] !== i) tl.to(edgeEls(id), { opacity: next, duration: 0.12 }, t)
    }
  }
  const revealNode = (i: number, id: string, t: number) => {
    tl.to(nodeEls(id), { opacity: opNode(i, id), duration: 0.02 }, t)
    tl.to(q(`[data-node="${id}"] path`), { drawSVG: '100%', duration: 0.12, ease: 'none' }, t)
    tl.to(q(`[data-node="${id}"] text`), { opacity: 1, duration: 0.05 }, t + 0.1)
  }
  const drawEdge = (i: number, id: string, t: number) => {
    tl.to(edgeEls(id), { opacity: opEdge(i, id), duration: 0.02 }, t)
    tl.to(shafts(id), { drawSVG: '100%', duration: 0.1, ease: 'none' }, t)
    tl.to(heads(id), { opacity: 1, duration: 0.03 }, t + 0.09)
  }

  // ── step 1: 결제가 생기는 즉시 브로커로, 바로 판단 ──
  const s1 = at(0)
  restyle(0, s1 + 0.02)
  tl.to(etl1m, { opacity: opNode(0, 'etl'), duration: 0.12 }, s1 + 0.02)
  revealNode(0, 'kafka', s1 + 0.28)
  tl.to(o('k-lanes'), { opacity: 1, duration: 0.05 }, s1 + 0.38)
  revealNode(0, 'fraud', s1 + 0.34)
  drawEdge(0, 'app>kafka', s1 + 0.34)
  drawEdge(0, 'kafka>fraud', s1 + 0.42)
  let last = 0
  const pFraud = o('p-fraud')
  pFraud.forEach((p, k) => (last = flowAlong(tl, p, s1 + 0.46 + k * 0.04, 0.12, k === pFraud.length - 1)))
  tl.to(o('hold'), { opacity: 1, duration: 0.04 }, last)
  tl.to(o('cap-rule'), { opacity: 1, duration: 0.05 }, s1 + 0.74)

  // ── step 2: DB의 변경이 다음 배치를 기다리지 않고 화면까지 ──
  const s2 = at(1)
  tl.to([...o('hold'), ...o('cap-rule'), ...pFraud], { opacity: 0, duration: 0.06 }, s2)
  if (cam[1] !== cam[0]) tl.to(svg, { attr: { viewBox: cam[1] }, duration: 0.28, ease: 'power2.inOut' }, s2 + 0.02)
  restyle(1, s2 + 0.02)
  if (opNode(1, 'etl') !== opNode(0, 'etl')) tl.to(etl1m, { opacity: opNode(1, 'etl'), duration: 0.12 }, s2 + 0.02)
  revealNode(1, 'cdc', s2 + 0.08)
  drawEdge(1, 'oltp>cdc', s2 + 0.12)
  drawEdge(1, 'cdc>kafka', s2 + 0.18)
  revealNode(1, 'stock', s2 + 0.22)
  tl.to(o('stock-card'), { opacity: 1, duration: 0.06 }, s2 + 0.26)
  drawEdge(1, 'kafka>stock', s2 + 0.24)
  const pStock = o('p-stock')
  const arrive = pStock.map((p, k) => flowAlong(tl, p, s2 + 0.34 + k * 0.1, 0.12, k === pStock.length - 1))
  const live = o('live-0')[0]
  if (live) {
    const v = { n: F.liveStock[0].from }
    live.textContent = String(v.n)
    arrive.forEach((t, k) => tl.to(v, { n: F.liveStock[0].from - k - 1, duration: 0.02, ease: 'none', onUpdate: () => (live.textContent = String(Math.round(v.n))) }, t))
  }
  tl.to(o('sold-out'), { opacity: 1, duration: 0.04 }, (arrive[arrive.length - 1] ?? s2 + 0.66) + 0.02)

  // ── step 3: 실시간이 필요한 곳만 스트리밍, 나머지는 배치 그대로 ──
  const s3 = at(2)
  tl.to([...o('stock-card'), ...pStock], { opacity: 0, duration: 0.06 }, s3)
  tl.to(svg, { attr: { viewBox: cam[2] }, duration: 0.3, ease: 'power2.inOut' }, s3 + 0.02)
  restyle(2, s3 + 0.04)
  tl.to(edgeEls(GONE), { opacity: 0, duration: 0.1 }, s3 + 0.12)
  drawEdge(2, 'kafka>lake', s3 + 0.24)
  tl.to(o('g-wrap'), { opacity: 1, duration: 0.06 }, s3 + 0.1)
  if (needle) tl.to(needle, { rotation: -90 + 0.5 * 180, svgOrigin: origin, duration: 0.12 }, s3 + 0.3)
  tl.to(etl1m, { opacity: 0, duration: 0.06 }, s3 + 0.36)
  tl.to(etlSub, { opacity: 1, duration: 0.06 }, s3 + 0.4)
  tl.to(o('etl-ok'), { opacity: 1, duration: 0.04 }, s3 + 0.42)
  o('p-lake').forEach((p, k) => flowAlong(tl, p, s3 + (k < 3 ? 0.4 : 0.56) + (k % 3) * 0.012, 0.08, k >= 3))
  const count = o('count')[0]
  tl.to(o('count'), { opacity: 1, duration: 0.04 }, s3 + 0.46)
  if (count) {
    const a = BEFORE.nodes.length
    const b = NOW.nodes.length
    const v = { n: a }
    count.textContent = F.nodes(a, a)
    tl.to(v, { n: b, duration: 0.2, ease: 'none', onUpdate: () => (count.textContent = F.nodes(a, Math.round(v.n))) }, s3 + 0.5)
  }
}
