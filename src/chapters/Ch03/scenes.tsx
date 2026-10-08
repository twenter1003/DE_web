import { ch3, JOBS, type JobId, type JobStatus } from '../../content/chapters/ch3'
import { T } from '../../content/map'
import { Badge, Node, NodeLabel } from '../../components/diagram'
import { Fig, Txt } from '../../components/fig'
import { PipelineMap } from '../../components/PipelineMap'
import { RArrow, RPath, RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import {
  bezier,
  boxEdge,
  cardPts,
  Clock,
  ClockIcon,
  counter,
  DagEdge,
  DAG_EDGES,
  DashArrow,
  dagPos,
  DNH,
  DNW,
  HistoryTable,
  init,
  initJob,
  JobNode,
  JOB_IDS,
  num,
  Phone,
  pick,
  setJob,
  tw,
} from './parts'

const F = ch3.figures

// 맵 노드 라벨은 map.ts에서 가져온다(Ch2 끝 상태)
const M2 = mapStateAt(T.ch2)
const NODE2 = Object.fromEntries(M2.nodes.map((n) => [n.id, n]))

/** 회전 초기값(svgOrigin 포함) */
const rot = (el: Element | undefined, deg: number) => ({ rotation: deg, svgOrigin: (el as SVGElement | undefined)?.dataset.origin ?? '0 0' })

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 아무도 몰랐던 새벽 3시
// ─────────────────────────────────────────────────────────────
const PX = 100
const PW = 150
const PH = 52
const PY = { oltp: 168, etl: 258, wh: 348, bi: 438 }
const CLK = { cx: 56, cy: 64, r: 36 }
const PBAR = { x: 214, y: 250, w: 210, h: 16 }
const WHB = { x: 372, y: 342, w: 40, h: 100 }

export function ProblemFig() {
  const n = NODE2
  const whLabelY = PY.wh + Math.min(9, PH * 0.16) * 0.7
  return (
    <Fig>
      {/* 시계와 예약 카드 */}
      <Clock cx={CLK.cx} cy={CLK.cy} r={CLK.r} el="clk" />
      {(['start', 'fail', 'morning'] as const).map((k) => (
        <Txt key={k} x={CLK.cx} y={CLK.cy + CLK.r + 20} size={15} weight={750} anchor="middle" mono el={`clk-${k}`}>
          {F.clock[k]}
        </Txt>
      ))}
      <g data-el="cron">
        <RRect x={112} y={38} w={318} h={56} seed="p-cron" rough={0.45} fill="var(--surface)" />
        <ClockIcon x={136} y={66} r={10} />
        <Txt x={156} y={71.5} size={15} weight={750}>
          {F.cronCard}
        </Txt>
      </g>

      {/* 맵 일부: 운영 DB → 야간 ETL 배치 → 분석용 DB → 아침 리포트 */}
      <Node x={PX} y={PY.oltp} w={PW} h={PH} label={n.oltp.label} sub={n.oltp.sub} kind="store" seed="p-oltp" />
      <g data-el="etl-ring">
        <rect x={PX - PW / 2 - 3} y={PY.etl - PH / 2 - 3} width={PW + 6} height={PH + 6} rx={6} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={2.6} />
      </g>
      <Node x={PX} y={PY.etl} w={PW} h={PH} label={n.etl.label} sub={n.etl.sub} kind="process" seed="p-etl" el="etl" statuses={['fail']} />
      <Node x={PX} y={PY.wh} w={PW} h={PH} label={n.warehouse.label} sub={n.warehouse.sub} kind="store" seed="p-wh" labelEl="wh-l0" />
      <NodeLabel x={PX} y={whLabelY} label={n.warehouse.label} sub={F.rows600} el="wh-l1" />
      <Node x={PX} y={PY.bi} w={PW} h={PH} label={n.bi.label} sub={n.bi.sub} kind="serve" seed="p-bi" />
      {[PY.oltp, PY.etl, PY.wh].map((y, k) => (
        <RArrow key={y} x1={PX} y1={y + PH / 2 + 4} x2={PX} y2={y + 90 - PH / 2 - 5} seed={`p-a${k}`} rough={0.5} />
      ))}

      {/* 예약 카드 → 야간 ETL 배치: 제어(점선) */}
      <DashArrow
        pts={[
          [200, 98],
          [200, PY.etl],
          [PX + PW / 2 + 7, PY.etl],
        ]}
        el="ctl"
      />

      {/* 진행 막대 */}
      <Txt x={PBAR.x} y={PBAR.y - 9} size={13} weight={600} muted>
        {F.moved}
      </Txt>
      <Txt x={PBAR.x + PBAR.w} y={PBAR.y - 9} size={14} weight={750} anchor="end" mono el="prog-n">
        {F.progress(0)}
      </Txt>
      <rect x={PBAR.x} y={PBAR.y} width={PBAR.w} height={PBAR.h} rx={4} style={{ fill: 'var(--surface)' }} />
      <rect data-el="prog-fill" x={PBAR.x} y={PBAR.y} width={PBAR.w} height={PBAR.h} rx={4} style={{ fill: 'var(--accent)' }} />
      <rect x={PBAR.x} y={PBAR.y} width={PBAR.w} height={PBAR.h} rx={4} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.5} />
      <Txt x={432} y={PBAR.y + 44} size={13.5} weight={750} anchor="end" color="var(--fail)" el="timeout">
        {F.timeout}
      </Txt>

      {/* step 2: 꺼진 휴대폰 — 아무 일도 일어나지 않는다 */}
      <g data-el="phone">
        <Txt x={365} y={334} size={13} weight={600} anchor="middle" muted>
          {F.juniPhone}
        </Txt>
        <Phone x={330} y={344} w={70} h={112} seed="p-phone" dark />
        <Txt x={365} y={474} size={13.5} weight={750} anchor="middle">
          {F.noAlerts}
        </Txt>
      </g>

      {/* step 3: 빈 리포트와 절반만 찬 분석용 DB */}
      <g data-el="rep">
        <RArrow x1={PX + PW / 2 + 5} y1={PY.bi} x2={192} y2={PY.bi} seed="p-rep-a" rough={0.4} head={7} />
        <RRect x={196} y={334} w={150} h={124} seed="p-rep" rough={0.45} fill="var(--surface)" />
        <Txt x={208} y={356} size={14} weight={750}>
          {F.report}
        </Txt>
        <Txt x={208} y={376} size={13} weight={600} muted>
          {F.noData}
        </Txt>
        {F.reportRows.map((r, k) => (
          <g key={r}>
            <Txt x={208} y={407 + k * 30} size={13.5} weight={600}>
              {r}
            </Txt>
            <rect data-el="cell" x={250} y={392 + k * 30} width={84} height={22} rx={3} style={{ fill: 'var(--wait)', opacity: 0.2 }} />
            <rect x={250} y={392 + k * 30} width={84} height={22} rx={3} style={{ fill: 'none', stroke: 'var(--wait)' }} strokeWidth={1.4} strokeDasharray="4 3" />
          </g>
        ))}
      </g>
      <g data-el="whbar">
        <Txt x={WHB.x + WHB.w / 2} y={WHB.y - 10} size={13} weight={750} anchor="middle">
          {F.whName}
        </Txt>
        <rect x={WHB.x} y={WHB.y} width={WHB.w} height={WHB.h} rx={3} style={{ fill: 'var(--surface)' }} />
        <rect x={WHB.x} y={WHB.y + WHB.h / 2} width={WHB.w} height={WHB.h / 2} style={{ fill: 'var(--accent)' }} />
        <rect x={WHB.x} y={WHB.y} width={WHB.w} height={WHB.h} rx={3} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.5} />
        <line x1={WHB.x - 4} y1={WHB.y + WHB.h / 2} x2={WHB.x + WHB.w + 4} y2={WHB.y + WHB.h / 2} style={{ stroke: 'var(--ink)' }} strokeWidth={1.5} strokeDasharray="3 3" />
        <Txt x={WHB.x + WHB.w / 2} y={WHB.y + WHB.h + 20} size={13} weight={700} anchor="middle" mono>
          {F.whRows(600)}
        </Txt>
      </g>
      <g data-el="whbar-hl">
        <rect x={WHB.x - 5} y={WHB.y + WHB.h / 2 - 5} width={WHB.w + 10} height={WHB.h / 2 + 10} rx={5} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const hour = o('clk-h')[0]
  const min = o('clk-m')[0]
  init(tl, hour, rot(hour, 85))
  init(tl, min, rot(min, -60))
  init(tl, [...o('clk-start'), ...o('clk-fail'), ...o('clk-morning'), ...o('ctl'), ...o('ctl-head'), ...o('etl:fail'), ...o('etl-ring'), ...o('timeout'), ...o('wh-l1'), ...o('phone'), ...o('rep'), ...o('cell'), ...o('whbar'), ...o('whbar-hl')], { opacity: 0 })
  const fill = o('prog-fill')
  init(tl, fill, { scaleX: 0, transformOrigin: '0% 50%' })
  const fmtP = F.progress
  counter(tl, o('prog-n')[0], fmtP, 0, [
    [120, at(0) + 0.52, 0.26],
    [600, at(1) + 0.04, 0.34],
  ])

  // step 1: 바늘이 03:00에 닿으면 cron이 배치를 출발시킨다
  tl.to(min, { rotation: 0, duration: 0.24, ease: 'power1.inOut' }, at(0))
  tl.to(hour, { rotation: 90, duration: 0.24, ease: 'power1.inOut' }, at(0))
  tl.to(o('clk-start'), { opacity: 1, duration: 0.05 }, at(0) + 0.22)
  tl.to(o('ctl'), { opacity: 1, duration: 0.02, stagger: 0.008 }, at(0) + 0.28)
  tl.to(o('ctl-head'), { opacity: 1, duration: 0.03 }, at(0) + 0.5)
  tl.to(fill, { scaleX: 0.1, duration: 0.26, ease: 'none' }, at(0) + 0.52)

  // step 2: 03:04, 600건에서 멈춤 — cron은 아무것도 하지 않는다
  tl.to(min, { rotation: 24, duration: 0.14 }, at(1))
  tl.to(hour, { rotation: 92, duration: 0.14 }, at(1))
  tl.to(o('clk-start'), { opacity: 0, duration: 0.05 }, at(1) + 0.12)
  tl.to(o('clk-fail'), { opacity: 1, duration: 0.05 }, at(1) + 0.14)
  tl.to(fill, { scaleX: 0.5, duration: 0.34, ease: 'none' }, at(1) + 0.04)
  tl.to([...o('etl-ring'), ...o('etl:fail')], { opacity: 1, duration: 0.05 }, at(1) + 0.42)
  tl.to(o('timeout'), { opacity: 1, duration: 0.08 }, at(1) + 0.46)
  tl.to(o('wh-l0'), { opacity: 0, duration: 0.08 }, at(1) + 0.52)
  tl.to(o('wh-l1'), { opacity: 1, duration: 0.08 }, at(1) + 0.54)
  tl.to(o('phone'), { opacity: 1, duration: 0.1 }, at(1) + 0.6)

  // step 3: 아침 9시, 빈 리포트. 원인은 '반만 들어간' 분석용 DB
  tl.to(hour, { rotation: 270, duration: 0.26, ease: 'power1.inOut' }, at(2))
  tl.to(min, { rotation: 360, duration: 0.26, ease: 'power1.inOut' }, at(2))
  tl.to(o('clk-fail'), { opacity: 0, duration: 0.05 }, at(2) + 0.22)
  tl.to(o('clk-morning'), { opacity: 1, duration: 0.05 }, at(2) + 0.24)
  tl.to(o('phone'), { opacity: 0, duration: 0.1 }, at(2) + 0.04)
  tl.to(o('rep'), { opacity: 1, duration: 0.1 }, at(2) + 0.18)
  tl.to(o('cell'), { opacity: 1, duration: 0.06, stagger: 0.06 }, at(2) + 0.32)
  tl.to(o('whbar'), { opacity: 1, duration: 0.1 }, at(2) + 0.46)
  tl.to(o('whbar-hl'), { opacity: 1, duration: 0.08 }, at(2) + 0.62)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 다시 돌렸을 뿐인데
// ─────────────────────────────────────────────────────────────
const RU = 0.15 // 분석용 DB 막대: 1행 = 0.15
const ST = { x: 40, w: 110, base: 452 }
const stackY = (rows: number) => ST.base - rows * RU

/** 시간 축(데스크톱 가로 · 모바일 세로) */
function planGeo(mobile: boolean) {
  const job = ['extract', 'orders', 'products', 'sales', 'report'] as const
  const span: Record<(typeof job)[number], [number, number]> = { extract: [0, 15], orders: [20, 35], products: [20, 30], sales: [40, 50], report: [60, 65] }
  if (!mobile) {
    const TX = (m: number) => 120 + (m * 298) / 70
    const row = { extract: 150, orders: 194, products: 238, sales: 282, report: 340 }
    const bar = (id: (typeof job)[number], s = span[id][0], e = span[id][1]) => ({ x: TX(s), y: row[id] - 12, w: TX(e) - TX(s), h: 24 })
    return {
      mobile,
      job,
      span,
      bar,
      label: (id: (typeof job)[number]) => ({ x: 8, y: row[id] + 5, anchor: 'start' as const }),
      icon: (id: (typeof job)[number]) => ({ x: TX(span[id][0]) - 11, y: row[id] }),
      slack: ([a, b]: [number, number]) => ({ x: TX(a), y: 132, w: TX(b) - TX(a), h: 222, lx: (TX(a) + TX(b)) / 2, ly: 124, anchor: 'middle' as const }),
      line40: { x1: TX(40), y1: 130, x2: TX(40), y2: 358 },
      axis: { x1: TX(0), y1: 364, x2: TX(70), y2: 364 },
      tick: (m: number) => ({ x1: TX(m), y1: 360, x2: TX(m), y2: 368, lx: TX(m), ly: 384, anchor: 'middle' as const }),
      hatch: (id: 'orders' | 'sales') => ({ x: TX(40), y: row[id] - 12, w: TX(50) - TX(40), h: 24 }),
      x: { x: TX(50) + 15, y: row.sales },
      late: { x: 436, y: row.sales + 33, anchor: 'end' as const },
      title: { x: 8, y: 96 },
      grow: 'width' as const,
    }
  }
  const TY = (m: number) => 104 + m * 5
  const col = { extract: 104, orders: 172, products: 240, sales: 308, report: 376 }
  const bar = (id: (typeof job)[number], s = span[id][0], e = span[id][1]) => ({ x: col[id] - 15, y: TY(s), w: 30, h: TY(e) - TY(s) })
  return {
    mobile,
    job,
    span,
    bar,
    label: (id: (typeof job)[number]) => ({ x: col[id], y: 62, anchor: 'middle' as const }),
    icon: (id: (typeof job)[number]) => ({ x: col[id], y: TY(span[id][0]) - 11 }),
    slack: ([a, b]: [number, number]) => ({ x: 56, y: TY(a), w: 380, h: TY(b) - TY(a), lx: 60, ly: (TY(a) + TY(b)) / 2 + 4.5, anchor: 'start' as const }),
    line40: { x1: 56, y1: TY(40), x2: 436, y2: TY(40) },
    axis: { x1: 50, y1: TY(0), x2: 50, y2: TY(70) },
    tick: (m: number) => ({ x1: 46, y1: TY(m), x2: 54, y2: TY(m), lx: 42, ly: TY(m) + 4.5, anchor: 'end' as const }),
    hatch: (id: 'orders' | 'sales') => ({ x: col[id] - 15, y: TY(40), w: 30, h: TY(50) - TY(40) }),
    x: { x: col.sales, y: TY(50) + 15 },
    late: { x: 352, y: TY(50) + 41, anchor: 'end' as const },
    title: { x: 8, y: 26 },
    grow: 'height' as const,
  }
}
const SLACKS: [number, number][] = [
  [15, 20],
  [35, 40],
  [50, 60],
]
const TICKS = [0, 20, 40, 60, 70]

export function AttemptFig() {
  const { mobile } = useEnv()
  const G = planGeo(mobile)
  const n = NODE2
  const dupBox = (top: number, bottom: number) => ({ x: ST.x - 3, y: top - 2, w: ST.w + 6, h: bottom - top + 4 })
  const d1 = dupBox(stackY(600), ST.base)
  const d2 = dupBox(stackY(1200), stackY(600))
  return (
    <Fig caption={F.cronOnlyTime}>
      {/* step 1–2: 다시 실행 → 덧쌓인 분석용 DB */}
      <g data-el="rerun">
        <Node x={100} y={52} w={150} h={52} label={n.etl.label} sub={n.etl.sub} kind="process" seed="a-etl" el="aetl" statuses={['fail', 'ok']} status="fail" />
        <Txt x={196} y={36} size={13} weight={600} muted>
          {F.rerun}
        </Txt>
        <Txt x={424} y={36} size={14} weight={750} anchor="end" mono el="aprog-n">
          {F.progress(0)}
        </Txt>
        <rect x={196} y={44} width={228} height={16} rx={4} style={{ fill: 'var(--surface)' }} />
        <rect data-el="aprog-fill" x={196} y={44} width={228} height={16} rx={4} style={{ fill: 'var(--accent)' }} />
        <rect x={196} y={44} width={228} height={16} rx={4} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.5} />

        <Txt x={ST.x + ST.w / 2} y={168} size={13.5} weight={750} anchor="middle">
          {F.whStack}
        </Txt>
        <line x1={ST.x - 14} y1={ST.base} x2={ST.x + ST.w + 14} y2={ST.base} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
        {/* 지난밤 600행(회색) */}
        <rect x={ST.x} y={stackY(600)} width={ST.w} height={600 * RU} style={{ fill: 'var(--wait)', opacity: 0.28 }} />
        <rect x={ST.x} y={stackY(600)} width={ST.w} height={600 * RU} style={{ fill: 'none', stroke: 'var(--wait)' }} strokeWidth={1.5} />
        <Txt x={ST.x + ST.w / 2} y={stackY(600) + 42} size={15} weight={750} anchor="middle">
          {F.rowsN(600)}
        </Txt>
        <Txt x={ST.x + ST.w / 2} y={stackY(600) + 62} size={12.5} weight={600} anchor="middle" muted>
          {F.lastNight}
        </Txt>
        {/* 방금 실행 1,200행(강조색) */}
        <rect data-el="new-block" x={ST.x} y={stackY(1800)} width={ST.w} height={1200 * RU} style={{ fill: 'var(--accent)' }} />
        <g data-el="new-l">
          <Txt x={ST.x + ST.w / 2} y={stackY(1800) + 34} size={15} weight={750} anchor="middle" color="var(--surface)">
            {F.rowsN(1200)}
          </Txt>
          <Txt x={ST.x + ST.w / 2} y={stackY(1800) + 54} size={12.5} weight={600} anchor="middle" color="var(--surface)">
            {F.justNow}
          </Txt>
        </g>

        {/* step 2: 같은 600행이 두 번 */}
        <g data-el="dup">
          {[d1, d2].map((b, k) => (
            <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} style={{ fill: 'var(--fail)', fillOpacity: 0.12, stroke: 'var(--fail)' }} strokeWidth={2.6} strokeDasharray="7 4" />
          ))}
          <path
            d={`M ${ST.x + ST.w + 6} ${d2.y + 2} L ${ST.x + ST.w + 14} ${d2.y + 2} L ${ST.x + ST.w + 14} ${d1.y + d1.h - 2} L ${ST.x + ST.w + 6} ${d1.y + d1.h - 2}`}
            style={{ fill: 'none', stroke: 'var(--fail)' }}
            strokeWidth={2}
          />
          <rect x={ST.x + ST.w + 20} y={stackY(600) - 14} width={44} height={28} rx={14} style={{ fill: 'var(--surface)', stroke: 'var(--fail)' }} strokeWidth={2.2} />
          <Txt x={ST.x + ST.w + 42} y={stackY(600) + 6} size={16} weight={800} anchor="middle" color="var(--fail)">
            {F.times2}
          </Txt>
        </g>
        <g data-el="card">
          <RRect x={196} y={96} w={234} h={140} seed="a-card" rough={0.45} fill="var(--surface)" />
          <Txt x={210} y={120} size={13} weight={700} muted>
            {F.report}
          </Txt>
          <Txt x={210} y={154} size={16} weight={750} el="ord-a">
            {F.ordersN(1200)}
          </Txt>
          <Txt x={210} y={154} size={16} weight={750} el="ord-b">
            {F.ordersN(1800)}
          </Txt>
          <Txt x={210} y={186} size={16} weight={750} el="rev-a">
            {F.revenueN(1200)}
          </Txt>
          <Txt x={210} y={186} size={16} weight={750} el="rev-b">
            {F.revenueN(1800)}
          </Txt>
          <Badge x={222 + tw(F.revenueN(1800), 16)} y={180.5} status="fail" r={10} el="rev-x" />
          <Txt x={210} y={218} size={12.5} weight={600} muted>
            {F.usual}
          </Txt>
        </g>
      </g>

      {/* step 3–4: 시각으로 띄운 다섯 단계 */}
      <g data-el="plan">
        <Txt x={G.title.x} y={G.title.y} size={14} weight={750} muted>
          {F.planTitle}
        </Txt>
        {SLACKS.map((s) => {
          const b = G.slack(s)
          return (
            <g key={s[0]} data-el="slack">
              <rect x={b.x} y={b.y} width={b.w} height={b.h} style={{ fill: 'var(--wait)', opacity: 0.1 }} />
              <Txt x={b.lx} y={b.ly} size={12.5} weight={700} anchor={b.anchor} muted>
                {F.slack}
              </Txt>
            </g>
          )
        })}
        <line data-el="line40" x1={G.line40.x1} y1={G.line40.y1} x2={G.line40.x2} y2={G.line40.y2} style={{ stroke: 'var(--muted)' }} strokeWidth={1.4} strokeDasharray="4 4" />
        <line data-el="line40-hl" x1={G.line40.x1} y1={G.line40.y1} x2={G.line40.x2} y2={G.line40.y2} style={{ stroke: 'var(--accent)' }} strokeWidth={2.4} />
        <line x1={G.axis.x1} y1={G.axis.y1} x2={G.axis.x2} y2={G.axis.y2} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
        {TICKS.map((m, k) => {
          const t = G.tick(m)
          return (
            <g key={m}>
              <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
              <Txt x={t.lx} y={t.ly} size={12} anchor={t.anchor} mono weight={m === 40 ? 750 : 500}>
                {F.ticks[k]}
              </Txt>
            </g>
          )
        })}
        {G.job.map((id) => {
          const b = G.bar(id)
          const l = G.label(id)
          const ic = G.icon(id)
          const long = id === 'orders' ? G.bar(id, 20, 55) : b
          return (
            <g key={id} data-el={`pb-${id}`}>
              <Txt x={l.x} y={l.y} size={14} weight={750} anchor={l.anchor}>
                {JOBS[id]}
              </Txt>
              <rect
                data-el={`bar-${id}`}
                data-w={b.w}
                data-h={b.h}
                data-lw={long.w}
                data-lh={long.h}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={3}
                style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
                strokeWidth={1.7}
              />
              <ClockIcon x={ic.x} y={ic.y} r={7.5} />
              {id === 'sales' && <ClockIcon x={ic.x} y={ic.y} r={7.5} el="sales-clk" color="var(--accent)" />}
            </g>
          )
        })}
        {(['orders', 'sales'] as const).map((id) => {
          const h = G.hatch(id)
          return (
            <g key={id} data-el="hatch">
              <RRect x={h.x} y={h.y} w={h.w} h={h.h} seed={`hatch-${id}`} rough={0.3} fill="var(--fail)" fillStyle="hachure" stroke="var(--fail)" strokeWidth={1.4} />
            </g>
          )
        })}
        <g data-el="late">
          <Badge x={G.x.x} y={G.x.y} status="fail" r={10.5} />
          <Txt x={G.late.x} y={G.late.y} size={13.5} weight={750} anchor={G.late.anchor} color="var(--fail)">
            {F.lateAgg}
          </Txt>
        </g>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const G = planGeo(mobile)
  init(tl, [...o('new-l'), ...o('dup'), ...o('card'), ...o('ord-b'), ...o('rev-b'), ...o('rev-x'), ...o('plan'), ...o('caption'), ...o('hatch'), ...o('late'), ...o('line40-hl'), ...o('sales-clk')], { opacity: 0 })
  init(tl, o('aetl:ok'), { opacity: 0 })
  init(tl, o('aetl:fail'), { opacity: 1 })
  const fill = o('aprog-fill')
  init(tl, fill, { scaleX: 0, transformOrigin: '0% 50%' })
  const block = o('new-block')
  init(tl, block, { scaleY: 0, transformOrigin: '50% 100%' })
  counter(tl, o('aprog-n')[0], F.progress, 0, [[1200, at(0) + 0.06, 0.5]])

  // step 1: 다시 실행 — 새 블록이 지난밤 블록을 지우지 않고 그 위에 쌓인다
  tl.to(fill, { scaleX: 1, duration: 0.5, ease: 'none' }, at(0) + 0.06)
  tl.to(block, { scaleY: 1, duration: 0.5, ease: 'none' }, at(0) + 0.06)
  tl.to(o('new-l'), { opacity: 1, duration: 0.06 }, at(0) + 0.58)
  tl.to(o('aetl:fail'), { opacity: 0, duration: 0.04 }, at(0) + 0.6)
  tl.to(o('aetl:ok'), { opacity: 1, duration: 0.04 }, at(0) + 0.62)

  // step 2: 같은 600행이 두 번 → 매출 1.5배
  tl.to(o('card'), { opacity: 1, duration: 0.1 }, at(1) + 0.06)
  tl.to(o('dup'), { opacity: 1, duration: 0.1 }, at(1) + 0.28)
  tl.to([...o('ord-a'), ...o('rev-a')], { opacity: 0, duration: 0.03 }, at(1) + 0.5)
  tl.to([...o('ord-b'), ...o('rev-b')], { opacity: 1, duration: 0.03 }, at(1) + 0.51)
  tl.to(o('rev-x'), { opacity: 1, duration: 0.05 }, at(1) + 0.56)

  // step 3: 다섯 단계를 시간 축 위 자기 자리에(위에서부터 하나씩)
  tl.to(o('rerun'), { opacity: 0, duration: 0.12 }, at(2))
  tl.to(o('plan'), { opacity: 1, duration: 0.1 }, at(2) + 0.08)
  const rows = G.job.map((id) => o(`pb-${id}`))
  rows.forEach((r) => init(tl, r, { opacity: 0, [G.mobile ? 'x' : 'y']: -14 }))
  rows.forEach((r, k) => tl.to(r, { opacity: 1, [G.mobile ? 'x' : 'y']: 0, duration: 0.1 }, at(2) + 0.16 + k * 0.08))
  const slack = o('slack')
  init(tl, slack, { opacity: 0 })
  tl.to(slack, { opacity: 1, duration: 0.08, stagger: 0.04 }, at(2) + 0.62)

  // step 4: '주문 정리'가 늘어나 03:40을 넘는 순간, cron은 '매출 집계'를 그냥 출발시킨다
  const ord = o('bar-orders')[0]
  const sal = o('bar-sales')[0]
  const key = G.grow
  const dimKey = key === 'width' ? 'w' : 'h'
  const lkey = key === 'width' ? 'lw' : 'lh'
  const T0 = at(3) + 0.1
  const SPEED = 0.5 / 20 // 타임라인 1 = 20분 × 0.5
  tl.to(o('line40-hl'), { opacity: 1, duration: 0.06 }, at(3))
  tl.to(sal, { attr: { [key]: 0 }, duration: 0.05 }, at(3))
  tl.to(ord, { attr: { [key]: num(ord, lkey) }, duration: 0.5, ease: 'none' }, T0)
  const cross = T0 + 5 * SPEED
  tl.to(o('sales-clk'), { opacity: 1, duration: 0.03 }, cross)
  tl.to(sal, { attr: { [key]: num(sal, dimKey) }, duration: 10 * SPEED, ease: 'none' }, cross)
  tl.to(o('hatch'), { opacity: 1, duration: 0.06 }, cross + 10 * SPEED)
  tl.to(o('late'), { opacity: 1, duration: 0.08 }, at(3) + 0.62)
  tl.to(o('caption'), { opacity: 1, duration: 0.1 }, at(3) + 0.66)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 비유: 밥이 다 돼야 비빔밥 → DAG → 오케스트레이터
// ─────────────────────────────────────────────────────────────
const DCY = 236
const DSHIFT = 120
const ARC: [number, number][] = [
  [392, DCY - DNH / 2 - 4],
  [392, 100],
  [46, 100],
  [46, DCY - DNH / 2 - 5],
]
const ARC_MID = bezier(ARC, 2)[1]
// 오케스트레이터 카드 → DAG 노드(step 4, DAG가 DSHIFT만큼 내려간 뒤)
const D4 = DCY + DSHIFT
const top4 = (id: JobId) => dagPos(id, D4)
const CTL: Record<JobId, [number, number][]> = {
  extract: bezier([[184, 188], [60, 200], [top4('extract').x + 4, top4('extract').y - DNH / 2 - 6]], 22),
  orders: [
    [204, 188],
    [top4('orders').x + 14, top4('orders').y - DNH / 2 - 6],
  ],
  products: bezier([[222, 188], [228, 340], [top4('products').x + DNW / 2 + 6, top4('products').y + 8]], 22),
  sales: [
    [284, 188],
    [top4('sales').x, top4('sales').y - DNH / 2 - 6],
  ],
  report: [
    [384, 188],
    [top4('report').x, top4('report').y - DNH / 2 - 6],
  ],
}

export function AnalogyFig() {
  return (
    <Fig>
      <Txt x={220} y={128} size={15.5} weight={800} anchor="middle" el="t-cook">
        {F.cookTitle}
      </Txt>
      <Txt x={220} y={128} size={15.5} weight={800} anchor="middle" el="t-dag">
        {F.dagTitle}
      </Txt>

      {/* 고리(step 3): 리포트 → 추출 */}
      <g data-el="arc-ghost-g">
        <DashArrow pts={bezier(ARC, 32)} el="arc-ghost" color="var(--fail)" width={2} dash={7} gap={6} head={9} />
      </g>
      <DashArrow pts={bezier(ARC, 32)} el="arc" color="var(--fail)" width={2.4} dash={7} gap={6} head={9} />
      <Badge x={ARC_MID[0]} y={ARC_MID[1]} status="fail" r={13} el="arc-x" />
      <Txt x={ARC_MID[0]} y={ARC_MID[1] - 22} size={14.5} weight={800} anchor="middle" color="var(--fail)" el="arc-l">
        {F.noCycle}
      </Txt>

      {/* step 4: cron 카드와 오케스트레이터 카드 */}
      <g data-el="cards">
        <RRect x={6} y={14} w={144} h={170} seed="an-cron" rough={0.45} fill="var(--surface)" />
        <Txt x={78} y={44} size={17} weight={800} anchor="middle">
          {F.cronName}
        </Txt>
        <ClockIcon x={78} y={98} r={26} />
        <Txt x={78} y={150} size={12.5} weight={600} anchor="middle" muted>
          {F.knows}
        </Txt>
        <Txt x={78} y={172} size={15.5} weight={750} anchor="middle">
          {F.cronKnows}
        </Txt>
        <RRect x={162} y={14} w={272} h={170} seed="an-orch" rough={0.45} fill="var(--surface)" />
        <Txt x={176} y={44} size={17} weight={800}>
          {F.orchName}
        </Txt>
        <Txt x={176} y={68} size={12.5} weight={600} muted>
          {F.knows}
        </Txt>
        {F.orchKnows.map((k, i) => {
          const cx = i < 3 ? 178 : 286
          const cy = 100 + (i % 3) * 28
          return (
            <g key={k}>
              <circle cx={cx} cy={cy - 4.5} r={2.6} style={{ fill: 'var(--ink)' }} />
              <Txt x={cx + 9} y={cy} size={14} weight={650}>
                {k}
              </Txt>
            </g>
          )
        })}
      </g>
      {JOB_IDS.map((id) => (
        <DashArrow key={id} pts={CTL[id]} el={`ctl-${id}`} width={1.9} dash={3} gap={5} head={8} />
      ))}

      {/* 요리 카드 → 작업 노드 */}
      <g data-el="dag">
        {DAG_EDGES.map(([a, b]) => (
          <DagEdge key={`${a}${b}`} a={a} b={b} cy={DCY} seed={`an-${a}-${b}`} el={`e-${a}-${b}`} />
        ))}
        <Txt x={dagPos('orders', DCY).x} y={DCY + 5} size={13.5} weight={800} anchor="middle" el="together">
          {F.together}
        </Txt>
        {JOB_IDS.map((id, k) => {
          const { x, y } = dagPos(id, DCY)
          const x0 = x - DNW / 2
          const y0 = y - DNH / 2
          return (
            <g key={id} data-el={`card-${id}`}>
              {id === 'sales' && <rect data-el="mix-ring" x={x0 - 4} y={y0 - 4} width={DNW + 8} height={DNH + 8} rx={7} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={3} />}
              <polygon
                data-el="shape"
                data-neat={cardPts(x0, y0, DNW, DNH)}
                points={cardPts(x0, y0, DNW, DNH, `cook${k}`, 3.4)}
                style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
                strokeWidth={1.7}
                strokeLinejoin="round"
              />
              <Txt x={x} y={y + 5} size={14.5} weight={700} anchor="middle" el="cook-l">
                {F.cook[k]}
              </Txt>
              <g data-el="job-l">
                <Txt x={x} y={y - 3} size={14.5} weight={700} anchor="middle">
                  {JOBS[id]}
                </Txt>
                <Txt x={x} y={y + 15} size={12} weight={600} anchor="middle" muted>
                  {F.status.wait}
                </Txt>
              </g>
              <Badge x={x0 + DNW - 2} y={y0 + 2} status="wait" r={10.5} el="wait-b" />
            </g>
          )
        })}
      </g>
    </Fig>
  )
}

export const buildAnalogy: SceneBuild = (q, tl) => {
  const o = pick(q)
  const shafts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
  const heads = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))
  const edge = (a: JobId, b: JobId) => o(`e-${a}-${b}`)
  const allEdges = DAG_EDGES.map(([a, b]) => edge(a, b))
  init(tl, shafts(allEdges.flat()), { drawSVG: '0%' })
  init(tl, heads(allEdges.flat()), { opacity: 0 })
  const ctl = JOB_IDS.map((id) => [...o(`ctl-${id}`), ...o(`ctl-${id}-head`)])
  init(tl, [...o('t-dag'), ...o('job-l'), ...o('wait-b'), ...o('together'), ...o('arc'), ...o('arc-head'), ...o('arc-ghost'), ...o('arc-ghost-head'), ...o('arc-x'), ...o('arc-l'), ...o('cards'), ...ctl.flat(), ...o('mix-ring')], { opacity: 0 })
  const mix = o('card-sales')
  init(tl, [...mix, ...o('card-report')], { opacity: 0.45 })

  // step 1: 화살표가 차례로 — '비비기'는 들어오는 두 개가 다 그려진 뒤에야 진해진다
  const drawEdge = (e: Element[], t: number) => {
    tl.to(shafts(e), { drawSVG: '100%', duration: 0.1, ease: 'none' }, t)
    tl.to(heads(e), { opacity: 1, duration: 0.03 }, t + 0.09)
  }
  drawEdge(edge('extract', 'orders'), at(0) + 0.04)
  drawEdge(edge('extract', 'products'), at(0) + 0.1)
  drawEdge(edge('orders', 'sales'), at(0) + 0.22)
  drawEdge(edge('products', 'sales'), at(0) + 0.36)
  tl.to(mix, { opacity: 1, duration: 0.06 }, at(0) + 0.48)
  tl.to(o('mix-ring'), { opacity: 1, duration: 0.06 }, at(0) + 0.48)
  drawEdge(edge('sales', 'report'), at(0) + 0.58)
  tl.to(o('card-report'), { opacity: 1, duration: 0.06 }, at(0) + 0.7)

  // step 2: 요리 카드가 노드로(모양만 바뀌고 화살표는 그대로), 이름이 바뀌고, 모두 ⏸ 대기
  tl.to(o('mix-ring'), { opacity: 0, duration: 0.08 }, at(1))
  o('shape').forEach((s) => tl.to(s, { attr: { points: (s as SVGElement).dataset.neat ?? '' }, duration: 0.24, ease: 'power2.inOut' }, at(1) + 0.06))
  tl.to(o('t-cook'), { opacity: 0, duration: 0.1 }, at(1) + 0.14)
  tl.to(o('t-dag'), { opacity: 1, duration: 0.1 }, at(1) + 0.2)
  tl.to(o('cook-l'), { opacity: 0, duration: 0.12 }, at(1) + 0.3)
  tl.to(o('job-l'), { opacity: 1, duration: 0.12 }, at(1) + 0.34)
  tl.to(o('wait-b'), { opacity: 1, duration: 0.08, stagger: 0.03 }, at(1) + 0.5)
  tl.to(o('together'), { opacity: 1, duration: 0.1 }, at(1) + 0.66)

  // step 3: 리포트 → 추출 고리가 그려지다 ✕, 거꾸로 지워지고 흐린 자국만
  const arc = o('arc')
  tl.to(o('t-dag'), { opacity: 0, duration: 0.08 }, at(2))
  tl.to(arc, { opacity: 1, duration: 0.01, stagger: 0.3 / arc.length }, at(2) + 0.08)
  tl.to(o('arc-head'), { opacity: 1, duration: 0.02 }, at(2) + 0.38)
  tl.to(o('arc-x'), { opacity: 1, duration: 0.04 }, at(2) + 0.4)
  tl.to(o('arc-l'), { opacity: 1, duration: 0.08 }, at(2) + 0.44)
  tl.to(o('arc-head'), { opacity: 0, duration: 0.02 }, at(2) + 0.48)
  tl.to([...arc].reverse(), { opacity: 0, duration: 0.01, stagger: 0.22 / arc.length }, at(2) + 0.5)
  tl.to([...o('arc-ghost'), ...o('arc-ghost-head')], { opacity: 0.32, duration: 0.08 }, at(2) + 0.72)

  // step 4: DAG가 내려가고, 오케스트레이터 카드에서 노드마다 점선(지휘)이 하나씩
  tl.to([...o('arc-ghost'), ...o('arc-ghost-head'), ...o('arc-x'), ...o('arc-l')], { opacity: 0, duration: 0.1 }, at(3))
  tl.to(o('dag'), { y: DSHIFT, duration: 0.26, ease: 'power2.inOut' }, at(3) + 0.02)
  tl.to(o('cards'), { opacity: 1, duration: 0.12 }, at(3) + 0.16)
  ctl.forEach((els, k) => {
    const segs = els.slice(0, -1)
    const t = at(3) + 0.34 + k * 0.09
    tl.to(segs, { opacity: 1, duration: 0.01, stagger: 0.07 / segs.length }, t)
    tl.to(els[els.length - 1], { opacity: 1, duration: 0.02 }, t + 0.07)
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 정의와 쇼핑몰 예시 — 실패해도 괜찮은 파이프라인
// ─────────────────────────────────────────────────────────────
const BCY = 104
const ALL: JobStatus[] = ['wait', 'ok', 'fail', 'retry']
const CUT_X = [8, 152, 296]
const CUT = { y: 222, w: 136, h: 150, cy: 298 }
const CUT_STATE: Record<JobId, JobStatus>[] = [
  { extract: 'ok', orders: 'fail', products: 'ok', sales: 'wait', report: 'wait' },
  { extract: 'ok', orders: 'retry', products: 'ok', sales: 'wait', report: 'wait' },
  { extract: 'ok', orders: 'ok', products: 'ok', sales: 'ok', report: 'ok' },
]
const MINI: Record<JobId, [number, number]> = { extract: [18, 0], orders: [56, -24], products: [56, 24], sales: [92, 0], report: [120, 0] }
const RUN_ORDER: Record<JobId, number> = { extract: 0, products: 1, orders: 2, sales: 3, report: 4 }

/** 동그라미 안 숫자(순서 표시) */
function NumChip({ x, y, n, el }: { x: number; y: number; n: string; el?: string }) {
  return (
    <g data-el={el}>
      <circle cx={x} cy={y} r={10} style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }} strokeWidth={1.6} />
      <Txt x={x} y={y + 4.5} size={13} weight={800} anchor="middle" mono>
        {n}
      </Txt>
    </g>
  )
}

/** 실행 횟수 비교(덧붙이기 vs 그날 치 지우고 다시 쓰기) 배치 */
function cmpGeo(mobile: boolean) {
  if (!mobile)
    return {
      counter: { lx: 220, ly: 30, anchor: 'middle' as const, cx: [180, 220, 260], cy: 56 },
      title: { L: { x: 14, y: 104 }, R: { x: 234, y: 104 } },
      cx: { L: [46, 111, 176], R: [262, 327, 392] },
      base: { L: 430, R: 430 },
      unit: 0.1,
      bw: 44,
      divider: true,
    }
  return {
    counter: { lx: 14, ly: 251, anchor: 'start' as const, cx: [150, 250, 350], cy: 246 },
    title: { L: { x: 14, y: 30 }, R: { x: 14, y: 290 } },
    cx: { L: [150, 250, 350], R: [150, 250, 350] },
    base: { L: 192, R: 446 },
    unit: 0.05,
    bw: 50,
    divider: false,
  }
}
const RUNS = {
  L: [
    { old: 0, add: 600 },
    { old: 600, add: 1200 },
    { old: 1800, add: 1200 },
  ],
  R: [
    { old: 0, add: 600 },
    { old: 600, add: 1200 },
    { old: 1200, add: 1200 },
  ],
}
const DAY = { y: 176, w: 56, barY: 216, barH: 80 }
const dayX = (k: number) => 10 + k * 60

export function DefinitionFig() {
  const { mobile, reduced } = useEnv()
  const C = cmpGeo(mobile)
  const P5 = mobile ? { x: 292, w: 144 } : { x: 308, w: 128 }
  return (
    <Fig caption={F.upsertNote}>
      {/* 큰 DAG */}
      <g data-el="big">
        {DAG_EDGES.map(([a, b]) => (
          <DagEdge key={`${a}${b}`} a={a} b={b} cy={BCY} seed={`df-${a}-${b}`} />
        ))}
        {JOB_IDS.map((id) => {
          const { x, y } = dagPos(id, BCY)
          return (
            <g key={id}>
              <JobNode x={x} y={y} label={JOBS[id]} el={`n-${id}`} statuses={ALL} status="wait" />
              {reduced && <NumChip x={x} y={y + DNH / 2 + 14} n={F.order[RUN_ORDER[id]]} el="ord-n" />}
            </g>
          )
        })}
      </g>

      {/* step 1: 작은 DAG 세 컷 */}
      <g data-el="cuts">
        {CUT_X.map((x0, k) => (
          <g key={k}>
            <rect x={x0} y={CUT.y} width={CUT.w} height={CUT.h} rx={6} style={{ fill: 'var(--surface)' }} />
            <RRect x={x0} y={CUT.y} w={CUT.w} h={CUT.h} seed={`cut${k}`} rough={0.4} />
            <rect data-el="cut-hl" x={x0 - 3} y={CUT.y - 3} width={CUT.w + 6} height={CUT.h + 6} rx={8} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
            <NumChip x={x0 + 18} y={CUT.y + 18} n={F.cuts[k].n} />
            {DAG_EDGES.map(([a, b]) => {
              const [ax, ay] = MINI[a]
              const [bx, by] = MINI[b]
              const ang = Math.atan2(by - ay, bx - ax)
              const r = 10.5
              return (
                <line
                  key={`${a}${b}`}
                  x1={x0 + ax + Math.cos(ang) * r}
                  y1={CUT.cy + ay + Math.sin(ang) * r}
                  x2={x0 + bx - Math.cos(ang) * r}
                  y2={CUT.cy + by - Math.sin(ang) * r}
                  style={{ stroke: 'var(--muted)' }}
                  strokeWidth={1.4}
                />
              )
            })}
            {JOB_IDS.map((id) => (
              <Badge key={id} x={x0 + MINI[id][0]} y={CUT.cy + MINI[id][1]} status={CUT_STATE[k][id]} r={9.5} />
            ))}
            <Txt x={x0 + CUT.w / 2} y={CUT.y + CUT.h - 16} size={13} weight={700} anchor="middle">
              {F.cuts[k].cap}
            </Txt>
          </g>
        ))}
      </g>

      {/* step 2: 실행 이력 + 알림 */}
      <HistoryTable x={8} y={222} rows={F.history5} mobile={mobile} el="h5" />
      <g data-el="phone5">
        <Txt x={P5.x + P5.w / 2} y={210} size={12.5} weight={600} anchor="middle" muted>
          {F.juniPhone}
        </Txt>
        <Phone x={P5.x} y={218} w={P5.w} h={230} seed="d-phone" />
      </g>
      <g data-el="note5">
        <rect x={P5.x + 8} y={250} width={P5.w - 16} height={82} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--fail)' }} strokeWidth={1.8} />
        {F.notify5.map((l, i) => (
          <Txt key={l} x={P5.x + 15} y={272 + i * 22} size={12} weight={i === 0 ? 800 : 600} color={i === 0 ? 'var(--fail)' : undefined} mono={i === 2}>
            {l}
          </Txt>
        ))}
      </g>

      {/* step 3: 실행 횟수에 따른 비교 */}
      <g data-el="cmp">
        <Txt x={C.counter.lx} y={C.counter.ly} size={13} weight={700} anchor={C.counter.anchor} muted>
          {F.runs}
        </Txt>
        {C.counter.cx.map((cx, k) => (
          <g key={k}>
            <circle cx={cx} cy={C.counter.cy} r={14} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.5} />
            <Txt x={cx} y={C.counter.cy + 5} size={14} weight={800} anchor="middle" mono>
              {k + 1}
            </Txt>
          </g>
        ))}
        <circle data-el="run-ring" data-gap={C.counter.cx[1] - C.counter.cx[0]} cx={C.counter.cx[0]} cy={C.counter.cy} r={18} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
        {C.divider && <line x1={220} y1={84} x2={220} y2={470} style={{ stroke: 'var(--edge)' }} strokeWidth={1.5} strokeDasharray="5 5" />}
        {(['L', 'R'] as const).map((s) => {
          const t = C.title[s]
          const title = s === 'L' ? F.append : F.overwrite
          return (
            <g key={s}>
              <Txt x={t.x} y={t.y} size={15} weight={800}>
                {title}
              </Txt>
              <Badge x={t.x + tw(title, 15) + 16} y={t.y - 5} status={s === 'L' ? 'fail' : 'ok'} r={10} />
              <line x1={C.cx[s][0] - C.bw} y1={C.base[s]} x2={C.cx[s][2] + C.bw} y2={C.base[s]} style={{ stroke: 'var(--line)' }} strokeWidth={1.5} />
              {RUNS[s].map((r, k) => {
                const x = C.cx[s][k] - C.bw / 2
                const base = C.base[s]
                const total = s === 'L' ? r.old + r.add : r.add
                return (
                  <g key={k}>
                    {r.old > 0 && (
                      <rect
                        data-el={`old-${s}${k}`}
                        x={x}
                        y={base - r.old * C.unit}
                        width={C.bw}
                        height={r.old * C.unit}
                        style={{ fill: 'var(--wait)', fillOpacity: 0.3, stroke: 'var(--wait)' }}
                        strokeWidth={1.4}
                        strokeDasharray={s === 'R' ? '4 3' : undefined}
                      />
                    )}
                    <rect data-el={`add-${s}${k}`} x={x} y={base - (s === 'L' ? r.old + r.add : r.add) * C.unit} width={C.bw} height={r.add * C.unit} style={{ fill: 'var(--accent)' }} />
                    <Txt x={x + C.bw / 2} y={base - total * C.unit - 7} size={13} weight={750} anchor="middle" mono el={`val-${s}${k}`}>
                      {F.rowsN(total)}
                    </Txt>
                    <Txt x={x + C.bw / 2} y={base + 17} size={12.5} weight={600} anchor="middle">
                      {F.runN(k + 1)}
                    </Txt>
                    {k === 0 && (
                      <Txt x={x + C.bw / 2} y={base + 32} size={11.5} weight={600} anchor="middle" muted>
                        {F.midFail}
                      </Txt>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
        <line
          data-el="same"
          x1={C.cx.R[1] - C.bw / 2 - 6}
          y1={C.base.R - 1200 * C.unit}
          x2={C.cx.R[2] + C.bw / 2 + 6}
          y2={C.base.R - 1200 * C.unit}
          style={{ stroke: 'var(--ok)' }}
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      </g>

      {/* step 4: 지난 일주일 백필 */}
      <g data-el="days">
        <Txt x={220} y={150} size={15.5} weight={800} anchor="middle">
          {F.backfill}
        </Txt>
        {F.days.map((d, k) => {
          const x0 = dayX(k)
          const cx = x0 + DAY.w / 2
          return (
            <g key={d}>
              <RRect x={x0} y={DAY.y} w={DAY.w} h={180} seed={`day${k}`} rough={0.4} fill="var(--surface)" />
              <Txt x={cx} y={DAY.y + 26} size={15} weight={800} anchor="middle">
                {d}
              </Txt>
              <rect x={cx - 12} y={DAY.barY} width={24} height={DAY.barH} rx={2} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
              <rect data-el="day-bar" x={cx - 12} y={DAY.barY + 10} width={24} height={DAY.barH - 10} style={{ fill: 'var(--accent)' }} />
              <Badge x={cx} y={DAY.y + 142} status="retry" r={10.5} el="day-r" />
              <Badge x={cx} y={DAY.y + 142} status="ok" r={10.5} el="day-v" />
              <Txt x={cx} y={DAY.y + 170} size={12.5} weight={700} anchor="middle" el="day-n">
                {F.noDup}
              </Txt>
            </g>
          )
        })}
      </g>
    </Fig>
  )
}

export const buildDefinition: SceneBuild = (q, tl) => {
  const o = pick(q)
  const rows = F.history5.map((_, i) => o(`h5-r${i}`))
  JOB_IDS.forEach((id) => initJob(tl, q, `n-${id}`, ALL, 'wait'))
  const hl = o('cut-hl')
  init(tl, [...hl, ...o('ord-n'), ...o('h5'), ...rows.flat(), ...o('phone5'), ...o('note5'), ...o('cmp'), ...o('days'), ...o('caption'), ...o('same')], { opacity: 0 })
  const set = (id: JobId, st: JobStatus, t: number) => setJob(tl, q, `n-${id}`, ALL, st, t)
  const focus = (k: number, t: number) => hl.forEach((h, i) => tl.to(h, { opacity: i === k ? 1 : 0, duration: 0.04 }, t))

  // step 1: 추출 ✓ → 주문 정리 ✕(상품 정리 ✓) → ↻ → ✓ → 매출 집계 ✓ → 리포트 ✓
  set('extract', 'ok', at(0) + 0.04)
  set('orders', 'fail', at(0) + 0.16)
  set('products', 'ok', at(0) + 0.16)
  focus(0, at(0) + 0.16)
  set('orders', 'retry', at(0) + 0.34)
  focus(1, at(0) + 0.34)
  set('orders', 'ok', at(0) + 0.5)
  set('sales', 'ok', at(0) + 0.58)
  set('report', 'ok', at(0) + 0.66)
  focus(2, at(0) + 0.66)
  const ordN = o('ord-n')
  if (ordN.length) tl.to(ordN, { opacity: 1, duration: 0.05 }, at(0) + 0.7)

  // step 2: 재시도까지 모두 실패 → 이력이 한 줄씩, 마지막 줄과 함께 알림
  tl.to([...o('cuts'), ...o('ord-n')], { opacity: 0, duration: 0.1 }, at(1))
  set('orders', 'fail', at(1) + 0.06)
  set('sales', 'wait', at(1) + 0.08)
  set('report', 'wait', at(1) + 0.08)
  tl.to([...o('h5'), ...o('phone5')], { opacity: 1, duration: 0.1 }, at(1) + 0.12)
  rows.forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.05 }, at(1) + 0.24 + i * 0.12))
  tl.to(o('note5'), { opacity: 1, duration: 0.06 }, at(1) + 0.6)

  // step 3: 실행 1 → 2 → 3. 왼쪽은 덧쌓이고, 오른쪽은 비운 뒤 다시 차서 같은 높이
  tl.to([...o('big'), ...o('h5'), ...o('phone5'), ...o('note5')], { opacity: 0, duration: 0.1 }, at(2))
  tl.to(o('cmp'), { opacity: 1, duration: 0.1 }, at(2) + 0.06)
  const ring = o('run-ring')[0]
  const stepX = num(ring, 'gap')
  ;(['L', 'R'] as const).forEach((s) =>
    RUNS[s].forEach((r, k) => {
      init(tl, [...o(`add-${s}${k}`)], { scaleY: 0, transformOrigin: '50% 100%' })
      init(tl, [...o(`val-${s}${k}`), ...(r.old ? o(`old-${s}${k}`) : [])], { opacity: 0 })
    }),
  )
  ;[0.06, 0.28, 0.5].forEach((t0, k) => {
    const t = at(2) + t0
    if (k > 0) tl.to(ring, { x: stepX * k, duration: 0.06 }, t - 0.02)
    // 덧붙이기: 이미 있는 행 위에 새 행이 쌓인다
    if (k > 0) tl.to(o(`old-L${k}`), { opacity: 1, duration: 0.03 }, t)
    tl.to(o(`add-L${k}`), { scaleY: 1, duration: 0.12, ease: 'none' }, t + 0.04)
    tl.to(o(`val-L${k}`), { opacity: 1, duration: 0.04 }, t + 0.16)
    // 그날 치 지우고 다시 쓰기: 있던 행을 지우고(0) 다시 채운다
    if (k > 0) {
      tl.to(o(`old-R${k}`), { opacity: 1, duration: 0.03 }, t)
      tl.to(o(`old-R${k}`), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.05 }, t + 0.04)
    }
    tl.to(o(`add-R${k}`), { scaleY: 1, duration: 0.1, ease: 'none' }, t + 0.1)
    tl.to(o(`val-R${k}`), { opacity: 1, duration: 0.04 }, t + 0.2)
  })
  tl.to(o('same'), { opacity: 1, duration: 0.06 }, at(2) + 0.74)

  // step 4: 요일마다 ↻ → ✓. 막대는 비웠다가 다시 찰 뿐 덧쌓이지 않는다
  tl.to(o('cmp'), { opacity: 0, duration: 0.1 }, at(3))
  tl.to(o('days'), { opacity: 1, duration: 0.1 }, at(3) + 0.06)
  tl.to(o('caption'), { opacity: 1, duration: 0.1 }, at(3) + 0.7)
  const bars = o('day-bar')
  const rb = o('day-r')
  const vb = o('day-v')
  const nd = o('day-n')
  init(tl, [...rb, ...vb, ...nd], { opacity: 0 })
  init(tl, bars, { transformOrigin: '50% 100%' })
  bars.forEach((b, k) => {
    const t = at(3) + 0.12 + k * 0.08
    tl.to(rb[k], { opacity: 1, duration: 0.02 }, t)
    tl.to(b, { scaleY: 0, duration: 0.04 }, t)
    tl.to(b, { scaleY: 1, duration: 0.06 }, t + 0.05)
    tl.to(rb[k], { opacity: 0, duration: 0.02 }, t + 0.11)
    tl.to([vb[k], nd[k]], { opacity: 1, duration: 0.03 }, t + 0.11)
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 시각 대신 순서로
// ─────────────────────────────────────────────────────────────
type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined
const CAM1 = '-14 -18 446 516'
const CAM2 = '-14 -18 506 516'

function MapOverlay({ at: pos }: { at: At }) {
  const [etl, wh, orch, alert] = ['etl', 'warehouse', 'orch', 'alert'].map(pos)
  if (!etl || !wh || !orch || !alert) return null
  // 야간 ETL 배치 → 분석용 DB: 오케스트레이터를 피해 왼쪽으로 돌아간다
  const ew: [number, number][] = [
    [etl.x - etl.w / 2 - 2, etl.y + 8],
    [etl.x - etl.w / 2 - 70, etl.y + 40],
    [wh.x - 52, wh.y - 110],
    [wh.x - 12, wh.y - wh.h / 2 - 7],
  ]
  const ewPts = bezier(ew, 24)
  const [hx, hy] = ewPts[ewPts.length - 1]
  const [px, py] = ewPts[ewPts.length - 3]
  const ha = Math.atan2(hy - py, hx - px)
  const head = `M ${hx - 9 * Math.cos(ha - 0.45)} ${hy - 9 * Math.sin(ha - 0.45)} L ${hx} ${hy} L ${hx - 9 * Math.cos(ha + 0.45)} ${hy - 9 * Math.sin(ha + 0.45)}`
  const oa1 = boxEdge(orch.x, orch.y, orch.w, orch.h, alert.x, alert.y, 4)
  const oa2 = boxEdge(alert.x, alert.y, alert.w, alert.h, orch.x, orch.y, 7)
  const tagX = orch.x + orch.w / 2 + 22
  const badge = { x: etl.x + etl.w / 2 - 2, y: etl.y - etl.h / 2 + 2 }
  const ph = { x: 338, y: 96, w: 144, h: 176 }
  const runX = 344
  const runY = (i: number) => 304 + i * 30
  return (
    <g>
      <rect data-el="cam" data-cam1={CAM1} data-cam2={CAM2} width={0} height={0} style={{ fill: 'none' }} />
      <g>
        <RPath d={`M ${ewPts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L ')}`} seed="sol-ew" rough={0.4} />
        <path d={head} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <DashArrow
        pts={[
          [orch.x, orch.y - orch.h / 2 - 4],
          [etl.x, etl.y + etl.h / 2 + 7],
        ]}
        el="c-oe"
        dash={3}
        gap={5}
      />
      <DashArrow pts={[oa1, oa2]} el="c-oa" dash={3} gap={5} />

      {/* step 1: 설정 태그 3개 */}
      <g data-el="tag-link">
        <path d={`M ${orch.x + orch.w / 2 + 5} ${orch.y} L ${tagX - 8} ${orch.y} M ${tagX - 8} ${orch.y - 28} L ${tagX - 8} ${orch.y + 28}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.5} />
      </g>
      {F.tags.map((t, k) => {
        const y = orch.y - 28 + k * 28
        const w = tw(t, 13.5) + 22
        return (
          <g key={t} data-el="tag">
            <rect x={tagX} y={y - 12} width={w} height={24} rx={12} style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }} strokeWidth={1.5} />
            <Txt x={tagX + 11} y={y + 5} size={13.5} weight={700}>
              {t}
            </Txt>
          </g>
        )
      })}

      {/* step 2: 추출 실패 → 바로 알림 → 재시도 성공 */}
      <Badge x={badge.x} y={badge.y} status="fail" r={11} el="etl-x" />
      <Badge x={badge.x} y={badge.y} status="retry" r={11} el="etl-r" />
      <Badge x={badge.x} y={badge.y} status="ok" r={11} el="etl-v" />
      <g data-el="phone6">
        <Txt x={ph.x + ph.w / 2} y={ph.y - 10} size={13} weight={600} anchor="middle" muted>
          {F.juniPhone}
        </Txt>
        <Phone x={ph.x} y={ph.y} w={ph.w} h={ph.h} seed="s-phone" />
      </g>
      <g data-el="note6">
        <rect x={ph.x + 8} y={ph.y + 24} width={ph.w - 16} height={120} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--fail)' }} strokeWidth={1.8} />
        {F.notify6.map((l, i) => (
          <Txt key={l} x={ph.x + 16} y={ph.y + 48 + i * 26} size={13} weight={i === 0 ? 800 : 650} color={i === 1 ? 'var(--fail)' : undefined} mono={i === 3}>
            {l}
          </Txt>
        ))}
      </g>
      <line data-el="run-line" x1={runX} y1={runY(0)} x2={runX} y2={runY(5)} style={{ stroke: 'var(--edge)' }} strokeWidth={2} />
      {F.run6.map((r, i) => (
        <g key={i} data-el="run">
          <Badge x={runX} y={runY(i)} status={r.st} r={10} />
          {r.st === 'retry' && <Badge x={runX + 32 + tw(r.job, 14)} y={runY(i)} status="ok" r={10} el="run-v" />}
          <Txt x={runX + 18} y={runY(i) + 5} size={14} weight={650}>
            {r.job}
          </Txt>
          <Txt x={ph.x + ph.w} y={runY(i) + 5} size={13} weight={600} anchor="end" mono muted>
            {r.time}
          </Txt>
        </g>
      ))}
    </g>
  )
}

function MorningFig() {
  const { mobile } = useEnv()
  const bar = { x: mobile ? 334 : 340, y: 150, w: 56, h: 180 }
  return (
    <Fig>
      <g data-el="m-card">
        <RRect x={10} y={12} w={420} h={84} seed="m-card" rough={0.45} fill="var(--surface)" />
        <Txt x={24} y={38} size={13} weight={700} muted>
          {F.morning}
        </Txt>
        <Txt x={24} y={76} size={17} weight={800}>
          {F.ordersN(1200)}
        </Txt>
        <Badge x={38 + tw(F.ordersN(1200), 17)} y={70} status="ok" r={10.5} />
        <Txt x={216} y={76} size={17} weight={800}>
          {F.revenueN(1200)}
        </Txt>
        <Badge x={230 + tw(F.revenueN(1200), 17)} y={70} status="ok" r={10.5} />
      </g>
      <HistoryTable x={10} y={116} rows={F.history6} mobile={mobile} el="h6" />
      <g data-el="m-bar">
        <Txt x={bar.x + bar.w / 2} y={bar.y - 12} size={13.5} weight={750} anchor="middle">
          {F.whName}
        </Txt>
        <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} style={{ fill: 'var(--accent)' }} />
        <rect x={bar.x} y={bar.y} width={bar.w} height={bar.h} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.5} />
        <line x1={bar.x - 14} y1={bar.y + bar.h} x2={bar.x + bar.w + 14} y2={bar.y + bar.h} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
        <Txt x={bar.x + bar.w / 2} y={bar.y + bar.h + 22} size={13} weight={750} anchor="middle">
          {F.whStatic}
        </Txt>
      </g>
    </Fig>
  )
}

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="map-layer" className="absolute inset-0">
        <PipelineMap t={T.ch3} from={T.ch2} vertical overlay={(a) => <MapOverlay at={a} />} />
      </div>
      <div data-el="morning-layer" className="absolute inset-0">
        <MorningFig />
      </div>
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl) => {
  const o = pick(q)
  const node = (id: string) => q(`[data-node="${id}"]`)
  const edge = (id: string) => q(`[data-edge="${id}"]`)
  const paths = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
  const texts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('text')))
  const svg = o('map')[0]
  const cam = o('cam')[0] as SVGElement | undefined
  if (svg && cam) init(tl, svg, { attr: { viewBox: cam.dataset.cam1 ?? '' } })
  const orch = node('orch')
  const alert = node('alert')
  const oe = [...o('c-oe'), ...o('c-oe-head')]
  const oa = o('c-oa')
  const rows = o('run')
  const h6 = F.history6.map((_, i) => o(`h6-r${i}`))
  // 맵의 직선 연결(오케스트레이터를 가로지름)과 제어선은 덧그림으로 대신한다
  init(tl, [...edge('etl>warehouse'), ...edge('orch>etl'), ...edge('orch>alert')], { opacity: 0 })
  init(tl, [...alert, ...oe, ...oa, ...o('c-oa-head'), ...o('tag'), ...o('tag-link'), ...o('etl-x'), ...o('etl-r'), ...o('etl-v'), ...o('phone6'), ...o('note6'), ...o('run-line'), ...rows, ...o('run-v'), ...o('morning-layer'), ...h6.flat(), ...texts(orch)], { opacity: 0 })
  init(tl, [...paths(orch), ...paths(alert)], { drawSVG: '0%' })

  init(tl, orch, { opacity: 0 })

  // step 1: 오케스트레이터가 그려지고, 점선으로 야간 ETL 배치를 지휘. 설정 태그 3개
  tl.to(orch, { opacity: 1, duration: 0.02 }, at(0) + 0.04)
  tl.to(paths(orch), { drawSVG: '100%', duration: 0.22, ease: 'none' }, at(0) + 0.04)
  tl.to(texts(orch), { opacity: 1, duration: 0.08 }, at(0) + 0.24)
  tl.to(o('c-oe'), { opacity: 1, duration: 0.01, stagger: 0.12 / Math.max(1, o('c-oe').length) }, at(0) + 0.34)
  tl.to(o('c-oe-head'), { opacity: 1, duration: 0.02 }, at(0) + 0.46)
  tl.to(o('tag-link'), { opacity: 1, duration: 0.06 }, at(0) + 0.52)
  tl.to(o('tag'), { opacity: 1, duration: 0.06, stagger: 0.1 }, at(0) + 0.54)

  // step 2: 추출 ✕ → 실패 알림 노드와 휴대폰 알림 → ↻ → ✓ → 나머지가 왼쪽부터 ✓
  tl.to([...o('tag'), ...o('tag-link')], { opacity: 0, duration: 0.1 }, at(1))
  if (svg && cam) tl.to(svg, { attr: { viewBox: cam.dataset.cam2 ?? '' }, duration: 0.24, ease: 'power2.inOut' }, at(1) + 0.02)
  tl.to(o('etl-x'), { opacity: 1, duration: 0.03 }, at(1) + 0.16)
  tl.to(o('run-line'), { opacity: 1, duration: 0.05 }, at(1) + 0.16)
  tl.to(rows[0], { opacity: 1, duration: 0.04 }, at(1) + 0.16)
  tl.to(oa, { opacity: 1, duration: 0.01, stagger: 0.1 / Math.max(1, oa.length) }, at(1) + 0.18)
  tl.to(o('c-oa-head'), { opacity: 1, duration: 0.02 }, at(1) + 0.28)
  tl.to(alert, { opacity: 1, duration: 0.03 }, at(1) + 0.26)
  tl.to(paths(alert), { drawSVG: '100%', duration: 0.12, ease: 'none' }, at(1) + 0.26)
  tl.to(o('phone6'), { opacity: 1, duration: 0.06 }, at(1) + 0.3)
  tl.to(o('note6'), { opacity: 1, duration: 0.06 }, at(1) + 0.36)
  tl.to(o('etl-x'), { opacity: 0, duration: 0.03 }, at(1) + 0.44)
  tl.to(o('etl-r'), { opacity: 1, duration: 0.03 }, at(1) + 0.44)
  tl.to(rows[1], { opacity: 1, duration: 0.04 }, at(1) + 0.44)
  tl.to(o('etl-r'), { opacity: 0, duration: 0.03 }, at(1) + 0.54)
  tl.to(o('etl-v'), { opacity: 1, duration: 0.03 }, at(1) + 0.54)
  tl.to(o('run-v'), { opacity: 1, duration: 0.03 }, at(1) + 0.54)
  ;[2, 3].forEach((i) => tl.to(rows[i], { opacity: 1, duration: 0.04 }, at(1) + 0.6))
  tl.to(rows[4], { opacity: 1, duration: 0.04 }, at(1) + 0.66)
  tl.to(rows[5], { opacity: 1, duration: 0.04 }, at(1) + 0.72)

  // step 3: 아침 — 리포트 카드, 이력 표가 위에서부터. 분석용 DB 막대는 1,200에서 그대로
  tl.to(o('map-layer'), { opacity: 0, duration: 0.12 }, at(2))
  tl.to(o('morning-layer'), { opacity: 1, duration: 0.12 }, at(2) + 0.08)
  h6.forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.05 }, at(2) + 0.26 + i * 0.08))
}
