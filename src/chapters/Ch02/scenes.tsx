import { ch2, CLEAN_ORDERS, RAW_ORDERS } from '../../content/chapters/ch2'
import { T } from '../../content/map'
import { Badge, Node } from '../../components/diagram'
import { Fig, Txt } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { PipelineMap } from '../../components/PipelineMap'
import { RArrow, RLine, RPath, RRect } from '../../components/sketch'
import { at, type Q, type SceneBuild } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import { Block, DashTrace, DataTable, DocIcon, ellipsePts, rectPts, tw, type ColKey, type TCol } from './parts'

const F = ch2.figures

// 맵 노드 라벨은 map.ts에서 가져온다(Ch1 끝 상태)
const M1 = mapStateAt(T.ch1)
const NODE1 = Object.fromEntries(M1.nodes.map((n) => [n.id, n]))
const WARN_LABEL = M1.edges.find((e) => e.kind === 'warn')?.label ?? ''

/** q 줄임: data-el 이름으로 찾기 */
const pick = (q: Q) => (name: string) => q(`[data-el="${name}"]`)
const num = (el: Element, key: string) => Number((el as SVGElement).dataset[key] ?? 0)
/**
 * 초기 상태. 타임라인 0초의 set은 첫 스크롤 전(그리고 0초로 되감을 때) 그려지지 않으므로,
 * DOM에도 바로 적용해 장면 머리글이 보이는 동안에도 step 1 이전 그림이 되게 한다.
 */
const init = (tl: gsap.core.Timeline, targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 분석할 곳이 따로 없어요
// ─────────────────────────────────────────────────────────────
const NW = 130
const NH = 52
const DAYX = (k: number) => 28 + k * 78

function Hand({ x, y }: { x: number; y: number }) {
  return (
    <RPath
      d={`M ${x - 12} ${y + 16} L ${x - 12} ${y - 2} Q ${x - 12} ${y - 8} ${x - 7} ${y - 8} Q ${x - 3} ${y - 8} ${x - 3} ${y - 2} L ${x - 3} ${y - 12} Q ${x - 3} ${y - 17} ${x + 1} ${y - 17} Q ${x + 5} ${y - 17} ${x + 5} ${y - 12} L ${x + 5} ${y - 9} Q ${x + 5} ${y - 14} ${x + 9} ${y - 14} Q ${x + 13} ${y - 14} ${x + 13} ${y - 9} L ${x + 13} ${y + 10} Q ${x + 13} ${y + 20} ${x + 3} ${y + 20} L ${x - 6} ${y + 20} Q ${x - 12} ${y + 20} ${x - 12} ${y + 16} Z`}
      seed="hand"
      rough={0.35}
      fill="var(--surface)"
    />
  )
}

export function ProblemFig() {
  const n = NODE1
  return (
    <Fig>
      {/* step 1: Ch1 끝의 맵 */}
      <g data-el="m-top">
        <Node x={85} y={70} w={NW} h={NH} label={n.app.label} sub={n.app.sub} kind="source" seed="p-app" />
        <Node x={355} y={70} w={NW} h={NH} label={n.csv.label} sub={n.csv.sub} kind="doc" seed="p-csv" />
        <Node x={355} y={230} w={NW} h={NH} label={n.bi.label} sub={n.bi.sub} kind="serve" seed="p-bi" />
        <RArrow x1={152} y1={70} x2={286} y2={70} seed="p-e1" rough={0.5} />
        <RArrow x1={355} y1={98} x2={355} y2={202} seed="p-e2" rough={0.5} />
        <RArrow x1={85} y1={98} x2={85} y2={202} seed="p-e3" rough={0.5} />
      </g>
      <g data-el="warn">
        <g data-el="warn-line">
          <RArrow x1={152} y1={230} x2={286} y2={230} seed="p-warn" dash="8 6" stroke="var(--fail)" rough={0.5} />
          <Txt x={220} y={211} size={12.5} anchor="middle" color="var(--fail)">
            {WARN_LABEL}
          </Txt>
        </g>
        <Badge x={220} y={230} status="fail" r={11} el="warn-x" />
        <Txt x={220} y={266} size={13.5} weight={700} anchor="middle" color="var(--fail)" el="warn-l">
          {F.noDirect}
        </Txt>
      </g>
      <Node x={85} y={230} w={NW} h={NH} label={n.oltp.label} sub={n.oltp.sub} kind="store" seed="p-oltp" />

      {/* step 2: 분석만 하는 빈 상자 */}
      <DashTrace pts={rectPts(290, 196, 130, 68)} el="store-seg" width={1.9} />
      <Txt x={355} y={236} size={14.5} weight={750} anchor="middle" el="store-l">
        {F.storeQ}
      </Txt>
      <Txt x={220} y={242} size={30} weight={700} anchor="middle" muted el="q-mark">
        ?
      </Txt>
      <Txt x={85} y={292} size={13} anchor="middle" muted el="under">
        {F.forOrders}
      </Txt>
      <Txt x={355} y={292} size={13} anchor="middle" muted el="under">
        {F.forAnalysis}
      </Txt>

      {/* step 3: 손으로 옮기는 CSV, 빠지는 날 */}
      <g data-el="s3">
        <RArrow x1={152} y1={230} x2={180} y2={230} seed="p-h1" rough={0.4} />
        <Node x={220} y={230} w={74} h={46} label={n.csv.label} kind="doc" seed="p-csv2" scale={0.87} />
        <RArrow x1={259} y1={230} x2={287} y2={230} seed="p-h2" rough={0.4} />
        <Hand x={220} y={180} />
      </g>
      <g data-el="week">
        {F.days.map((d, k) => (
          <g key={d}>
            <RRect x={DAYX(k)} y={326} w={72} h={86} seed={`day${k}`} rough={0.4} dash={k === 2 ? '5 5' : undefined} />
            <Txt x={DAYX(k) + 36} y={350} size={15} weight={750} anchor="middle">
              {d}
            </Txt>
            {k === 2 ? (
              <Txt x={DAYX(k) + 36} y={390} size={13.5} weight={700} anchor="middle" el="forgot">
                {F.forgot}
              </Txt>
            ) : (
              <DocIcon x={DAYX(k) + 25} y={366} seed={`dc${k}`} el="day-csv" />
            )}
          </g>
        ))}
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const seg = o('store-seg')
  const icons = o('day-csv')
  init(tl, [...o('warn-x'), ...o('warn-l'), ...seg, ...o('store-l'), ...o('q-mark'), ...o('under'), ...o('s3'), ...o('week'), ...o('forgot')], { opacity: 0 })
  init(tl, icons, { opacity: 0, y: -14 })

  // step 1: 직접 조회하는 길이 막혔다
  tl.to(o('warn-x'), { opacity: 1, duration: 0.1 }, at(0) + 0.15)
  tl.to(o('warn-line'), { opacity: 0.3, duration: 0.3 }, at(0) + 0.25)
  tl.to(o('warn-l'), { opacity: 1, duration: 0.15 }, at(0) + 0.4)

  // step 2: 운영과 분석은 서로 다른 상자
  tl.to([...o('m-top'), ...o('warn')], { opacity: 0, duration: 0.18 }, at(1))
  tl.to(seg, { opacity: 1, duration: 0.02, stagger: 0.011 }, at(1) + 0.15)
  tl.to(o('store-l'), { opacity: 1, duration: 0.12 }, at(1) + 0.48)
  tl.to(o('q-mark'), { opacity: 1, duration: 0.12 }, at(1) + 0.52)
  tl.to(o('under'), { opacity: 1, duration: 0.12, stagger: 0.06 }, at(1) + 0.56)

  // step 3: 손으로 옮기면 빠지는 날이 생긴다
  tl.to(o('q-mark'), { opacity: 0, duration: 0.1 }, at(2))
  tl.to(o('s3'), { opacity: 1, duration: 0.15 }, at(2) + 0.06)
  tl.to(o('week'), { opacity: 1, duration: 0.1 }, at(2) + 0.18)
  const order = [0.3, 0.4, 0.6, 0.7] // 월 화 (수 건너뜀) 목 금
  icons.forEach((el, k) => tl.to(el, { opacity: 1, y: 0, duration: 0.08 }, at(2) + order[k]))
  tl.to(o('forgot'), { opacity: 1, duration: 0.08 }, at(2) + 0.5)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 그대로 복사했더니
// ─────────────────────────────────────────────────────────────
function aLayout(mobile: boolean) {
  const size = mobile ? 14.5 : 12
  const rowH = mobile ? 26 : 24
  // 모바일은 세 열만(주문번호·가격·배송지). step 3에서만 배송지 자리에 주문일을 겹쳐 보인다.
  const cols: TCol[] = mobile
    ? [
        { key: 'id', x: 20, w: 74 },
        { key: 'price', x: 94, w: 92 },
        { key: 'addr', x: 186, w: 128 },
        { key: 'date', x: 186, w: 128, overlay: true },
      ]
    : [
        { key: 'id', x: 10, w: 60 },
        { key: 'date', x: 70, w: 88 },
        { key: 'product', x: 158, w: 64 },
        { key: 'price', x: 222, w: 64 },
        { key: 'addr', x: 286, w: 96 },
      ]
  const left = cols[0].x
  const right = mobile ? 314 : 382
  const tableH = rowH * 7
  const Ay = 34
  const By = Ay + tableH + 66
  const B2 = 116
  return { size, rowH, cols, left, right, tableH, Ay, By, B2, mid: Math.round((left + right) / 2), below: B2 + tableH + 30 }
}
type L3 = ReturnType<typeof aLayout>
const colOf = (L: L3, k: ColKey) => L.cols.find((c) => c.key === k)!
/** 표 y에서 i번째 데이터 행의 위쪽 */
const rowTop = (L: L3, y: number, i: number) => y + L.rowH * (i + 1)
const rowBase = (L: L3, y: number, i: number) => rowTop(L, y, i) + L.rowH * 0.68

const DATE_KEYS = ['2026-06-09', '06/09/2026', '2026.6.9']
const BAR_X = [90, 220, 350]
const BAR_BASE = 444
const BAR_U = 28
const barOf = (i: number) => DATE_KEYS.indexOf(RAW_ORDERS[i].date)
const slotOf = (i: number) => RAW_ORDERS.slice(0, i).filter((_, k) => barOf(k) === barOf(i)).length
const isNumber = (s: string) => /^\d+$/.test(s)
const REVENUE_AT: [number, number] = [96, 70]

export function AttemptFig() {
  const { mobile } = useEnv()
  const L = aLayout(mobile)
  const price = colOf(L, 'price')
  const date = colOf(L, 'date')
  const addr = colOf(L, 'addr')
  const rx = L.right - 172
  const regTop = L.below + 10
  const blankRow = RAW_ORDERS.findIndex((r) => !r.addr)
  const cellMid = rowTop(L, L.B2, blankRow) + L.rowH / 2
  const regMid = regTop + 26 * 4 + 13
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-2" className="col-start-1 row-start-1">
            {F.dupNote}
          </span>
          <span data-el="cap-3" className="col-start-1 row-start-1">
            {F.sumNote}
          </span>
        </span>
      }
    >
      {/* step 1: 원본 → 복사본 */}
      <g data-el="tA">
        <Txt x={L.left} y={L.Ay - 9} size={13.5} weight={750}>
          {F.srcTable}
        </Txt>
        <DataTable y={L.Ay} cols={L.cols} rows={RAW_ORDERS} labels={F.cols} el="a" rowH={L.rowH} size={L.size} seed="tA" />
        <RArrow x1={L.mid} y1={L.Ay + L.tableH + 8} x2={L.mid} y2={L.By - 26} seed="copy-arrow" rough={0.5} />
        <Txt x={L.mid + 14} y={(L.Ay + L.tableH + L.By) / 2 - 4} size={13.5} weight={700}>
          {F.copyArrow}
        </Txt>
      </g>
      <g data-el="tB">
        <Txt x={L.left} y={L.By - 9} size={13.5} weight={750}>
          {F.copyTable}
        </Txt>
        <DataTable y={L.By} cols={L.cols} rows={RAW_ORDERS} labels={F.cols} el="b" rowH={L.rowH} size={L.size} seed="tB" />
      </g>
      {RAW_ORDERS.map((_, i) => (
        <circle key={i} data-el="cp" cx={L.mid} cy={rowTop(L, L.Ay, i) + L.rowH / 2} r={5.5} style={{ fill: 'var(--accent)' }} />
      ))}

      {/* 리포트 카드 */}
      <g data-el="rcard">
        <RRect x={10} y={8} w={420} h={84} seed="a-card" rough={0.45} fill="var(--surface)" />
      </g>
      <g data-el="r1">
        <Txt x={24} y={40} size={15.5} weight={750}>
          {F.orders(6)}
        </Txt>
        <Badge x={222} y={35} status="fail" r={10} el="r1-x" />
        <Txt x={240} y={40} size={14} weight={600} el="r1-real">
          {F.realOrders}
        </Txt>
      </g>
      <g data-el="r2">
        <Txt x={24} y={74} size={15.5} weight={750}>
          {F.revenueWrong}
        </Txt>
        <Badge x={222} y={69} status="fail" r={10} />
        <Txt x={240} y={74} size={14} weight={600}>
          {F.realRevenue}
        </Txt>
      </g>

      {/* step 2: 2042번 두 줄 */}
      <g data-el="dup">
        <rect x={L.left - 3} y={rowTop(L, L.B2, 1) - 1} width={L.right - L.left + 6} height={L.rowH * 2 + 2} rx={4} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={2.4} />
        <path d={`M ${L.right + 5} ${rowTop(L, L.B2, 1) + 2} L ${L.right + 10} ${rowTop(L, L.B2, 1) + 2} L ${L.right + 10} ${rowTop(L, L.B2, 3) - 2} L ${L.right + 5} ${rowTop(L, L.B2, 3) - 2}`} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={1.8} />
        <Txt x={L.right + 14} y={rowTop(L, L.B2, 2) + 5} size={13.5} weight={750}>
          {F.dup}
        </Txt>
      </g>

      {/* step 3: 글자 섞인 가격, 제각각인 날짜 */}
      {RAW_ORDERS.map((r, i) =>
        isNumber(r.price) ? (
          <text
            key={i}
            data-el="fly"
            data-dx={REVENUE_AT[0] - (price.x + 8)}
            data-dy={REVENUE_AT[1] - rowBase(L, L.B2, i)}
            x={price.x + 8}
            y={rowBase(L, L.B2, i)}
            style={{ fontSize: L.size, fontWeight: 700, fill: 'var(--accent)' }}
          >
            {r.price}
          </text>
        ) : (
          <g key={i}>
            <line data-el="ul" x1={price.x + 7} y1={rowBase(L, L.B2, i) + 4} x2={price.x + 9 + tw(r.price, L.size)} y2={rowBase(L, L.B2, i) + 4} style={{ stroke: 'var(--fail)' }} strokeWidth={2.2} />
            <Txt x={L.right + 10} y={rowBase(L, L.B2, i)} size={12.5} weight={750} color="var(--fail)" el="tag">
              {F.textTag}
            </Txt>
          </g>
        ),
      )}
      <g data-el="bars">
        <Txt x={L.left} y={L.below} size={13.5} weight={750}>
          {F.byDate}
        </Txt>
        <line x1={30} y1={BAR_BASE} x2={410} y2={BAR_BASE} style={{ stroke: 'var(--line)' }} strokeWidth={1.5} />
        {RAW_ORDERS.map((_, i) => (
          <rect key={i} data-el="unit" x={BAR_X[barOf(i)] - 35} y={BAR_BASE - (slotOf(i) + 1) * BAR_U + 2} width={70} height={BAR_U - 3} rx={2} style={{ fill: 'var(--accent)' }} />
        ))}
        {DATE_KEYS.map((d, b) => {
          const n = RAW_ORDERS.filter((r) => r.date === d).length
          return (
            <g key={d}>
              <Txt x={BAR_X[b]} y={BAR_BASE - n * BAR_U - 8} size={13} weight={700} anchor="middle" el="bcount">
                {F.count(n)}
              </Txt>
              <Txt x={BAR_X[b]} y={BAR_BASE + 19} size={12.5} anchor="middle" mono>
                {d}
              </Txt>
            </g>
          )
        })}
      </g>
      {RAW_ORDERS.map((_, i) => {
        const sx = date.x + 40
        const sy = rowTop(L, L.B2, i) + L.rowH / 2
        return (
          <circle
            key={i}
            data-el="dpart"
            data-dx={BAR_X[barOf(i)] - sx}
            data-dy={BAR_BASE - (slotOf(i) + 0.5) * BAR_U - sy}
            cx={sx}
            cy={sy}
            r={5.5}
            style={{ fill: 'var(--accent)' }}
          />
        )
      })}

      {/* step 4: 빈 배송지 → 정체불명 줄 */}
      <DashTrace pts={rectPts(addr.x + 3, rowTop(L, L.B2, blankRow) + 3, addr.w - 6, L.rowH - 6)} el="empty" color="var(--fail)" width={2} dash={6} gap={4} />
      <g data-el="conn">
        <RPath d={`M ${L.right + 2} ${cellMid} L ${L.right + 16} ${cellMid} L ${L.right + 16} ${regMid} L ${rx + 166} ${regMid}`} seed="conn" rough={0.3} stroke="var(--fail)" strokeWidth={2} />
      </g>
      <g data-el="conn-head">
        <path d={`M ${rx + 174} ${regMid - 5} L ${rx + 166} ${regMid} L ${rx + 174} ${regMid + 5}`} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={2} strokeLinecap="round" />
      </g>
      <g data-el="region">
        <Txt x={rx} y={L.below} size={13.5} weight={750}>
          {F.byRegion}
        </Txt>
        <rect x={rx} y={regTop} width={162} height={130} style={{ fill: 'var(--surface)' }} />
        <rect x={rx} y={regTop + 104} width={162} height={26} style={{ fill: 'var(--fail)', opacity: 0.12 }} />
        <RRect x={rx} y={regTop} w={162} h={130} seed="region" rough={0.4} />
        {F.regions.map(([name, n], k) => (
          <g key={name}>
            {k > 0 && <RLine x1={rx} y1={regTop + 26 * k} x2={rx + 162} y2={regTop + 26 * k} seed={`reg${k}`} rough={0.3} strokeWidth={0.9} />}
            <Txt x={rx + 12} y={regTop + 26 * k + 18} size={13.5}>
              {name}
            </Txt>
            <Txt x={rx + 112} y={regTop + 26 * k + 18} size={13.5} anchor="end" mono>
              {n}
            </Txt>
          </g>
        ))}
      </g>
      <g data-el="reg-x">
        <Badge x={rx + 138} y={regTop + 117} status="fail" r={9} />
      </g>
      <g data-el="juni">
        <g transform="translate(14 372) scale(0.85)">
          <JuniFace mood="panic" seed="a-juni" />
        </g>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl, { mobile }) => {
  const L = aLayout(mobile)
  const o = pick(q)
  const rows6 = RAW_ORDERS.map((_, i) => i)
  const colEls = (t: 'a' | 'b', k: ColKey) => [...o(`${t}-h-${k}`), ...rows6.flatMap((i) => o(`${t}-c${i}-${k}`))]
  const later = ['rcard', 'r1', 'r1-x', 'r1-real', 'r2', 'dup', 'cap-2', 'cap-3', 'fly', 'ul', 'tag', 'bars', 'dpart', 'empty', 'conn-head', 'region', 'reg-x', 'juni']
  init(tl, later.flatMap(o), { opacity: 0 })
  if (mobile) init(tl, [...colEls('a', 'date'), ...colEls('b', 'date')], { opacity: 0 })
  const connPaths = q('[data-el="conn"] path')
  init(tl, connPaths, { drawSVG: '0%' })

  // step 1: 행이 입자가 되어 그대로 옮겨진다
  const rowsB = rows6.map((i) => o(`b-r${i}`)[0])
  init(tl, rowsB, { opacity: 0 })
  o('cp').forEach((p, i) => {
    init(tl, p, { opacity: 0 })
    const t = at(0) + 0.1 + i * 0.085
    tl.to(p, { opacity: 1, duration: 0.03 }, t)
    tl.to(p, { y: L.By - L.Ay, duration: 0.2, ease: 'power1.inOut' }, t + 0.02)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.22)
    tl.to(rowsB[i], { opacity: 1, duration: 0.05 }, t + 0.2)
  })

  // step 2: 같은 주문번호 두 줄 → 6건
  tl.to(o('tA'), { opacity: 0, duration: 0.15 }, at(1))
  tl.to(o('tB'), { y: L.B2 - L.By, duration: 0.3, ease: 'power2.inOut' }, at(1) + 0.1)
  tl.to([...o('rcard'), ...o('r1')], { opacity: 1, duration: 0.12 }, at(1) + 0.3)
  tl.to(o('dup'), { opacity: 1, duration: 0.12 }, at(1) + 0.45)
  tl.to([...o('r1-x'), ...o('r1-real')], { opacity: 1, duration: 0.1 }, at(1) + 0.6)
  tl.to(o('cap-2'), { opacity: 1, duration: 0.12 }, at(1) + 0.62)

  // step 3: 값의 형식이 다르면 계산이 어긋난다
  tl.to([...o('dup'), ...o('cap-2')], { opacity: 0, duration: 0.12 }, at(2))
  tl.to(o('cap-3'), { opacity: 1, duration: 0.12 }, at(2) + 0.1)
  if (mobile) {
    tl.to(colEls('b', 'addr'), { opacity: 0, duration: 0.1 }, at(2))
    tl.to(colEls('b', 'date'), { opacity: 1, duration: 0.1 }, at(2) + 0.06)
  }
  tl.to(o('b-hl-price'), { opacity: 0.14, duration: 0.1 }, at(2) + 0.04)
  const fly = o('fly')
  const ul = o('ul')
  const tag = o('tag')
  let nf = 0
  let nt = 0
  rows6.forEach((i) => {
    const t = at(2) + 0.1 + i * 0.045
    if (isNumber(RAW_ORDERS[i].price)) {
      const el = fly[nf++]
      tl.to(el, { opacity: 1, duration: 0.02 }, t)
      tl.to(el, { x: num(el, 'dx'), y: num(el, 'dy'), duration: 0.14, ease: 'power2.in' }, t + 0.02)
      tl.to(el, { opacity: 0, duration: 0.03 }, t + 0.15)
    } else {
      tl.to([ul[nt], tag[nt]], { opacity: 1, duration: 0.05 }, t)
      nt++
    }
  })
  tl.to(o('r2'), { opacity: 1, duration: 0.1 }, at(2) + 0.42)
  tl.to(o('bars'), { opacity: 1, duration: 0.1 }, at(2) + 0.45)
  const units = o('unit')
  init(tl, [...units, ...o('bcount')], { opacity: 0 })
  o('dpart').forEach((p, i) => {
    const t = at(2) + 0.5 + i * 0.03
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.13, ease: 'power2.in' }, t + 0.02)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.15)
    tl.to(units[i], { opacity: 1, duration: 0.03 }, t + 0.14)
  })
  tl.to(o('bcount'), { opacity: 1, duration: 0.06 }, at(2) + 0.72)

  // step 4: 빈 값이 '정체불명' 줄로 남는다
  tl.to([...o('b-hl-price'), ...ul, ...tag, ...o('bars'), ...o('cap-3')], { opacity: 0, duration: 0.12 }, at(3))
  if (mobile) {
    tl.to(colEls('b', 'date'), { opacity: 0, duration: 0.1 }, at(3))
    tl.to(colEls('b', 'addr'), { opacity: 1, duration: 0.1 }, at(3) + 0.06)
  }
  tl.to(o('empty'), { opacity: 1, duration: 0.02, stagger: 0.012 }, at(3) + 0.15)
  tl.to(o('region'), { opacity: 1, duration: 0.12 }, at(3) + 0.32)
  tl.to(connPaths, { drawSVG: '100%', duration: 0.2, ease: 'none' }, at(3) + 0.42)
  tl.to(o('conn-head'), { opacity: 1, duration: 0.04 }, at(3) + 0.6)
  tl.to(o('reg-x'), { opacity: 1, duration: 0.1 }, at(3) + 0.62)
  tl.to(o('juni'), { opacity: 1, duration: 0.12 }, at(3) + 0.66)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 비유: 택배 물류센터 → ETL과 정제
// ─────────────────────────────────────────────────────────────
const STX = [132, 220, 308]
const SW = 76
const STEP1_DY = 130
const ROW = { x: 36, w: 368, h: 22, y0: 198, gap: 26 }
const rowY = (i: number) => ROW.y0 + ROW.gap * i
const FX = { id: 48, date: 98, priceRaw: 206, priceEnd: 264, addr: 280 }
const CLEAN_OF = [0, 1, 1, 2, 3, 4] // 원본 행 → 정리본 행
const CELL_X = [8, 152, 296]
const B4 = { cx: [300, 348, 396], base: 452, u: 20, w: 30 }
const MERGED_SLOT = [0, 3, -1, 4, 1, 2] // 합쳐진 막대에서의 자리(-1 = 중복이라 사라짐)
const bar4 = (i: number) => barOf(i)

function Station({ i, label, sub, el }: { i: number; label: string; sub?: string; el: string }) {
  return (
    <g data-el={el}>
      <Txt x={STX[i]} y={sub ? 64 : 62} size={sub ? 15 : 14} weight={750} anchor="middle">
        {label}
      </Txt>
      {sub && (
        <Txt x={STX[i]} y={83} size={11.5} anchor="middle" muted>
          {sub}
        </Txt>
      )}
    </g>
  )
}

export function AnalogyFig() {
  return (
    <Fig caption={F.transformNote}>
      {/* 컨베이어 띠: step 1에서는 화면 가운데, step 2부터 위로 */}
      <g data-el="band">
        <RLine x1={6} y1={100} x2={434} y2={100} seed="belt-a" rough={0.5} />
        <RLine x1={6} y1={112} x2={434} y2={112} seed="belt-b" rough={0.5} />
        {Array.from({ length: 13 }, (_, k) => (
          <circle key={k} cx={20 + k * 33.3} cy={106} r={2.6} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.2} />
        ))}
        {STX.map((x, i) => (
          <g key={x}>
            <RRect x={x - SW / 2} y={40} w={SW} h={60} seed={`st${i}`} rough={0.5} />
            {F.boxStations[i] && <Station i={i} label={F.boxStations[i]} el="lbl-box" />}
            <Station i={i} label={F.etlStations[i][0]} sub={F.etlStations[i][1]} el="lbl-etl" />
          </g>
        ))}
        <g data-el="hl-t">
          <rect x={STX[1] - SW / 2 - 3} y={37} width={SW + 6} height={66} rx={5} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
        </g>
        <g data-el="hl-l">
          <rect x={STX[2] - SW / 2 - 3} y={37} width={SW + 6} height={66} rx={5} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
        </g>
        {/* step 1: 상자들과 트럭 */}
        <g data-el="ends-box">
          <Block x={8} y={70} w={22} h={30} seed="cb1" amp={4} fill="var(--surface)" stroke="currentColor" />
          <Block x={34} y={60} w={30} h={40} seed="cb2" amp={5} fill="var(--surface)" stroke="currentColor" />
          <Block x={68} y={78} w={18} h={22} seed="cb3" amp={3.5} fill="var(--surface)" stroke="currentColor" />
          {[356, 380, 404].map((x) => (
            <g key={x}>
              <Block x={x} y={78} w={22} h={22} fill="var(--surface)" stroke="currentColor" />
              <line x1={x + 6} y1={84} x2={x + 16} y2={84} style={{ stroke: 'var(--line)' }} strokeWidth={1.2} />
            </g>
          ))}
          <RRect x={362} y={124} w={46} h={28} seed="truck" rough={0.45} fill="var(--surface)" />
          <RPath d="M 408 132 L 424 132 L 432 142 L 432 152 L 408 152 Z" seed="cab" rough={0.45} fill="var(--surface)" />
          <circle cx={376} cy={156} r={5} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} />
          <circle cx={420} cy={156} r={5} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} />
        </g>
        <Block x={16} y={76} w={24} h={24} seed="mbox" amp={4} el="mbox" fill="var(--surface)" stroke="currentColor" />
        {/* step 2: 양 끝 = 운영 DB, 분석용 저장소 */}
        <g data-el="ends-etl">
          <Node x={46} y={72} w={76} h={52} label={F.source[0]} sub={F.source[1]} kind="store" seed="a-src" scale={0.85} />
          <Node x={394} y={72} w={76} h={52} label={F.store[0]} sub={F.store[1]} kind="store" seed="a-dst" scale={0.85} />
        </g>
        <g data-el="dst-ring">
          <rect x={352} y={40} width={84} height={64} rx={8} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
        </g>
        {/* 주니의 복사: 변환을 건너뛰는 우회선 */}
        <DashTrace
          pts={Array.from({ length: 25 }, (_, k) => {
            const t = k / 24
            const x = (1 - t) ** 3 * 170 + 3 * (1 - t) ** 2 * t * 182 + 3 * (1 - t) * t ** 2 * 258 + t ** 3 * 270
            const y = (1 - t) ** 3 * 42 + 3 * (1 - t) ** 2 * t * 12 + 3 * (1 - t) * t ** 2 * 12 + t ** 3 * 42
            return [x, y] as [number, number]
          })}
          el="bypass-seg"
          color="var(--muted)"
          width={2}
        />
        <g data-el="bypass-l">
          <path d="M 263 33 L 270 42 L 274 31" style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={2} strokeLinecap="round" />
          <Txt x={220} y={12} size={12.5} weight={700} anchor="middle" muted>
            {F.bypass}
          </Txt>
        </g>
      </g>

      {/* 데이터 영역 */}
      <g data-el="feed">
        <RArrow x1={46} y1={118} x2={46} y2={176} seed="feed" rough={0.4} />
      </g>
      <g data-el="zoom">
        <path d={`M ${STX[1] - SW / 2} 114 L 8 134 M ${STX[1] + SW / 2} 114 L 432 134`} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.2} strokeDasharray="4 4" />
        {F.cells.map((c, k) => (
          <g key={c}>
            <rect data-el="cell-hl" x={CELL_X[k]} y={136} width={136} height={34} rx={4} style={{ fill: 'var(--accent)', opacity: 0 }} />
            <RRect x={CELL_X[k]} y={136} w={136} h={34} seed={`cell${k}`} rough={0.4} />
            <Txt x={CELL_X[k] + 68} y={158} size={14} weight={750} anchor="middle">
              {c}
            </Txt>
          </g>
        ))}
      </g>
      <g data-el="store4">
        <RRect x={8} y={140} w={424} h={184} seed="store4" rough={0.45} />
        <Txt x={20} y={161} size={13.5} weight={750}>
          {F.cleanTable}
        </Txt>
      </g>
      <g data-el="hdr">
        <Txt x={FX.id} y={190} size={11.5} weight={700} muted>
          {F.cols.id}
        </Txt>
        <Txt x={FX.date} y={190} size={11.5} weight={700} muted>
          {F.cols.date}
        </Txt>
        <Txt x={FX.priceEnd} y={190} size={11.5} weight={700} muted anchor="end">
          {F.cols.price}
        </Txt>
        <Txt x={FX.addr} y={190} size={11.5} weight={700} muted>
          {F.cols.addr}
        </Txt>
      </g>
      {RAW_ORDERS.map((r, i) => {
        const c = CLEAN_ORDERS[CLEAN_OF[i]]
        const y = rowY(i) + 15.5
        return (
          <g key={i} data-el="row">
            <Block x={ROW.x} y={rowY(i)} w={ROW.w} h={ROW.h} seed={`row${i}`} amp={2.6} el="row-box" fill="var(--surface)" stroke="currentColor" />
            <Txt x={FX.id} y={y} size={13} mono weight={600}>
              {r.id}
            </Txt>
            {r.date === c.date ? (
              <Txt x={FX.date} y={y} size={13} mono>
                {r.date}
              </Txt>
            ) : (
              <>
                <Txt x={FX.date} y={y} size={13} mono el="raw">
                  {r.date}
                </Txt>
                <Txt x={FX.date} y={y} size={13} mono el="clean">
                  {c.date}
                </Txt>
              </>
            )}
            <Txt x={FX.priceRaw} y={y} size={13} mono el="raw">
              {r.price}
            </Txt>
            <Txt x={FX.priceEnd} y={y} size={13} mono anchor="end" el="clean">
              {c.price}
            </Txt>
            {r.addr ? (
              <Txt x={FX.addr} y={y} size={13}>
                {r.addr}
              </Txt>
            ) : (
              <>
                <rect data-el="blank" x={FX.addr} y={rowY(i) + 5} width={64} height={12} rx={2} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeDasharray="3 3" />
                <g data-el="miss-tag">
                  <rect x={FX.addr - 4} y={rowY(i) + 3} width={56} height={17} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--accent)' }} strokeWidth={1.8} />
                  <Txt x={FX.addr + 24} y={y - 0.5} size={12.5} weight={750} anchor="middle">
                    {c.addr}
                  </Txt>
                </g>
              </>
            )}
          </g>
        )
      })}

      {/* step 4: 다시 계산한 리포트 */}
      <g data-el="report">
        <RRect x={8} y={334} w={244} h={136} seed="rep4" rough={0.45} fill="var(--surface)" />
        <Txt x={22} y={358} size={13} weight={700} muted>
          {F.report}
        </Txt>
        <Txt x={22} y={390} size={15} weight={750} el="r1-bad">
          {F.orders(6)}
        </Txt>
        <Txt x={22} y={390} size={15} weight={750} el="r1-ok">
          {F.orders(5)}
        </Txt>
        <Badge x={230} y={385} status="fail" r={10} el="r1-x" />
        <Badge x={230} y={385} status="ok" r={10} el="r1-v" />
        <Txt x={22} y={422} size={15} weight={750} el="r2-bad">
          {F.revenueWrong}
        </Txt>
        <Txt x={22} y={422} size={15} weight={750} el="r2-ok">
          {F.revenueRight}
        </Txt>
        <Badge x={230} y={417} status="fail" r={10} el="r2-x" />
        <Badge x={230} y={417} status="ok" r={10} el="r2-v" />
        <Txt x={22} y={454} size={14} weight={600} el="r3">
          {F.missingCount}
        </Txt>
      </g>
      <g data-el="bars4">
        <line x1={268} y1={B4.base} x2={430} y2={B4.base} style={{ stroke: 'var(--line)' }} strokeWidth={1.5} />
        {RAW_ORDERS.map((_, i) => {
          const s = MERGED_SLOT[i]
          const x0 = B4.cx[bar4(i)] - B4.w / 2
          const y0 = B4.base - (slotOf(i) + 1) * B4.u + 1
          const x1 = B4.cx[1] - B4.w / 2
          const y1 = B4.base - (Math.max(s, 0) + 1) * B4.u + 1
          return <rect key={i} data-el="u4" data-dx={x1 - x0} data-dy={y1 - y0} data-dup={s < 0 ? 1 : 0} x={x0} y={y0} width={B4.w} height={B4.u - 2} rx={2} style={{ fill: 'var(--accent)' }} />
        })}
        {DATE_KEYS.map((d, b) => {
          const n = RAW_ORDERS.filter((r) => r.date === d).length
          return (
            <Txt key={d} x={B4.cx[b]} y={B4.base - n * B4.u - 6} size={12.5} weight={700} anchor="middle" el="c4-before">
              {F.count(n)}
            </Txt>
          )
        })}
        <g data-el="c4-after">
          <Txt x={B4.cx[1]} y={B4.base - 5 * B4.u - 6} size={13.5} weight={750} anchor="middle">
            {F.count(5)}
          </Txt>
          <Txt x={B4.cx[1]} y={B4.base + 16} size={12.5} weight={700} anchor="middle">
            {F.oneDay}
          </Txt>
        </g>
      </g>
    </Fig>
  )
}

export const buildAnalogy: SceneBuild = (q, tl) => {
  const o = pick(q)
  const rows = o('row')
  const boxes = o('row-box')
  init(tl, o('band'), { y: STEP1_DY })
  const later = ['lbl-etl', 'ends-etl', 'hl-t', 'hl-l', 'dst-ring', 'bypass-seg', 'bypass-l', 'feed', 'hdr', 'row', 'caption', 'zoom', 'store4', 'report', 'bars4', 'clean', 'miss-tag']
  init(tl, later.flatMap(o), { opacity: 0 })

  // step 1: 상자 하나가 세 스테이션을 지나며 반듯해진다
  const mb = o('mbox')[0]
  tl.to(mb, { x: STX[0] - 28, duration: 0.15, ease: 'power1.inOut' }, at(0) + 0.04)
  tl.to(mb, { x: STX[1] - 28, duration: 0.15, ease: 'power1.inOut' }, at(0) + 0.22)
  tl.to(mb, { attr: { points: (mb as SVGElement).dataset.neat ?? '' }, duration: 0.12 }, at(0) + 0.38)
  tl.to(mb, { x: STX[2] - 28, duration: 0.15, ease: 'power1.inOut' }, at(0) + 0.52)
  tl.to(mb, { x: 312, duration: 0.1, ease: 'power1.out' }, at(0) + 0.69)

  // step 2: 라벨이 ETL로, 원본 6행이 벨트 앞에, 주니의 복사는 변환을 건너뛴다
  tl.to(o('band'), { y: 0, duration: 0.3, ease: 'power2.inOut' }, at(1))
  tl.to([...o('lbl-box'), ...o('ends-box'), mb], { opacity: 0, duration: 0.15 }, at(1))
  tl.to(o('lbl-etl'), { opacity: 1, duration: 0.15 }, at(1) + 0.12)
  tl.to(o('ends-etl'), { opacity: 1, duration: 0.15 }, at(1) + 0.18)
  tl.to(o('feed'), { opacity: 1, duration: 0.1 }, at(1) + 0.3)
  tl.to(o('hdr'), { opacity: 1, duration: 0.1 }, at(1) + 0.32)
  tl.to(rows, { opacity: 1, duration: 0.06, stagger: 0.03 }, at(1) + 0.34)
  tl.to(o('hl-t'), { opacity: 1, duration: 0.1 }, at(1) + 0.46)
  tl.to(o('bypass-seg'), { opacity: 1, duration: 0.02, stagger: 0.012 }, at(1) + 0.52)
  tl.to(o('bypass-l'), { opacity: 1, duration: 0.1 }, at(1) + 0.68)
  tl.to(o('caption'), { opacity: 1, duration: 0.1 }, at(1) + 0.7)

  // step 3: 변환 안의 세 칸을 차례로 — 중복 제거 → 결측치 처리 → 형식 통일
  const cells = o('cell-hl')
  tl.to([...o('bypass-seg'), ...o('bypass-l'), ...o('feed'), ...o('caption')], { opacity: 0, duration: 0.1 }, at(2))
  tl.to(o('zoom'), { opacity: 1, duration: 0.12 }, at(2))
  tl.to(cells[0], { opacity: 0.22, duration: 0.05 }, at(2) + 0.12)
  tl.to(rows[2], { y: -ROW.gap, opacity: 0, duration: 0.14, ease: 'power2.in' }, at(2) + 0.16)
  tl.to([rows[3], rows[4], rows[5]], { y: -ROW.gap, duration: 0.14 }, at(2) + 0.22)
  tl.to(cells[0], { opacity: 0.08, duration: 0.05 }, at(2) + 0.36)
  tl.to(cells[1], { opacity: 0.22, duration: 0.05 }, at(2) + 0.37)
  tl.to(o('blank'), { opacity: 0, duration: 0.06 }, at(2) + 0.41)
  tl.to(o('miss-tag'), { opacity: 1, duration: 0.08 }, at(2) + 0.42)
  tl.to(cells[1], { opacity: 0.08, duration: 0.05 }, at(2) + 0.52)
  tl.to(cells[2], { opacity: 0.22, duration: 0.05 }, at(2) + 0.53)
  tl.to(o('raw'), { opacity: 0, duration: 0.08 }, at(2) + 0.57)
  tl.to(o('clean'), { opacity: 1, duration: 0.08 }, at(2) + 0.6)
  boxes.forEach((b) => tl.to(b, { attr: { points: (b as SVGElement).dataset.neat ?? '' }, duration: 0.14 }, at(2) + 0.58))
  tl.to(cells[2], { opacity: 0.08, duration: 0.05 }, at(2) + 0.74)

  // step 4: 적재 → 저장소 표, 리포트가 맞아진다
  tl.to(o('zoom'), { opacity: 0, duration: 0.1 }, at(3))
  tl.to(o('hl-t'), { opacity: 0, duration: 0.1 }, at(3))
  tl.to(o('hl-l'), { opacity: 1, duration: 0.1 }, at(3) + 0.05)
  tl.to(o('store4'), { opacity: 1, duration: 0.12 }, at(3) + 0.1)
  tl.to(o('hdr'), { y: -10, duration: 0.12 }, at(3) + 0.12)
  ;[0, 1, 3, 4, 5].forEach((i, k) => tl.to(rows[i], { y: (i >= 3 ? -ROW.gap : 0) - 10, duration: 0.1 }, at(3) + 0.14 + k * 0.05))
  tl.to(o('dst-ring'), { opacity: 1, duration: 0.1 }, at(3) + 0.4)
  init(tl, [...o('r1-ok'), ...o('r1-v'), ...o('r2-ok'), ...o('r2-v'), ...o('r3'), ...o('c4-after')], { opacity: 0 })
  tl.to([...o('report'), ...o('bars4')], { opacity: 1, duration: 0.1 }, at(3) + 0.42)
  // 숫자는 카운트업 없이 한 번에 바뀐다
  tl.to([...o('r1-bad'), ...o('r1-x'), ...o('r2-bad'), ...o('r2-x'), ...o('c4-before')], { opacity: 0, duration: 0.04 }, at(3) + 0.6)
  tl.to([...o('r1-ok'), ...o('r1-v'), ...o('r2-ok'), ...o('r2-v'), ...o('r3')], { opacity: 1, duration: 0.04 }, at(3) + 0.62)
  o('u4').forEach((u) => {
    if (num(u, 'dup')) tl.to(u, { opacity: 0, duration: 0.08 }, at(3) + 0.6)
    else tl.to(u, { x: num(u, 'dx'), y: num(u, 'dy'), duration: 0.14, ease: 'power2.inOut' }, at(3) + 0.6)
  })
  tl.to(o('c4-after'), { opacity: 1, duration: 0.06 }, at(3) + 0.74)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 정의: ETL과 ELT는 순서의 선택
// ─────────────────────────────────────────────────────────────
const LX = [40, 108, 176]
const LSW = 58
const STORE_X = 222
const NARROW = 140
const WIDE = 210
const ELT_BASE = 250
const ELT_T = { x: 262, y: 87 } // 저장소 안 변환의 중심(base 기준)
const chipX = (k: number, gap: number, x0: number) => x0 + k * gap

function LineStation({ cx, base, label, seed }: { cx: number; base: number; label: string; seed: string }) {
  return (
    <g>
      <rect x={cx - LSW / 2} y={base + 40} width={LSW} height={46} style={{ fill: 'var(--surface)' }} />
      <RRect x={cx - LSW / 2} y={base + 40} w={LSW} h={46} seed={seed} rough={0.45} />
      <Txt x={cx} y={base + 68} size={15} weight={750} anchor="middle">
        {label}
      </Txt>
    </g>
  )
}

function Belt({ base, seed }: { base: number; seed: string }) {
  return (
    <g>
      <RLine x1={8} y1={base + 86} x2={208} y2={base + 86} seed={`${seed}a`} rough={0.4} />
      <RLine x1={8} y1={base + 96} x2={208} y2={base + 96} seed={`${seed}b`} rough={0.4} />
      <RArrow x1={204} y1={base + 91} x2={STORE_X - 3} y2={base + 91} seed={`${seed}c`} rough={0.4} head={7} />
    </g>
  )
}

function SubTable({ x, y, name, tag, el }: { x: number; y: number; name: string; tag?: string; el?: string }) {
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={126} h={56} seed={`sub${name}${y}`} rough={0.35} />
      <Txt x={x + 8} y={y + 18} size={12.5} weight={700} mono>
        {name}
      </Txt>
      {tag && (
        <g>
          <rect x={x + 74} y={y + 6} width={46} height={17} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--muted)' }} strokeWidth={1.2} />
          <Txt x={x + 97} y={y + 18.5} size={11.5} weight={700} anchor="middle">
            {tag}
          </Txt>
        </g>
      )}
    </g>
  )
}

export function DefinitionFig() {
  const t = F.etlStations
  const eltCleanY = 154
  return (
    <Fig>
      {/* 위 줄: ETL */}
      <g data-el="etl">
        <Txt x={8} y={38} size={17} weight={800}>
          {ch2.interaction.modes.etl}
        </Txt>
        <Belt base={20} seed="eb" />
        <LineStation cx={LX[0]} base={20} label={t[0][0]} seed="e0" />
        <LineStation cx={LX[1]} base={20} label={t[1][0]} seed="e1" />
        <LineStation cx={LX[2]} base={20} label={t[2][0]} seed="e2" />
        <RRect x={STORE_X} y={50} w={NARROW} h={156} seed="estore" rough={0.45} />
        <Txt x={STORE_X + 10} y={70} size={13} weight={750}>
          {F.storeName}
        </Txt>
        <SubTable x={STORE_X + 8} y={132} name={F.cleanName} />
        {[0, 1, 2, 3, 4].map((k) => (
          <Block key={k} x={chipX(k, 22, STORE_X + 16)} y={164} w={16} h={14} />
        ))}
      </g>

      {/* 아래 줄(step 1에서는 위 자리): ELT */}
      <g data-el="elt">
        <Txt x={8} y={38} size={17} weight={800} el="elt-name">
          {ch2.interaction.modes.elt}
        </Txt>
        <Belt base={20} seed="lb" />
        <LineStation cx={LX[0]} base={20} label={t[0][0]} seed="l0" />
        <LineStation cx={LX[2]} base={20} label={t[2][0]} seed="l2" />
        {/* 넓어지는 저장소: 위·아래 선은 왼쪽 기준으로 늘이고, 오른쪽 선은 옮긴다 */}
        <g data-el="ls-h">
          <RLine x1={STORE_X} y1={50} x2={STORE_X + WIDE} y2={50} seed="ls-t" rough={0.45} />
          <RLine x1={STORE_X} y1={206} x2={STORE_X + WIDE} y2={206} seed="ls-b" rough={0.45} />
        </g>
        <RLine x1={STORE_X} y1={50} x2={STORE_X} y2={206} seed="ls-l" rough={0.45} />
        <g data-el="ls-r">
          <RLine x1={STORE_X + WIDE} y1={50} x2={STORE_X + WIDE} y2={206} seed="ls-r" rough={0.45} />
        </g>
        <Txt x={STORE_X + 10} y={70} size={13} weight={750}>
          {F.storeName}
        </Txt>
        <SubTable x={298} y={78} name={F.rawName} tag={F.beforeTag} el="ls-raw" />
        <SubTable x={298} y={142} name={F.cleanName} el="ls-clean" />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Block key={k} x={chipX(k, 19, 306)} y={110} w={15} h={14} seed={`lr${k}`} amp={2.2} el="lchip-raw" />
        ))}
        {[0, 1, 2, 3, 4].map((k) => (
          <Block key={k} x={chipX(k, 22, 306)} y={eltCleanY + 20} w={16} h={14} el="lchip-clean" />
        ))}
        {/* 벨트에서 들려 저장소 안으로 옮겨지는 변환 */}
        <g data-el="elt-t">
          <LineStation cx={LX[1]} base={20} label={t[1][0]} seed="l1" />
        </g>
      </g>

      {/* step 3 */}
      <Txt x={220} y={234} size={15} weight={800} anchor="middle" el="choice">
        {F.choice}
      </Txt>
      <DashTrace pts={ellipsePts(LX[1], 83, 37, 31)} el="ring-a" color="var(--accent)" width={2.2} />
      <DashTrace pts={ellipsePts(ELT_T.x, ELT_BASE + ELT_T.y, 37, 31)} el="ring-b" color="var(--accent)" width={2.2} />
    </Fig>
  )
}

export const buildDefinition: SceneBuild = (q, tl) => {
  const o = pick(q)
  const raw = o('lchip-raw')
  const clean = o('lchip-clean')
  init(tl, [...o('etl'), ...o('elt-name'), ...o('ls-raw'), ...o('ls-clean'), ...raw, ...clean, ...o('choice'), ...o('ring-a'), ...o('ring-b')], { opacity: 0 })
  init(tl, o('ls-h'), { scaleX: NARROW / WIDE, transformOrigin: '0% 50%' })
  init(tl, o('ls-r'), { x: NARROW - WIDE })
  // 원본 칩은 벨트 앞(추출 아래)에서 출발
  raw.forEach((c, k) => init(tl, c, { x: 14 + (k % 3) * 10 - (306 + k * 19), y: 64 + Math.floor(k / 3) * 8 - 110 }))
  clean.forEach((c, k) => init(tl, c, { x: ELT_T.x - 8 - (306 + k * 22), y: 20 + ELT_T.y - 7 - 174 }))

  // step 1: 변환이 들려 저장소 안으로, 저장소가 넓어지고, 원본이 모양 그대로 실린다
  const tg = o('elt-t')
  tl.to(tg, { y: -16, duration: 0.1, ease: 'power1.out' }, at(0) + 0.04)
  tl.to(tg, { x: ELT_T.x - LX[1], y: ELT_T.y - 63, duration: 0.22, ease: 'power2.inOut' }, at(0) + 0.14)
  tl.to(o('ls-h'), { scaleX: 1, duration: 0.22, ease: 'power2.inOut' }, at(0) + 0.14)
  tl.to(o('ls-r'), { x: 0, duration: 0.22, ease: 'power2.inOut' }, at(0) + 0.14)
  tl.to(o('elt-name'), { opacity: 1, duration: 0.1 }, at(0) + 0.2)
  tl.to([...o('ls-raw'), ...o('ls-clean')], { opacity: 1, duration: 0.1 }, at(0) + 0.34)
  raw.forEach((c, k) => {
    const t = at(0) + 0.38 + k * 0.02
    tl.to(c, { opacity: 1, duration: 0.02 }, t)
    tl.to(c, { x: LX[2] - 8 - (306 + k * 19), y: 66 - 110, duration: 0.1, ease: 'none' }, t)
    tl.to(c, { x: 0, y: 0, duration: 0.12, ease: 'power2.out' }, t + 0.1)
  })
  clean.forEach((c, k) => {
    const t = at(0) + 0.6 + k * 0.02
    tl.to(c, { opacity: 1, duration: 0.02 }, t)
    tl.to(c, { x: 0, y: 0, duration: 0.12, ease: 'power2.out' }, t)
  })

  // step 2: 두 줄 비교 — ELT는 아래로, 위에 ETL
  tl.to(o('elt'), { y: ELT_BASE - 20, duration: 0.3, ease: 'power2.inOut' }, at(1))
  tl.to(o('etl'), { opacity: 1, duration: 0.2 }, at(1) + 0.3)

  // step 3: 차이는 '변환이 어디에 있느냐' 하나
  tl.to(o('choice'), { opacity: 1, duration: 0.12 }, at(2) + 0.1)
  tl.to(o('ring-a'), { opacity: 1, duration: 0.02, stagger: 0.012 }, at(2) + 0.25)
  tl.to(o('ring-b'), { opacity: 1, duration: 0.02, stagger: 0.012 }, at(2) + 0.25)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 매일 밤 한 번, 야간 배치
// ─────────────────────────────────────────────────────────────
const SY = (h: number) => 60 + (h * 360) / 27
const ORDER_H = [9.2, 11 + 40 / 60, 14 + 5 / 60, 14 + 5 / 60, 19.5, 22.8]
const ORDER_X = [80, 80, 80, 94, 80, 80]
const STRIP_SPAN = 0.66 // step 1에서 커서가 00:00 → 다음 날 03:00을 지나는 시간

function StripFig() {
  return (
    <Fig caption={F.batchNote}>
      <Txt x={20} y={32} size={15.5} weight={800}>
        {F.dayRange}
      </Txt>
      <RRect x={74} y={56} w={12} h={368} seed="strip" rough={0.35} fill="var(--surface)" />
      {F.hours.map((h, k) => (
        <g key={h}>
          <RLine x1={68} y1={SY(k * 6)} x2={92} y2={SY(k * 6)} seed={`tick${k}`} rough={0.2} />
          <Txt x={50} y={SY(k * 6) + 4.5} size={12.5} anchor="end" muted mono>
            {h}
          </Txt>
        </g>
      ))}
      <Txt x={50} y={SY(27) + 4.5} size={13} anchor="end" weight={750} mono>
        {F.flagTime}
      </Txt>
      <Txt x={50} y={SY(27) + 21} size={11.5} anchor="end" muted>
        {F.nextDay}
      </Txt>
      {ORDER_H.map((h, i) => (
        <circle key={i} cx={ORDER_X[i]} cy={SY(h)} r={5} style={{ fill: 'var(--bg)', stroke: 'var(--muted)' }} strokeWidth={1.3} />
      ))}
      {F.orderTimes.map((t, k) => (
        <Txt key={t} x={108} y={SY(ORDER_H[k < 3 ? k : k + 1]) + 4.5} size={13.5} mono>
          {t}
        </Txt>
      ))}
      {/* 어제 주문 바구니 */}
      <RPath d="M 270 198 L 410 198 L 396 252 L 284 252 Z" seed="basket" rough={0.5} fill="var(--surface)" />
      <RLine x1={262} y1={198} x2={418} y2={198} seed="rim" rough={0.4} strokeWidth={2.2} />
      <Txt x={340} y={186} size={14.5} weight={750} anchor="middle">
        {F.basket}
      </Txt>
      <RArrow x1={300} y1={260} x2={272} y2={316} seed="pour" rough={0.4} />
      {/* 컨베이어 */}
      {F.etlStations.map(([l], k) => (
        <g key={l}>
          <RRect x={240 + k * 66} y={322} w={56} h={28} seed={`mini${k}`} rough={0.4} fill="var(--surface)" />
          <Txt x={268 + k * 66} y={341} size={12.5} weight={750} anchor="middle">
            {l}
          </Txt>
        </g>
      ))}
      <RLine x1={236} y1={350} x2={432} y2={350} seed="mb-a" rough={0.4} />
      <RLine x1={236} y1={360} x2={432} y2={360} seed="mb-b" rough={0.4} />
      {/* 03:00 깃발 */}
      <RLine x1={100} y1={398} x2={100} y2={428} seed="pole" rough={0.3} strokeWidth={2} />
      <path d="M 101 398 L 124 404 L 101 410 Z" style={{ fill: 'var(--ink)' }} />
      <Txt x={130} y={414} size={13.5} weight={750}>
        {F.flag}
      </Txt>
      {/* 커서 */}
      <g data-el="cursor">
        <line x1={64} y1={SY(0)} x2={96} y2={SY(0)} style={{ stroke: 'var(--ink)' }} strokeWidth={2.5} />
        <path d={`M 56 ${SY(0) - 5} L 64 ${SY(0)} L 56 ${SY(0) + 5} Z`} style={{ fill: 'var(--ink)' }} />
      </g>
      {/* 주문 입자 */}
      {ORDER_H.map((h, i) => (
        <circle key={i} data-el="ord" data-bx={296 + i * 18 - ORDER_X[i]} data-by={232 - SY(h)} data-cx={246 + i * 11 - ORDER_X[i]} data-cy={355 - SY(h)} cx={ORDER_X[i]} cy={SY(h)} r={5.5} style={{ fill: 'var(--accent)' }} />
      ))}
    </Fig>
  )
}

type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined

/** 맵 위 덧그림: 옆으로 비킨 CSV 경로, 흐르는 입자, 윤 대표의 휴대폰 */
function MapOverlay({ at: pos }: { at: At }) {
  const [app, oltp, csv, etl, wh, bi] = ['app', 'oltp', 'csv', 'etl', 'warehouse', 'bi'].map(pos)
  if (!app || !oltp || !csv || !etl || !wh || !bi) return null
  const aside = { x: etl.x + etl.w / 2 + 40 + csv.w / 2, y: etl.y }
  const ph = { x: bi.x + bi.w / 2 + 40, y: bi.y - 150, w: 154, h: 214 }
  const cam = {
    x: Math.min(app.x - app.w / 2, bi.x - bi.w / 2) - 16,
    y: Math.min(app.y, oltp.y) - app.h / 2 - 18,
    x1: Math.max(aside.x + csv.w / 2, ph.x + ph.w) + 14,
    y1: Math.max(bi.y + bi.h / 2, ph.y + ph.h) + 14,
  }
  // 옆으로 비킨 CSV를 잇는 선(노드 테두리 바깥에서 시작·끝)
  const s1 = { x: app.x + app.w / 2 - 22, y: app.y + app.h / 2 + 5 }
  const e1 = { x: aside.x - csv.w / 2 - 6, y: aside.y - csv.h / 2 - 4 }
  const s2 = { x: aside.x - 18, y: aside.y + csv.h / 2 + 5 }
  const e2 = { x: bi.x + bi.w / 2 + 7, y: bi.y - 8 }
  const card = { x: ph.x + 10, y: ph.y + 26, w: ph.w - 20, h: 150 }
  const line = (i: number) => card.y + 30 + i * 32
  return (
    <g>
      <rect data-el="cam" data-vb={`${cam.x} ${cam.y} ${cam.x1 - cam.x} ${cam.y1 - cam.y}`} x={cam.x} y={cam.y} width={0} height={0} style={{ fill: 'none' }} />
      <g data-el="csv-off" data-dx={aside.x - csv.x} data-dy={aside.y - csv.y} />
      <g data-el="csv-edges">
        <RArrow x1={s1.x} y1={s1.y} x2={e1.x} y2={e1.y} seed="sol-csv1" rough={0.5} />
        <RArrow x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y} seed="sol-csv2" rough={0.5} />
      </g>
      <circle
        data-el="flow-dot"
        data-pts={[etl, wh, bi].map((n) => `${n.x - oltp.x},${n.y - oltp.y}`).join(' ')}
        cx={oltp.x}
        cy={oltp.y}
        r={6.5}
        style={{ fill: 'var(--accent)' }}
      />
      <g data-el="phone">
        <Txt x={ph.x + ph.w / 2} y={ph.y - 10} size={13} weight={700} anchor="middle" muted>
          {F.ceoPhone}
        </Txt>
        <rect x={ph.x} y={ph.y} width={ph.w} height={ph.h} rx={18} style={{ fill: 'var(--surface)' }} />
        <RRect x={ph.x} y={ph.y} w={ph.w} h={ph.h} seed="phone" rough={0.4} />
        <RLine x1={ph.x + 52} y1={ph.y + 13} x2={ph.x + 88} y2={ph.y + 13} seed="spk" rough={0.2} strokeWidth={2.4} />
      </g>
      <g data-el="card" data-dx={bi.x - (card.x + card.w / 2)} data-dy={bi.y - (card.y + card.h / 2)}>
        <rect x={card.x} y={card.y} width={card.w} height={card.h} rx={8} style={{ fill: 'var(--bg)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
        <Txt x={card.x + 10} y={line(0)} size={14.5} weight={800}>
          {F.phone[0]}
        </Txt>
        <Txt x={card.x + 10} y={line(1)} size={13.5} weight={700}>
          {F.phone[1]}
        </Txt>
        <Badge x={card.x + card.w - 14} y={line(1) - 5} status="ok" r={8.5} />
        <Txt x={card.x + 10} y={line(2)} size={13.5} weight={700}>
          {F.phone[2]}
        </Txt>
        <Badge x={card.x + card.w - 14} y={line(2) - 5} status="ok" r={8.5} />
        <Txt x={card.x + 10} y={line(3)} size={12.5} weight={600}>
          {F.phone[3]}
        </Txt>
      </g>
      <g data-el="to-phone">
        <RArrow x1={bi.x + bi.w / 2 + 6} y1={bi.y} x2={ph.x - 6} y2={bi.y} seed="to-phone" rough={0.5} />
      </g>
    </g>
  )
}

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="strip-layer" className="absolute inset-0">
        <StripFig />
      </div>
      <div data-el="map-layer" className="absolute inset-0">
        <PipelineMap t={T.ch2} from={T.ch1} vertical overlay={(a) => <MapOverlay at={a} />} />
      </div>
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl) => {
  const o = pick(q)
  const svg = o('map')[0]
  const cam = o('cam')[0] as SVGElement | undefined
  if (svg && cam?.dataset.vb) init(tl, svg, { attr: { viewBox: cam.dataset.vb } })
  const node = (id: string) => q(`[data-node="${id}"]`)
  const edge = (id: string) => q(`[data-edge="${id}"]`)
  const strokes = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
  const shafts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
  const heads = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))

  const etlN = node('etl')
  const whN = node('warehouse')
  const newE = [edge('oltp>etl'), edge('etl>warehouse'), edge('warehouse>bi')]
  const off = o('csv-off')[0]
  init(tl, o('map-layer'), { opacity: 0 })
  // 원래 CSV 연결선은 bi의 새 자리로 그려지므로 숨기고, 옆으로 비킨 CSV를 덧그린 선으로 잇는다
  init(tl, [...edge('app>csv'), ...edge('csv>bi'), ...etlN, ...whN, ...newE.flat(), ...o('lbl-new'), ...o('flow-dot'), ...o('phone'), ...o('card'), ...o('to-phone')], { opacity: 0 })
  if (off) init(tl, node('csv'), { x: num(off, 'dx'), y: num(off, 'dy') })
  init(tl, [...strokes([...etlN, ...whN]), ...shafts(newE.flat())], { drawSVG: '0%' })
  newE.forEach((e) => init(tl, heads(e), { opacity: 0 }))

  // step 1: 커서가 하루를 지나며 주문을 바구니에 모으고, 03:00에 한꺼번에 쏟는다
  tl.to(o('cursor'), { y: SY(27) - SY(0), duration: STRIP_SPAN, ease: 'none' }, at(0))
  o('ord').forEach((p, i) => {
    init(tl, p, { opacity: 0 })
    const t = at(0) + (STRIP_SPAN * ORDER_H[i]) / 27
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'bx'), y: num(p, 'by'), duration: 0.07, ease: 'power2.inOut' }, t + 0.01)
    tl.to(p, { x: num(p, 'cx'), y: num(p, 'cy'), duration: 0.08, ease: 'power2.in' }, at(0) + STRIP_SPAN + 0.02 + i * 0.008)
  })

  // step 2: 맵에 야간 ETL 배치와 분석용 DB, 직접 쿼리 점선은 지워진다
  tl.to(o('strip-layer'), { opacity: 0, duration: 0.1 }, at(1))
  tl.to(o('map-layer'), { opacity: 1, duration: 0.12 }, at(1) + 0.06)
  tl.to(edge('oltp>bi'), { opacity: 0, duration: 0.14 }, at(1) + 0.16)
  ;[etlN, whN].forEach((n, k) => {
    tl.to(n, { opacity: 1, duration: 0.06 }, at(1) + 0.26 + k * 0.12)
    tl.to(strokes(n), { drawSVG: '100%', duration: 0.14 }, at(1) + 0.26 + k * 0.12)
  })
  newE.forEach((e, k) => {
    const t = at(1) + 0.32 + k * 0.1
    tl.to(e, { opacity: 1, duration: 0.02 }, t)
    tl.to(shafts(e), { drawSVG: '100%', duration: 0.1 }, t)
    tl.to(heads(e), { opacity: 1, duration: 0.03 }, t + 0.09)
  })
  const dot = o('flow-dot')[0] as SVGElement | undefined
  if (dot) {
    const pts = (dot.dataset.pts ?? '').split(' ').map((s) => s.split(',').map(Number))
    tl.to(dot, { opacity: 1, duration: 0.02 }, at(1) + 0.56)
    pts.forEach(([x, y], k) => tl.to(dot, { x, y, duration: 0.06, ease: 'none' }, at(1) + 0.57 + k * 0.06))
    tl.to(dot, { opacity: 0, duration: 0.03 }, at(1) + 0.76)
  }

  // step 3: CSV 파일이 사라지고, 노트북 자리는 아침 리포트로
  tl.to([...node('csv'), ...o('csv-edges')], { opacity: 0, duration: 0.2 }, at(2))
  tl.to(o('lbl-old'), { opacity: 0, duration: 0.18 }, at(2) + 0.25)
  tl.to(o('lbl-new'), { opacity: 1, duration: 0.18 }, at(2) + 0.25)

  // step 4: 리포트 카드가 떨어져 나와 휴대폰에 도착한다
  const card = o('card')[0]
  tl.to(o('phone'), { opacity: 1, duration: 0.14 }, at(3))
  if (card) {
    init(tl, card, { x: num(card, 'dx'), y: num(card, 'dy'), scale: 0.3, transformOrigin: '50% 50%' })
    tl.to(card, { opacity: 1, duration: 0.06 }, at(3) + 0.12)
    tl.to(card, { x: 0, y: 0, scale: 1, duration: 0.34, ease: 'power2.inOut' }, at(3) + 0.14)
  }
  tl.to(o('to-phone'), { opacity: 1, duration: 0.12 }, at(3) + 0.52)
}
