import { ch4, ORDERS4, SALES6 } from '../../content/chapters/ch4'
import { T } from '../../content/map'
import { PEOPLE } from '../../content/people'
import type { Mood } from '../../content/types'
import { Badge, Gauge, Node } from '../../components/diagram'
import { Fig, Txt, countTo, won } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { PipelineMap, mapTransition } from '../../components/PipelineMap'
import { RArrow, REllipse, RLine, RPath, RRect } from '../../components/sketch'
import { at, type Q, type SceneBuild } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'

const F = ch4.figures

// 맵 노드 라벨은 map.ts에서(Ch3 끝 → Ch4 끝)
const N3 = Object.fromEntries(mapStateAt(T.ch3).nodes.map((n) => [n.id, n]))
const N4 = Object.fromEntries(mapStateAt(T.ch4).nodes.map((n) => [n.id, n]))
const DB_LABEL = N3.warehouse.label
const WH_LABEL = N4.warehouse.label
const BI_LABEL = N4.bi.label

// ─────────────────────────────────────────────────────────────
// 공통 도구
// ─────────────────────────────────────────────────────────────
type Els = Element[]
/** data-el 이름 여러 개로 한꺼번에 찾기 */
const pick =
  (q: Q) =>
  (...names: string[]): Els =>
    names.flatMap((n) => q(`[data-el="${n}"]`))
/** 초기 상태: DOM에도 바로 적용해 첫 스크롤 전·0초로 되감을 때도 step 1 이전 그림이 되게 한다 */
const init = (tl: gsap.core.Timeline, targets: Els | Element, vars: gsap.TweenVars) => {
  if (Array.isArray(targets) && !targets.length) return
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}
const num = (el: Element, key: string) => Number((el as SVGElement).dataset[key] ?? 0)
const paths = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
const shafts = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
const heads = (els: Els) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))
/** 화살표를 선 → 화살촉 순서로 그린다 */
function drawArrows(tl: gsap.core.Timeline, els: Els, t: number, d = 0.12) {
  init(tl, shafts(els), { drawSVG: '0%' })
  init(tl, heads(els), { opacity: 0 })
  tl.to(shafts(els), { drawSVG: '100%', duration: d, ease: 'none' }, t)
  tl.to(heads(els), { opacity: 1, duration: 0.03 }, t + d - 0.02)
}
/** 숫자를 여러 구간에 걸쳐 바꾼다(합계가 도착할 때마다 쌓이는 카운터) */
function countSeq(tl: gsap.core.Timeline, el: Element | undefined, fmt: (n: number) => string, from: number, segs: [number, number, number][]) {
  if (!el) return
  const o = { v: from }
  el.textContent = fmt(from)
  const write = () => (el.textContent = fmt(Math.round(o.v)))
  for (const [to, t, d] of segs) tl.to(o, { v: to, duration: d, ease: 'none', onUpdate: write }, t)
}
const n0 = (n: number) => n.toLocaleString('ko-KR')
/** 글자 폭 어림(한글 0.88em, 숫자 0.58em — 본문 글꼴 기준) */
const tw = (s: string, size: number) =>
  Array.from(s).reduce((a, c) => a + (/[가-힣]/.test(c) ? size * 0.88 : /\d/.test(c) ? size * 0.58 : /[ ,.]/.test(c) ? size * 0.26 : size * 0.6), 0)

interface Box {
  x: number
  y: number
  w: number
  h: number
}
/** 중심 기준 상자의 테두리와, 중심에서 (tx,ty)로 가는 선이 만나는 점 */
function edge(b: Box, tx: number, ty: number, gap = 4): [number, number] {
  const dx = tx - b.x
  const dy = ty - b.y
  if (!dx && !dy) return [b.x, b.y]
  const s = Math.min(Math.abs((b.w / 2 + gap) / (dx || 1e-9)), Math.abs((b.h / 2 + gap) / (dy || 1e-9)))
  return [b.x + dx * s, b.y + dy * s]
}
const link = (a: Box, b: Box, gap = 4): [number, number, number, number] => [...edge(a, b.x, b.y, gap), ...edge(b, a.x, a.y, gap + 3)]

type Visitor = keyof typeof F.initials
/** 인물: 머리(주니는 표정 있는 얼굴, 다른 인물은 이름 첫 글자) + 어깨, 위에 이름 */
function Person({
  who,
  x,
  y,
  r = 19,
  mood,
  body = 3.4,
  name = true,
  seed,
}: {
  who: Visitor | 'juni'
  x: number
  y: number
  r?: number
  mood?: Mood
  body?: number
  name?: boolean
  seed: string
}) {
  const b = y + r * body
  const s = r / 31
  return (
    <g>
      <RPath
        d={`M ${x - r * 1.5} ${b} C ${x - r * 1.45} ${y + r * 1.7}, ${x - r * 0.7} ${y + r * 1.1}, ${x} ${y + r * 1.1} C ${x + r * 0.7} ${y + r * 1.1}, ${x + r * 1.45} ${y + r * 1.7}, ${x + r * 1.5} ${b}`}
        rough={0.4}
        seed={`${seed}-b`}
        fill="var(--surface)"
      />
      {who === 'juni' ? (
        <g transform={`translate(${x - 50 * s} ${y - 52 * s}) scale(${s})`}>
          <JuniFace mood={mood} seed={`${seed}-f`} />
        </g>
      ) : (
        <>
          <REllipse cx={x} cy={y} w={r * 2} h={r * 2} rough={0.4} seed={`${seed}-h`} fill="var(--surface)" />
          <Txt x={x} y={y + r * 0.36} size={r * 0.95} weight={800} anchor="middle">
            {F.initials[who]}
          </Txt>
        </>
      )}
      {name && (
        <Txt x={x} y={y - r - 9} size={13} weight={650} anchor="middle">
          {PEOPLE[who].name}
        </Txt>
      )}
    </g>
  )
}

/** 손글씨 ≠ (획 셋을 차례로 그린다) */
function Neq({ x, y, el = 'neq' }: { x: number; y: number; el?: string }) {
  return (
    <g data-el={el}>
      {[`M ${x - 11} ${y - 6} L ${x + 11} ${y - 6}`, `M ${x - 11} ${y + 6} L ${x + 11} ${y + 6}`, `M ${x + 7} ${y - 17} L ${x - 7} ${y + 17}`].map((d, i) => (
        <g key={i} data-el={`${el}-s`}>
          <RPath d={d} seed={`${el}${i}${x}`} rough={0.5} strokeWidth={2.4} />
        </g>
      ))}
    </g>
  )
}

/** 반원 게이지 + 초록 구간(0~0.35) */
function GaugeOk({ x, y, r, label, el, value, seed }: { x: number; y: number; r: number; label: string; el: string; value: number; seed: string }) {
  const p = (a: number, rr: number) => [x + rr * Math.cos(Math.PI + a * Math.PI), y + rr * Math.sin(Math.PI + a * Math.PI)]
  const [sx, sy] = p(0, r - 7)
  const [ex, ey] = p(0.35, r - 7)
  return (
    <g>
      <path d={`M ${sx} ${sy} A ${r - 7} ${r - 7} 0 0 1 ${ex} ${ey}`} style={{ stroke: 'var(--ok)', fill: 'none' }} strokeWidth={6} strokeLinecap="round" />
      <Gauge x={x} y={y} r={r} label={label} el={el} value={value} seed={seed} />
    </g>
  )
}
const angle = (v: number) => -90 + v * 180

// ─────────────────────────────────────────────────────────────
// 회의실(오프닝 그림 · 장면 6 step 4)
// ─────────────────────────────────────────────────────────────
const ROOM = { headY: 228, tableY: 298 }
const ROOM_PEOPLE: [Visitor | 'juni', number][] = [
  ['ceo', 62],
  ['sora', 146],
  ['minjae', 294],
  ['juni', 380],
]
const RCARD = { w: 112, h: 46, y: 252, x: [146, 294] }
const TILE = { x: [68, 228], y: 50, w: 144, h: 108 }

export function MeetingRoom({ tiles = false }: { tiles?: boolean }) {
  return (
    <g>
      {/* 벽 스크린 */}
      <RRect x={52} y={16} w={336} h={154} seed="room-scr" rough={0.45} fill="var(--surface)" />
      {tiles && (
        <g data-el="tiles">
          <Txt x={68} y={40} size={13} weight={700} muted>
            {BI_LABEL}
          </Txt>
          <Txt x={372} y={40} size={12.5} anchor="end" muted>
            {F.fake}
          </Txt>
          {TILE.x.map((x, k) => (
            <g key={k}>
              <RRect x={x} y={TILE.y} w={TILE.w} h={TILE.h} seed={`tile${k}`} rough={0.35} />
              <g data-el="tile-in">
                <Txt x={x + 12} y={TILE.y + 24} size={15} weight={800}>
                  {F.tiles[k]}
                </Txt>
                <Badge x={x + TILE.w - 16} y={TILE.y + 19} status="ok" r={9} />
                <Txt x={x + 12} y={TILE.y + 94} size={12.5} weight={600} style={{ textDecoration: 'underline' }}>
                  {F.seeDef}
                </Txt>
              </g>
            </g>
          ))}
        </g>
      )}
      {/* 사람들 */}
      {ROOM_PEOPLE.map(([who, x]) => (
        <Person key={who} who={who} x={x} y={ROOM.headY} mood={tiles ? 'proud' : 'panic'} seed={`room-${who}`} />
      ))}
      {/* 주니의 노트북(뒷면) */}
      <RRect x={356} y={262} w={48} h={36} seed="room-laptop" rough={0.4} fill="var(--surface)" />
      <REllipse cx={380} cy={280} w={8} h={8} rough={0.3} seed="room-laptop-dot" />
      {/* 테이블 */}
      <RRect x={14} y={ROOM.tableY} w={412} h={14} seed="room-table" rough={0.5} fill="var(--surface)" />
      <RLine x1={40} y1={312} x2={40} y2={372} seed="room-leg1" rough={0.4} />
      <RLine x1={400} y1={312} x2={400} y2={372} seed="room-leg2" rough={0.4} />
      {/* 숫자 카드와 ≠ */}
      {RCARD.x.map((x, k) => (
        <g key={k} data-el="rcard" data-dx={TILE.x[k] + TILE.w / 2 - x} data-dy={TILE.y + 58 - (RCARD.y + RCARD.h / 2)}>
          <g data-el="rcard-frame">
            <RRect x={x - RCARD.w / 2} y={RCARD.y} w={RCARD.w} h={RCARD.h} seed={`rcard${k}`} rough={0.4} fill="var(--surface)" />
          </g>
          <Txt x={x} y={RCARD.y + 29} size={14.5} weight={800} anchor="middle">
            {won(F.revenues[k])}
          </Txt>
        </g>
      ))}
      <Neq x={220} y={RCARD.y + 22} el="rneq" />
      <Txt x={220} y={340} size={12.5} anchor="middle" muted el="room-fake">
        {F.fake}
      </Txt>
    </g>
  )
}

/** 오프닝 아래 회의실 그림(스크롤 연동 아님) */
export function MeetingFig() {
  return (
    <figure role="img" aria-label={F.meetingAlt} className="mx-auto w-full max-w-[34rem] pb-[6svh]">
      <Fig viewBox="0 0 440 380">
        <MeetingRoom />
      </Fig>
    </figure>
  )
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 같은 이름, 다른 계산
// ─────────────────────────────────────────────────────────────
const PDB: Box = { x: 220, y: 70, w: 156, h: 62 }
const PCARD = { x: [112, 328], y: 228, w: 184, h: 80 }
const TB = { x: 15, y: 46, rowH: 36 }
const TCOLS = [
  { key: 'id', w: 50 },
  { key: 'price', w: 182, end: true },
  { key: 'ship', w: 62, end: true },
  { key: 'disc', w: 58, end: true },
  { key: 'status', w: 58 },
] as const
type TKey = (typeof TCOLS)[number]['key']
const TW = TCOLS.reduce((a, c) => a + c.w, 0)
const colX = (k: TKey) =>
  TB.x +
  TCOLS.slice(
    0,
    TCOLS.findIndex((c) => c.key === k),
  ).reduce((a, c) => a + c.w, 0)
const colW = (k: TKey) => TCOLS.find((c) => c.key === k)!.w
const isEnd = (k: TKey) => 'end' in TCOLS.find((c) => c.key === k)!
const cellTx = (k: TKey) => (isEnd(k) ? colX(k) + colW(k) - 10 : colX(k) + 10)
const rowTop = (i: number) => TB.y + TB.rowH * (i + 1)
const rowBase = (i: number) => rowTop(i) + 23.5
const SUMY = [242, 350]
const MID_Y = 326
const SORA_ROWS = ORDERS4.map((r) => r.price + r.ship)
const MINJAE_ROWS = ORDERS4.map((r) => (r.counted ? r.price - r.disc : 0))
const SORA_TOTAL = SORA_ROWS.reduce((a, b) => a + b, 0)
const MINJAE_TOTAL = MINJAE_ROWS.reduce((a, b) => a + b, 0)
const SUM_VX = [TB.x + 16 + tw(F.soraSum, 15) + 2, TB.x + 16 + tw(F.minjaeSum, 15) + 2]

export function ProblemFig() {
  const { mobile } = useEnv()
  const labels = { ...F.cols, price: mobile ? F.priceShort : F.cols.price }
  const H = TB.rowH * (ORDERS4.length + 1)
  return (
    <Fig>
      {/* step 1: 같은 DB에서 두 갈래 */}
      <g data-el="s1">
        <Node x={PDB.x} y={PDB.y} w={PDB.w} h={PDB.h} label={DB_LABEL} kind="store" seed="p-db" scale={1.05} />
        {PCARD.x.map((x, k) => {
          const sx = PDB.x + (k ? 22 : -22)
          return <RArrow key={k} x1={sx} y1={PDB.y + PDB.h / 2 + 6} x2={x + (k ? -26 : 26)} y2={PCARD.y - 34} seed={`p-arr${k}`} rough={0.5} />
        })}
        {PCARD.x.map((x, k) => (
          <g key={k}>
            <Txt x={x} y={PCARD.y - 12} size={13.5} weight={700} anchor="middle">
              {k ? F.minjaeQuery : F.soraQuery}
            </Txt>
            <RRect x={x - PCARD.w / 2} y={PCARD.y} w={PCARD.w} h={PCARD.h} seed={`p-card${k}`} rough={0.45} fill="var(--surface)" />
            <Txt x={x} y={PCARD.y + 28} size={14} anchor="middle" muted>
              {F.revenue}
            </Txt>
            <Txt x={x} y={PCARD.y + 62} size={22} weight={800} anchor="middle" el={`p-v${k}`}>
              {won(F.revenues[k])}
            </Txt>
          </g>
        ))}
        <Neq x={220} y={PCARD.y + 42} />
        <Txt x={220} y={PCARD.y + PCARD.h + 30} size={12.5} anchor="middle" muted>
          {F.fake}
        </Txt>
        {PCARD.x.map((x, k) =>
          Array.from({ length: 7 }, (_, i) => {
            const sx = PDB.x + (k ? 22 : -22)
            const sy = PDB.y + PDB.h / 2 + 6
            return (
              <circle
                key={`${k}-${i}`}
                data-el="pp"
                data-k={k}
                data-i={i}
                data-dx={x + (k ? -26 : 26) - sx}
                data-dy={PCARD.y - 34 - sy}
                cx={sx}
                cy={sy}
                r={4.5}
                style={{ fill: 'var(--accent)' }}
              />
            )
          }),
        )}
      </g>

      {/* step 2~3: 주문 4건 표 */}
      <g data-el="s2">
        <Txt x={TB.x} y={TB.y - 12} size={13} muted>
          {F.sample}
        </Txt>
        <rect x={TB.x} y={TB.y} width={TW} height={H} style={{ fill: 'var(--surface)' }} />
        {ORDERS4.map((_, i) => (
          <rect key={i} data-el="hl-r" x={TB.x} y={rowTop(i)} width={TW} height={TB.rowH} style={{ fill: 'var(--accent)', opacity: 0 }} />
        ))}
        {(['price', 'ship'] as const).map((k) => (
          <rect key={k} data-el="hl-h" x={colX(k)} y={TB.y} width={colW(k)} height={TB.rowH} style={{ fill: 'var(--accent)', opacity: 0 }} />
        ))}
        {(['disc', 'ship'] as const).map((k) => (
          <rect key={k} data-el={`gray-${k}`} x={colX(k)} y={TB.y} width={colW(k)} height={H} style={{ fill: 'var(--wait)', opacity: 0 }} />
        ))}
        <RRect x={TB.x} y={TB.y} w={TW} h={H} seed="p-t-o" rough={0.4} />
        <RLine x1={TB.x} y1={TB.y + TB.rowH} x2={TB.x + TW} y2={TB.y + TB.rowH} seed="p-t-h" rough={0.4} />
        {TCOLS.slice(1).map((c) => (
          <RLine key={c.key} x1={colX(c.key)} y1={TB.y} x2={colX(c.key)} y2={TB.y + H} seed={`p-t-v${c.key}`} rough={0.3} strokeWidth={0.9} />
        ))}
        {TCOLS.map((c) => (
          <text
            key={c.key}
            data-el={`h-${c.key}`}
            x={cellTx(c.key)}
            y={TB.y + 23.5}
            textAnchor={'end' in c ? 'end' : 'start'}
            className="t-sans"
            style={{ fontSize: 13, fontWeight: 750 }}
          >
            {labels[c.key]}
          </text>
        ))}
        {ORDERS4.map((r, i) => (
          <g key={r.id}>
            <Txt x={cellTx('id')} y={rowBase(i)} size={14} weight={650}>
              {r.id}
            </Txt>
            <Txt x={cellTx('price')} y={rowBase(i)} size={14} anchor="end" el={r.counted ? 'p-orig' : undefined}>
              {n0(r.price)}
            </Txt>
            {r.counted && (
              <Txt x={cellTx('price')} y={rowBase(i)} size={13.5} anchor="end" el="p-calc">
                {`${n0(r.price)} − ${n0(r.disc)} = `}
                <tspan style={{ fontWeight: 800 }}>{n0(r.price - r.disc)}</tspan>
              </Txt>
            )}
            <Txt x={cellTx('ship')} y={rowBase(i)} size={14} anchor="end" el="c-ship">
              {n0(r.ship)}
            </Txt>
            <Txt x={cellTx('disc')} y={rowBase(i)} size={14} anchor="end" el="c-disc">
              {n0(r.disc)}
            </Txt>
            <Txt x={cellTx('status')} y={rowBase(i)} size={14}>
              {r.status}
            </Txt>
            {/* step 2: 상품 금액 + 배송비가 입자가 되어 합계로 */}
            <text
              data-el="vchip"
              data-dx={SUM_VX[0] - (colX('price') + 10)}
              data-dy={SUMY[0] + 26 - rowBase(i)}
              x={colX('price') + 10}
              y={rowBase(i)}
              className="t-sans"
              style={{ fontSize: 14, fontWeight: 800, fill: 'var(--accent)' }}
            >
              {n0(SORA_ROWS[i])}
            </text>
            {/* step 3: 할인 값이 금액 칸으로 이동해 빠진다 */}
            {r.counted && (
              <text
                data-el="dfly"
                data-dx={cellTx('price') - tw(` = ${n0(r.price - r.disc)}`, 13.5) - cellTx('disc')}
                x={cellTx('disc')}
                y={rowBase(i)}
                textAnchor="end"
                className="t-sans"
                style={{ fontSize: 14, fontWeight: 800, fill: 'var(--accent)' }}
              >
                {n0(r.disc)}
              </text>
            )}
          </g>
        ))}
        {/* step 3: 제외 행 */}
        {ORDERS4.map((r, i) =>
          r.counted ? null : (
            <g key={r.id}>
              <path
                data-el="strike"
                d={`M ${TB.x + 4} ${rowTop(i) + TB.rowH / 2} L ${TB.x + TW - 4} ${rowTop(i) + TB.rowH / 2}`}
                style={{ stroke: 'var(--ink)', fill: 'none' }}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <g data-el="excl">
                <rect x={colX('price') + 5} y={rowTop(i) + 7} width={64} height={TB.rowH - 14} rx={5} style={{ fill: 'var(--surface)', stroke: 'var(--fail)' }} strokeWidth={1.6} />
                <Badge x={colX('price') + 19} y={rowTop(i) + TB.rowH / 2} status="fail" r={8} />
                <Txt x={colX('price') + 32} y={rowTop(i) + TB.rowH / 2 + 5} size={13} weight={750} color="var(--fail)">
                  {F.excluded}
                </Txt>
              </g>
            </g>
          ),
        )}
        {/* 합계 칸 */}
        {[0, 1].map((k) => (
          <g key={k} data-el={k ? 'sum-m' : 'sum-s'}>
            <RRect x={TB.x} y={SUMY[k]} w={TW} h={62} seed={`p-sum${k}`} rough={0.45} fill="var(--surface)" />
            <Txt x={TB.x + 16} y={SUMY[k] + 26} size={15} weight={750}>
              {k ? F.minjaeSum : F.soraSum}
            </Txt>
            <Txt x={SUM_VX[k]} y={SUMY[k] + 26} size={17} weight={800} el={k ? 'sum-m-v' : 'sum-s-v'}>
              {won(k ? MINJAE_TOTAL : SORA_TOTAL)}
            </Txt>
            <Txt x={TB.x + 16} y={SUMY[k] + 49} size={13}>
              {k ? F.minjaeRules : F.soraRules}
            </Txt>
          </g>
        ))}
        <g data-el="mid">
          <Txt x={196} y={MID_Y + 5} size={14} weight={750} anchor="end">
            {F.calc}
          </Txt>
          <Badge x={209} y={MID_Y} status="ok" r={9} />
          <Txt x={224} y={MID_Y + 5} size={14} weight={750}>
            {F.defDiff}
          </Txt>
        </g>
      </g>
    </Fig>
  )
}

/** 흐린 글자의 하한. 회색 칸 위에서도 본문 대비 4.5:1을 넘긴다 */
const DIM_TXT = 0.72

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  init(tl, o('s2'), { opacity: 0 })

  // step 1: 같은 원본이 두 계산으로 갈라진다 → 숫자가 오르고 → ≠
  const pp = o('pp')
  init(tl, pp, { opacity: 0 })
  pp.forEach((p) => {
    const t = at(0) + 0.04 + num(p, 'i') * 0.035 + num(p, 'k') * 0.012
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.18, ease: 'power1.in' }, t)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.17)
  })
  F.revenues.forEach((v, k) => countTo(tl, o(`p-v${k}`)[0], 0, v, won, at(0) + 0.22, 0.38))
  o('neq-s').forEach((s, i) => {
    init(tl, paths([s]), { drawSVG: '0%' })
    tl.to(paths([s]), { drawSVG: '100%', duration: 0.06, ease: 'none' }, at(0) + 0.62 + i * 0.07)
  })

  // step 2: 소라의 규칙 — 4행 전부, 상품 금액 + 배송비, 할인은 적용 안 함
  const s2 = at(1)
  const hl = o('hl-r')
  const chips = o('vchip')
  const discTxt = [...o('h-disc'), ...o('c-disc')]
  const shipTxt = [...o('h-ship'), ...o('c-ship')]
  init(tl, [...o('sum-s'), ...o('sum-m'), ...o('mid'), ...o('excl'), ...o('p-calc'), ...o('dfly'), ...chips], { opacity: 0 })
  tl.to(o('s1'), { opacity: 0, duration: 0.14 }, s2)
  tl.to(o('s2'), { opacity: 1, duration: 0.14 }, s2 + 0.08)
  tl.to(o('hl-h'), { opacity: 0.26, duration: 0.08 }, s2 + 0.18)
  tl.to(o('gray-disc'), { opacity: 0.16, duration: 0.08 }, s2 + 0.18)
  tl.to(discTxt, { opacity: DIM_TXT, duration: 0.08 }, s2 + 0.18)
  tl.to(o('sum-s'), { opacity: 1, duration: 0.1 }, s2 + 0.2)
  const soraSegs: [number, number, number][] = []
  let acc = 0
  hl.forEach((h, i) => {
    const t = s2 + 0.24 + i * 0.13
    tl.to(h, { opacity: 0.14, duration: 0.05 }, t)
    const c = chips[i]
    tl.to(c, { opacity: 1, duration: 0.03 }, t + 0.03)
    tl.to(c, { x: num(c, 'dx'), y: num(c, 'dy'), duration: 0.12, ease: 'power2.in' }, t + 0.05)
    tl.to(c, { opacity: 0, duration: 0.02 }, t + 0.16)
    acc += SORA_ROWS[i]
    soraSegs.push([acc, t + 0.15, 0.04])
  })
  countSeq(tl, o('sum-s-v')[0], won, 0, soraSegs)

  // step 3: 민재의 규칙 — 취소·환불 제외, 배송비 제외, 할인 뺀 금액
  const s3 = at(2)
  tl.to([...hl, ...o('hl-h'), ...o('gray-disc')], { opacity: 0, duration: 0.08 }, s3)
  tl.to(discTxt, { opacity: 1, duration: 0.08 }, s3)
  o('strike').forEach((s, k) => {
    init(tl, s, { drawSVG: '0%' })
    tl.to(s, { drawSVG: '100%', duration: 0.12, ease: 'none' }, s3 + 0.08 + k * 0.1)
  })
  tl.to(o('excl'), { opacity: 1, duration: 0.06 }, s3 + 0.3)
  tl.to(o('gray-ship'), { opacity: 0.16, duration: 0.08 }, s3 + 0.34)
  tl.to(shipTxt, { opacity: DIM_TXT, duration: 0.08 }, s3 + 0.34)
  tl.to(o('sum-m'), { opacity: 1, duration: 0.1 }, s3 + 0.4)
  o('dfly').forEach((d) => {
    tl.to(d, { opacity: 1, duration: 0.02 }, s3 + 0.4)
    tl.to(d, { x: num(d, 'dx'), duration: 0.12, ease: 'power2.inOut' }, s3 + 0.42)
    tl.to(d, { opacity: 0, duration: 0.03 }, s3 + 0.54)
  })
  tl.to(o('p-orig'), { opacity: 0, duration: 0.04 }, s3 + 0.54)
  tl.to(o('p-calc'), { opacity: 1, duration: 0.05 }, s3 + 0.55)
  const counted = ORDERS4.map((r, i) => (r.counted ? MINJAE_ROWS[i] : 0)).filter(Boolean)
  countSeq(tl, o('sum-m-v')[0], won, 0, [
    [counted[0], s3 + 0.58, 0.04],
    [MINJAE_TOTAL, s3 + 0.63, 0.05],
  ])
  tl.to(o('mid'), { opacity: 1, duration: 0.08 }, s3 + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 쿼리가 하나씩 늘어나요
// ─────────────────────────────────────────────────────────────
const ADB: Box = { x: 166, y: 204, w: 136, h: 58 }
const FILE = { w: 138, h: 56 }
const FPOS: [number, number][] = [
  [82, 286],
  [250, 286],
  [82, 76],
  [252, 92],
  [166, 380],
]
const fbox = (i: number): Box => ({
  x: FPOS[i][0],
  y: FPOS[i][1],
  w: FILE.w,
  h: FILE.h,
})
const AG = { x: 282, y: 214, r: 28 }
const SIDE = { x: 384, y: 214 }
const REQ: Visitor[] = ['sora', 'minjae']

export function AttemptFig() {
  return (
    <Fig caption={F.filesNote}>
      {/* 외장 모니터 */}
      <RRect x={8} y={12} w={316} h={400} seed="a-mon" rough={0.45} fill="var(--surface)" />
      <RLine x1={166} y1={412} x2={166} y2={440} seed="a-stand" rough={0.3} />
      <RLine x1={128} y1={440} x2={204} y2={440} seed="a-base" rough={0.3} />

      <Node x={ADB.x} y={ADB.y} w={ADB.w} h={ADB.h} label={DB_LABEL} kind="store" seed="a-db" />
      {[0, 1].map((i) => {
        const [x1, y1, x2, y2] = link(ADB, fbox(i))
        return (
          <g key={i} data-el="a1-arrow">
            <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={`a1-${i}`} rough={0.5} />
          </g>
        )
      })}
      {FPOS.map((_, i) => {
        const [x1, y1, x2, y2] = link(fbox(i), ADB)
        return (
          <g key={i} data-el="a3-arrow">
            <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={`a3-${i}`} rough={0.5} />
          </g>
        )
      })}
      {F.files.map(([name, result], i) => {
        const [x, y] = FPOS[i]
        return (
          <g key={name} data-el="af">
            <Node x={x} y={y} w={FILE.w} h={FILE.h} label="" kind="doc" seed={`af${i}`} el={`af${i}`} statuses={['ok', 'wait']} />
            <Txt x={x} y={y - 4} size={14} weight={750} anchor="middle">
              {name}
            </Txt>
            <Txt x={x} y={y + 17} size={14} anchor="middle" el="af-res">
              {`→ ${result}`}
            </Txt>
            <Txt x={x} y={y + 17} size={13.5} weight={700} anchor="middle" muted el="af-wait">
              {F.aggregating}
            </Txt>
          </g>
        )
      })}
      {REQ.map((who, i) => (
        <g key={who} data-el="req">
          <Txt x={FPOS[i][0] - 6} y={FPOS[i][1] + FILE.h / 2 + 20} size={13} weight={650} anchor="middle">
            {PEOPLE[who].name}
          </Txt>
          <Badge x={FPOS[i][0] + 20} y={FPOS[i][1] + FILE.h / 2 + 15} status="ok" r={8} />
        </g>
      ))}

      {/* step 3: 집계 대기 게이지 */}
      <g data-el="a-gauge">
        <GaugeOk x={AG.x} y={AG.y} r={AG.r} label={F.waitGauge} el="ag" value={0.12} seed="a-g" />
      </g>
      <Txt x={AG.x} y={AG.y - AG.r - 12} size={14} weight={800} anchor="middle" color="var(--fail)" el="slow">
        {F.slow}
      </Txt>

      {/* 모니터 옆: 동료 한 명 또는 주니 */}
      <g data-el="sora">
        <Person who="sora" x={SIDE.x} y={SIDE.y} seed="a-sora" />
      </g>
      <g data-el="daon">
        <Person who="daon" x={SIDE.x} y={SIDE.y} name={false} seed="a-daon" />
        <RRect x={SIDE.x - 12} y={SIDE.y - 62} w={24} h={24} rough={0.3} seed="a-daon-q" fill="var(--surface)" />
        <Txt x={SIDE.x} y={SIDE.y - 44} size={16} weight={800} anchor="middle">
          ?
        </Txt>
        <rect x={SIDE.x - 50} y={SIDE.y + 76} width={100} height={42} rx={6} style={{ fill: 'var(--surface)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
        <Txt x={SIDE.x} y={SIDE.y + 93} size={13} weight={750} anchor="middle">
          {PEOPLE.daon.name}
        </Txt>
        <Txt x={SIDE.x} y={SIDE.y + 110} size={12.5} anchor="middle">
          {PEOPLE.daon.role}
        </Txt>
      </g>
      <g data-el="juni">
        <Person who="juni" mood="panic" x={SIDE.x} y={SIDE.y} seed="a-juni" />
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)
  const files = o('af')
  const ok = FPOS.map((_, i) => o(`af${i}:ok`)[0])
  const wait = FPOS.map((_, i) => o(`af${i}:wait`)[0])
  init(tl, [...files, ...o('req'), ...o('a3-arrow'), ...o('a-gauge'), ...o('slow'), ...o('daon'), ...o('juni'), ...o('caption'), ...o('af-wait')], { opacity: 0 })

  // step 1: DB에서 화살표 두 개 → 끝에 파일 → ✓
  const a1 = o('a1-arrow')
  a1.forEach((a, i) => {
    const t = at(0) + 0.06 + i * 0.12
    drawArrows(tl, [a], t, 0.14)
    tl.to(files[i], { opacity: 1, duration: 0.08 }, t + 0.14)
    tl.to(ok[i], { opacity: 1, duration: 0.05 }, t + 0.26)
    tl.to(o('req')[i], { opacity: 1, duration: 0.06 }, t + 0.3)
  })

  // step 2: 파일이 하나씩 늘어 다섯 개, 숫자도 다섯 가지 → 다온이 들어온다
  const s2 = at(1)
  tl.to(o('sora'), { opacity: 0, duration: 0.12 }, s2)
  ;[2, 3, 4].forEach((i, k) => {
    const t = s2 + 0.1 + k * 0.14
    tl.to(files[i], { opacity: 1, duration: 0.08 }, t)
    tl.to(ok[i], { opacity: 1, duration: 0.05 }, t + 0.08)
  })
  tl.to(o('caption'), { opacity: 1, duration: 0.1 }, s2 + 0.5)
  init(tl, o('daon'), { opacity: 0, x: 60 })
  tl.to(o('daon'), { opacity: 1, x: 0, duration: 0.2 }, s2 + 0.56)

  // step 3: 다섯 쿼리가 한꺼번에 DB로 → 게이지가 빨간 구간 → ✓가 ⏸로
  const s3 = at(2)
  tl.to(o('daon'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('juni'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  tl.to([...a1, ...o('req')], { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('a-gauge'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  const a3 = o('a3-arrow')
  tl.to(a3, { opacity: 1, duration: 0.02 }, s3 + 0.14)
  drawArrows(tl, a3, s3 + 0.14, 0.16)
  const needle = o('ag-needle')[0] as SVGGElement | undefined
  if (needle) {
    const origin = needle.dataset.origin ?? `${AG.x} ${AG.y}`
    init(tl, needle, { rotation: angle(0.12), svgOrigin: origin })
    tl.to(needle, { rotation: angle(0.9), svgOrigin: origin, duration: 0.32, ease: 'none' }, s3 + 0.3)
  }
  tl.to(ok, { opacity: 0, duration: 0.04 }, s3 + 0.54)
  tl.to(wait, { opacity: 1, duration: 0.04 }, s3 + 0.54)
  tl.to(o('af-res'), { opacity: 0, duration: 0.05 }, s3 + 0.54)
  tl.to(o('af-wait'), { opacity: 1, duration: 0.05 }, s3 + 0.56)
  tl.to(o('slow'), { opacity: 1, duration: 0.06 }, s3 + 0.6)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 잘 정리된 도서관, 데이터 웨어하우스
// ─────────────────────────────────────────────────────────────
const SH = [270, 328, 386]
const SHELF = { y: 150, h: 104, w: 54 }
const BOOK = { w: 15, h: 92, y: 158 }
const SLOTS = (() => {
  const used = [0, 0, 0]
  return F.books.map(([s]) => used[s as number]++)
})()
const bookX = (i: number) => SH[F.books[i][0] as number] - 24 + SLOTS[i] * 16.5
const FLOOR_Y = 330
const PILE_X = [104, 116, 100, 112, 108, 98, 114]
const PILE_R = [-86, -95, -88, -97, -84, -93, -89]
const LEFT_X = [106, 112, 102]
const LEFT_R = [-3, 4, -2]
const WH_DX = 220 - 328

// 행/열 저장
const CK = ['id', 'date', 'cust', 'prod', 'amt'] as const
type CKey = (typeof CK)[number]
const CWID: Record<CKey, number> = {
  id: 46,
  date: 58,
  cust: 42,
  prod: 64,
  amt: 70,
}
const CH = 30
const ROWX0 = 52
const ROW_W = CK.reduce((a, k) => a + CWID[k], 0)
const rowCellX = (k: CKey) => ROWX0 + CK.slice(0, CK.indexOf(k)).reduce((a, c) => a + CWID[c], 0)
const ROWY = (r: number) => 112 + r * 42
const COLX = (k: CKey) => ROWX0 + CK.slice(0, CK.indexOf(k)).reduce((a, c) => a + CWID[c] + 12, 0)
const COLY = (r: number) => 110 + r * CH
const PROD_W = 34
const NEEDED: CKey[] = ['prod', 'amt']
const DICT = new Map(F.dict.map(([w, c]) => [w, c]))

function TableIcon({ cx, seed }: { cx: number; seed: string }) {
  const x = cx - 26
  const y = 152
  return (
    <g>
      <rect x={x} y={y} width={52} height={68} style={{ fill: 'var(--surface)' }} />
      <rect x={x} y={y} width={52} height={14} style={{ fill: 'var(--edge)' }} />
      <RRect x={x} y={y} w={52} h={68} seed={seed} rough={0.35} />
      {[1, 2, 3].map((k) => (
        <RLine key={k} x1={x} y1={y + 14 + k * 13.5} x2={x + 52} y2={y + 14 + k * 13.5} seed={`${seed}l${k}`} rough={0.2} strokeWidth={0.9} />
      ))}
      <RLine x1={x + 20} y1={y + 14} x2={x + 20} y2={y + 68} seed={`${seed}v`} rough={0.2} strokeWidth={0.9} />
    </g>
  )
}

export function WarehouseFig() {
  const { reduced } = useEnv()
  const pileY = (lv: number) => FLOOR_Y - 7.5 - lv * 15
  return (
    <Fig>
      {/* step 1: 방바닥과 도서관 */}
      <g data-el="floor">
        <Txt x={110} y={40} size={15} weight={800} anchor="middle">
          {F.floor}
        </Txt>
        <RLine x1={14} y1={FLOOR_Y} x2={206} y2={FLOOR_Y} seed="w-floor" rough={0.5} />
        {F.leftover.map((t, k) => (
          <g key={k} transform={`rotate(${LEFT_R[k]} ${LEFT_X[k]} ${pileY(k)})`}>
            <rect x={LEFT_X[k] - BOOK.h / 2} y={pileY(k) - BOOK.w / 2} width={BOOK.h} height={BOOK.w} style={{ fill: 'var(--surface)' }} />
            <RRect x={LEFT_X[k] - BOOK.h / 2} y={pileY(k) - BOOK.w / 2} w={BOOK.h} h={BOOK.w} seed={`w-left${k}`} rough={0.3} />
            <Txt x={LEFT_X[k]} y={pileY(k) + 4.5} size={12} weight={700} anchor="middle">
              {t}
            </Txt>
          </g>
        ))}
      </g>
      <g data-el="lib-l">
        <Txt x={328} y={40} size={15} weight={800} anchor="middle">
          {F.library}
        </Txt>
      </g>
      <g data-el="bldg">
        <RPath d="M 222 112 L 328 62 L 434 112 Z M 230 112 L 230 344 L 426 344 L 426 112" seed="w-bldg" rough={0.5} />
      </g>

      {/* 색인 카드 상자 */}
      <g data-el="index">
        <g data-el="icard">
          <rect x={235} y={262} width={186} height={32} rx={3} style={{ fill: 'var(--surface)' }} />
          <RRect x={235} y={262} w={186} h={32} seed="w-card" rough={0.35} />
          <Txt x={328} y={283} size={13.5} weight={750} anchor="middle">
            {F.indexCard}
          </Txt>
        </g>
        <rect x={288} y={298} width={80} height={38} style={{ fill: 'var(--surface)' }} />
        <RRect x={288} y={298} w={80} h={38} seed="w-ibox" rough={0.45} />
        <Txt x={328} y={322} size={13.5} weight={750} anchor="middle">
          {F.indexBox}
        </Txt>
      </g>

      {/* step 2: 같은 자리의 웨어하우스 노드(가운데로 옮겨 간다) */}
      <g data-el="wh-move">
        <g data-el="wh">
          <Node x={328} y={166} w={208} h={214} label={WH_LABEL} kind="store" bands={[]} seed="w-wh" scale={1.05} />
        </g>
        <g data-el="tables">
          {SH.map((cx, k) => (
            <TableIcon key={k} cx={cx} seed={`w-ti${k}`} />
          ))}
        </g>
        <g data-el="shelves">
          {SH.map((cx, k) => (
            <g key={k}>
              <rect x={cx - SHELF.w / 2} y={SHELF.y} width={SHELF.w} height={SHELF.h} style={{ fill: 'var(--surface)' }} />
              <RRect x={cx - SHELF.w / 2} y={SHELF.y} w={SHELF.w} h={SHELF.h} seed={`w-sh${k}`} rough={0.4} />
            </g>
          ))}
        </g>
        {F.shelves.map((s, k) => (
          <Txt key={s} x={SH[k]} y={140} size={14} weight={800} anchor="middle">
            {s}
          </Txt>
        ))}
        {F.books.map(([, label], i) => {
          const x = bookX(i)
          const cx = x + BOOK.w / 2
          const cy = BOOK.y + BOOK.h / 2
          const lv = 3 + (F.books.length - 1 - i)
          const chars = Array.from(label as string)
          return (
            <g key={i} data-el="book" data-cx={cx} data-cy={cy} data-dx={PILE_X[i] - cx} data-dy={pileY(lv) - cy} data-r={PILE_R[i]}>
              <g data-el="book-r">
                <rect
                  x={x}
                  y={BOOK.y}
                  width={BOOK.w}
                  height={BOOK.h}
                  style={{
                    fill: label === F.books[6][1] ? 'var(--bg)' : 'var(--surface)',
                  }}
                />
                <RRect x={x} y={BOOK.y} w={BOOK.w} h={BOOK.h} seed={`w-book${i}`} rough={0.3} />
                {chars.map((ch, k) => (
                  <Txt key={k} x={cx} y={BOOK.y + 40 + k * 14} size={12.5} weight={750} anchor="middle">
                    {ch}
                  </Txt>
                ))}
              </g>
            </g>
          )
        })}
      </g>
      <g data-el="mapping">
        {F.mapping.map(([a, b], k) => (
          <g key={a}>
            <Txt x={30} y={350 + k * 46} size={15} weight={800}>
              {a}
            </Txt>
            <g data-el="map-arrow">
              <RArrow x1={70} y1={345 + k * 46} x2={112} y2={345 + k * 46} seed={`w-map${k}`} rough={0.4} head={8} />
            </g>
            <Txt x={122} y={350 + k * 46} size={14} weight={600}>
              {b}
            </Txt>
          </g>
        ))}
      </g>

      {/* step 3~4: 행 기반 / 열 기반 저장 */}
      <g data-el="store">
        <Txt x={20} y={40} size={17} weight={800}>
          {F.byProduct}
        </Txt>
        <Txt x={420} y={40} size={14} weight={750} anchor="end" el="read-n">
          {F.readCount(30)}
        </Txt>
        <Txt x={ROWX0} y={76} size={13.5} weight={750} muted el="lbl-row">
          {F.rowStore}
        </Txt>
        <Txt x={ROWX0} y={76} size={13.5} weight={750} muted el="lbl-col">
          {F.colStore}
        </Txt>
        {CK.map((k) => (
          <g key={k} data-el="chead" data-dx={rowCellX(k) - COLX(k)} data-dy={4}>
            <Txt x={COLX(k) + CWID[k] / 2} y={100} size={12.5} weight={750} anchor="middle" muted>
              {F.storeCols[k]}
            </Txt>
          </g>
        ))}
        {/* 열 강조(step 4) */}
        {CK.map((k) => (
          <rect
            key={k}
            data-el={NEEDED.includes(k) ? 'col-beam' : 'col-gray'}
            x={COLX(k)}
            y={COLY(0)}
            width={CWID[k]}
            height={CH * 6}
            style={{
              fill: NEEDED.includes(k) ? 'var(--accent)' : 'var(--wait)',
              opacity: 0,
            }}
          />
        ))}
        {SALES6.map((row, r) =>
          CK.map((k) => {
            const x = COLX(k)
            const y = COLY(r)
            const word = row[k]
            return (
              <g key={`${r}-${k}`} data-el="cell" data-k={k} data-r={r} data-dx={rowCellX(k) - x} data-dy={ROWY(r) - y}>
                <rect
                  data-el={k === 'prod' ? 'prod-rect' : undefined}
                  x={x}
                  y={y}
                  width={CWID[k]}
                  height={CH}
                  style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
                  strokeWidth={1}
                />
                <rect data-el={NEEDED.includes(k) ? 'cell-tint' : undefined} x={x} y={y} width={CWID[k]} height={CH} style={{ fill: 'var(--accent)', opacity: 0 }} />
                <Txt
                  x={x + CWID[k] / 2}
                  y={y + 20}
                  size={13}
                  weight={NEEDED.includes(k) ? 700 : 500}
                  anchor="middle"
                  el={NEEDED.includes(k) ? (k === 'prod' ? 'prod-word' : undefined) : 'cell-dim'}
                >
                  {word}
                </Txt>
                {k === 'prod' && (
                  <Txt x={x + PROD_W / 2} y={y + 20} size={13.5} weight={800} anchor="middle" el="prod-code">
                    {DICT.get(word)}
                  </Txt>
                )}
              </g>
            )
          }),
        )}
        {/* step 3: 블록마다 '읽음' */}
        {SALES6.map((_, r) => (
          <g key={r} data-el="read-mark">
            <rect x={ROWX0 - 2} y={ROWY(r) - 2} width={ROW_W + 4} height={CH + 4} rx={3} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.4} />
            <Txt x={ROWX0 + ROW_W + 10} y={ROWY(r) + 20} size={12.5} weight={750}>
              {F.read}
            </Txt>
          </g>
        ))}
        <g data-el="cursor">
          <rect x={ROWX0 - 2} y={ROWY(0) - 5} width={4} height={CH + 10} rx={2} style={{ fill: 'var(--ink)' }} />
        </g>
        {/* step 4: 필요한 열 테두리, 사전, 결과 */}
        {NEEDED.map((k) => (
          <rect
            key={k}
            data-el={k === 'prod' ? 'need-prod' : 'need'}
            x={COLX(k) - 3}
            y={COLY(0) - 3}
            width={CWID[k] + 6}
            height={CH * 6 + 6}
            rx={4}
            style={{ fill: 'none', stroke: 'var(--accent)', opacity: 0 }}
            strokeWidth={2.6}
          />
        ))}
        <g data-el="dict">
          <RRect x={206} y={306} w={96} h={84} seed="w-dict" rough={0.35} fill="var(--surface)" />
          <Txt x={216} y={326} size={12.5} weight={750} muted>
            {F.dictTitle}
          </Txt>
          {F.dict.map(([w, c], k) => (
            <Txt key={w} x={216} y={348 + k * 18} size={13} weight={600}>
              {`${w}=${c}`}
            </Txt>
          ))}
          <RLine x1={COLX('prod') + PROD_W / 2} y1={COLY(6) + 4} x2={COLX('prod') + PROD_W / 2} y2={304} seed="w-dict-l" rough={0.2} strokeWidth={1.2} />
        </g>
        <g data-el="result">
          <RRect x={316} y={306} w={112} h={84} seed="w-res" rough={0.35} fill="var(--surface)" />
          <Txt x={326} y={326} size={12.5} weight={750} muted>
            {F.resultTitle}
          </Txt>
          {F.result.map(([w, v], k) => (
            <g key={w}>
              <Txt x={326} y={348 + k * 18} size={13} weight={650}>
                {w}
              </Txt>
              <Txt x={418} y={348 + k * 18} size={13} weight={750} anchor="end">
                {v}
              </Txt>
            </g>
          ))}
        </g>
        <g data-el="simple">
          <rect x={316} y={420} width={112} height={24} rx={12} style={{ fill: 'var(--surface)', stroke: 'var(--muted)' }} strokeWidth={1.3} />
          <Txt x={372} y={436.5} size={12.5} weight={700} anchor="middle">
            {F.simplified}
          </Txt>
        </g>
        {/* 모션 줄이기: 행 → 열 재배열 대신 왼쪽에 행 기반 저장 그림을 나란히 */}
        {reduced && (
          <g data-el="row-thumb">
            <Txt x={16} y={318} size={12.5} weight={750} muted>
              {F.rowStore}
            </Txt>
            {SALES6.map((_, r) =>
              CK.map((k) => (
                <rect
                  key={`${r}${k}`}
                  x={16 + CK.slice(0, CK.indexOf(k)).reduce((a, c) => a + CWID[c] * 0.6, 0)}
                  y={328 + r * 16}
                  width={CWID[k] * 0.6}
                  height={12}
                  style={{
                    fill: NEEDED.includes(k) ? 'var(--surface)' : 'var(--edge)',
                    stroke: 'var(--line)',
                  }}
                  strokeWidth={0.8}
                />
              )),
            )}
            <rect x={14} y={326} width={ROW_W * 0.6 + 4} height={6 * 16} rx={3} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2} />
            <Txt x={16} y={440} size={12.5} weight={700}>
              {F.readCount(30)}
            </Txt>
          </g>
        )}
      </g>
    </Fig>
  )
}

export const buildWarehouse: SceneBuild = (q, tl) => {
  const o = pick(q)
  // step 1: 바닥의 책이 한 권씩 맞는 서가로
  const books = o('book')
  // 이동(바깥 g)과 회전(안쪽 g, 책 중심 기준)을 나눠야 svgOrigin 보정이 위치를 흔들지 않는다
  const spin = (b: Element) => b.querySelector('[data-el="book-r"]')!
  books.forEach((b) => {
    init(tl, b, { x: num(b, 'dx'), y: num(b, 'dy') })
    init(tl, spin(b), {
      rotation: num(b, 'r'),
      svgOrigin: `${num(b, 'cx')} ${num(b, 'cy')}`,
    })
  })
  const card = o('icard')
  init(tl, card, { y: 40, opacity: 0 })
  init(tl, [...o('tables'), ...o('mapping'), ...o('store'), ...o('wh')], {
    opacity: 0,
  })
  books.forEach((b, i) => {
    const t = at(0) + 0.04 + i * 0.075
    tl.to(b, { x: 0, y: 0, duration: 0.14, ease: 'power2.inOut' }, t)
    tl.to(
      spin(b),
      {
        rotation: 0,
        svgOrigin: `${num(b, 'cx')} ${num(b, 'cy')}`,
        duration: 0.14,
        ease: 'power2.inOut',
      },
      t,
    )
  })
  tl.to(card, { y: 0, opacity: 1, duration: 0.14, ease: 'power2.out' }, at(0) + 0.68)

  // step 2: 서가 → 표, 건물 윤곽 → 웨어하우스 테두리, 대응표
  const s2 = at(1)
  const whPaths = paths(o('wh'))
  const whText = o('wh').flatMap((e) => Array.from(e.querySelectorAll('text')))
  init(tl, whPaths, { drawSVG: '0%' })
  init(tl, whText, { opacity: 0 })
  tl.to([...o('floor'), ...o('lib-l'), ...o('index')], { opacity: 0, duration: 0.14 }, s2)
  tl.to(o('bldg'), { opacity: 0, duration: 0.18 }, s2 + 0.06)
  tl.to(o('wh'), { opacity: 1, duration: 0.06 }, s2 + 0.08)
  tl.to(whPaths, { drawSVG: '100%', duration: 0.26, ease: 'none' }, s2 + 0.1)
  tl.to(whText, { opacity: 1, duration: 0.1 }, s2 + 0.3)
  tl.to([...o('shelves'), ...books], { opacity: 0, duration: 0.14 }, s2 + 0.14)
  init(tl, o('tables'), { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' })
  tl.to(o('tables'), { opacity: 1, scale: 1, duration: 0.16 }, s2 + 0.2)
  tl.to(o('wh-move'), { x: WH_DX, duration: 0.18, ease: 'power2.inOut' }, s2 + 0.42)
  tl.to(o('mapping'), { opacity: 1, duration: 0.02 }, s2 + 0.6)
  init(
    tl,
    o('mapping').flatMap((m) => Array.from(m.querySelectorAll('text'))),
    { opacity: 0 },
  )
  o('map-arrow').forEach((a, k) => {
    const t = s2 + 0.58 + k * 0.09
    const texts = Array.from(a.parentElement?.querySelectorAll(':scope > text') ?? [])
    tl.to(texts[0], { opacity: 1, duration: 0.05 }, t)
    drawArrows(tl, [a], t + 0.02, 0.06)
    tl.to(texts[1], { opacity: 1, duration: 0.05 }, t + 0.08)
  })

  // step 3: 행 기반 — 커서가 블록마다 모든 칸을 지나간다
  const s3 = at(2)
  const cells = o('cell')
  cells.forEach((c) => init(tl, c, { x: num(c, 'dx'), y: num(c, 'dy') }))
  o('chead').forEach((c) => init(tl, c, { x: num(c, 'dx'), y: num(c, 'dy') }))
  const marks = o('read-mark')
  const cursor = o('cursor')
  init(tl, [...marks, ...cursor, ...o('lbl-col'), ...o('need'), ...o('need-prod'), ...o('dict'), ...o('result'), ...o('simple'), ...o('prod-code'), ...o('row-thumb')], {
    opacity: 0,
  })
  tl.to(o('wh-move'), { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('mapping'), { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('store'), { opacity: 1, duration: 0.12 }, s3 + 0.08)
  const SWEEP = 0.08
  const T0 = s3 + 0.22
  tl.to(cursor, { opacity: 1, duration: 0.02 }, T0 - 0.02)
  SALES6.forEach((_, r) => {
    const t = T0 + r * 0.085
    tl.set(cursor, { y: ROWY(r) - ROWY(0), x: 0 }, t)
    tl.to(cursor, { x: ROW_W, duration: SWEEP, ease: 'none' }, t)
    CK.forEach((k) => {
      const cell = cells.find((c) => (c as SVGElement).dataset.k === k && num(c, 'r') === r)
      if (!cell) return
      const tc = t + (SWEEP * (rowCellX(k) - ROWX0 + CWID[k] * 0.6)) / ROW_W
      const dim = cell.querySelector('[data-el="cell-dim"]')
      const tint = cell.querySelector('[data-el="cell-tint"]')
      if (dim) tl.to(dim, { opacity: DIM_TXT, duration: 0.02 }, tc)
      if (tint) tl.to(tint, { opacity: 0.13, duration: 0.02 }, tc)
    })
    tl.to(marks[r], { opacity: 1, duration: 0.03 }, t + SWEEP)
  })
  const readN = o('read-n')[0]
  countSeq(tl, readN, F.readCount, 0, [
    [30, T0, 6 * 0.085 - 0.005],
    [0, at(3) + 0.3, 0.01],
    [12, at(3) + 0.36, 0.16],
  ])
  tl.to(cursor, { opacity: 0, duration: 0.04 }, T0 + 6 * 0.085 + 0.02)

  // step 4: 같은 열끼리 다시 쌓기 → 빛줄기가 상품·금액만 → 압축 → 결과
  const s4 = at(3)
  tl.to(marks, { opacity: 0, duration: 0.06 }, s4)
  tl.to(o('cell-dim'), { opacity: 1, duration: 0.06 }, s4)
  tl.to(o('cell-tint'), { opacity: 0, duration: 0.06 }, s4)
  tl.to(o('lbl-row'), { opacity: 0, duration: 0.06 }, s4)
  tl.to(o('lbl-col'), { opacity: 1, duration: 0.08 }, s4 + 0.24)
  cells.forEach((c) => tl.to(c, { x: 0, y: 0, duration: 0.18, ease: 'power2.inOut' }, s4 + 0.06 + CK.indexOf((c as SVGElement).dataset.k as CKey) * 0.025))
  tl.to(o('chead'), { x: 0, y: 0, duration: 0.18, ease: 'power2.inOut' }, s4 + 0.1)
  tl.to(o('col-gray'), { opacity: 0.14, duration: 0.06 }, s4 + 0.34)
  tl.to(o('cell-dim'), { opacity: DIM_TXT, duration: 0.06 }, s4 + 0.34)
  const beam = o('col-beam')
  init(tl, beam, { scaleY: 0, transformOrigin: '50% 0%' })
  tl.to(beam, { opacity: 0.3, duration: 0.02 }, s4 + 0.36)
  tl.to(beam, { scaleY: 1, duration: 0.16, ease: 'none' }, s4 + 0.36)
  tl.to([...o('need'), ...o('need-prod')], { opacity: 1, duration: 0.05 }, s4 + 0.5)
  tl.to(beam, { opacity: 0, duration: 0.06 }, s4 + 0.53)
  tl.to(o('prod-word'), { opacity: 0, duration: 0.05 }, s4 + 0.58)
  tl.to(o('prod-code'), { opacity: 1, duration: 0.05 }, s4 + 0.6)
  tl.to(o('prod-rect'), { attr: { width: PROD_W }, duration: 0.1 }, s4 + 0.58)
  tl.to(o('need-prod'), { attr: { width: PROD_W + 6 }, duration: 0.1 }, s4 + 0.58)
  // 짧아진 상품 블록 가운데로 머리글도 옮긴다
  const prodHead = o('chead')[CK.indexOf('prod')]?.querySelector('text')
  if (prodHead) tl.to(prodHead, { x: -(CWID.prod - PROD_W) / 2, duration: 0.1 }, s4 + 0.58)
  tl.to(o('dict'), { opacity: 1, duration: 0.08 }, s4 + 0.62)
  tl.to(o('result'), { opacity: 1, duration: 0.08 }, s4 + 0.68)
  tl.to([...o('simple'), ...o('row-thumb')], { opacity: 1, duration: 0.08 }, s4 + 0.72)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 나눌까, 합칠까: 스타 스키마
// ─────────────────────────────────────────────────────────────
interface SCol {
  key: string
  label: string
  w: number
}
/** 작은 표. 칸 data-el=`${el}-c{i}-{key}`, 머리글 `${el}-h-{key}` */
function MiniTable({
  x,
  y,
  cols,
  rows,
  el,
  seed,
  rowH = 26,
  size = 13,
  title,
  bars,
}: {
  x: number
  y: number
  cols: SCol[]
  rows: string[][]
  el: string
  seed: string
  rowH?: number
  size?: number
  title?: string
  /** 글자 대신 막대(읽을 수 없게 작은 축소판용) */
  bars?: boolean
}) {
  const W = cols.reduce((a, c) => a + c.w, 0)
  const H = rowH * (rows.length + 1)
  const cx = (j: number) => x + cols.slice(0, j).reduce((a, c) => a + c.w, 0)
  return (
    <g data-el={el}>
      {title && (
        <Txt x={x} y={y - 8} size={14} weight={800}>
          {title}
        </Txt>
      )}
      <rect x={x} y={y} width={W} height={H} style={{ fill: 'var(--surface)' }} />
      <RRect x={x} y={y} w={W} h={H} seed={`${seed}-o`} rough={0.35} />
      <RLine x1={x} y1={y + rowH} x2={x + W} y2={y + rowH} seed={`${seed}-h`} rough={0.3} />
      {cols.slice(1).map((c, j) => (
        <RLine key={c.key} x1={cx(j + 1)} y1={y} x2={cx(j + 1)} y2={y + H} seed={`${seed}-v${j}`} rough={0.25} strokeWidth={0.9} />
      ))}
      {cols.map((c, j) =>
        bars ? (
          <rect key={c.key} x={cx(j) + 7} y={y + rowH * 0.3} width={tw(c.label, size * 0.92)} height={rowH * 0.4} rx={3} style={{ fill: 'var(--ink)' }} />
        ) : (
          <Txt key={c.key} x={cx(j) + 7} y={y + rowH * 0.67} size={size * 0.92} weight={750} el={`${el}-h-${c.key}`}>
            {c.label}
          </Txt>
        ),
      )}
      {rows.map((r, i) =>
        cols.map((c, j) =>
          bars ? (
            <rect key={`${i}${c.key}`} x={cx(j) + 7} y={y + rowH * (i + 1.3)} width={tw(r[j], size)} height={rowH * 0.4} rx={3} style={{ fill: 'var(--muted)' }} />
          ) : (
            <Txt key={`${i}${c.key}`} x={cx(j) + 7} y={y + rowH * (i + 1) + rowH * 0.67} size={size} el={`${el}-c${i}-${c.key}`}>
              {r[j]}
            </Txt>
          ),
        ),
      )}
    </g>
  )
}

const NC = F.nCols
const col = (key: keyof typeof NC, w: number): SCol => ({
  key,
  label: NC[key],
  w,
})
const OT = {
  x: 14,
  y: 164,
  cols: [col('id', 44), col('pid', 62), col('qty', 40), col('amt', 60)],
}
const PT = {
  x: 240,
  y: 164,
  cols: [col('pid', 62), col('name', 56), col('cid', 62)],
}
const CT = { x: 300, y: 330, cols: [col('cid', 62), col('cname', 58)] }
const RH = 26
const cellBox = (t: { x: number; y: number; cols: SCol[] }, key: string, i: number) => {
  const j = t.cols.findIndex((c) => c.key === key)
  const x = t.x + t.cols.slice(0, j).reduce((a, c) => a + c.w, 0)
  return { x, y: t.y + RH * (i + 1), w: t.cols[j].w, h: RH }
}
const colMid = (t: { x: number; cols: SCol[] }, key: string) => {
  const j = t.cols.findIndex((c) => c.key === key)
  return t.x + t.cols.slice(0, j).reduce((a, c) => a + c.w, 0) + t.cols[j].w / 2
}
// 나누기 전의 넓은 표: 조각 A(주문 항목) · B(이름·분류번호) · C(분류명)
const WIDE_Y = 160
const WIDE_X = 29
const PIECES = [
  {
    cols: [col('id', 44), col('pid', 62), col('qty', 40), col('amt', 60)],
    to: OT,
  },
  { cols: [col('name', 56), col('cid', 62)], to: PT },
  { cols: [col('cname', 58)], to: CT },
]
const PIECE_X = [WIDE_X, WIDE_X + 206, WIDE_X + 206 + 118]
const WIDE_W = 206 + 118 + 58
const catOf = (cid: string) => F.nCats.find((c) => c[0] === cid)![1]
const WIDE_ROWS = F.nItems.map(([id, pid, qty, amt]) => {
  const p = F.nProducts.find((r) => r[0] === pid)!
  return [id, pid, qty, amt, p[1], p[2], catOf(p[2])]
})
const PIECE_ROWS = [WIDE_ROWS.map((r) => r.slice(0, 4)), WIDE_ROWS.map((r) => r.slice(4, 6)), WIDE_ROWS.map((r) => r.slice(6))]
const MINI = { x: 220 - (WIDE_W * 0.5) / 2, y: 32, s: 0.5 }
/** 반복되는 값(수건 2칸·욕실 3칸)에 회색 밑줄 */
const repeats = (piece: number) =>
  PIECE_ROWS[piece].flatMap((r, i) =>
    r.flatMap((v, j) => {
      const all = WIDE_ROWS.map((w) => w[(piece === 0 ? 0 : piece === 1 ? 4 : 6) + j])
      return (v === F.nProducts[0][1] || v === F.nCats[0][1]) && all.filter((a) => a === v).length > 1 ? [[i, j]] : []
    }),
  )

function WidePiece({ k, x, y, el, seed, bars }: { k: number; x: number; y: number; el?: string; seed: string; bars?: boolean }) {
  const p = PIECES[k]
  const cx = (j: number) => x + p.cols.slice(0, j).reduce((a, c) => a + c.w, 0)
  return (
    <g data-el={el}>
      <MiniTable x={x} y={y} cols={p.cols} rows={PIECE_ROWS[k]} el={`${seed}t`} seed={seed} bars={bars} />
      {repeats(k).map(([i, j]) => (
        <line
          key={`${i}${j}`}
          x1={cx(j) + 6}
          y1={y + RH * (i + 1) + 21}
          x2={cx(j) + 6 + tw(PIECE_ROWS[k][i][j], 13)}
          y2={y + RH * (i + 1) + 21}
          style={{ stroke: 'var(--muted)' }}
          strokeWidth={2.2}
        />
      ))}
    </g>
  )
}

const DIM = {
  date: { x: 131, y: 86, cols: [62, 36, 36, 44] },
  product: { x: 14, y: 378, cols: [56, 48, 48] },
  customer: { x: 270, y: 378, cols: [56, 44, 56] },
}
const FT = { x: 76, y: 210, cols: [62, 58, 58, 44, 66] }
const FT_W = FT.cols.reduce((a, b) => a + b, 0)
const ftColX = (j: number) => FT.x + FT.cols.slice(0, j).reduce((a, b) => a + b, 0)
const ftMid = (j: number) => ftColX(j) + FT.cols[j] / 2
const STAR_ARROWS: [number, number, number, number][] = [
  [ftMid(0), 184, 186, 118],
  [ftMid(1), 318, 112, 370],
  [ftMid(2), 318, 330, 370],
]
const RES2 = { x: 322, y: 20, w: 108, h: 84 }
// 팩트 → 결과 입자: 제목·측정값 라벨 오른쪽으로 올라가 결과 상자 자리에 닿는다(상자는 입자가 사라진 뒤 나타남)
const SP2_START = [FT.x + FT_W + 16, FT.y + RH * 2.5]
const SP2_END = [RES2.x + RES2.w / 2, RES2.y + RES2.h / 2]

function DimTable({ x, y, cols, title, labels, el, seed }: { x: number; y: number; cols: number[]; title: string; labels: string[]; el: string; seed: string }) {
  const W = cols.reduce((a, b) => a + b, 0)
  const cx = (j: number) => x + cols.slice(0, j).reduce((a, b) => a + b, 0)
  return (
    <g data-el={el}>
      <Txt x={x} y={y - 8} size={14} weight={800}>
        {title}
      </Txt>
      <rect x={x} y={y} width={W} height={28} style={{ fill: 'var(--surface)' }} />
      <RRect x={x} y={y} w={W} h={28} seed={seed} rough={0.35} />
      {cols.slice(1).map((_, j) => (
        <RLine key={j} x1={cx(j + 1)} y1={y} x2={cx(j + 1)} y2={y + 28} seed={`${seed}v${j}`} rough={0.25} strokeWidth={0.9} />
      ))}
      {labels.map((l, j) => (
        <Txt key={l} x={cx(j) + 7} y={y + 19} size={12.5} weight={700}>
          {l}
        </Txt>
      ))}
    </g>
  )
}

export function StarFig() {
  const p1 = colMid(OT, 'pid')
  const p2 = colMid(PT, 'pid')
  const k1 = colMid(PT, 'cid')
  const k2 = colMid(CT, 'cid')
  const otBottom = OT.y + RH * 5
  const ptBottom = PT.y + RH * 4
  const keyLine1 = `M ${p1} ${otBottom + 3} L ${p1} 314 L ${p2} 314 L ${p2} ${ptBottom + 3}`
  const keyLine2 = `M ${k1} ${ptBottom + 3} L ${k1} 292 L ${k2} 292 L ${k2} ${CT.y - 3}`
  const suGeo = cellBox(PT, 'name', 0)
  return (
    <Fig>
      {/* step 1: 나누기 전 넓은 표 → 가위선 → 세 조각 */}
      <Txt x={WIDE_X} y={WIDE_Y - 12} size={13} weight={700} muted el="wide-l">
        {F.before}
      </Txt>
      {PIECES.map((p, k) => (
        <g
          key={k}
          data-el="piece"
          data-dx={
            p.to.x +
            p.to.cols
              .slice(
                0,
                p.to.cols.findIndex((c) => c.key === p.cols[0].key),
              )
              .reduce((a, c) => a + c.w, 0) -
            PIECE_X[k]
          }
          data-dy={p.to.y - WIDE_Y}
        >
          <WidePiece k={k} x={PIECE_X[k]} y={WIDE_Y} seed={`st-wp${k}`} />
        </g>
      ))}
      {[PIECE_X[1], PIECE_X[2]].map((x, k) => (
        <g key={k} data-el="scissor">
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} data-el="cut" x1={x} y1={WIDE_Y - 14 + i * 11} x2={x} y2={WIDE_Y - 8 + i * 11} style={{ stroke: 'var(--ink)' }} strokeWidth={2} strokeLinecap="round" />
          ))}
        </g>
      ))}
      {/* 흐린 축소판 */}
      <g data-el="mini">
        <Txt x={MINI.x} y={MINI.y - 6} size={12.5} weight={700} muted>
          {F.before}
        </Txt>
        <g transform={`translate(${MINI.x} ${MINI.y}) scale(${MINI.s})`} style={{ opacity: 0.75 }}>
          {PIECES.map((_, k) => (
            <WidePiece key={k} k={k} x={PIECE_X[k] - WIDE_X} y={0} seed={`st-mp${k}`} bars />
          ))}
        </g>
        <RArrow x1={220} y1={MINI.y + 70} x2={220} y2={128} seed="st-mini-a" rough={0.4} />
      </g>
      {/* 정규화된 표 셋 */}
      <MiniTable x={OT.x} y={OT.y} cols={OT.cols} rows={F.nItems} el="ot" seed="st-ot" title={F.orderItems} />
      <g data-el="pt">
        <MiniTable x={PT.x} y={PT.y} cols={PT.cols} rows={F.nProducts} el="ptt" seed="st-pt" title={F.products} />
        {F.nProducts.map((r, i) => (
          <Txt key={i} x={cellBox(PT, 'cid', i).x + 7} y={cellBox(PT, 'cid', i).y + RH * 0.67} size={13} el="pt-cname">
            {catOf(r[2])}
          </Txt>
        ))}
        <Txt x={cellBox(PT, 'cid', 0).x + 7} y={PT.y + RH * 0.67} size={13 * 0.92} weight={750} el="pt-hcname">
          {NC.cname}
        </Txt>
      </g>
      <g data-el="ct" data-dx={cellBox(PT, 'cid', 0).x - (CT.x + CT.cols[0].w)} data-dy={PT.y - CT.y}>
        <MiniTable x={CT.x} y={CT.y} cols={CT.cols} rows={F.nCats} el="ctt" seed="st-ct" title={F.cats} />
      </g>
      {/* 수건 두 칸이 한 칸으로 */}
      <text data-el="su-fly" data-dy={-RH * 2} x={suGeo.x + 7} y={suGeo.y + RH * 2 + RH * 0.67} className="t-sans" style={{ fontSize: 13, fontWeight: 800, fill: 'var(--accent)' }}>
        {F.nProducts[0][1]}
      </text>
      <g data-el="once">
        <rect x={suGeo.x + 2} y={suGeo.y + 2} width={suGeo.w - 4} height={RH - 4} rx={3} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.6} />
        <Txt x={suGeo.x + suGeo.w / 2 + 18} y={PT.y - 8} size={13} weight={750} anchor="middle">
          {F.once}
        </Txt>
      </g>
      {/* 키 연결선 */}
      <g data-el="keys">
        {[cellBox(OT, 'pid', 0), cellBox(OT, 'pid', 2), cellBox(PT, 'pid', 0), cellBox(PT, 'cid', 0), cellBox(PT, 'cid', 2), cellBox(CT, 'cid', 0)].map((b, i) => (
          <rect key={i} x={b.x + 2} y={b.y + 2} width={b.w - 4} height={b.h - 4} rx={3} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={1.8} strokeDasharray="4 3" />
        ))}
      </g>
      <g data-el="key1">
        <RPath d={keyLine1} seed="st-k1" rough={0.4} strokeWidth={1.8} />
      </g>
      <g data-el="key2">
        <RPath d={keyLine2} seed="st-k2" rough={0.4} strokeWidth={1.8} />
      </g>
      <g data-el="join1">
        <rect x={(p1 + p2) / 2 - 24} y={304} width={48} height={20} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
        <Txt x={(p1 + p2) / 2} y={318.5} size={12.5} weight={800} anchor="middle" mono>
          {F.join}
        </Txt>
      </g>
      <g data-el="join1b">
        <rect x={(p1 + p2) / 2 - 46} y={304} width={92} height={20} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--accent)' }} strokeWidth={1.6} />
        <Txt x={(p1 + p2) / 2} y={318.5} size={12.5} weight={800} anchor="middle" mono>
          {F.joinCount}
        </Txt>
      </g>
      <g data-el="join2">
        <rect x={(k1 + k2) / 2 - 24} y={282} width={48} height={20} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.3} />
        <Txt x={(k1 + k2) / 2} y={296.5} size={12.5} weight={800} anchor="middle" mono>
          {F.join}
        </Txt>
      </g>
      <g data-el="dup">
        {[0, 2].map((i) => {
          const b = cellBox(PT, 'cid', i)
          return <line key={i} x1={b.x + 6} y1={b.y + 21} x2={b.x + 6 + tw(F.nCats[0][1], 13)} y2={b.y + 21} style={{ stroke: 'var(--muted)' }} strokeWidth={2.2} />
        })}
        <Txt x={k1 - 6} y={ptBottom + 22} size={12.5} weight={700} anchor="middle">
          {F.dupNote}
        </Txt>
      </g>

      {/* step 3~4: 팩트와 디멘션 */}
      <g data-el="fact">
        <Txt x={FT.x + FT_W} y={172} size={15} weight={800} anchor="end">
          {F.factTitle}
        </Txt>
        <rect x={ftColX(0)} y={186} width={ftColX(3) - ftColX(0)} height={18} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.5} />
        <Txt x={(ftColX(0) + ftColX(3)) / 2} y={199} size={12.5} weight={800} anchor="middle">
          {F.key}
        </Txt>
        <rect x={ftColX(3)} y={186} width={FT.x + FT_W - ftColX(3)} height={18} rx={4} style={{ fill: 'var(--accent)' }} />
        <Txt x={(ftColX(3) + FT.x + FT_W) / 2} y={199} size={12.5} weight={800} anchor="middle" color="#fff">
          {F.measure}
        </Txt>
        <MiniTable
          x={FT.x}
          y={FT.y}
          cols={FT.cols.map((w, j) => ({
            key: String(j),
            label: F.factCols[j],
            w,
          }))}
          rows={F.factRows}
          el="ftt"
          seed="st-ft"
        />
      </g>
      {STAR_ARROWS.map(([x1, y1, x2, y2], k) => (
        <g key={k} data-el="star-arrow">
          <RArrow x1={x1} y1={y1} x2={x2} y2={y2} seed={`st-sa${k}`} rough={0.4} />
        </g>
      ))}
      {STAR_ARROWS.slice(0, 2).map(([x1, y1, x2, y2], k) => (
        <line key={k} data-el="star-hot" x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--accent)' }} strokeWidth={3.4} strokeLinecap="round" />
      ))}
      <DimTable {...DIM.date} title={F.dims.date.title} labels={F.dims.date.cols} el="dim" seed="st-dd" />
      <DimTable {...DIM.product} title={F.dims.product.title} labels={F.dims.product.cols} el="dim" seed="st-dp" />
      <DimTable {...DIM.customer} title={F.dims.customer.title} labels={F.dims.customer.cols} el="dim" seed="st-dc" />
      <g data-el="merged-note">
        <Txt x={DIM.product.x + 56 + 48 + 24} y={DIM.product.y + 46} size={12.5} weight={650} anchor="middle" muted>
          {F.mergedNote}
        </Txt>
      </g>
      <Txt x={16} y={36} size={15} weight={800} el="q2">
        {F.byCategory}
      </Txt>
      <g data-el="res2">
        <RRect x={RES2.x} y={RES2.y} w={RES2.w} h={RES2.h} seed="st-res" rough={0.35} fill="var(--surface)" />
        <Txt x={RES2.x + 10} y={RES2.y + 22} size={13} weight={800}>
          {F.monthTitle}
        </Txt>
        {F.monthRows.map(([a, b], k) => (
          <g key={a}>
            <Txt x={RES2.x + 10} y={RES2.y + 46 + k * 22} size={13} weight={650}>
              {a}
            </Txt>
            <Txt x={RES2.x + RES2.w - 10} y={RES2.y + 46 + k * 22} size={13} weight={750} anchor="end">
              {b}
            </Txt>
          </g>
        ))}
        <Txt x={RES2.x + RES2.w / 2} y={RES2.y + RES2.h + 17} size={12.5} anchor="middle" muted>
          {F.monthNote}
        </Txt>
      </g>
      {/* 분류별 월 매출: 디멘션 → 팩트 → 결과 */}
      {STAR_ARROWS.slice(0, 2).flatMap(([x1, y1, x2, y2], k) =>
        [0, 1, 2, 3].map((i) => (
          <circle key={`${k}${i}`} data-el="sp" data-k={k} data-i={i} data-dx={x1 - x2} data-dy={y1 - y2} cx={x2} cy={y2} r={4.5} style={{ fill: 'var(--accent)' }} />
        )),
      )}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          data-el="sp2"
          data-i={i}
          data-dx={SP2_END[0] - SP2_START[0]}
          data-dy={SP2_END[1] - SP2_START[1]}
          cx={SP2_START[0]}
          cy={SP2_START[1]}
          r={4.5}
          style={{ fill: 'var(--accent)' }}
        />
      ))}
    </Fig>
  )
}

export const buildStar: SceneBuild = (q, tl) => {
  const o = pick(q)
  const tables = [...o('ot'), ...o('pt')]
  init(
    tl,
    [
      ...tables,
      ...o('ct'),
      ...o('mini'),
      ...o('su-fly'),
      ...o('once'),
      ...o('keys'),
      ...o('join1'),
      ...o('join1b'),
      ...o('join2'),
      ...o('dup'),
      ...o('pt-cname'),
      ...o('pt-hcname'),
      ...o('cut'),
    ],
    { opacity: 0 },
  )
  init(tl, [...o('fact'), ...o('star-arrow'), ...o('star-hot'), ...o('dim'), ...o('merged-note'), ...o('q2'), ...o('res2'), ...o('sp'), ...o('sp2')], { opacity: 0 })

  // step 1: 가위선 → 세 조각이 벌어져 → 정규화된 표 셋. 수건 두 칸은 한 칸으로, 원래 표는 흐린 축소판으로
  const s1 = at(0)
  tl.to(o('cut'), { opacity: 1, duration: 0.01, stagger: 0.008 }, s1 + 0.04)
  tl.to([...o('scissor'), ...o('wide-l')], { opacity: 0, duration: 0.06 }, s1 + 0.22)
  const pieces = o('piece')
  pieces.forEach((p) =>
    tl.to(
      p,
      {
        x: num(p, 'dx'),
        y: num(p, 'dy'),
        duration: 0.16,
        ease: 'power2.inOut',
      },
      s1 + 0.2,
    ),
  )
  tl.to(pieces, { opacity: 0, duration: 0.08 }, s1 + 0.38)
  tl.to([...tables, ...o('ct')], { opacity: 1, duration: 0.08 }, s1 + 0.38)
  const su = o('su-fly')
  tl.to(su, { opacity: 1, duration: 0.02 }, s1 + 0.4)
  tl.to(su, { y: num(su[0], 'dy'), duration: 0.1, ease: 'power2.inOut' }, s1 + 0.42)
  tl.to(su, { opacity: 0, duration: 0.03 }, s1 + 0.52)
  tl.to(o('once'), { opacity: 1, duration: 0.06 }, s1 + 0.52)
  tl.to(o('mini'), { opacity: 1, duration: 0.1 }, s1 + 0.54)
  const k1 = paths(o('key1'))
  const k2 = paths(o('key2'))
  init(tl, [...k1, ...k2], { drawSVG: '0%' })
  tl.to(o('keys'), { opacity: 1, duration: 0.05 }, s1 + 0.6)
  tl.to(k1, { drawSVG: '100%', duration: 0.1, ease: 'none' }, s1 + 0.62)
  tl.to(k2, { drawSVG: '100%', duration: 0.08, ease: 'none' }, s1 + 0.7)

  // step 2: 조인 두 번 → 분류 표가 상품 표에 붙어 '분류명' 열이 된다 → JOIN 2 → 1
  const s2 = at(1)
  tl.to([...o('mini'), ...o('once'), ...o('keys')], { opacity: 0, duration: 0.1 }, s2)
  tl.to([...o('join1'), ...o('join2')], { opacity: 1, duration: 0.08 }, s2 + 0.1)
  const ct = o('ct')[0]
  tl.to(o('join2'), { opacity: 0, duration: 0.06 }, s2 + 0.24)
  tl.to(k2, { drawSVG: '0%', duration: 0.12, ease: 'none' }, s2 + 0.24)
  tl.to(
    ct,
    {
      x: num(ct, 'dx'),
      y: num(ct, 'dy'),
      duration: 0.18,
      ease: 'power2.inOut',
    },
    s2 + 0.24,
  )
  const cidTexts = [...o('ptt-h-cid'), ...F.nProducts.flatMap((_, i) => o(`ptt-c${i}-cid`))]
  tl.to(cidTexts, { opacity: 0, duration: 0.05 }, s2 + 0.42)
  tl.to([...o('pt-cname'), ...o('pt-hcname')], { opacity: 1, duration: 0.06 }, s2 + 0.44)
  tl.to(ct, { opacity: 0, duration: 0.08 }, s2 + 0.44)
  tl.to(o('dup'), { opacity: 1, duration: 0.08 }, s2 + 0.54)
  tl.to(o('join1'), { opacity: 0, duration: 0.05 }, s2 + 0.62)
  tl.to(o('join1b'), { opacity: 1, duration: 0.06 }, s2 + 0.64)

  // step 3: 팩트 테이블이 가운데 → 키 열에서 화살표가 바깥으로
  const s3 = at(2)
  tl.to([...tables, ...o('dup'), ...o('join1b'), ...o('key1')], { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('fact'), { opacity: 1, duration: 0.12 }, s3 + 0.12)
  const arrows = o('star-arrow')
  arrows.forEach((a, k) => {
    tl.to(a, { opacity: 1, duration: 0.02 }, s3 + 0.36 + k * 0.1)
    drawArrows(tl, [a], s3 + 0.36 + k * 0.1, 0.1)
  })

  // step 4: 화살표 끝에 디멘션 셋 → 질문 → 필요한 두 선만 따라 결과로
  const s4 = at(3)
  o('dim').forEach((d, k) => tl.to(d, { opacity: 1, duration: 0.1 }, s4 + 0.04 + k * 0.1))
  tl.to(o('merged-note'), { opacity: 1, duration: 0.08 }, s4 + 0.24)
  tl.to(o('q2'), { opacity: 1, duration: 0.08 }, s4 + 0.36)
  tl.to(o('star-hot'), { opacity: 1, duration: 0.06 }, s4 + 0.42)
  o('sp').forEach((p) => {
    const t = s4 + 0.48 + num(p, 'i') * 0.03 + num(p, 'k') * 0.012
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.1, ease: 'power1.in' }, t)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.1)
  })
  o('sp2').forEach((p) => {
    const t = s4 + 0.6 + num(p, 'i') * 0.025
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.08, ease: 'power1.in' }, t)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.08)
  })
  tl.to(o('res2'), { opacity: 1, duration: 0.08 }, s4 + 0.78)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 이름 붙인 정의는 한곳에
// ─────────────────────────────────────────────────────────────
const DCARD = { x: 32, w: 376, h: 100, y: [100, 232] }
const SFILE: [number, number][] = [
  [92, 120],
  [340, 132],
  [100, 268],
  [330, 286],
  [214, 200],
]
const LOG = { x: 52, y: [384, 410, 436] }

function DefsFig() {
  return (
    <Fig caption={F.accountingNote} captionEl="note">
      <Txt x={214} y={30} size={15} weight={800} anchor="end" el="cnt5">
        {F.queries5}
      </Txt>
      <Txt x={224} y={30} size={15} weight={800} el="cnt2">
        {F.defs2}
      </Txt>
      <g data-el="defbox">
        <RRect x={16} y={48} w={408} h={296} seed="s-box" rough={0.45} />
        <Txt x={32} y={76} size={15} weight={800} el="defbox-t">
          {F.defBox}
        </Txt>
      </g>
      {F.defs.map((d, k) => {
        const y = DCARD.y[k]
        return (
          <g key={d.name} data-el="dcard" data-dx={214 - (DCARD.x + DCARD.w / 2)} data-dy={200 - (y + DCARD.h / 2)}>
            <g data-el="tab">
              <path
                d={`M ${DCARD.x} ${y} L ${DCARD.x} ${y - 18} Q ${DCARD.x} ${y - 24} ${DCARD.x + 6} ${y - 24} L ${DCARD.x + 124} ${y - 24} Q ${DCARD.x + 130} ${y - 24} ${DCARD.x + 132} ${y - 18} L ${DCARD.x + 138} ${y}`}
                style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
                strokeWidth={1.6}
              />
            </g>
            <RRect x={DCARD.x} y={y} w={DCARD.w} h={DCARD.h} seed={`s-card${k}`} rough={0.4} fill="var(--surface)" />
            <Txt x={DCARD.x + 16} y={y + 28} size={18} weight={800} el="dname">
              {d.name}
            </Txt>
            <Txt x={DCARD.x + 10} y={y - 7} size={13.5} weight={750} mono el="dfile">
              {d.file}
            </Txt>
            <Txt x={DCARD.x + 16} y={y + 52} size={14} weight={600}>
              {d.desc}
            </Txt>
            <Txt x={DCARD.x + 16} y={y + 74} size={13}>
              {d.rules}
            </Txt>
            <Txt x={DCARD.x + 16} y={y + 93} size={12.5} muted>
              {d.owner}
            </Txt>
          </g>
        )
      })}
      {/* 밑받침: 정리된 데이터(스타 스키마) 위에 정의가 놓인다 */}
      <g data-el="base">
        <RRect x={60} y={354} w={320} h={66} seed="s-base" rough={0.45} fill="var(--surface)" />
        <g style={{ color: 'var(--muted)' }}>
          {[
            [110, 368],
            [178, 368],
            [144, 408],
          ].map(([x, y], i) => (
            <g key={i}>
              <RLine x1={144} y1={387} x2={x} y2={y} seed={`s-bl${i}`} rough={0.2} strokeWidth={1.2} />
              <RRect x={x - 14} y={y - 7} w={28} h={14} seed={`s-bd${i}`} rough={0.2} fill="var(--surface)" />
            </g>
          ))}
          <RRect x={128} y={379} w={32} h={16} seed="s-bf" rough={0.2} fill="var(--surface)" strokeWidth={2} />
        </g>
        <Txt x={212} y={392} size={14.5} weight={800}>
          {WH_LABEL}
        </Txt>
      </g>
      {/* 흩어져 있던 매출 쿼리 5개 */}
      {F.files.map(([name], i) => (
        <g key={name} data-el="sfile" data-dx={214 + (i - 2) * 6 - SFILE[i][0]} data-dy={200 + (i - 2) * 5 - SFILE[i][1]}>
          <Node x={SFILE[i][0]} y={SFILE[i][1]} w={128} h={40} label="" kind="doc" seed={`s-f${i}`} />
          <Txt x={SFILE[i][0]} y={SFILE[i][1] + 5} size={13.5} weight={750} anchor="middle">
            {name}
          </Txt>
        </g>
      ))}
      {/* step 2: 순매출.sql 변경 기록(위가 최신) */}
      <g data-el="log">
        <RLine x1={LOG.x} y1={DCARD.y[1] + DCARD.h + 4} x2={LOG.x} y2={LOG.y[2]} seed="s-log" rough={0.2} strokeWidth={1.4} />
        <Txt x={LOG.x + 16} y={358} size={12.5} weight={700} muted>
          {F.logTitle}
        </Txt>
      </g>
      {F.log.map(([who, what], k) => (
        <g key={k} data-el="log-row">
          <circle cx={LOG.x} cy={LOG.y[k]} r={5} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.8} />
          <Txt x={LOG.x + 16} y={LOG.y[k] + 5} size={13.5} weight={k === 0 ? 750 : 600}>
            {`${who} · ${what}`}
          </Txt>
          {k === 0 && (
            <g data-el="review">
              <Txt x={LOG.x + 30 + tw(`${who} · ${what}`, 13.5)} y={LOG.y[k] + 5} size={13.5} weight={800}>
                {F.reviewed}
              </Txt>
              <Badge x={LOG.x + 30 + tw(`${who} · ${what}`, 13.5) + 40} y={LOG.y[k]} status="ok" r={9} />
            </g>
          )}
        </g>
      ))}
    </Fig>
  )
}

type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined

/** 맵 위 덧그림: 끊어질 옛 연결선(좌표는 build에서), warehouse 옆 '집계 대기' 게이지 */
function MapOverlay({ at: pos }: { at: At }) {
  const wh = pos('warehouse')
  const etl = pos('etl')
  if (!wh || !etl) return null
  const g = { x: wh.x - wh.w / 2 + 26, y: wh.y + wh.h / 2 + 52, r: 22 }
  // 세로 배치에선 etl → warehouse 직선이 오케스트레이터 뒤를 지나 '오케스트레이터를 거쳐 간다'로 읽힌다.
  // 같은 연결선을 왼쪽으로 돌려 그린다(원래 선은 build에서 숨김)
  const rx = wh.x - wh.w / 2 + 34
  const sx = etl.x - etl.w / 2 - 5
  return (
    <g>
      <g data-el="etl-route">
        <RLine x1={sx} y1={etl.y} x2={rx} y2={etl.y} seed="s-etl-r1" rough={0.5} />
        <RArrow x1={rx} y1={etl.y} x2={rx} y2={wh.y - wh.h / 2 - 7} seed="s-etl-r2" rough={0.5} />
      </g>
      <g data-el="old-link" style={{ color: 'var(--line)' }}>
        <line data-el="old-a" x1={0} y1={0} x2={0} y2={0} style={{ stroke: 'currentColor' }} strokeWidth={1.6} strokeLinecap="round" />
        <line data-el="old-b" x1={0} y1={0} x2={0} y2={0} style={{ stroke: 'currentColor' }} strokeWidth={1.6} strokeLinecap="round" />
        <path data-el="old-head" d="M 0 0" style={{ stroke: 'currentColor', fill: 'none' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g data-el="m-gauge" data-box={`${g.x - g.r - 30} ${g.y - g.r - 6} ${g.r * 2 + 60} ${g.r + 46}`}>
        <GaugeOk x={g.x} y={g.y} r={g.r} label={F.waitGauge} el="mg" value={0.14} seed="s-mg" />
        <Badge x={g.x + g.r + 12} y={g.y - 6} status="ok" r={9} />
      </g>
    </g>
  )
}

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="defs-layer" className="absolute inset-0">
        <DefsFig />
      </div>
      <div data-el="map-layer" className="absolute inset-0 flex flex-col">
        {/* 모바일 줌: 뷰박스 밖 노드(운영 DB 등)가 위 여백으로 비져 나오지 않게 자른다 */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <PipelineMap t={T.ch4} from={T.ch3} vertical className="absolute inset-0" label={ch4.scenes.solution.steps[2].alt} overlay={(a) => <MapOverlay at={a} />} />
        </div>
        <p className="mt-2 text-center text-[0.8125rem] leading-snug text-muted md:text-sm">{F.mapCaption}</p>
      </div>
      <div data-el="room-layer" className="absolute inset-0">
        <Fig viewBox="0 0 440 380">
          <MeetingRoom tiles />
        </Fig>
      </div>
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  init(tl, [...o('map-layer'), ...o('room-layer')], { opacity: 0 })

  // step 1: 흩어진 쿼리 5개가 가운데로 모여 → 정의 카드 2장
  const s1 = at(0)
  const files = o('sfile')
  const cards = o('dcard')
  init(tl, [...cards, ...o('cnt2'), ...o('defbox'), ...o('base'), ...o('note'), ...o('tab'), ...o('dfile'), ...o('log'), ...o('log-row'), ...o('review')], { opacity: 0 })
  files.forEach((f, i) =>
    tl.to(
      f,
      {
        x: num(f, 'dx'),
        y: num(f, 'dy'),
        duration: 0.22,
        ease: 'power2.inOut',
      },
      s1 + 0.04 + i * 0.02,
    ),
  )
  tl.to(files, { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', duration: 0.1 }, s1 + 0.32)
  cards.forEach((c) =>
    init(tl, c, {
      x: num(c, 'dx'),
      y: num(c, 'dy'),
      scale: 0.6,
      transformOrigin: '50% 50%',
    }),
  )
  tl.to(cards, { opacity: 1, duration: 0.08 }, s1 + 0.36)
  tl.to(cards, { x: 0, y: 0, scale: 1, duration: 0.2, ease: 'power2.out', stagger: 0.04 }, s1 + 0.38)
  tl.to(o('defbox'), { opacity: 1, duration: 0.1 }, s1 + 0.46)
  tl.to(o('base'), { opacity: 1, duration: 0.1 }, s1 + 0.54)
  tl.to(o('cnt2'), { opacity: 1, duration: 0.08 }, s1 + 0.6)
  tl.to(o('note'), { opacity: 1, duration: 0.1 }, s1 + 0.64)

  // step 2: 정의 카드 → 파일 탭(.sql), 변경 기록이 아래에서 위로
  const s2 = at(1)
  tl.to([...o('base'), ...o('defbox-t'), ...o('cnt5'), ...o('cnt2')], { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('tab'), { opacity: 1, duration: 0.1 }, s2 + 0.08)
  tl.to(o('dfile'), { opacity: 1, duration: 0.08 }, s2 + 0.14)
  tl.to(o('log'), { opacity: 1, duration: 0.08 }, s2 + 0.26)
  const rows = o('log-row')
  ;[2, 1, 0].forEach((k, n) => {
    init(tl, rows[k], { opacity: 0, y: 10 })
    tl.to(rows[k], { opacity: 1, y: 0, duration: 0.1 }, s2 + 0.32 + n * 0.12)
  })
  tl.to(o('review'), { opacity: 1, duration: 0.06 }, s2 + 0.7)

  // step 3: 맵 — 라벨 교체 → 옛 연결선이 가운데서 끊기고 → model → 다시 이어짐 → bi 라벨
  const s3 = at(2)
  tl.to(o('defs-layer'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('map-layer'), { opacity: 1, duration: 0.1 }, s3 + 0.04)
  const svg = o('map')[0] as SVGSVGElement | undefined
  const box = (id: string): Box | null => {
    const r = q(`[data-node="${id}"] .node-focus`)[0]
    if (!r) return null
    const n = (a: string) => Number(r.getAttribute(a))
    return {
      x: n('x') + n('width') / 2,
      y: n('y') + n('height') / 2,
      w: n('width') - 12,
      h: n('height') - 12,
    }
  }
  const wh = box('warehouse')
  const biNow = box('bi')
  const biEl = q('[data-node="bi"]')[0] as SVGElement | undefined
  if (svg && wh && biNow && biEl) {
    // 이 장면은 노드 8개에 꼭 맞춰 고정(줌 없음)
    const all = q('[data-node] .node-focus').map((r) => {
      const n = (a: string) => Number(r.getAttribute(a))
      return [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')]
    })
    const gb = (o('m-gauge')[0] as SVGElement | undefined)?.dataset.box?.split(' ').map(Number)
    if (gb) all.push([gb[0], gb[1], gb[0] + gb[2], gb[1] + gb[3]])
    const fit = (list: number[][]) => {
      const x0 = Math.min(...list.map((b) => b[0])) - 10
      const y0 = Math.min(...list.map((b) => b[1])) - 10
      return `${x0} ${y0} ${Math.max(...list.map((b) => b[2])) + 10 - x0} ${Math.max(...list.map((b) => b[3])) + 10 - y0}`
    }
    svg.dataset.vbFrom = svg.dataset.vbTo = fit(all)
    // 모바일에선 노드 8개 전체가 너무 작아진다 → 전체를 보여 준 뒤 바뀌는 아래쪽(ETL ~ BI)으로 다가간다
    const etl = box('etl')
    if (mobile && etl) svg.dataset.vbTo = fit(all.filter((b) => b[1] >= etl.y - etl.h / 2 - 8))

    // 옛 연결선(warehouse → 예전 자리의 bi)
    const biOld: Box = {
      ...biNow,
      x: biNow.x + Number(biEl.dataset.dx ?? 0),
      y: biNow.y + Number(biEl.dataset.dy ?? 0),
    }
    const [ax, ay, bx, by] = link(wh, biOld)
    const mx = (ax + bx) / 2
    const my = (ay + by) / 2
    const a = Math.atan2(by - ay, bx - ax)
    const hd = `M ${bx - 9 * Math.cos(a - 0.45)} ${by - 9 * Math.sin(a - 0.45)} L ${bx} ${by} L ${bx - 9 * Math.cos(a + 0.45)} ${by - 9 * Math.sin(a + 0.45)}`
    init(tl, o('old-a'), { attr: { x1: ax, y1: ay, x2: mx, y2: my } })
    init(tl, o('old-b'), { attr: { x1: bx, y1: by, x2: mx, y2: my } })
    init(tl, o('old-head'), { attr: { d: hd } })
  }
  // 라벨 교체는 이 장면에서 순서를 따로 정한다(mapTransition이 건드리지 않도록 이름을 바꿔 둔다)
  const relabel = (id: string, from: string, to: string) =>
    q(`[data-node="${id}"] [data-el="${from}"], [data-node="${id}"] [data-el="${to}"]`).forEach((e) => e.setAttribute('data-el', to))
  relabel('warehouse', 'lbl-old', 'wh-old')
  relabel('warehouse', 'lbl-new', 'wh-new')
  relabel('bi', 'lbl-old', 'bi-old')
  relabel('bi', 'lbl-new', 'bi-new')
  init(tl, [...o('wh-new'), ...o('bi-new'), ...o('m-gauge'), ...q('[data-edge="warehouse>bi"]'), ...q('[data-edge="etl>warehouse"]')], { opacity: 0 })
  const whPaths = q('[data-node="warehouse"] path')
  tl.to(o('wh-old'), { opacity: 0, duration: 0.06 }, s3 + 0.16)
  tl.to(o('wh-new'), { opacity: 1, duration: 0.08 }, s3 + 0.22)
  // 테두리를 한 번 다시 그린다(되감으면 원래대로 남아 있게 0%로 끊는 순간을 따로 둔다)
  tl.to(whPaths, { drawSVG: '0%', duration: 0.001 }, s3 + 0.16)
  tl.to(whPaths, { drawSVG: '100%', duration: 0.16, ease: 'none' }, s3 + 0.162)
  tl.to(o('m-gauge'), { opacity: 1, duration: 0.08 }, s3 + 0.28)
  // 가운데서 끊긴다: 두 반쪽이 양 끝으로 물러난다
  init(tl, [...o('old-a'), ...o('old-b')], { drawSVG: '100%' })
  tl.to([...o('old-a'), ...o('old-b')], { drawSVG: '0%', duration: 0.1, ease: 'none' }, s3 + 0.32)
  tl.to(o('old-head'), { opacity: 0, duration: 0.03 }, s3 + 0.4)
  mapTransition(q, tl, s3 + 0.36, { dur: 0.39 })
  const model = q('[data-node="model"] path')
  init(tl, model, { drawSVG: '0%' })
  tl.to(model, { drawSVG: '100%', duration: 0.12, ease: 'none' }, s3 + 0.54)
  const newE = [...q('[data-edge="warehouse>model"]'), ...q('[data-edge="model>bi"]')]
  drawArrows(tl, newE, s3 + 0.6, 0.1)
  tl.to(q('[data-node="model"] .node-focus'), { opacity: 1, duration: 0.06 }, s3 + 0.66)
  tl.to(o('bi-old'), { opacity: 0, duration: 0.05 }, s3 + 0.7)
  tl.to(o('bi-new'), { opacity: 1, duration: 0.08 }, s3 + 0.72)

  // step 4: 다시 열린 회의 — 숫자 카드가 스크린 타일로, 이름표가 붙고 ≠는 지워진다
  const s4 = at(3)
  tl.to(o('map-layer'), { opacity: 0, duration: 0.1 }, s4)
  tl.to(o('room-layer'), { opacity: 1, duration: 0.1 }, s4 + 0.06)
  init(tl, [...o('tiles'), ...o('tile-in')], { opacity: 0 })
  o('rneq-s').forEach((s, i) => tl.to(paths([s]), { drawSVG: '0%', duration: 0.05, ease: 'none' }, s4 + 0.2 + i * 0.04))
  tl.to(o('room-fake'), { opacity: 0, duration: 0.06 }, s4 + 0.22)
  tl.to(o('tiles'), { opacity: 1, duration: 0.08 }, s4 + 0.22)
  o('rcard').forEach((c) =>
    tl.to(
      c,
      {
        x: num(c, 'dx'),
        y: num(c, 'dy'),
        duration: 0.24,
        ease: 'power2.inOut',
      },
      s4 + 0.3,
    ),
  )
  tl.to(o('rcard-frame'), { opacity: 0, duration: 0.08 }, s4 + 0.5)
  tl.to(o('tile-in'), { opacity: 1, duration: 0.08, stagger: 0.04 }, s4 + 0.56)
}
