import { ch1, ORDERS, PRODUCTS, YESTERDAY } from '../../content/chapters/ch1'
import { Badge, CodeType, Gauge, Node } from '../../components/diagram'
import { Fig, Txt, scatter } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { PipelineMap, mapTransition } from '../../components/PipelineMap'
import { RArrow, REllipse, RLine, RPath, RRect } from '../../components/sketch'
import { at, type Q, type SceneBuild } from '../../components/StepScene'
import { useEnv } from '../../state/env'

const F = ch1.figures
const C = ch1.interaction.cols

// ─────────────────────────────────────────────────────────────
// 공통 도구
// ─────────────────────────────────────────────────────────────
const num = (n: number) => n.toLocaleString('ko-KR')
const isYesterday = (o: { ordered_at: string }) => o.ordered_at.startsWith(`${YESTERDAY} `)

interface TCol {
  key: string
  label: string
  w: number
  align?: 'start' | 'end'
}
type Row = Record<string, string | number>

/**
 * SVG 표. 틀(`${el}-frame`)·머리글(`${el}-head`, 칸마다 `${el}-h-{key}`)·행(`${el}-r`, 칸마다 `${el}-c-{key}`)을
 * 따로 표시해 두어 틀만 지우고 행만 옮길 수 있다. n을 주면 빈 틀만 그린다.
 */
function Table({ x, y, cols, rows = [], n, rowH = 25, el, seed, size = 13 }: { x: number; y: number; cols: TCol[]; rows?: readonly Row[]; n?: number; rowH?: number; el: string; seed: string; size?: number }) {
  const count = n ?? rows.length
  const width = cols.reduce((a, c) => a + c.w, 0)
  const height = rowH * (count + 1)
  const colX = cols.map((_, j) => x + cols.slice(0, j).reduce((a, c) => a + c.w, 0))
  const tx = (j: number) => (cols[j].align === 'end' ? colX[j] + cols[j].w - 8 : colX[j] + 8)
  const anchor = (j: number) => (cols[j].align === 'end' ? 'end' : 'start')
  return (
    <g data-el={el}>
      <g data-el={`${el}-frame`}>
        <rect x={x} y={y} width={width} height={height} style={{ fill: 'var(--surface)' }} />
        <RRect x={x} y={y} w={width} h={height} seed={`${seed}-o`} rough={0.4} />
        <RLine x1={x} y1={y + rowH} x2={x + width} y2={y + rowH} seed={`${seed}-h`} rough={0.4} />
        {colX.slice(1).map((cx, j) => (
          <RLine key={j} x1={cx} y1={y} x2={cx} y2={y + height} seed={`${seed}-v${j}`} rough={0.3} strokeWidth={0.9} />
        ))}
      </g>
      <g data-el={`${el}-head`}>
        {cols.map((c, j) => (
          <text key={c.key} data-el={`${el}-h-${c.key}`} x={tx(j)} y={y + rowH * 0.66} textAnchor={anchor(j)} style={{ fontSize: size * 0.92, fontWeight: 700 }}>
            {c.label}
          </text>
        ))}
      </g>
      {rows.map((r, i) => (
        <g key={i} data-el={`${el}-r`} data-i={i}>
          {cols.map((c, j) => (
            <text key={c.key} data-el={`${el}-c-${c.key}`} x={tx(j)} y={y + rowH * (i + 1) + rowH * 0.66} textAnchor={anchor(j)} style={{ fontSize: size }}>
              {r[c.key]}
            </text>
          ))}
        </g>
      ))}
    </g>
  )
}

/** 원통(저장소). 몸통은 불투명하게 채워 뒤에 있는 것을 가린다 */
function Cylinder({ cx, top, bottom, rx, ry, seed, lid = true }: { cx: number; top: number; bottom: number; rx: number; ry: number; seed: string; lid?: boolean }) {
  const x0 = cx - rx
  const x1 = cx + rx
  return (
    <>
      <path d={`M ${x0} ${top} A ${rx} ${ry} 0 0 0 ${x1} ${top} L ${x1} ${bottom} A ${rx} ${ry} 0 0 1 ${x0} ${bottom} Z`} style={{ fill: 'var(--surface)' }} />
      <RPath d={`M ${x0} ${top} L ${x0} ${bottom} A ${rx} ${ry} 0 0 0 ${x1} ${bottom} L ${x1} ${top}`} seed={`${seed}-body`} rough={0.5} />
      {lid && <REllipse cx={cx} cy={top} w={rx * 2} h={ry * 2} seed={`${seed}-lid`} rough={0.5} fill="var(--surface)" />}
    </>
  )
}

/** 사람(머리 + 어깨). x=0 기준으로 그리고 위치는 타임라인에서 옮긴다 */
function Person({ seed, head = 214 }: { seed: string; head?: number }) {
  return (
    <>
      <RPath d={`M -16 ${head + 74} C -15 ${head + 40}, -8 ${head + 24}, 0 ${head + 23} C 8 ${head + 24}, 15 ${head + 40}, 16 ${head + 74}`} seed={`${seed}b`} rough={0.4} fill="var(--surface)" />
      <REllipse cx={0} cy={head} w={26} h={27} seed={`${seed}h`} rough={0.4} fill="var(--surface)" />
    </>
  )
}

/** 이름 첫 글자 동그라미 + 이름 */
function Initial({ x, y, r = 20, initial, name, seed }: { x: number; y: number; r?: number; initial: string; name?: string; seed: string }) {
  return (
    <>
      <REllipse cx={x} cy={y} w={r * 2} h={r * 2} seed={seed} rough={0.4} fill="var(--surface)" />
      <Txt x={x} y={y + r * 0.3} size={r * 0.75} weight={800} anchor="middle">
        {initial}
      </Txt>
      {name && (
        <Txt x={x} y={y + r + 18} size={13} weight={600} anchor="middle">
          {name}
        </Txt>
      )}
    </>
  )
}

// ── 코드 타이핑 ──
/** 줄 비교용: 끝의 세미콜론·주석을 뗀다(SQL 놀이터도 같이 쓴다) */
export const norm = (line: string) => line.replace(/;?(\s+--.*)?$/, '')
/** 새 코드의 글자마다: 앞 step 코드에 이미 있던 줄의 글자면 false(바로 보임), 새로 써지는 글자면 true */
function typedMask(prev: string, cur: string) {
  const old = new Set(prev ? prev.split('\n').map(norm) : [])
  return cur.split('\n').flatMap((line) => {
    const keep = old.has(norm(line)) ? norm(line).length : 0
    return Array.from(line).map((_, i) => i >= keep)
  })
}
/** step 슬롯 안에서 새 글자를 차례로 켠다. 타이핑이 끝나는 시각을 돌려준다 */
function typeCode(q: Q, tl: gsap.core.Timeline, el: string, prev: string, cur: string, start: number, dur: number) {
  const mask = typedMask(prev, cur)
  const typed = q(`[data-el="${el}"] [data-ch]`).filter((_, i) => mask[i])
  if (!typed.length) return start
  tl.set(typed, { opacity: 0 }, 0)
  tl.to(typed, { opacity: 1, duration: 0.001, stagger: dur / typed.length, ease: 'none' }, start)
  return start + dur
}
const swapBlock = (tl: gsap.core.Timeline, blocks: Element[], i: number, t: number) => {
  tl.to(blocks[i - 1], { autoAlpha: 0, duration: 0.01 }, t)
  tl.to(blocks[i], { autoAlpha: 1, duration: 0.01 }, t)
}
/** 코드 창: 줄바꿈하지 않고 창 안에서 가로 스크롤(모바일) */
const CODE_CLS = '[grid-area:1/1] overflow-x-auto whitespace-pre! max-md:p-3! max-md:text-[0.75rem]! max-md:leading-5!'

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 운영 DB 속의 표
// ─────────────────────────────────────────────────────────────
const RIM = { cx: 220, cy: 250, rx: 110, ry: 22, bottom: 420 }

function TableCard({ x, y, title, seed }: { x: number; y: number; title: string; seed: string }) {
  return (
    <>
      <RRect x={x} y={y} w={160} h={120} seed={seed} rough={0.5} fill="var(--surface)" />
      <Txt x={x + 80} y={y + 28} size={14} weight={700} anchor="middle">
        {title}
      </Txt>
      <rect x={x + 16} y={y + 42} width={128} height={16} style={{ fill: 'var(--accent)', opacity: 0.18 }} />
      <RRect x={x + 16} y={y + 42} w={128} h={64} seed={`${seed}-t`} rough={0.3} />
      {[58, 74, 90].map((dy) => (
        <line key={dy} x1={x + 16} y1={y + dy} x2={x + 144} y2={y + dy} style={{ stroke: 'var(--muted)' }} strokeWidth={1} />
      ))}
      {[58, 100].map((dx) => (
        <line key={dx} x1={x + dx} y1={y + 42} x2={x + dx} y2={y + 106} style={{ stroke: 'var(--muted)' }} strokeWidth={1} />
      ))}
    </>
  )
}

const PO = { x: 4, y: 48, rowH: 23 }
const POCOLS: TCol[] = [
  { key: 'order_id', label: C.order_id, w: 68 },
  { key: 'product_id', label: C.product_id, w: 84 },
  { key: 'qty', label: C.qty, w: 44, align: 'end' },
  { key: 'price', label: C.price, w: 58, align: 'end' },
  { key: 'ordered_at', label: C.ordered_at, w: 86 },
]
const OROWS = ORDERS.map((o) => ({ ...o, price: num(o.price) }))
const PP = { x: 72, y: 332 }
const PPCOLS: TCol[] = [
  { key: 'product_id', label: C.product_id, w: 84 },
  { key: 'name', label: C.name, w: 84 },
]

export function ProblemFig() {
  return (
    <Fig>
      {/* step 1: 석 리드의 모니터 속 운영 DB, 주니의 CSV */}
      <g data-el="desk">
        <RRect x={210} y={40} w={210} h={150} seed="p-mon" rough={0.5} fill="var(--surface)" />
        <RLine x1={315} y1={190} x2={315} y2={212} seed="p-stand" rough={0.3} />
        <RLine x1={282} y1={212} x2={348} y2={212} seed="p-base" rough={0.3} />
        <Node x={315} y={110} w={130} h={84} kind="store" label={F.opsDb} seed="p-db" />
        <Initial x={392} y={262} r={22} initial={F.seokInitial} name={F.seokName} seed="p-seok" />
        <g transform="translate(6 292) scale(0.9)">
          <JuniFace mood="panic" seed="p-juni" />
        </g>
        <Txt x={51} y={398} size={13} weight={600} anchor="middle">
          {F.juniName}
        </Txt>
        <RPath d="M 112 300 L 158 300 L 172 314 L 172 374 L 112 374 Z M 158 300 L 158 314 L 172 314" seed="p-csv" rough={0.5} fill="var(--surface)" />
        <RPath d="M 122 328 L 162 328 M 122 342 L 162 342 M 122 356 L 150 356" seed="p-csv-l" rough={0.3} stroke="var(--muted)" strokeWidth={1} />
        <Txt x={142} y={398} size={13} weight={700} anchor="middle">
          {F.csvFile}
        </Txt>
      </g>
      <RArrow data-el="export" x1={300} y1={160} x2={168} y2={294} seed="p-exp" strokeWidth={2.2} />
      <Txt x={198} y={238} size={14} weight={700} anchor="end" el="export-l">
        {F.exportLabel}
      </Txt>

      {/* step 2: 원통 뚜껑이 열리고 테이블 카드 두 장이 올라온다 */}
      <g data-el="db">
        <REllipse cx={RIM.cx} cy={RIM.cy} w={RIM.rx * 2} h={RIM.ry * 2} seed="p-rim" rough={0.5} fill="var(--edge)" />
        <g data-el="card-0">
          <TableCard x={40} y={60} title={F.cardOrders} seed="p-c0" />
        </g>
        <g data-el="card-1">
          <TableCard x={240} y={60} title={F.cardProducts} seed="p-c1" />
        </g>
        <Cylinder cx={RIM.cx} top={RIM.cy} bottom={RIM.bottom} rx={RIM.rx} ry={RIM.ry} seed="p-big" lid={false} />
        <Txt x={RIM.cx} y={356} size={18} weight={800} anchor="middle">
          {F.opsDb}
        </Txt>
        <g data-el="lid">
          <REllipse cx={RIM.cx} cy={RIM.cy} w={RIM.rx * 2} h={RIM.ry * 2} seed="p-lid" rough={0.5} fill="var(--surface)" />
        </g>
      </g>

      {/* step 3: 행과 열, 같은 열 product_id */}
      <g data-el="tbl">
        <Txt x={4} y={30} size={14} weight={800}>
          {F.ordersTitle}
        </Txt>
        <Txt x={60} y={30} size={12.5} muted>
          · {F.ordersCaption}
        </Txt>
        <Table x={PO.x} y={PO.y} cols={POCOLS} rows={OROWS} rowH={PO.rowH} el="po" seed="p-po" size={12.5} />
        <Txt x={4} y={PP.y + 17} size={14} weight={800}>
          {F.productsTitle}
        </Txt>
        <Table x={PP.x} y={PP.y} cols={PPCOLS} rows={PRODUCTS} rowH={PO.rowH} el="pp" seed="p-pp" size={12.5} />
        <rect data-el="row-band" x={PO.x} y={PO.y + PO.rowH} width={340} height={PO.rowH} style={{ fill: 'var(--accent)', opacity: 0.2 }} />
        <rect data-el="col-band" x={PO.x + 152} y={PO.y} width={44} height={PO.rowH * 11} style={{ fill: 'var(--accent)', opacity: 0.2 }} />
        <Txt x={350} y={PO.y + PO.rowH + 16} size={13} weight={700} el="row-l">
          {F.rowLabel}
        </Txt>
        <Txt x={PO.x + 174} y={PO.y + PO.rowH * 11 + 18} size={13} weight={700} anchor="middle" el="col-l">
          {F.colLabel}
        </Txt>
        <g data-el="same-col">
          <rect x={PO.x + 68} y={PO.y} width={84} height={PO.rowH * 11} rx={3} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.2} strokeDasharray="6 4" />
          <rect x={PP.x} y={PP.y} width={84} height={PO.rowH * 5} rx={3} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.2} strokeDasharray="6 4" />
        </g>
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const shaft = q('[data-el="export"] [data-el="shaft"] path')
  const head = q('[data-el="export"] [data-el="head"]')
  tl.set(q('[data-el="desk"]'), { opacity: 0 }, 0)
  tl.set(shaft, { drawSVG: '100% 100%' }, 0)
  tl.set([head, q('[data-el="export-l"]'), q('[data-el="db"]'), q('[data-el="tbl"]')], { opacity: 0 }, 0)

  // step 1: 화살표가 CSV에서 거슬러 올라가 운영 DB에 닿고, 방향이 운영 DB → CSV로 정해진다
  tl.to(q('[data-el="desk"]'), { opacity: 1, duration: 0.12 }, at(0))
  tl.to(shaft, { drawSVG: '0% 100%', duration: 0.4, ease: 'power1.inOut' }, at(0) + 0.15)
  tl.to(head, { opacity: 1, duration: 0.06 }, at(0) + 0.56)
  tl.to(q('[data-el="export-l"]'), { opacity: 1, duration: 0.1 }, at(0) + 0.6)

  // step 2: 뚜껑이 열리고 테이블 카드가 차례로 올라온다
  tl.to([q('[data-el="desk"]'), q('[data-el="export"]'), q('[data-el="export-l"]')], { opacity: 0, duration: 0.12 }, at(1))
  tl.to(q('[data-el="db"]'), { opacity: 1, duration: 0.12 }, at(1) + 0.06)
  const lid = q('[data-el="lid"]')
  tl.set(lid, { rotation: 0, svgOrigin: `${RIM.cx - RIM.rx} ${RIM.cy}` }, 0)
  tl.to(lid, { rotation: -14, y: -8, duration: 0.2, ease: 'power2.out' }, at(1) + 0.16)
  // 몸통 안에서 곧게 올라온 뒤(가려진 채로) 옆으로 벌어져 나란히 놓인다
  ;[0, 1].forEach((i) => {
    const card = q(`[data-el="card-${i}"]`)
    const t = at(1) + 0.34 + i * 0.2
    tl.set(card, { x: i === 0 ? 100 : -100, y: 210 }, 0)
    tl.to(card, { y: 0, duration: 0.16, ease: 'power2.out' }, t)
    tl.to(card, { x: 0, duration: 0.1, ease: 'power2.inOut' }, t + 0.16)
  })

  // step 3: 행 띠 → 열 띠 → 두 표의 같은 열
  tl.to(q('[data-el="db"]'), { opacity: 0, duration: 0.12 }, at(2))
  tl.to(q('[data-el="tbl"]'), { opacity: 1, duration: 0.12 }, at(2) + 0.08)
  const band = q('[data-el="row-band"]')
  const colBand = q('[data-el="col-band"]')
  tl.set(band, { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.set(colBand, { scaleY: 0, transformOrigin: '50% 0%' }, 0)
  tl.set([q('[data-el="row-l"]'), q('[data-el="col-l"]'), q('[data-el="same-col"]')], { opacity: 0 }, 0)
  tl.to(band, { scaleX: 1, duration: 0.18, ease: 'none' }, at(2) + 0.24)
  tl.to(q('[data-el="row-l"]'), { opacity: 1, duration: 0.08 }, at(2) + 0.38)
  tl.to(colBand, { scaleY: 1, duration: 0.18, ease: 'none' }, at(2) + 0.44)
  tl.to(q('[data-el="col-l"]'), { opacity: 1, duration: 0.08 }, at(2) + 0.6)
  tl.to(q('[data-el="same-col"]'), { opacity: 1, duration: 0.1 }, at(2) + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 ① — 첫 SQL은 통했어요
// ─────────────────────────────────────────────────────────────
const OX = 4
const OY = 30
const ORH = 25
const OW = 340
const OCOLS = POCOLS
const KEEP = ORDERS.map((o, i) => (isYesterday(o) ? i : -1)).filter((i) => i >= 0)
const rowTop = (i: number) => OY + ORH * (i + 1)

// 결과 표 자리(C)와 products 표 자리
const RX = 4
const RY = 40
const RRH = 34
const PX = 276
const GROUPS = PRODUCTS.map((p) => ({
  product_id: p.product_id,
  name: p.name,
  v: ORDERS.filter((o) => o.product_id === p.product_id && isYesterday(o)).reduce((a, o) => a + o.qty, 0),
}))
const R3COLS: TCol[] = [
  { key: 'product_id', label: C.product_id, w: 84 },
  { key: 'v', label: C.count, w: 72, align: 'end' },
]
const R4COLS: TCol[] = [R3COLS[0], { key: 'name', label: C.name, w: 76 }, R3COLS[1]]
const FCOLS = OCOLS.slice(0, 3)
const R4W = 232

// 걸러진 행 → 결과 칸으로 옮길 때의 세로 이동(글자 기준선 맞춤)
const dy = (i: number, slot: number) => RY + RRH * (slot + 1) + RRH * 0.66 - (OY + ORH * (i + 1) + ORH * 0.66)
const groupIdx = (i: number) => PRODUCTS.findIndex((p) => p.product_id === ORDERS[i].product_id)
/** 상품 순서로 줄 세운 자리(합치기 전) */
const SORTED = [...KEEP].sort((a, b) => groupIdx(a) - groupIdx(b) || a - b)

export function AttemptFig() {
  const { reduced } = useEnv()
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2" data-static={reduced ? '' : undefined}>
      <div className="grid">
        {F.code.map((c, i) => (
          <CodeType key={i} code={c} el={`code-${i}`} className={CODE_CLS} />
        ))}
      </div>
      <div className="grid font-mono text-[0.75rem] leading-snug text-muted md:text-[0.8125rem]">
        {F.codeNotes.map((t, i) => (
          <p key={i} data-el={`note-${i}`} className="[grid-area:1/1]">
            {t}
          </p>
        ))}
      </div>
      <svg viewBox="0 0 440 312" className="diagram h-auto min-h-0 w-full shrink" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <Txt x={OX} y={20} size={13} muted el="cap1">
          {F.tableCaption1}
        </Txt>
        <Txt x={436} y={20} size={13} weight={700} anchor="end" el="today">
          {F.todayCaption}
        </Txt>
        {/* 정지 그림(step 3)의 왼쪽 틀: 걸러진 5행이 이 위로 옮겨 온다 */}
        <Table x={RX} y={RY} cols={FCOLS} n={KEEP.length} rowH={RRH} el="ft" seed="a-ft" />
        <Table x={OX} y={OY} cols={OCOLS} rows={OROWS} rowH={ORH} el="o" seed="a-o" />
        <rect data-el="flash" x={OX - 3} y={OY - 3} width={OW + 6} height={ORH * 11 + 6} rx={4} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
        {KEEP.map((i) => (
          <rect key={i} data-el="keep-b" x={OX} y={rowTop(i)} width={OW} height={ORH} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.2} />
        ))}
        {ORDERS.map((_, i) =>
          KEEP.includes(i) ? null : (
            <Txt key={i} x={OX + OW + 8} y={rowTop(i) + 17} size={12.5} weight={700} muted el="excl">
              {F.excluded}
            </Txt>
          ),
        )}
        <line data-el="scan" x1={OX + 254} y1={rowTop(0)} x2={OX + OW} y2={rowTop(0)} style={{ stroke: 'var(--accent)' }} strokeWidth={3} />

        {/* 정지 그림(step 3): 걸러진 5행 → GROUP BY → 결과 4행 */}
        <g data-el="gb-arrow">
          <Txt x={238} y={128} size={13} weight={700} anchor="middle">
            {F.groupByArrow}
          </Txt>
          <RArrow x1={208} y1={142} x2={268} y2={142} seed="a-gb" />
        </g>

        {GROUPS.map((_, i) => {
          const y = RY + RRH * (i + 1)
          return (
            <g key={i}>
              <g data-el="link">
                <RLine x1={RX + R4W} y1={y + RRH / 2} x2={PX} y2={y + RRH / 2} seed={`a-l${i}`} rough={0.3} stroke="var(--accent)" strokeWidth={2.2} />
                <circle cx={RX + R4W} cy={y + RRH / 2} r={3} style={{ fill: 'var(--accent)' }} />
                <circle cx={PX} cy={y + RRH / 2} r={3} style={{ fill: 'var(--accent)' }} />
              </g>
            </g>
          )
        })}
        <g data-el="prod">
          <Txt x={PX} y={RY - 10} size={13} weight={700}>
            {F.productsTitle}
          </Txt>
          <Table x={PX} y={RY} cols={PPCOLS.map((c) => ({ ...c, w: c.key === 'name' ? 76 : 84 }))} rows={PRODUCTS} rowH={RRH} el="pt" seed="a-pt" />
        </g>
        {/* name 값이 products 표 위를 지나 결과 표로 옮겨 오므로 products 표보다 뒤에 그린다 */}
        <Table x={RX} y={RY} cols={R4COLS} rows={GROUPS} rowH={RRH} el="r4" seed="a-r4" />
        <g data-el="res3wrap">
          <Txt x={RX} y={RY - 10} size={13} weight={700} el="res-title">
            {F.resultTitle}
          </Txt>
          <Table x={RX} y={RY} cols={R3COLS} rows={GROUPS} rowH={RRH} el="r3" seed="a-r3" />
          <Txt x={RX + 164} y={RY + RRH + 22} size={12.5} weight={700} el="sum">
            {F.sumP1}
          </Txt>
        </g>
        {GROUPS.map((_, i) =>
          [RX, PX].map((x) => <rect key={`${i}-${x}`} data-el="tint" x={x} y={RY + RRH * (i + 1)} width={84} height={RRH} style={{ fill: 'var(--accent)', fillOpacity: 0.16 }} />),
        )}
      </svg>
    </div>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const isStatic = q('[data-static]').length > 0
  const blocks = F.code.map((_, i) => q(`[data-el="code-${i}"]`)[0])
  const notes = F.codeNotes.map((_, i) => q(`[data-el="note-${i}"]`)[0])
  const rows = q('[data-el="o-r"]')
  const cell = (i: number, key: string) => rows[i].querySelector(`[data-el="o-c-${key}"]`)!
  const kept = KEEP.map((i) => rows[i])
  const dropped = rows.filter((_, i) => !KEEP.includes(i))
  const keepB = q('[data-el="keep-b"]')
  const excl = q('[data-el="excl"]')
  const r3 = { frame: q('[data-el="r3-frame"]'), head: q('[data-el="r3-head"]'), rows: q('[data-el="r3-r"]') }
  const r4 = { frame: q('[data-el="r4-frame"]'), head: q('[data-el="r4-head"]'), rows: q('[data-el="r4-r"]') }
  const r4Names = q('[data-el="r4-c-name"]')
  const r4NameHead = q('[data-el="r4-h-name"]')
  const res3wrap = q('[data-el="res3wrap"]')
  const resTitle = q('[data-el="res-title"]')
  const sum = q('[data-el="sum"]')
  const ft = q('[data-el="ft"]')
  const gbArrow = q('[data-el="gb-arrow"]')
  const prod = q('[data-el="prod"]')
  const links = q('[data-el="link"]')
  const tints = q('[data-el="tint"]')

  tl.set(blocks.slice(1), { autoAlpha: 0 }, 0)
  tl.set(notes, { opacity: 0 }, 0)
  tl.set(
    [q('[data-el="o"]'), q('[data-el="cap1"]'), q('[data-el="today"]'), q('[data-el="flash"]'), keepB, excl, q('[data-el="scan"]'), r3.frame, r3.head, ...r3.rows, resTitle, sum, ft, gbArrow, r4.frame, r4.head, ...r4.rows, prod, links, tints],
    { opacity: 0 },
    0,
  )
  tl.set(r4Names, { opacity: 0, x: PX - RX }, 0)
  tl.set(r4NameHead, { opacity: 0 }, 0)
  tl.set(prod, { x: 60 }, 0)

  // step 1: SELECT * FROM orders; — 질문이 가리키는 표
  const s1 = at(0)
  tl.to([q('[data-el="o"]'), q('[data-el="cap1"]')], { opacity: 1, duration: 0.1 }, s1)
  const t1 = typeCode(q, tl, 'code-0', '', F.code[0], s1, 0.4)
  tl.to(q('[data-el="flash"]'), { opacity: 1, duration: 0.06 }, t1)
  tl.to(q('[data-el="flash"]'), { opacity: 0, duration: 0.16 }, t1 + 0.16)
  tl.to(notes[0], { opacity: 1, duration: 0.08 }, t1)

  // step 2: WHERE — 훑는 선이 지나가며 6/2가 아닌 행이 흐려진다
  const s2 = at(1)
  swapBlock(tl, blocks, 1, s2)
  const t2 = typeCode(q, tl, 'code-1', F.code[0], F.code[1], s2, 0.5)
  tl.to(notes[0], { opacity: 0, duration: 0.05 }, s2)
  tl.to(notes[1], { opacity: 1, duration: 0.08 }, t2)
  const scan = q('[data-el="scan"]')
  tl.to(scan, { opacity: 1, duration: 0.02 }, s2 + 0.05)
  tl.to(scan, { y: ORH * 10, duration: 0.45, ease: 'none' }, s2 + 0.05)
  tl.to(scan, { opacity: 0, duration: 0.04 }, s2 + 0.52)
  let e = 0
  let k = 0
  rows.forEach((r, i) => {
    const t = s2 + 0.05 + (0.45 * (i + 0.5)) / rows.length
    if (KEEP.includes(i)) tl.to(keepB[k++], { opacity: 1, duration: 0.04 }, t)
    else {
      tl.to(r, { opacity: 0.3, duration: 0.04 }, t)
      tl.to(excl[e++], { opacity: 1, duration: 0.04 }, t)
    }
  })
  tl.to(q('[data-el="today"]'), { opacity: 1, duration: 0.1 }, s2 + 0.56)

  // step 3: GROUP BY — 같은 상품끼리 모여 숫자 하나로
  const s3 = at(2)
  swapBlock(tl, blocks, 2, s3)
  const t3 = typeCode(q, tl, 'code-2', F.code[1], F.code[2], s3, 0.28)
  tl.to(notes[1], { opacity: 0, duration: 0.05 }, s3)
  tl.to(notes[2], { opacity: 1, duration: 0.08 }, t3)
  const away = [q('[data-el="o-frame"]'), q('[data-el="o-head"]'), ...dropped, keepB, excl, q('[data-el="cap1"]'), q('[data-el="today"]')]
  if (!isStatic) {
    tl.to(away, { opacity: 0, duration: 0.1 }, s3 + 0.28)
    tl.to(
      KEEP.flatMap((i) => ['order_id', 'price', 'ordered_at'].map((key) => cell(i, key))),
      { opacity: 0, duration: 0.12 },
      s3 + 0.3,
    )
    tl.to(
      KEEP.map((i) => cell(i, 'qty')),
      { x: RX + 84 + 72 - 8 - (OX + 68 + 84 + 44 - 8 - 68), duration: 0.18 },
      s3 + 0.3,
    )
    KEEP.forEach((i) => {
      tl.to(rows[i], { x: RX - (OX + 68), y: dy(i, SORTED.indexOf(i)), duration: 0.18, ease: 'power2.inOut' }, s3 + 0.3)
      tl.to(rows[i], { y: dy(i, groupIdx(i)), duration: 0.13, ease: 'power2.inOut' }, s3 + 0.5)
    })
    tl.to(sum, { opacity: 1, duration: 0.05 }, s3 + 0.5)
    tl.to([r3.frame, r3.head, ...r3.rows, resTitle], { opacity: 1, duration: 0.1 }, s3 + 0.66)
    tl.to(kept, { opacity: 0, duration: 0.08 }, s3 + 0.68)
    tl.to(sum, { opacity: 0, duration: 0.06 }, s3 + 0.74)
  } else {
    // 정지 그림: 왼쪽에 걸러진 5행, 가운데 GROUP BY →, 오른쪽에 결과 4행
    tl.to(away, { opacity: 0, duration: 0.05 }, s3 + 0.3)
    tl.to(
      KEEP.flatMap((i) => [cell(i, 'price'), cell(i, 'ordered_at')]),
      { opacity: 0, duration: 0.05 },
      s3 + 0.3,
    )
    KEEP.forEach((i, slot) => tl.to(rows[i], { y: dy(i, slot), duration: 0.05 }, s3 + 0.3))
    tl.to([ft, gbArrow], { opacity: 1, duration: 0.05 }, s3 + 0.3)
    tl.to(res3wrap, { x: PX - RX, duration: 0.05 }, s3 + 0.3)
    tl.to([r3.frame, r3.head, ...r3.rows, resTitle], { opacity: 1, duration: 0.05 }, s3 + 0.35)
  }

  // step 4: JOIN — products 표가 들어와 같은 product_id끼리 이어지고, name이 새 열로 옮겨진다
  const s4 = at(3)
  swapBlock(tl, blocks, 3, s4)
  typeCode(q, tl, 'code-3', F.code[2], F.code[3], s4, 0.32)
  tl.to(notes[2], { opacity: 0, duration: 0.05 }, s4)
  if (isStatic) {
    tl.to([...kept, ft, gbArrow], { opacity: 0, duration: 0.05 }, s4)
    tl.to(res3wrap, { x: 0, duration: 0.15 }, s4)
  }
  tl.to(prod, { opacity: 1, x: 0, duration: 0.15 }, s4 + 0.28)
  tl.to([...q('[data-el="r3-c-v"]'), ...q('[data-el="r3-h-v"]')], { x: 76, duration: 0.12 }, s4 + 0.42)
  tl.to(r3.frame, { opacity: 0, duration: 0.12 }, s4 + 0.42)
  tl.to(r4.frame, { opacity: 1, duration: 0.12 }, s4 + 0.42)
  tl.to([links, tints], { opacity: 1, duration: 0.1 }, s4 + 0.46)
  tl.set([r3.head, ...r3.rows], { opacity: 0 }, s4 + 0.56)
  tl.set([r4.head, ...r4.rows], { opacity: 1 }, s4 + 0.56)
  tl.to(r4Names, { opacity: 1, duration: 0.03 }, s4 + 0.56)
  tl.to(r4Names, { x: 0, duration: 0.18, ease: 'power2.inOut', stagger: 0.015 }, s4 + 0.58)
  tl.to(r4NameHead, { opacity: 1, duration: 0.06 }, s4 + 0.74)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 시도와 실패 ② — 운영 DB에 던진 큰 쿼리
// ─────────────────────────────────────────────────────────────
const G = { x: 308, y: 96, r: 62 }
const angle = (v: number) => -90 + v * 180
const PAY_Y = [154, 188, 222]
const MINI = { x: 24, y: 64, w: 136, h: 156 }

export function OverloadFig() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2">
      <div className="flex items-center justify-between gap-2 font-mono text-xs md:text-sm">
        <span className="text-muted">{F.sqlTag}</span>
        <span className="flex items-center gap-2">
          <span data-el="stopped" className="rounded border-[1.5px] border-fail px-2 py-0.5 font-bold text-fail">
            {F.stopped}
          </span>
          <span className="grid">
            <span data-el="stop-off" className="rounded border-[1.5px] border-ink px-2 py-0.5 [grid-area:1/1]">
              {F.stop}
            </span>
            <span data-el="stop-on" className="rounded border-[1.5px] border-ink bg-ink px-2 py-0.5 text-bg [grid-area:1/1]">
              {F.stop}
            </span>
          </span>
        </span>
      </div>
      <div className="grid">
        <CodeType code={F.bigQuery} el="code" className={`${CODE_CLS} md:text-[0.8125rem]!`} />
      </div>
      <p data-el="note" className="font-mono text-[0.75rem] text-muted md:text-[0.8125rem]">
        {F.customersNote}
      </p>
      <svg viewBox="0 0 440 256" className="diagram h-auto min-h-0 w-full shrink" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <Cylinder cx={92} top={22} bottom={236} rx={84} ry={14} seed="ov-db" />
        <Txt x={92} y={52} size={14} weight={800} anchor="middle">
          {F.opsDb}
        </Txt>
        <RRect x={MINI.x} y={MINI.y} w={MINI.w} h={MINI.h} seed="ov-mini" rough={0.3} />
        <Txt x={MINI.x + 8} y={MINI.y + 13} size={11.5} weight={700}>
          {F.ordersTitle}
        </Txt>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={MINI.x} y1={MINI.y + 19 + i * 17.2} x2={MINI.x + MINI.w} y2={MINI.y + 19 + i * 17.2} style={{ stroke: 'var(--muted)' }} strokeWidth={1} />
        ))}
        {[44, 92].map((dx) => (
          <line key={dx} x1={MINI.x + dx} y1={MINI.y + 19} x2={MINI.x + dx} y2={MINI.y + MINI.h} style={{ stroke: 'var(--muted)' }} strokeWidth={1} />
        ))}
        <rect data-el="beam" x={MINI.x} y={MINI.y} width={MINI.w} height={MINI.h} style={{ fill: 'var(--accent)', opacity: 0.32 }} />

        <Gauge x={G.x} y={G.y} r={G.r} label={F.gaugeLabel} value={0.15} seed="ov-g" />
        <Txt x={G.x} y={G.y - 20} size={20} weight={800} anchor="middle" el="pct">
          {F.pct(15)}
        </Txt>
        <g data-el="over">
          <Badge x={G.x - 30} y={G.y + 40} status="fail" r={9} />
          <Txt x={G.x - 16} y={G.y + 45} size={13.5} weight={800} color="var(--fail)">
            {F.overload}
          </Txt>
        </g>

        {PAY_Y.map((y, i) => (
          <g key={i}>
            <RRect x={200} y={y} w={236} h={28} seed={`ov-slot${i}`} rough={0.3} dash="5 5" stroke="var(--muted)" strokeWidth={1} />
            <g data-el="pay">
              <RRect x={200} y={y} w={236} h={28} seed={`ov-pay${i}`} rough={0.4} fill="var(--surface)" />
              <Txt x={212} y={y + 19} size={13} weight={700}>
                {F.payments[i]}
              </Txt>
              <g data-el="pay-w">
                <Badge x={372} y={y + 14} status="wait" r={9} />
                <Txt x={386} y={y + 19} size={12.5} weight={600}>
                  {F.waiting}
                </Txt>
              </g>
              <g data-el="pay-k">
                <Badge x={372} y={y + 14} status="ok" r={9} />
                <Txt x={386} y={y + 19} size={12.5} weight={600}>
                  {F.done}
                </Txt>
              </g>
            </g>
          </g>
        ))}

        {/* step 1: 석 리드가 주니 뒤에서 화면을 보고 있다(태오가 오기 전 같은 자리) */}
        <g data-el="seok">
          <Initial x={410} y={34} r={17} initial={F.seokInitial} seed="ov-seok" />
          <Txt x={410} y={72} size={12.5} weight={600} anchor="middle">
            {F.seokName}
          </Txt>
        </g>
        <g data-el="taeo">
          <Initial x={410} y={34} r={17} initial={F.taeoInitial} seed="ov-taeo" />
          <RRect x={390} y={58} w={40} h={14} seed="ov-laptop" rough={0.3} fill="var(--surface)" />
          <Txt x={410} y={90} size={12.5} weight={600} anchor="middle">
            {F.taeoName}
          </Txt>
        </g>
      </svg>
      <p data-el="caption" className="text-center text-[0.75rem] leading-snug text-muted md:text-[0.8125rem]">
        {F.loadNote}
      </p>
    </div>
  )
}

export const buildOverload: SceneBuild = (q, tl) => {
  const needle = q('[data-el="gauge-needle"]')[0] as SVGGElement
  const origin = needle.dataset.origin ?? `${G.x} ${G.y}`
  const pct = q('[data-el="pct"]')[0]
  const load = { v: 15 }
  const write = () => (pct.textContent = F.pct(Math.round(load.v)))
  const beam = q('[data-el="beam"]')
  const pays = q('[data-el="pay"]')
  const waits = q('[data-el="pay-w"]')
  const oks = q('[data-el="pay-k"]')
  const taeo = q('[data-el="taeo"]')

  tl.set(needle, { rotation: angle(0.15), svgOrigin: origin }, 0)
  tl.set(beam, { scaleY: 0, transformOrigin: '50% 0%' }, 0)
  tl.set([q('[data-el="note"]'), q('[data-el="over"]'), q('[data-el="caption"]'), q('[data-el="stopped"]'), q('[data-el="stop-on"]'), ...pays, ...oks], { opacity: 0 }, 0)
  tl.set(taeo, { opacity: 0, x: 50 }, 0)

  // step 1: 긴 쿼리가 써진다. 게이지는 15%
  const t1 = typeCode(q, tl, 'code', '', F.bigQuery, at(0), 0.66)
  tl.to(q('[data-el="note"]'), { opacity: 1, duration: 0.08 }, t1)

  // step 2: 빛줄기가 표를 훑을수록 부하가 오르고 결제가 ⏸로 쌓인다
  const s2 = at(1)
  tl.to(beam, { scaleY: 1, duration: 0.6, ease: 'none' }, s2)
  tl.to(needle, { rotation: angle(0.98), svgOrigin: origin, duration: 0.6, ease: 'none' }, s2)
  tl.to(load, { v: 98, duration: 0.6, ease: 'none', onUpdate: write }, s2)
  pays.forEach((p, i) => tl.to(p, { opacity: 1, duration: 0.08 }, s2 + 0.14 + i * 0.15))
  tl.to(q('[data-el="seok"]'), { opacity: 0, duration: 0.12 }, s2 + 0.2)
  tl.to(taeo, { opacity: 1, x: 0, duration: 0.3 }, s2 + 0.34)
  tl.to([q('[data-el="over"]'), q('[data-el="caption"]')], { opacity: 1, duration: 0.1 }, s2 + 0.62)

  // step 3: [중지] → 빛줄기가 사라지고, 부하가 내려가며 결제가 차례로 ✓
  const s3 = at(2)
  tl.to(q('[data-el="stop-on"]'), { opacity: 1, duration: 0.05 }, s3)
  tl.to(q('[data-el="stopped"]'), { opacity: 1, duration: 0.08 }, s3 + 0.08)
  tl.to(beam, { opacity: 0, duration: 0.1 }, s3 + 0.1)
  tl.to(q('[data-el="over"]'), { opacity: 0, duration: 0.08 }, s3 + 0.12)
  tl.to(needle, { rotation: angle(0.15), svgOrigin: origin, duration: 0.38 }, s3 + 0.12)
  tl.to(load, { v: 15, duration: 0.38, onUpdate: write }, s3 + 0.12)
  waits.forEach((w, i) => {
    tl.to(w, { opacity: 0, duration: 0.05 }, s3 + 0.32 + i * 0.12)
    tl.to(oks[i], { opacity: 1, duration: 0.05 }, s3 + 0.32 + i * 0.12)
  })
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 계산대와 장부 정리
// ─────────────────────────────────────────────────────────────
const SLOT = (k: number) => 186 + 58 * k
const ENTER_X = 432
const SHOP_UP = -112
const LEDGER_MOVE = { x: 200, y: 154 - SHOP_UP }

export function AnalogyFig() {
  return (
    <Fig>
      <g data-el="shop">
        <Txt x={20} y={148} size={15} weight={800}>
          {F.counter}
        </Txt>
        <g transform="translate(66 0)">
          <Person seed="an-cashier" head={196} />
        </g>
        <RRect x={20} y={236} w={130} h={52} seed="an-counter" rough={0.5} fill="var(--surface)" />
        <RRect x={104} y={216} w={34} h={20} seed="an-reg" rough={0.4} fill="var(--surface)" />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} data-el="cust">
            <Person seed={`an-c${i}`} />
            <Badge x={0} y={180} status="ok" r={10} el="c-ok" />
            <Badge x={0} y={180} status="wait" r={10} el="c-wait" />
          </g>
        ))}
        <Txt x={SLOT(0) - 16} y={326} size={13.5} weight={700} el="legend-done">
          {F.legendDone}
        </Txt>
        <Txt x={SLOT(0) - 16} y={326} size={13.5} weight={700} el="legend-wait">
          {F.legendWait}
        </Txt>
        <g data-el="ledger">
          <RRect x={30} y={216} w={80} h={22} seed="an-ledger" rough={0.5} fill="var(--accent)" fillStyle="hachure" />
          <RPath d="M 34 222 L 106 222 M 34 228 L 106 228" seed="an-ledger-p" rough={0.3} strokeWidth={1} />
          <Txt x={70} y={308} size={13} weight={700} anchor="middle">
            {F.ledger}
          </Txt>
        </g>
      </g>

      <g data-el="office">
        <RLine x1={10} y1={250} x2={430} y2={250} seed="an-div" rough={0.3} dash="6 6" stroke="var(--muted)" />
        <Txt x={20} y={286} size={15} weight={800}>
          {F.office}
        </Txt>
        <RRect x={150} y={392} w={240} h={12} seed="an-desk" rough={0.5} fill="var(--surface)" />
        <RLine x1={170} y1={404} x2={170} y2={462} seed="an-leg1" rough={0.3} />
        <RLine x1={370} y1={404} x2={370} y2={462} seed="an-leg2" rough={0.3} />
        <RPath d="M 430 350 L 430 404 M 402 404 L 432 404 M 404 404 L 404 452 M 430 404 L 430 452" seed="an-chair" rough={0.4} />
      </g>
    </Fig>
  )
}

export const buildAnalogy: SceneBuild = (q, tl) => {
  const cs = q('[data-el="cust"]')
  const ok = cs.map((c) => c.querySelector('[data-el="c-ok"]')!)
  const wait = cs.map((c) => c.querySelector('[data-el="c-wait"]')!)
  const done = q('[data-el="legend-done"]')
  const waiting = q('[data-el="legend-wait"]')
  const ledger = q('[data-el="ledger"]')
  cs.forEach((c, i) => tl.set(c, { x: i < 4 ? SLOT(i) : ENTER_X, opacity: i < 4 ? 1 : 0 }, 0))
  tl.set([...ok, ...wait, done, waiting, q('[data-el="office"]')], { opacity: 0 }, 0)
  tl.set(ledger, { opacity: 0, y: -24 }, 0)

  /** 맨 앞 손님이 빠지고, 뒤 손님들이 한 칸씩 당겨지며, 새 손님이 줄 끝에 선다 */
  const advance = (leaving: number, t: number) => {
    tl.to(cs[leaving], { x: 128, y: -36, opacity: 0, duration: 0.12, ease: 'power1.in' }, t)
    for (let k = 1; k <= 4; k++) if (cs[leaving + k]) tl.to(cs[leaving + k], { x: SLOT(k - 1), opacity: 1, duration: 0.15 }, t + 0.02)
  }
  const flip = (from: Element[], to: Element[], i: number, t: number) => {
    tl.to(from[i], { opacity: 0, duration: 0.04 }, t)
    tl.to(to[i], { opacity: 1, duration: 0.04 }, t)
  }

  // step 1: 짧은 계산이 하나씩, 빠르게
  const s1 = at(0)
  tl.to([ok[0], done], { opacity: 1, duration: 0.05 }, s1 + 0.04)
  advance(0, s1 + 0.14)
  tl.to(ok[1], { opacity: 1, duration: 0.05 }, s1 + 0.34)
  advance(1, s1 + 0.44)
  tl.to(ok[2], { opacity: 1, duration: 0.05 }, s1 + 0.64)
  tl.to(ok[3], { opacity: 1, duration: 0.05 }, s1 + 0.72)

  // step 2: 장부가 놓이면 줄이 멈추고, 앞에서부터 ⏸
  const s2 = at(1)
  tl.to(ledger, { opacity: 1, y: 0, duration: 0.15 }, s2)
  flip(done, waiting, 0, s2 + 0.22)
  ;[2, 3, 4, 5].forEach((ci, k) => flip(ok, wait, ci, s2 + 0.25 + k * 0.1))

  // step 3: 장부는 뒤쪽 사무실로, 계산대 줄은 다시 움직인다
  const s3 = at(2)
  tl.to(q('[data-el="shop"]'), { y: SHOP_UP, duration: 0.2, ease: 'power2.inOut' }, s3)
  tl.to(q('[data-el="office"]'), { opacity: 1, duration: 0.15 }, s3 + 0.1)
  tl.to(ledger, { x: LEDGER_MOVE.x, y: LEDGER_MOVE.y, duration: 0.25, ease: 'power2.inOut' }, s3 + 0.24)
  flip(wait, ok, 2, s3 + 0.5)
  advance(2, s3 + 0.56)
  flip(waiting, done, 0, s3 + 0.6)
  ;[3, 4, 5].forEach((ci, k) => flip(wait, ok, ci, s3 + 0.62 + k * 0.07))
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 개념 — OLTP와 OLAP
// ─────────────────────────────────────────────────────────────
const OT = { x: 22, y: 100, rowH: 30 }
const OTCOLS: TCol[] = [
  { key: 'order_id', label: C.order_id, w: 70 },
  { key: 'product_id', label: C.product_id, w: 84 },
  { key: 'qty', label: C.qty, w: 36, align: 'end' },
  { key: 'st', label: '', w: 22 },
]
const OTW = 212
const otMid = (i: number) => OT.y + OT.rowH * (i + 1) + OT.rowH / 2
const POKES = [9, 3, 6].map((row, k) => ({ row, label: F.pokes[k] }))
const REVENUE = PRODUCTS.map((p) => ORDERS.filter((o) => o.product_id === p.product_id).reduce((a, o) => a + o.qty * o.price, 0))
const BAR = { x: 272, y: 176, gap: 64, h: 20, max: 150 }
const barW = (i: number) => (BAR.max * REVENUE[i]) / Math.max(...REVENUE)
const CMP = { x: 10, y: 96, cols: [116, 148, 156], headH: 46, rowH: 64 }

export function OltpFig() {
  const { mobile } = useEnv()
  const n = mobile ? 12 : 24
  const starts = scatter(n, 'ol-p', OT.x + 10, OT.y + OT.rowH, OTW - 20, OT.rowH * 10)
  const colX = CMP.cols.map((_, j) => CMP.x + CMP.cols.slice(0, j).reduce((a, w) => a + w, 0))
  const cmpW = CMP.cols.reduce((a, w) => a + w, 0)
  const cmpH = CMP.headH + CMP.rowH * F.compare.rows.length
  return (
    <Fig caption={F.compareNote}>
      <g data-el="cyl">
        <Cylinder cx={128} top={40} bottom={446} rx={118} ry={16} seed="ol-db" />
        <Txt x={128} y={84} size={15} weight={800} anchor="middle">
          {F.oltpDb}
        </Txt>
        <Table x={OT.x} y={OT.y} cols={OTCOLS} rows={ORDERS.map((o) => ({ ...o, st: '' }))} rowH={OT.rowH} el="ot" seed="ol-t" />
        {POKES.map((p) => (
          <rect key={p.row} data-el="poke-hl" x={OT.x} y={OT.y + OT.rowH * (p.row + 1)} width={OTW} height={OT.rowH} style={{ fill: 'var(--accent)', fillOpacity: 0.22 }} />
        ))}
      </g>
      <rect data-el="beam" x={OT.x} y={OT.y} width={OTW} height={OT.rowH * 11} style={{ fill: 'var(--accent)', opacity: 0.26 }} />
      {POKES.map((p) => (
        <g key={p.row} data-el="poke">
          <RArrow x1={268} y1={otMid(p.row)} x2={236} y2={otMid(p.row)} seed={`ol-a${p.row}`} strokeWidth={2.2} />
          <Txt x={276} y={otMid(p.row) - 3} size={13.5} weight={700}>
            {p.label[0]}
          </Txt>
          <Txt x={276} y={otMid(p.row) + 15} size={12.5} muted>
            {p.label[1]}
          </Txt>
        </g>
      ))}
      {POKES.map((p) => (
        <Badge key={p.row} x={OT.x + OTW - 12} y={otMid(p.row)} status="ok" r={9} el="poke-ok" />
      ))}

      <g data-el="olap">
        <Txt x={BAR.x} y={110} size={20} weight={800}>
          {F.olap}
        </Txt>
        <Txt x={BAR.x} y={136} size={13.5} muted>
          {F.salesByProduct}
        </Txt>
        {PRODUCTS.map((p, i) => (
          <Txt key={p.product_id} x={BAR.x} y={BAR.y + i * BAR.gap - 8} size={13.5} weight={600}>
            {p.name}
          </Txt>
        ))}
      </g>
      {PRODUCTS.map((p, i) => (
        <rect key={p.product_id} data-el="bar" x={BAR.x} y={BAR.y + i * BAR.gap} width={barW(i)} height={BAR.h} style={{ fill: 'var(--accent)' }} />
      ))}
      {starts.map(([x, y], i) => {
        const b = i % PRODUCTS.length
        const tx = BAR.x + 6 + ((i * 37) % Math.max(8, barW(b) - 12))
        const ty = BAR.y + b * BAR.gap + BAR.h / 2
        return <circle key={i} data-el="olap-p" data-dx={tx - x} data-dy={ty - y} cx={x} cy={y} r={4} style={{ fill: 'var(--accent)' }} />
      })}

      <g data-el="cmp">
        <g data-el="cmp-frame">
          <rect x={CMP.x} y={CMP.y} width={cmpW} height={cmpH} style={{ fill: 'var(--surface)' }} />
          <RRect x={CMP.x} y={CMP.y} w={cmpW} h={cmpH} seed="ol-cmp" rough={0.4} />
          {F.compare.rows.map((_, r) => (
            <RLine key={r} x1={CMP.x} y1={CMP.y + CMP.headH + CMP.rowH * r} x2={CMP.x + cmpW} y2={CMP.y + CMP.headH + CMP.rowH * r} seed={`ol-cr${r}`} rough={0.3} strokeWidth={r === 0 ? 1.6 : 0.9} />
          ))}
          {colX.slice(1).map((x, j) => (
            <RLine key={j} x1={x} y1={CMP.y} x2={x} y2={CMP.y + cmpH} seed={`ol-cc${j}`} rough={0.3} strokeWidth={0.9} />
          ))}
          {F.compare.head.map((h, j) => (
            <Txt key={j} x={colX[j] + CMP.cols[j] / 2} y={CMP.y + 29} size={14.5} weight={800} anchor="middle">
              {h}
            </Txt>
          ))}
        </g>
        {F.compare.rows.map((cells, r) => (
          <g key={r} data-el="cmp-row">
            {cells.map((lines, j) =>
              lines.map((l, k) => (
                <Txt key={`${j}${k}`} x={colX[j] + 12} y={CMP.y + CMP.headH + CMP.rowH * r + CMP.rowH / 2 + 5 + (k - (lines.length - 1) / 2) * 20} size={13.5} weight={j === 0 ? 700 : 500} muted={j === 0}>
                  {l}
                </Txt>
              )),
            )}
          </g>
        ))}
        <g data-el="cmp-load">
          <Gauge x={44} y={CMP.y + cmpH + 64} r={26} label="" value={0.92} seed="ol-g" />
          <Txt x={84} y={CMP.y + cmpH + 62} size={14.5} weight={700}>
            {F.sameDbLoad}
          </Txt>
        </g>
      </g>
    </Fig>
  )
}

export const buildOltp: SceneBuild = (q, tl) => {
  const pokes = q('[data-el="poke"]')
  const hls = q('[data-el="poke-hl"]')
  const oks = q('[data-el="poke-ok"]')
  const beam = q('[data-el="beam"]')
  const bars = q('[data-el="bar"]')
  const ps = q('[data-el="olap-p"]')
  const rowsCmp = q('[data-el="cmp-row"]')
  tl.set([...pokes, ...hls, ...oks, q('[data-el="olap"]'), ...ps, q('[data-el="cmp"]'), q('[data-el="caption"]')], { opacity: 0 }, 0)
  tl.set(pokes, { x: 14 }, 0)
  tl.set(beam, { scaleY: 0, transformOrigin: '50% 0%' }, 0)
  tl.set(bars, { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.set([q('[data-el="cmp-frame"]'), ...rowsCmp, q('[data-el="cmp-load"]')], { opacity: 0 }, 0)

  // step 1: 짧은 화살표가 번갈아 행 하나씩 찍는다
  pokes.forEach((p, k) => {
    const t = at(0) + 0.05 + k * 0.22
    tl.to(p, { opacity: 1, x: 0, duration: 0.08 }, t)
    tl.to(hls[k], { opacity: 1, duration: 0.04 }, t + 0.06)
    tl.to(hls[k], { opacity: 0.7, duration: 0.1 }, t + 0.12)
    tl.to(oks[k], { opacity: 1, duration: 0.05 }, t + 0.08)
  })

  // step 2: 빛줄기가 모든 행을 훑고, 값이 막대 4개로 모인다
  const s2 = at(1)
  tl.to([...pokes, ...hls, ...oks], { opacity: 0, duration: 0.1 }, s2)
  tl.to(beam, { scaleY: 1, duration: 0.34, ease: 'none' }, s2 + 0.08)
  tl.to(q('[data-el="olap"]'), { opacity: 1, duration: 0.1 }, s2 + 0.4)
  tl.to(ps, { opacity: 1, duration: 0.03 }, s2 + 0.42)
  ps.forEach((p) => {
    const e = p as SVGElement
    tl.to(p, { x: Number(e.dataset.dx), y: Number(e.dataset.dy), duration: 0.24, ease: 'power2.inOut' }, s2 + 0.44)
  })
  tl.to(ps, { opacity: 0, duration: 0.05 }, s2 + 0.7)
  tl.to(bars, { scaleX: 1, duration: 0.2, stagger: 0.03 }, s2 + 0.48)

  // step 3: 비교 표가 한 줄씩 채워지고, 마지막에 부하 표시
  const s3 = at(2)
  tl.to([q('[data-el="cyl"]'), beam, q('[data-el="olap"]'), ...bars], { opacity: 0, duration: 0.12 }, s3)
  tl.to([q('[data-el="cmp"]'), q('[data-el="cmp-frame"]')], { opacity: 1, duration: 0.1 }, s3 + 0.1)
  rowsCmp.forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.1 }, s3 + 0.22 + i * 0.14))
  tl.to([q('[data-el="cmp-load"]'), q('[data-el="caption"]')], { opacity: 1, duration: 0.1 }, s3 + 0.68)
}

// ─────────────────────────────────────────────────────────────
// 장면 7. 해결 — 운영 DB는 계산대에 맡기기
// ─────────────────────────────────────────────────────────────
const BOX = { x: 252, y: 122, w: 108, h: 96 }
/** 연필 점선 상자: 짧은 선분을 둘레를 따라 순서대로 늘어놓는다 */
const DASHES = (() => {
  const { x, y, w, h } = BOX
  const pts: [number, number][] = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y],
  ]
  const out: [number, number, number, number][] = []
  for (let s = 0; s < 4; s++) {
    const [ax, ay] = pts[s]
    const [bx, by] = pts[s + 1]
    const len = Math.hypot(bx - ax, by - ay)
    for (let d = 0; d < len; d += 13) {
      const e = Math.min(d + 8, len)
      out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len, ax + ((bx - ax) * e) / len, ay + ((by - ay) * e) / len])
    }
  }
  return out
})()

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <Fig>
        <g data-el="rules">
          <RRect x={70} y={24} w={300} h={180} seed="so-scr" rough={0.5} fill="var(--surface)" />
          <RPath d="M 50 222 L 70 204 L 370 204 L 390 222 Z" seed="so-base" rough={0.5} fill="var(--surface)" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={92} y={52 + i * 22} width={[120, 96, 132, 70][i]} height={8} rx={3} style={{ fill: 'var(--edge)' }} />
          ))}
          <Gauge x={300} y={150} r={36} label={F.gaugeLabel} value={0.15} seed="so-g" />
          <Txt x={300} y={134} size={14} weight={800} anchor="middle">
            {F.pct(15)}
          </Txt>
          {F.rules.map((r, i) => (
            <g key={r} data-el="rule">
              <RRect x={40} y={244 + i * 72} w={360} h={56} seed={`so-n${i}`} rough={0.6} fill="color-mix(in srgb, var(--accent) 14%, var(--surface))" />
              <Txt x={60} y={244 + i * 72 + 34} size={15} weight={700}>
                {r}
              </Txt>
            </g>
          ))}
        </g>

        <g data-el="paper">
          <RRect x={56} y={40} w={328} h={250} seed="so-paper" rough={0.8} fill="var(--surface)" />
          <Node x={160} y={170} w={112} h={96} kind="store" label={F.opsDb} seed="so-db" />
          {DASHES.map(([x1, y1, x2, y2], i) => (
            <line key={i} data-el="dash" x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--line)' }} strokeWidth={2} strokeLinecap="round" />
          ))}
          <Txt x={BOX.x + BOX.w / 2} y={BOX.y + BOX.h / 2 + 6} size={17} weight={800} anchor="middle" el="ask">
            {F.analytics}
          </Txt>
          <g transform="translate(64 318) scale(0.95)">
            <JuniFace mood="focus" seed="so-juni" />
          </g>
          <Txt x={111} y={430} size={13} weight={600} anchor="middle">
            {F.juniName}
          </Txt>
          <Initial x={330} y={370} r={24} initial={F.seokInitial} name={F.seokName} seed="so-seok" />
        </g>
      </Fig>

      <div data-el="mapwrap" className="absolute inset-0">
        <p className="absolute left-0 top-0 font-mono text-xs text-muted md:text-sm">{F.mapCaption}</p>
        <PipelineMap t={1} from={0} className="absolute inset-0" label={F.mapCaption} />
        <svg data-el="warn-layer" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="diagram pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <g data-el="warn">
            {[F.loadWarn, F.directLoadWarn].map((t, i) => {
              const w = i === 0 ? 120 : 196
              return (
                <g key={t} data-el={i === 0 ? 'warn-s' : 'warn-l'}>
                  <rect x={-w / 2} y={-14} width={w} height={28} rx={6} style={{ fill: 'var(--surface)', stroke: 'var(--fail)' }} strokeWidth={1.6} />
                  <path d={`M ${-w / 2 + 12} 6 A 11 11 0 0 1 ${-w / 2 + 34} 6`} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={2} />
                  <line x1={-w / 2 + 23} y1={6} x2={-w / 2 + 32} y2={-1} style={{ stroke: 'var(--fail)' }} strokeWidth={2.2} strokeLinecap="round" />
                  <text x={-w / 2 + 42} y={5} className="t-sans" style={{ fontSize: 13, fontWeight: 800, fill: 'var(--fail)' }}>
                    {t}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl) => {
  const notes = q('[data-el="rule"]')
  const mapwrap = q('[data-el="mapwrap"]')
  const dashes = q('[data-el="dash"]')
  tl.set(notes, { opacity: 0, y: -10 }, 0)
  tl.set([mapwrap, q('[data-el="paper"]'), ...dashes, q('[data-el="ask"]')], { opacity: 0 }, 0)

  // step 1: 포스트잇이 ① → ② → ③ 순서로 붙는다
  notes.forEach((n, i) => tl.to(n, { opacity: 1, y: 0, duration: 0.12 }, at(0) + 0.06 + i * 0.2))

  // step 2: 맵에 운영 DB가 생기고, '직접 쿼리' 점선에 부하 경고
  const s2 = at(1)
  tl.to(q('[data-el="rules"]'), { opacity: 0, duration: 0.12 }, s2)
  tl.to(mapwrap, { opacity: 1, duration: 0.1 }, s2 + 0.04)
  const map = q('[data-el="map"]')[0] as SVGSVGElement | undefined
  const label = q('[data-edge="oltp>bi"] text')[0]
  const warn = q('[data-el="warn"]')
  const box = (id: string) => {
    const r = q(`[data-node="${id}"] .node-focus`)[0]
    const n = (a: string) => Number(r?.getAttribute(a))
    return r ? { x: n('x'), y: n('y'), w: n('width'), h: n('height'), cx: n('x') + n('width') / 2, cy: n('y') + n('height') / 2 } : null
  }
  // 맵의 기본 뷰박스는 HUD용 비율이라 세로 배치(모바일)에서 위아래 여백이 크다. 이 장면에서는 노드 4개에 꼭 맞춰 줌한다
  const all = ['app', 'csv', 'bi', 'oltp'].map(box)
  if (map && all.every(Boolean)) {
    const b = all as NonNullable<ReturnType<typeof box>>[]
    const x0 = Math.min(...b.map((r) => r.x)) - 24
    const y0 = Math.min(...b.map((r) => r.y)) - 24
    map.dataset.vbTo = `${x0} ${y0} ${Math.max(...b.map((r) => r.x + r.w)) + 24 - x0} ${Math.max(...b.map((r) => r.y + r.h)) + 24 - y0}`
  }
  mapTransition(q, tl, s2 + 0.08, { dur: 0.6 })
  // 스토리보드 순서: 앱에서 새 실선이 뻗고 → 그 끝에 운영 DB가 그려지고 → 운영 DB ⇢ 노트북 경고 점선
  // (mapTransition은 새 노드·선을 한꺼번에 켠다. 자식 요소의 opacity·drawSVG로 순서만 나눈다)
  const newShaft = q('[data-edge="app>oltp"] [data-el="shaft"] path')
  const newHead = q('[data-edge="app>oltp"] [data-el="head"]')
  const dbOutline = q('[data-node="oltp"] path')
  const dbText = q('[data-node="oltp"] text')
  const warnLine = q('[data-edge="oltp>bi"] > *')
  tl.set(newShaft, { drawSVG: '0%' }, 0)
  tl.set([...newHead, ...dbText, ...warnLine], { opacity: 0 }, 0)
  tl.set(dbOutline, { drawSVG: '0%' }, 0)
  tl.to(newShaft, { drawSVG: '100%', duration: 0.14, ease: 'none' }, s2 + 0.4)
  tl.to(newHead, { opacity: 1, duration: 0.03 }, s2 + 0.53)
  tl.to(dbOutline, { drawSVG: '100%', duration: 0.1, ease: 'none' }, s2 + 0.54)
  tl.to(dbText, { opacity: 1, duration: 0.05 }, s2 + 0.6)
  tl.to(warnLine, { opacity: 1, duration: 0.06 }, s2 + 0.64)
  const db = box('oltp')
  const bi = box('bi')
  if (map && label && db && bi) {
    // 경고 표시는 점선의 운영 DB 쪽 1/4 지점. 세로 배치(모바일)에서 '직접 쿼리' 라벨이 다른 노드에 가려지면 표시에 함께 적는다
    const lx = Number(label.getAttribute('x'))
    const ly = Number(label.getAttribute('y'))
    const hidden = ['app', 'csv'].some((id) => {
      const r = box(id)
      return r !== null && lx > r.x && lx < r.x + r.w && ly > r.y && ly < r.y + r.h
    })
    tl.set(q('[data-el="warn-layer"]'), { attr: { viewBox: map.dataset.vbTo ?? '0 0 100 100' } }, 0)
    // 긴 표시는 앱 → CSV 화살표를 가리지 않게 점선 오른쪽으로 비켜 둔다
    tl.set(warn, { x: db.cx + (bi.cx - db.cx) * 0.25 + (hidden ? 30 : 0), y: db.cy + (bi.cy - db.cy) * 0.25, opacity: 0 }, 0)
    tl.set(q(hidden ? '[data-el="warn-s"]' : '[data-el="warn-l"]'), { opacity: 0 }, 0)
    tl.to(warn, { opacity: 1, duration: 0.1 }, s2 + 0.7)
  }

  // step 3: 연필이 운영 DB 옆에 점선 상자를 그리고 '분석용?'을 쓴다
  const s3 = at(2)
  tl.to(mapwrap, { opacity: 0, duration: 0.12 }, s3)
  tl.to(q('[data-el="paper"]'), { opacity: 1, duration: 0.12 }, s3 + 0.08)
  tl.to(dashes, { opacity: 1, duration: 0.001, stagger: 0.36 / dashes.length, ease: 'none' }, s3 + 0.24)
  tl.to(q('[data-el="ask"]'), { opacity: 1, duration: 0.1 }, s3 + 0.66)
}
