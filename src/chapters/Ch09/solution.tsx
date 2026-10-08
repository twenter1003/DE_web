import { ch9 } from '../../content/chapters/ch9'
import { T } from '../../content/map'
import { PEOPLE } from '../../content/people'
import { Badge } from '../../components/diagram'
import { Fig, Txt } from '../../components/fig'
import { mapTransition, PipelineMap } from '../../components/PipelineMap'
import { RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { mapStateAt, type Box } from '../../state/derive'
import { useEnv } from '../../state/env'
import { gsap } from '../../lib/gsap'
import { DashArrow, init, Meter, needleInit, needleTo, pick, StatusMark, WorkCard } from './parts'
import { BILL_NOW } from './scenes'

// 장면 6. 해결 — 필요한 만큼만 읽고, 필요한 만큼만 연다
// 맵(세로 배치)은 왼쪽, 청구서·비용 모니터·카탈로그 카드는 오른쪽 판. step 2는 작업 카드 그림으로 바꿔 보여 준다.
// 모바일: 맵 전체를 옆에 두면 글자가 5px 안팎이라, 맵은 위 띠에서 바뀐 줄만 크게 보여 주고(개요는 노드 수 카운터) 판은 아래에 쌓는다.

const F = ch9.figures
const N_BEFORE = mapStateAt(T.ch8).nodes.length
const N_AFTER = mapStateAt(T.ch9).nodes.length
const IDS = mapStateAt(T.ch9).nodes.map((n) => n.id)
/** 다음 달 청구서 막대(이번 달 = BILL_NOW). 배수는 쓰지 않는다 */
const BILL_NEXT = [0.34, 0.3, 0.2]
/** 비용 모니터의 최근 7일 요금(오른쪽으로 갈수록 낮아짐) */
const DAYS7 = [0.92, 0.78, 0.62, 0.5, 0.41, 0.34, 0.29]

type At = (id: string) => Box | undefined
const box = (b: Box) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`
const unbox = (s: string | undefined): Box => {
  const [x, y, w, h] = (s ?? '0 0 100 100').split(' ').map(Number)
  return { x, y, w, h }
}
/** 세로로 긴 영역을 왼쪽에 붙여 화면 비율에 맞춘다(오른쪽은 판 자리) */
const fitLeft = (r: Box, aspect: number) => {
  if (r.w / r.h < aspect) return `${r.x.toFixed(1)} ${r.y.toFixed(1)} ${(r.h * aspect).toFixed(1)} ${r.h.toFixed(1)}`
  const h = r.w / aspect
  return `${r.x.toFixed(1)} ${(r.y + r.h / 2 - h / 2).toFixed(1)} ${r.w.toFixed(1)} ${h.toFixed(1)}`
}

/** 맵 위 덧그림: 다른 노드를 피해 오른쪽으로 돌아가는 제어 점선 두 개, bi 칩, 보관 계층 표시, 카메라 */
function SolOverlay({ at: pos, mobile }: { at: At; mobile: boolean }) {
  const lh = pos('lakehouse')
  const bi = pos('bi')
  const cat = pos('catalog')
  const cost = pos('cost')
  if (!lh || !bi || !cat || !cost) return null
  const all = IDS.map(pos).filter(Boolean) as Box[]
  const right = Math.max(...all.map((n) => n.x + n.w / 2))
  const lhR = lh.x + lh.w / 2
  const yb = lh.y + lh.h / 2
  const catPts: [number, number][] = [
    [cat.x + cat.w / 2 + 4, cat.y],
    [right + 14, cat.y],
    [right + 14, yb - 16],
    [lhR + 6, yb - 16],
  ]
  const costPts: [number, number][] = [
    [cost.x + cost.w / 2 + 4, cost.y],
    [right + 24, cost.y],
    [right + 24, yb - 7],
    [lhR + 6, yb - 7],
  ]
  const chip = { x: bi.x - 70, y: bi.y + bi.h / 2 + 8, w: 140, h: 24 }
  const ax = lh.x - 40
  const ay = yb + 10
  const x0 = Math.min(...all.map((n) => n.x - n.w / 2)) - 8
  const y0 = Math.min(...all.map((n) => n.y - n.h / 2)) - 8
  const x1 = right + 24 + 14
  const full: Box = { x: x0, y: y0, w: x1 - x0, h: chip.y + chip.h + 8 - y0 }
  // 모바일 카메라: step 1은 bi·비용 모니터 줄(칩 포함), step 3은 카탈로그 줄
  const r1 = Math.min(bi.y - bi.h / 2, cost.y - cost.h / 2) - 12
  const m1: Box = { x: x0, y: r1, w: x1 - x0, h: chip.y + chip.h + 8 - r1 }
  // 아래쪽은 모델링 → BI 화살표의 품질 배지까지 담는다(반쯤 잘려 보이지 않게)
  const m3: Box = { x: x0, y: cat.y + cat.h / 2 + 36 - m1.h, w: m1.w, h: m1.h }
  return (
    <g>
      <rect data-el="cams" data-full={box(full)} data-m1={box(m1)} data-m3={box(m3)} width={0} height={0} style={{ fill: 'none' }} />
      <DashArrow pts={catPts} el="rt-cat" />
      <DashArrow pts={costPts} el="rt-cost" />
      <g data-el="bi-chip">
        <rect x={chip.x} y={chip.y} width={chip.w} height={chip.h} rx={11} style={{ fill: 'var(--accent)' }} />
        <Txt x={bi.x} y={chip.y + 17} size={13} weight={800} anchor="middle" color="var(--bg)">
          {F.biFilter}
        </Txt>
      </g>
      {/* 모바일에선 레이크하우스가 카메라 밖이라 보관 계층 표시는 청구서 카드 안에 둔다 */}
      {!mobile && (
      <g data-el="archive">
        {/* 작은 선반: 위 칸(빠름) · 아래 칸(보관)으로 상자가 내려간 모습 */}
        <rect x={ax} y={ay} width={34} height={30} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.3} />
        <line x1={ax} y1={ay + 15} x2={ax + 34} y2={ay + 15} style={{ stroke: 'var(--line)' }} strokeWidth={1.3} />
        <rect x={ax + 5} y={ay + 19} width={10} height={9} style={{ fill: 'var(--line)' }} />
        <rect x={ax + 18} y={ay + 19} width={10} height={9} style={{ fill: 'var(--line)' }} />
        <Txt x={ax + 34} y={ay + 46} size={11.5} weight={750} anchor="end">
          {F.archive[0]}
        </Txt>
        <Txt x={ax + 34} y={ay + 61} size={11.5} weight={750} anchor="end">
          {F.archive[1]}
        </Txt>
      </g>
      )}
    </g>
  )
}

function Counter({ mobile }: { mobile: boolean }) {
  return (
    <div
      data-el="counter"
      className={`rounded-lg border-[1.5px] border-edge bg-surface ${mobile ? 'flex items-baseline gap-2 self-end px-2.5 py-1' : 'absolute right-0 top-[6%] px-3 py-2 text-right'}`}
    >
      <p className="text-xs font-semibold text-muted">{F.nodeCount}</p>
      <p className={`grid font-mono font-extrabold leading-tight ${mobile ? 'text-base' : 'text-2xl'}`}>
        <span data-el="cnt1" className="col-start-1 row-start-1">
          {N_BEFORE}
          <span data-el="cnt1-to"> → {N_BEFORE + 1}</span>
        </span>
        <span data-el="cnt2" className="col-start-1 row-start-1">
          {N_BEFORE + 1}
          <span data-el="cnt2-to"> → {N_AFTER}</span>
        </span>
      </p>
    </div>
  )
}

const PANEL = 'absolute right-0 top-[calc(6%+5.5rem)] w-[50%] space-y-3 text-[0.875rem] leading-snug'
/** 모바일: 맵 띠 아래, 두 판이 같은 칸에 겹쳐 있고(step 1 ↔ step 3) 카드는 두 열 */
const PANEL_M = 'col-start-1 row-start-1 grid grid-cols-2 content-start items-start gap-1.5 text-[0.6875rem] leading-snug'
const CARD = 'rounded-xl border-[1.5px] border-edge bg-surface px-2.5 py-2 md:px-4 md:py-3'

function CostPanels({ mobile }: { mobile: boolean }) {
  return (
    <div data-el="panel1" className={mobile ? PANEL_M : PANEL}>
      <div className={CARD}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <p className="font-bold">{F.nextBill}</p>
          <p className="text-muted">
            <span className="mr-1 inline-block h-2 w-4 rounded-sm border border-dashed border-muted align-middle" aria-hidden="true" />
            {F.thisMonth}
          </p>
        </div>
        {/* 모바일은 카드가 반 폭이라 미터기를 막대 아래에 두어 글자가 읽히는 크기를 지킨다 */}
        <div className={`mt-1 grid gap-2 ${mobile ? '' : 'grid-cols-[minmax(0,1fr)_7rem] items-end'}`}>
          <div className="space-y-1">
            {F.bill.rows.map((r, k) => (
              <div key={r}>
                <p>{r}</p>
                <div className="relative mt-0.5 h-2 md:h-2.5">
                  <div className="absolute inset-y-0 left-0 rounded-sm border border-dashed border-muted" style={{ width: `${BILL_NOW[k] * 100}%` }} />
                  <div data-el="nb" data-k={k} className="absolute inset-y-0 left-0 rounded-sm bg-ink" style={{ width: `${BILL_NEXT[k] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <svg viewBox="12 14 146 92" className={`diagram ${mobile ? 'mx-auto w-[6.5rem]' : 'w-full'}`} aria-hidden="true">
            <Meter x={74} y={76} r={52} label={F.meterQuery} el="nm" high={F.high} seed="s6-nm" value={0.9} highColor="var(--ink)" />
          </svg>
        </div>
        {mobile && (
          <p data-el="archive" className="mt-1.5 border-t border-edge pt-1 font-semibold">
            {F.archive[0]} {F.archive[1]}
          </p>
        )}
      </div>
      <div className={CARD}>
        <p className="font-bold">{F.costPanel}</p>
        <p className="text-muted">{F.last7}</p>
        <div className="mt-1 flex h-8 items-end gap-[3px] md:h-12 md:gap-1">
          {DAYS7.map((v, i) => (
            <div key={i} data-el="d7" className="flex-1 rounded-t-sm bg-ink" style={{ height: `${v * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between text-muted">
          <span>{F.last7Ends[0]}</span>
          <span>{F.last7Ends[1]}</span>
        </div>
        <p className="mt-1.5 font-bold">{F.topQueries}</p>
        <ol className="mt-0.5 space-y-0.5">
          {F.queries.map((t, i) => (
            <li key={t} data-el="tq">
              {i + 1}. {t}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function CatalogPanels({ mobile }: { mobile: boolean }) {
  return (
    <div data-el="panel3" className={mobile ? PANEL_M : PANEL}>
      <div className="relative col-span-2 pt-2.5">
        <div data-el="gov" className="pointer-events-none absolute inset-0 rounded-t-[1.5rem] border-x-2 border-t-[3px] border-ink">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-bg px-2 text-[0.8125rem] font-extrabold md:text-base">{F.governance}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1 px-1.5 pb-1.5 pt-2.5 md:gap-1.5 md:px-3 md:pb-2.5">
          {F.govTags.map((t) => (
            <span key={t} data-el="gtag" className="rounded-full border-[1.5px] border-edge bg-surface px-2 py-0.5 font-semibold">
              {t}
            </span>
          ))}
        </div>
      </div>
      {F.catalogCards.map((c) => (
        <div key={c.title} className={CARD}>
          <p className="font-bold">{c.title}</p>
          {c.lines.map(([k, v]) => (
            <p key={k} data-el="cat-line">
              <b className="font-bold">{k}:</b> {v}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

/** step 2: 작업 카드 네 장 + 역할 격자 축소판 */
const WCARD = (k: number) => 84 + k * 82
const MINI = { x: 282, top: 150, rowH: 40, col: (j: number) => 360 + j * 28 }
function WorkFig() {
  const labels = { run: F.running, wait: F.paused, ok: F.resumed }
  return (
    <Fig>
      {F.doneTasks.map((t, k) => {
        const name = t.who === 'cs' ? F.csName : PEOPLE[t.who].name
        const initial = t.who === 'cs' ? F.csInitial : name.slice(0, 1)
        return <WorkCard key={t.who} x={8} y={WCARD(k)} w={262} initial={initial} name={name} task={t.task} el={`sw${k}`} labels={labels} note={'note' in t ? t.note : undefined} seed={`s6-w${k}`} />
      })}
      <g>
        <RRect x={MINI.x - 6} y={MINI.top - 40} w={156} h={40 + MINI.rowH * 4 + 34} rough={0.3} seed="s6-mini" fill="var(--surface)" />
        {F.miniCols.map((c, j) => (
          <Txt key={c} x={MINI.col(j)} y={MINI.top - 14} size={12} weight={800} anchor="middle">
            {c}
          </Txt>
        ))}
        {F.miniRows.map((r, i) => (
          <g key={r}>
            <Txt x={MINI.x} y={MINI.top + MINI.rowH * i + 24} size={12} weight={700}>
              {r}
            </Txt>
            {F.grid[i].map((c, j) => (
              <Badge key={j} x={MINI.col(j)} y={MINI.top + MINI.rowH * i + 20} status={c.ok ? 'ok' : 'fail'} r={9} />
            ))}
          </g>
        ))}
        {/* 축소판이라 칸마다 글자를 못 쓰니, 아이콘 뜻을 범례로 */}
        <StatusMark x={MINI.x + 10} y={MINI.top + MINI.rowH * 4 + 14} status="ok" text={F.allow} r={9} />
        <StatusMark x={MINI.x + 80} y={MINI.top + MINI.rowH * 4 + 14} status="fail" text={F.deny} r={9} />
      </g>
    </Fig>
  )
}

export function SolutionFig() {
  const { mobile } = useEnv()
  const map = <PipelineMap t={T.ch9} from={T.ch8} vertical overlay={(a) => <SolOverlay at={a} mobile={mobile} />} />
  const cards = (
    <div data-el="cards-layer" className="absolute inset-0">
      <WorkFig />
    </div>
  )
  if (mobile)
    return (
      <div className="relative flex h-full w-full flex-col gap-1.5">
        <Counter mobile />
        {/* 높이는 buildSolution이 카메라 영역 비율에 맞춘다(위아래로 다른 줄이 비치지 않게) */}
        <div data-el="map-layer" className="relative h-[30%] shrink-0 overflow-hidden">
          {map}
        </div>
        <div className="grid">
          <CostPanels mobile />
          <CatalogPanels mobile />
        </div>
        {cards}
      </div>
    )
  return (
    <div className="relative h-full w-full">
      <div data-el="map-layer" className="absolute inset-0 overflow-hidden">
        {map}
      </div>
      {cards}
      <Counter mobile={false} />
      <CostPanels mobile={false} />
      <CatalogPanels mobile={false} />
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const svg = o('map')[0] as SVGSVGElement | undefined
  const cams = o('cams')[0] as SVGElement | undefined
  if (!svg || !cams) return
  const m1 = unbox(cams.dataset.m1)
  // 모바일: 맵 띠의 높이를 카메라 영역 비율에 맞춰, 바뀐 줄이 띠 폭을 꽉 채우게 한다
  if (mobile) gsap.set(o('map-layer'), { height: (svg.getBoundingClientRect().width * m1.h) / m1.w })
  const rect = svg.getBoundingClientRect()
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.75
  const cam = mobile ? box(m1) : fitLeft(unbox(cams.dataset.full), aspect)
  svg.dataset.vbFrom = cam
  svg.dataset.vbTo = cam
  const node = (id: string) => q(`[data-node="${id}"]`)
  const edge = (id: string) => q(`[data-edge="${id}"]`)
  const ring = (id: string) => q(`[data-node="${id}"] > .node-focus`)
  // 카탈로그는 step 3에서 따로 그리고, 두 제어선은 다른 노드를 피해 돌아가는 덧그림 선으로 바꾼다
  node('catalog').forEach((el) => ((el as SVGElement).dataset.change = 'later'))
  for (const id of ['catalog>lakehouse', 'cost>lakehouse']) edge(id).forEach((el) => ((el as SVGElement).dataset.change = 'routed'))
  init(tl, [...node('catalog'), ...edge('catalog>lakehouse'), ...edge('cost>lakehouse')], { opacity: 0 })
  init(tl, o('rt-cat', 'rt-cat-head', 'rt-cost', 'rt-cost-head', 'bi-chip', 'archive', 'panel1', 'panel3', 'cards-layer', 'counter', 'cnt1-to', 'cnt2', 'cnt2-to', 'gtag', 'cat-line', 'tq'), { opacity: 0 })
  init(tl, o('gov'), { opacity: 0, y: -22 })
  init(tl, o('d7'), { scaleY: 0, transformOrigin: '50% 100%' })
  o('nb').forEach((b) => {
    const k = Number((b as HTMLElement).dataset.k)
    init(tl, b, { scaleX: BILL_NOW[k] / BILL_NEXT[k], transformOrigin: '0% 50%' })
  })
  const needle = o('nm-needle')[0]
  needleInit(tl, needle, 0.9)

  // step 1: 비용 모니터 노드와 제어 점선, 대시보드 기본 필터·보관 계층, 다음 달 청구서
  const s1 = at(0)
  tl.to(o('counter'), { opacity: 1, duration: 0.06 }, s1)
  mapTransition(q, tl, s1 + 0.02, { dur: 0.36 })
  tl.to(o('rt-cost'), { opacity: 1, duration: 0.01, stagger: 0.12 / Math.max(1, o('rt-cost').length) }, s1 + 0.32)
  tl.to(o('rt-cost-head'), { opacity: 1, duration: 0.02 }, s1 + 0.44)
  tl.to(ring('cost'), { opacity: 1, duration: 0.04 }, s1 + 0.46)
  tl.to(o('cnt1-to'), { opacity: 1, duration: 0.05 }, s1 + 0.34)
  tl.to(o('bi-chip'), { opacity: 1, duration: 0.06 }, s1 + 0.48)
  tl.to(o('archive'), { opacity: 1, duration: 0.06 }, s1 + 0.52)
  tl.to(o('panel1'), { opacity: 1, duration: 0.08 }, s1 + 0.38)
  tl.to(o('nb'), { scaleX: 1, duration: 0.16, ease: 'power2.inOut' }, s1 + 0.46)
  needleTo(tl, needle, 0.18, s1 + 0.46, 0.16)
  tl.to(o('d7'), { scaleY: 1, duration: 0.03, stagger: 0.02 }, s1 + 0.54)
  tl.to(o('tq'), { opacity: 1, duration: 0.03, stagger: 0.03 }, s1 + 0.7)

  // step 2: 멈춰 있던 카드가 하나씩 ⏸ 회색 → ✓ 재개
  const s2 = at(1)
  tl.to(o('map-layer', 'panel1', 'counter'), { opacity: 0, duration: 0.08 }, s2)
  tl.to(o('cards-layer'), { opacity: 1, duration: 0.08 }, s2 + 0.06)
  ;[0, 1, 2, 3].forEach((k) => {
    init(tl, o(`sw${k}-run`, `sw${k}-ok`), { opacity: 0 })
    const t = s2 + 0.22 + k * 0.13
    tl.to(o(`sw${k}-grey`, `sw${k}-wait`), { opacity: 0, duration: 0.05 }, t)
    tl.to(o(`sw${k}-ok`), { opacity: 1, duration: 0.05 }, t + 0.02)
  })

  // step 3: 카탈로그 노드 → 테이블 꼬리표 → '거버넌스'가 네 꼬리표를 묶는다
  const s3 = at(2)
  tl.to(o('cards-layer'), { opacity: 0, duration: 0.08 }, s3)
  // 모바일: 맵이 가려진 사이 카메라를 카탈로그 줄로 옮긴다
  if (mobile) tl.set(svg, { attr: { viewBox: box(unbox(cams.dataset.m3)) } }, s3 + 0.04)
  tl.set(o('cnt1'), { opacity: 0 }, s3 + 0.04)
  tl.set(o('cnt2'), { opacity: 1 }, s3 + 0.04)
  tl.to(ring('cost'), { opacity: 0, duration: 0.02 }, s3 + 0.04)
  tl.to(o('map-layer', 'counter'), { opacity: 1, duration: 0.08 }, s3 + 0.06)
  tl.to(node('catalog'), { opacity: 1, duration: 0.06 }, s3 + 0.16)
  tl.to(o('rt-cat'), { opacity: 1, duration: 0.01, stagger: 0.1 / Math.max(1, o('rt-cat').length) }, s3 + 0.22)
  tl.to(o('rt-cat-head'), { opacity: 1, duration: 0.02 }, s3 + 0.32)
  tl.to(o('cnt2-to'), { opacity: 1, duration: 0.05 }, s3 + 0.24)
  tl.to([...ring('catalog'), ...ring('lakehouse')], { opacity: 1, duration: 0.04 }, s3 + 0.34)
  tl.to(o('panel3'), { opacity: 1, duration: 0.06 }, s3 + 0.22)
  tl.to(o('cat-line'), { opacity: 1, duration: 0.03, stagger: 0.03 }, s3 + 0.3)
  tl.to(o('gtag'), { opacity: 1, duration: 0.03, stagger: 0.025 }, s3 + 0.56)
  tl.to(o('gov'), { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, s3 + 0.66)
}
