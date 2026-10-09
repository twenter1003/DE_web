import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ch2, RAW_ORDERS } from '../../content/chapters/ch2'
import { UI } from '../../content/ui'
import { InteractionFrame } from '../../components/Chapter'
import { Badge } from '../../components/diagram'
import { Txt } from '../../components/fig'
import { RArrow, RLine, RPath, RRect } from '../../components/sketch'
import { plain, Rich } from '../../lib/rich'
import { useEnv } from '../../state/env'
import { blockPts, tw } from './parts'
import { BLANK, commandOf, EMPTY, filledReal, kindOf, NAMES, isNum, isStdDate, issuesOf, region, regionKey, reportOf, run, TRUTH, type CmdName, type Kind, type Row, type Snap, type Step, type Trace } from './pipeline'

// 파이프라인 코드 실행기: 코드를 한 줄씩 실행하며, 그 줄이 데이터에 한 일을 그림으로 보여 준다.
// 그림은 줄마다의 상태 사진(Snap)을 그대로 그리고, 사진 사이의 움직임은 CSS 전환(transform·opacity)이 맡는다.

const I = ch2.interaction
const DEFAULT = I.code.join('\n')
const STEP_MS = 750

// ── 그림 좌표 ─────────────────────────────────────────────────
const ROW_W = 300
const ROW_H = 22
const PITCH = 26
const ROWS_TOP = 44 // 표 제목(0~18) + 머리글(18~40) 아래부터 줄
const SLOTS = RAW_ORDERS.length
const TABLE_H = ROWS_TOP + SLOTS * PITCH
const CHIP_H = 42
// 칸 위치는 모바일 글자 하한(11.5 → 12.75)에서도 날짜와 글자 가격이 붙지 않게 잡았다
const CX = { id: 12, date: 59, priceL: 142, priceR: 203, region: 212, tagR: 295 }
const HL: Record<string, [number, number]> = { id: [8, 56], date: [56, 139], price: [139, 207], addr: [208, 256] }

interface Box {
  x: number
  y: number
  w: number
  h: number
}
interface Geo {
  w: number
  h: number
  wide: boolean
  src: Box
  stub: (i: number) => Box
  belt: { x0: number; x1: number; chipY: number; lineY: number }
  work: { x0: number; x1: number; y: number }
  store: Box
  storeChips: { x0: number; x1: number; y: number } | null
  origY: number | null
  table: { x: number; y: number }
}

/** onBelt: 표가 벨트 위에 있는 동안만(좁은 그림) 벨트와 저장소 사이에 표 자리를 연다. 비었을 땐 저장소를 벨트 바로 아래로 */
function geo(wide: boolean, hasStoreChips: boolean, hasOrig: boolean, onBelt: boolean): Geo {
  if (wide) {
    return {
      w: 920,
      h: 356,
      wide,
      src: { x: 10, y: 8, w: 132, h: 340 },
      stub: (i) => ({ x: 26, y: 128 + ROWS_TOP + i * PITCH + 2, w: 100, h: 18 }),
      belt: { x0: 158, x1: 568, chipY: 26, lineY: 68 },
      work: { x0: 166, x1: 268, y: 128 },
      store: { x: 590, y: 8, w: 322, h: 340 },
      storeChips: { x0: 600, x1: 902, y: 42 },
      origY: 106,
      table: { x: 601, y: 140 },
    }
  }
  const S = onBelt ? 404 : 212
  let next = S + 32
  const storeChips = hasStoreChips ? { x0: 20, x1: 340, y: next } : null
  if (hasStoreChips) next += 62
  const origY = hasOrig ? next : null
  if (hasOrig) next += 28
  const bottom = next + TABLE_H + 6
  return {
    w: 360,
    h: bottom + 8,
    wide,
    src: { x: 20, y: 8, w: 320, h: 92 },
    stub: (i) => ({ x: 36 + i * 48, y: 58, w: 40, h: 14 }),
    // 칩 6개(수거·분류·포장×4·배송)가 들어가도 가장 긴 라벨 '분류·포장'(모바일 11.5)이 칩 테두리에 닿지 않게 벨트를 화면 폭 거의 끝까지(가운데 180 유지)
    belt: { x0: 4, x1: 356, chipY: 118, lineY: 160 },
    work: { x0: 30, x1: 30, y: 188 },
    store: { x: 10, y: S, w: 340, h: bottom - S },
    storeChips,
    origY,
    table: { x: 30, y: next },
  }
}

// ── 작은 부품 ─────────────────────────────────────────────────

/** 원통(DB). 뚜껑 안에 이름을 쓴다 */
function Drum({ b, seed, label }: { b: Box; seed: string; label: string }) {
  const { x, y, w, h } = b
  const ry = 12
  const x1 = x + w
  const y1 = y + h
  const rx = w / 2
  const body = `M ${x} ${y + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y + ry} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x} ${y1 - ry} Z`
  const outline = `M ${x} ${y + ry} A ${rx} ${ry} 0 0 1 ${x1} ${y + ry} A ${rx} ${ry} 0 0 1 ${x} ${y + ry} M ${x} ${y + ry} L ${x} ${y1 - ry} A ${rx} ${ry} 0 0 0 ${x1} ${y1 - ry} L ${x1} ${y + ry}`
  return (
    <g>
      <path d={body} style={{ fill: 'var(--surface)' }} />
      <RPath d={outline} seed={seed} rough={0.45} />
      <Txt x={x + rx} y={y + ry + 5} size={13} weight={750} anchor="middle">
        {label}
      </Txt>
    </g>
  )
}

const ICONS: Record<Kind, string> = {
  extract: 'M -8 -1 L 8 -1 L 8 7 L -8 7 Z M 0 -3 L 0 -10 M -3.5 -6.5 L 0 -10 L 3.5 -6.5',
  transform: 'M -8 -5 L 8 -5 L 8 7 L -8 7 Z M -8 -1 L 8 -1 M -2.5 -5 L -2.5 -1 M 2.5 -5 L 2.5 -1',
  load: 'M -10 -5 L 2 -5 L 2 4 L -10 4 Z M 2 -2 L 6 -2 L 9 1 L 9 4 L 2 4',
  report: 'M -6 -8 L 3 -8 L 6 -5 L 6 8 L -6 8 Z M -3 5 L -3 2 M 0 5 L 0 -1 M 3 5 L 3 1',
}

function Chip({ cx, y, slot, step, cur, shown }: { cx: number; y: number; slot: number; step: Step; cur: boolean; shown: boolean }) {
  const w = Math.max(8, Math.min(56, slot - 6))
  const x0 = cx - w / 2
  const ok = step.ok
  const kind = step.kind
  // 양옆 4 이상 남을 때만 10, 아니면 9(모바일 칩 6개의 '분류·포장'이 테두리에 닿지 않게)
  const label = ok && kind ? I.kinds[kind] : I.fig.stop
  return (
    <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 0.3s' }}>
      <rect x={x0} y={y} width={w} height={CHIP_H} rx={4} style={{ fill: 'var(--surface)' }} />
      <RRect x={x0} y={y} w={w} h={CHIP_H} seed={`chip${step.line}`} rough={0.35} stroke={ok ? undefined : 'var(--fail)'} />
      <rect x={x0 - 2.5} y={y - 2.5} width={w + 5} height={CHIP_H + 5} rx={6} style={{ fill: 'none', stroke: 'var(--accent)', opacity: cur ? 1 : 0, transition: 'opacity 0.25s' }} strokeWidth={2.6} />
      <Txt x={x0 + 4} y={y + 11} size={9.5} weight={700} muted>
        {step.line + 1}
      </Txt>
      {ok && kind ? (
        <path d={ICONS[kind]} transform={`translate(${cx} ${y + 17})`} style={{ fill: 'none', stroke: 'currentColor' }} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      ) : (
        <Badge x={cx} y={y + 16} status="fail" r={8} />
      )}
      {w >= 40 && (
        <Txt x={cx} y={y + 36} size={tw(label, 10) + 8 <= w ? 10 : 9} weight={650} anchor="middle" color={ok ? undefined : 'var(--fail)'}>
          {label}
        </Txt>
      )}
      {ok && slot >= 46 && step.name in I.commands && (
        <Txt x={cx} y={y + CHIP_H + 15} size={10} anchor="middle" muted>
          {I.commands[step.name as CmdName].short}
        </Txt>
      )}
    </g>
  )
}

/** 표 제목 + 정리 상태(✓/✕ + 글자) */
function TableTitle({ name, rows, x = 0, y = 12 }: { name: string; rows: Row[]; x?: number; y?: number }) {
  const n = issuesOf(rows).total
  const title = `${name} · ${I.fig.count(rows.length)}`
  const tx = x + tw(title, 12) + 10
  return (
    <g>
      <Txt x={x} y={y} size={12} weight={750}>
        {title}
      </Txt>
      <Txt x={tx} y={y} size={11} weight={700} color={n ? 'var(--fail)' : 'var(--ok)'}>
        {n ? `✕ ${I.fig.dirty(n)}` : `✓ ${I.fig.clean}`}
      </Txt>
    </g>
  )
}

const fade = (on: boolean, extra?: CSSProperties): CSSProperties => ({ opacity: on ? 1 : 0, transition: 'opacity 0.35s', ...extra })

/** 주문 한 줄 = 데이터 블록. 고칠 곳이 남아 있으면 울퉁불퉁, 다 고치면 반듯 */
function RowBlock({ row, dup, changed }: { row: Row; dup: boolean; changed: string[] }) {
  const { mobile } = useEnv()
  // 점선 밑줄 길이: 모바일에선 fs()가 11.5를 12.75로 키워 그린다(index.css --fs-lift: 7px)
  const ul = (s: string) => tw(s, mobile ? 12.75 : 11.5)
  const raw = RAW_ORDERS[row.uid]
  const textPrice = !isNum(row.price)
  const oddDate = !isStdDate(row.date)
  const blank = row.addr.trim() === ''
  const filled = row.filled.includes('addr')
  const dirty = dup || textPrice || oddDate || blank
  const hit = (c: string) => changed.includes(`${row.uid}:${c}`)
  const y = 15.5
  const priceText = `"${raw.price}"`
  const fillText = Array.from(row.addr).length > 4 ? `${Array.from(row.addr).slice(0, 4).join('')}…` : row.addr
  return (
    <g>
      <polygon points={blockPts(0, 0, ROW_W, ROW_H, `run-row${row.uid}`, 2.4)} style={fade(dirty, { fill: 'var(--surface)', stroke: 'var(--accent)' })} strokeWidth={1.6} strokeLinejoin="round" />
      <polygon points={blockPts(0, 0, ROW_W, ROW_H)} style={fade(!dirty, { fill: 'var(--surface)', stroke: 'var(--accent)' })} strokeWidth={1.6} />
      <rect x={3.5} y={4} width={5} height={ROW_H - 8} rx={1} style={{ fill: 'var(--accent)' }} />
      {Object.entries(HL).map(([c, [a, b]]) => (
        <rect key={c} x={a} y={2} width={b - a} height={ROW_H - 4} rx={3} style={{ fill: 'var(--accent)', opacity: hit(c) ? 0.2 : 0, transition: 'opacity 0.3s' }} />
      ))}
      <Txt x={CX.id} y={y} size={11.5} weight={650} mono>
        {row.id}
      </Txt>
      {/* 날짜: 원래 모양 ↔ 맞춘 모양 */}
      <g style={fade(row.date === raw.date)}>
        <Txt x={CX.date} y={y} size={11.5} mono>
          {raw.date}
        </Txt>
        {!isStdDate(raw.date) && <line x1={CX.date} y1={y + 3} x2={CX.date + ul(raw.date)} y2={y + 3} style={{ stroke: 'var(--muted)' }} strokeWidth={1.2} strokeDasharray="2 2" />}
      </g>
      <g style={fade(row.date !== raw.date)}>
        <Txt x={CX.date} y={y} size={11.5} mono>
          {row.date}
        </Txt>
      </g>
      {/* 가격: 글자(따옴표, 왼쪽 정렬) ↔ 숫자(오른쪽 정렬) */}
      <g style={fade(textPrice)}>
        <Txt x={CX.priceL} y={y} size={11.5} mono>
          {priceText}
        </Txt>
        <line x1={CX.priceL} y1={y + 3} x2={CX.priceL + ul(priceText)} y2={y + 3} style={{ stroke: 'var(--muted)' }} strokeWidth={1.2} strokeDasharray="2 2" />
      </g>
      <g style={fade(!textPrice)}>
        <Txt x={CX.priceR} y={y} size={11.5} mono anchor="end">
          {textPrice ? raw.price : row.price}
        </Txt>
      </g>
      {/* 지역: 빈칸 ↔ 채운 값 */}
      <g style={fade(blank)}>
        <rect x={CX.region - 2} y={4} width={42} height={ROW_H - 8} rx={2} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.2} strokeDasharray="3 3" />
        <Txt x={CX.region + 19} y={y - 0.5} size={10} anchor="middle" muted>
          {I.fig.blank}
        </Txt>
      </g>
      <g style={fade(filled && !blank)}>
        <rect x={CX.region - 3} y={3} width={tw(fillText, 11) + 8} height={ROW_H - 6} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--accent)' }} strokeWidth={1.6} />
        <Txt x={CX.region + 1} y={y - 0.5} size={11} weight={700}>
          {fillText}
        </Txt>
      </g>
      <g style={fade(!filled && !blank)}>
        <Txt x={CX.region} y={y} size={11.5}>
          {region(row.addr)}
        </Txt>
      </g>
      <g style={fade(dup)}>
        <Txt x={CX.tagR} y={y} size={11} weight={750} anchor="end" color="var(--fail)">
          {`✕ ${I.fig.dup}`}
        </Txt>
      </g>
    </g>
  )
}

const move = (x: number, y: number, sx = 1, sy = 1) => `translate(${x}px, ${y}px)` + (sx !== 1 || sy !== 1 ? ` scale(${sx}, ${sy})` : '')

function PipelineFig({ trace, cur, wide, reduced }: { trace: Trace; cur: number; wide: boolean; reduced: boolean }) {
  const { steps } = trace
  const snap: Snap = cur >= 0 ? steps[cur].snap : EMPTY
  const inStore = (s: Step) => s.kind !== 'extract' && s.kind !== 'load' && (s.kind === 'transform' ? s.inside : s.snap.where === 'store')
  const outside = steps.filter((s) => !inStore(s))
  const inside = steps.filter(inStore)
  const g = geo(wide, inside.length > 0, steps.some((s) => s.snap.orig), snap.where === 'belt')
  const chipAt = (s: Step) => {
    const list = inStore(s) ? inside : outside
    const z = inStore(s) ? g.storeChips! : g.belt
    const slot = (z.x1 - z.x0) / Math.max(list.length, 1)
    return { cx: z.x0 + slot * (list.indexOf(s) + 0.5), slot }
  }

  // 표 자리: 벨트 위면 지금 스테이션 아래로 조금씩 따라가고, 실리면 저장소 안
  const curStep = cur >= 0 ? steps[cur] : null
  let tx = g.work.x0
  let ty = g.work.y
  if (snap.where === 'store') [tx, ty] = [g.table.x, g.table.y]
  else if (curStep && !inStore(curStep)) tx = Math.min(g.work.x1, Math.max(g.work.x0, chipAt(curStep).cx - ROW_W / 2))
  const tableName = snap.where === 'store' ? snap.table : I.fig.belt
  const dupRows = issuesOf(snap.rows).dupRows
  const T = 'transform 0.55s cubic-bezier(.4,0,.2,1), opacity 0.35s'

  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} className="diagram block h-auto w-full" aria-hidden="true">
      {/* 운영 DB: 꺼내도 원본 줄은 그대로 */}
      <Drum b={g.src} seed="run-src" label={I.fig.source} />
      {g.wide ? (
        <>
          <Txt x={g.src.x + g.src.w / 2} y={56} size={11.5} anchor="middle" muted mono>
            {I.fig.sourceSub}
          </Txt>
          <Txt x={g.src.x + g.src.w / 2} y={76} size={12} weight={700} anchor="middle">
            {I.fig.srcCount(RAW_ORDERS.length)}
          </Txt>
          {I.fig.srcKeep.map((t, k) => (
            <Txt key={t} x={g.src.x + g.src.w / 2} y={104 + k * 15} size={11} anchor="middle" muted style={fade(snap.where !== 'none')}>
              {t}
            </Txt>
          ))}
        </>
      ) : (
        <>
          <Txt x={g.src.x + 14} y={50} size={12} weight={700}>
            {I.fig.srcCount(RAW_ORDERS.length)}
          </Txt>
          <Txt x={g.src.x + g.src.w - 14} y={50} size={11.5} anchor="end" muted mono>
            {I.fig.sourceSub}
          </Txt>
          <Txt x={g.src.x + 14} y={90} size={11} muted style={fade(snap.where !== 'none')}>
            {I.fig.srcKeep.join(' ')}
          </Txt>
        </>
      )}
      {RAW_ORDERS.map((_, i) => {
        const b = g.stub(i)
        return (
          <polygon
            key={i}
            points={blockPts(b.x, b.y, b.w, b.h, `run-stub${i}`, 1.8)}
            style={{ fill: 'var(--accent)', opacity: 0.85 }}
          />
        )
      })}

      {/* 벨트 */}
      {g.wide ? (
        <RLine x1={g.src.x + g.src.w} y1={g.belt.lineY} x2={g.store.x - 4} y2={g.belt.lineY} seed="run-belt" rough={0.4} />
      ) : (
        <>
          <RLine x1={g.belt.x0} y1={g.belt.lineY} x2={g.belt.x1} y2={g.belt.lineY} seed="run-belt" rough={0.4} />
          <RLine x1={180} y1={g.src.y + g.src.h + 2} x2={180} y2={g.belt.chipY - 4} seed="run-drop" rough={0.3} strokeWidth={1.2} />
          <RArrow x1={180} y1={snap.where === 'belt' ? g.work.y + TABLE_H : g.belt.lineY + 22} x2={180} y2={g.store.y - 2} seed="run-into" rough={0.3} head={7} />
        </>
      )}

      {/* 분석용 DB */}
      <Drum b={g.store} seed="run-store" label={I.fig.store} />
      {g.wide && <path d={`M ${g.store.x - 12} ${g.belt.lineY - 6} L ${g.store.x - 3} ${g.belt.lineY} L ${g.store.x - 12} ${g.belt.lineY + 6}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.8} />}

      {/* 스테이션: 실행한 줄마다 하나 */}
      {steps.map((s, k) => {
        const { cx, slot } = chipAt(s)
        const y = inStore(s) ? g.storeChips!.y : g.belt.chipY
        return <Chip key={k} cx={cx} y={y} slot={slot} step={s} cur={k === cur} shown={k <= cur} />
      })}

      {/* ELT: 저장소 안에 그대로 남은 원본 */}
      {g.origY !== null && (
        <g style={fade(!!snap.orig)}>
          <TableTitle name={I.fig.tables.orig} rows={snap.orig ?? []} x={g.table.x} y={g.origY + 14} />
          {(snap.orig ?? []).map((r, k) => {
            const x = g.table.x + ROW_W - (SLOTS - k) * 17
            const bumpy = issuesOf(snap.orig ?? []).dupRows.has(r.uid) || !isNum(r.price) || !isStdDate(r.date) || r.addr.trim() === ''
            return <polygon key={r.uid} points={blockPts(x, g.origY! + 4, 14, 12, bumpy ? `run-orig${r.uid}` : undefined, 1.6)} style={{ fill: 'var(--accent)' }} />
          })}
        </g>
      )}

      {/* 표 머리 */}
      <g style={{ transform: move(tx, ty), opacity: snap.where === 'none' ? 0 : 1, transition: T }}>
        <TableTitle name={tableName} rows={snap.rows} />
        {(
          [
            ['id', CX.id, 'start'],
            ['date', CX.date, 'start'],
            ['price', CX.priceR, 'end'],
            ['region', CX.region, 'start'],
          ] as const
        ).map(([k, x, a]) => (
          <Txt key={k} x={x} y={34} size={10.5} weight={700} anchor={a} muted>
            {I.fig.heads[k]}
          </Txt>
        ))}
      </g>

      {/* 주문 줄(데이터 블록). 아직 안 꺼냈으면 운영 DB 안 자기 자리에 숨어 있다 */}
      {RAW_ORDERS.map((raw, uid) => {
        const slot = snap.rows.findIndex((r) => r.uid === uid)
        const gone = snap.gone.find((x) => x.row.uid === uid)
        const row = slot >= 0 ? snap.rows[slot] : (gone?.row ?? { ...raw, uid, filled: [] })
        let style: CSSProperties
        if (slot >= 0) style = { transform: move(tx, ty + ROWS_TOP + slot * PITCH), opacity: 1 }
        else if (gone) style = { transform: move(tx + 28, ty + ROWS_TOP + gone.slot * PITCH), opacity: 0 }
        else {
          const b = g.stub(uid)
          style = { transform: move(b.x, b.y, b.w / ROW_W, b.h / ROW_H), opacity: 0 }
        }
        return (
          <g key={uid} style={{ ...style, transition: T, transitionDelay: reduced || gone ? '0s' : `${uid * 0.035}s` }}>
            <RowBlock row={row} dup={dupRows.has(uid) || !!gone} changed={snap.changed} />
          </g>
        )
      })}
    </svg>
  )
}

// ── 아침 리포트 ───────────────────────────────────────────────

function ReportCard({ snap }: { snap: Snap }) {
  const R = I.report
  if (snap.where !== 'store')
    return (
      <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
        <p className="font-bold">{R.title}</p>
        <p className="mt-1 text-muted">{R.empty}</p>
      </div>
    )
  const rows = snap.rows
  const r = reportOf(rows)
  const t = TRUTH.report
  const dup = r.issues.dup
  const dupNum = rows.filter((x) => r.issues.dupRows.has(x.uid) && isNum(x.price)).map((x) => x.id)
  const blank = rows.filter((x) => x.addr.trim() === '').length
  const fakeAddr = rows.find(filledReal)?.addr
  const sortKey = (a: [string, number][]) => JSON.stringify([...a].sort())
  const label = (k: string) => (k === BLANK ? R.blankRegion : k)
  const lines: { key: string; label: string; value: string; ok: boolean; wrong: string; why: string[] }[] = [
    { key: 'count', label: R.labels.count, value: R.count(r.count), ok: r.count === t.count, wrong: R.wrong(R.count(t.count)), why: dup.length ? [R.why.dup(dup)] : [] },
    {
      key: 'revenue',
      label: R.labels.revenue,
      value: R.won(r.revenue),
      ok: r.revenue === t.revenue,
      wrong: R.wrong(R.won(t.revenue)),
      why: [...(r.issues.text ? [R.why.text(r.issues.text)] : []), ...(dupNum.length ? [R.why.dupPrice(dupNum)] : [])],
    },
    {
      key: 'regions',
      label: R.labels.regions,
      value: r.regions.map(([k, n]) => R.pair(label(k), n)).join(' · '),
      ok: regionKey(rows) === TRUTH.regionKey,
      wrong: R.differs,
      why: [...(blank ? [R.why.blank(blank)] : []), ...(fakeAddr ? [R.why.filledReal(fakeAddr)] : []), ...(dup.length ? [R.why.dup(dup)] : [])],
    },
    {
      key: 'dates',
      label: R.labels.dates,
      value: r.dates.map(([k, n]) => R.datePair(k, n)).join(' · '),
      ok: sortKey(r.dates) === sortKey(t.dates),
      wrong: R.differs,
      why: [...(r.dates.length > 1 ? [R.why.dates(r.dates.length)] : []), ...(dup.length ? [R.why.dup(dup)] : [])],
    },
  ]
  return (
    <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-bold">{R.title}</span>
        <span className="text-sm text-muted">{R.from(snap.table)}</span>
      </p>
      <dl className="mt-2 space-y-2">
        {lines.map((l) => (
          <div key={l.key} className="grid gap-x-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
            <dt className="text-sm font-semibold text-muted">{l.label}</dt>
            <dd className="min-w-0">
              <span className="font-mono font-bold">{l.value}</span>{' '}
              <span className={`whitespace-nowrap text-sm font-bold ${l.ok ? 'text-ok' : 'text-fail'}`}>
                <span aria-hidden="true">{l.ok ? '✓' : '✕'}</span> {l.ok ? R.right : l.wrong}
              </span>
              {!l.ok &&
                l.why.map((w) => (
                  <span key={w} className="mt-0.5 block text-sm text-muted">
                    {w}
                  </span>
                ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ── 실험: 지금 코드를 고쳐 쓴다 ───────────────────────────────

type Exp = keyof typeof I.experiments
function rewrite(code: string, e: Exp): string {
  const lines = code.split('\n')
  const is = (n: CmdName) => (l: string) => commandOf(l) === n
  if (e === 'reset') return DEFAULT
  if (e === 'noDedupe') return lines.filter((l) => !is('remove_duplicates')(l)).join('\n')
  if (e === 'noNumber') return lines.filter((l) => !is('to_number')(l)).join('\n')
  // elt: load 줄을 extract 바로 아래로(없으면 처음 코드의 load 줄을 넣는다)
  const loads = lines.filter(is('load'))
  const rest = lines.filter((l) => !is('load')(l))
  rest.splice(rest.findIndex(is('extract')) + 1, 0, ...(loads.length ? loads : I.code.filter(is('load'))))
  return rest.join('\n')
}

const entryOf = (s: Step) => (s.ok ? I.log.entry(s.line + 1, s.name, s.inside, s.text) : I.log.error(s.line + 1, s.text))

// ── 본체 ─────────────────────────────────────────────────────

export function CodeRunner() {
  const { reduced } = useEnv()
  const [code, setCode] = useState(DEFAULT)
  const [cur, setCur] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [note, setNote] = useState('')
  // 화면 읽기: 바꿔 쓰지 않고 덧붙여서(role=log), 빠르게 넘어가도 기록 한 줄씩 차례로 읽힌다
  const [live, setLiveList] = useState<{ k: number; text: string }[]>([])
  const seq = useRef(0)
  const setLive = (text: string) => setLiveList((l) => [...l.slice(-4), { k: ++seq.current, text }])
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1100)
  const figBox = useRef<HTMLDivElement>(null)
  const editorId = useId()
  const trace = useMemo(() => run(code), [code])
  const { steps } = trace
  const last = steps.length - 1
  const step = cur >= 0 ? steps[cur] : null
  const lines = code.split('\n')

  useLayoutEffect(() => {
    const el = figBox.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 800))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const advance = (k: number) => {
    setCur(k)
    setLive(plain(entryOf(steps[k])))
  }

  // ▶ 실행: 한 줄씩 차례로(줄마다 STEP_MS)
  useEffect(() => {
    if (!playing) return
    if (cur >= last) {
      setPlaying(false)
      return
    }
    if (reduced) {
      // 재생 중에 모션 줄이기를 켜면 남은 줄을 한 번에 보여 준다
      setPlaying(false)
      setCur(last)
      setLive(steps.slice(cur + 1).map((s) => plain(entryOf(s))).join(' '))
      return
    }
    const t = window.setTimeout(() => advance(cur + 1), STEP_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, cur, last, reduced])

  const edit = (next: string) => {
    setCode(next)
    setCur(-1)
    setPlaying(false)
  }
  const nothing = () => {
    setNote(I.err.nothing)
    setLive(I.err.nothing)
  }
  const onRun = () => {
    if (playing) return setPlaying(false)
    if (!steps.length) return nothing()
    const start = cur >= last ? 0 : cur + 1
    if (reduced) {
      // 모션 줄이기: 움직임 없이 마지막 상태 + 줄마다의 기록을 한 번에
      setCur(last)
      return setLive(steps.slice(start).map((s) => plain(entryOf(s))).join(' '))
    }
    advance(start)
    setPlaying(start < last)
  }
  const onStep = () => {
    setPlaying(false)
    if (!steps.length) return nothing()
    advance(cur >= last ? 0 : cur + 1)
  }
  const onReset = () => {
    setPlaying(false)
    setCur(-1)
    setLive(I.live.reset)
  }
  const onExp = (e: Exp) => {
    const next = rewrite(code, e)
    const msg = next === code && e !== 'reset' ? I.same : I.experiments[e].watch
    // 이미 그 모양이면 실행 상태를 지우지 않는다
    if (next !== code) edit(next)
    setNote(msg)
    setLive(msg)
  }

  const markOf = (i: number) => {
    if (!step) return ''
    if (step.line === i) return step.ok ? '▶' : '✕'
    return steps.slice(0, cur).some((s) => s.line === i) ? '✓' : ''
  }
  const LH = '1.625rem'
  const PAD = '0.75rem'

  return (
    <InteractionFrame title={I.title} hint={I.hint} note={`${UI.simplified}. ${I.note(NAMES.length)}`}>
      <div className="flex min-w-0 flex-col gap-5 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-x-6">
        {/* 실험 */}
        <div className="order-1 min-w-0 md:col-span-2 md:row-start-1">
          <p className="font-mono text-sm text-muted">{I.experimentsTitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(I.experiments) as Exp[]).map((e) => (
              <button key={e} type="button" className="btn btn-sm" onClick={() => onExp(e)}>
                {I.experiments[e].label}
              </button>
            ))}
          </div>
          {note && (
            <p className="mt-2 text-sm font-semibold">
              <Rich text={note} />
            </p>
          )}
        </div>

        {/* 편집기 + 실행 버튼 */}
        <div className="order-2 min-w-0 md:col-start-1 md:row-start-2">
          <div className="rounded-xl border-[1.5px] border-ink bg-bg has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-[var(--accent)]">
            <label htmlFor={editorId} className="block border-b border-edge px-3 py-2 text-sm font-bold">
              {I.editorLabel}
            </label>
            <div className="flex min-w-0 font-mono text-base md:text-[0.9375rem]">
              <div aria-hidden="true" className="shrink-0 select-none border-r border-edge pl-1.5 pr-2 text-right text-muted" style={{ paddingTop: PAD, lineHeight: LH }}>
                {lines.map((_, i) => {
                  const m = markOf(i)
                  return (
                    <div key={i} className="flex gap-1.5">
                      <span className={`w-4 text-center font-bold ${m === '✕' ? 'text-fail' : m === '▶' ? 'text-accent' : ''}`}>{m}</span>
                      <span className="min-w-[1.25rem]">{i + 1}</span>
                    </div>
                  )
                })}
              </div>
              <div className="relative min-w-0 flex-1">
                {step && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0"
                    style={{
                      top: `calc(${PAD} + ${step.line} * ${LH})`,
                      height: LH,
                      background: `color-mix(in srgb, ${step.ok ? 'var(--accent)' : 'var(--fail)'} 16%, transparent)`,
                    }}
                  />
                )}
                <textarea
                  id={editorId}
                  value={code}
                  onChange={(e) => {
                    edit(e.target.value)
                    setNote('')
                  }}
                  rows={lines.length + 1}
                  wrap="off"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  className="relative block w-full resize-none overflow-x-auto overflow-y-hidden whitespace-pre bg-transparent pl-2 pr-3 focus-visible:outline-none"
                  style={{ paddingTop: PAD, paddingBottom: PAD, lineHeight: LH }}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-solid min-w-[6.5rem] justify-center" onClick={onRun}>
              <span aria-hidden="true">{playing ? '⏸' : '▶'}</span> {playing ? I.controls.pause : I.controls.run}
            </button>
            <button type="button" className="btn" onClick={onStep}>
              {I.controls.step}
            </button>
            <button type="button" className="btn" onClick={onReset}>
              <span aria-hidden="true">↺</span> {I.controls.reset}
            </button>
            <span className="text-sm text-muted">{I.progress(cur + 1, trace.total)}</span>
          </div>
          <details className="mt-3 min-w-0 rounded-lg border-[1.5px] border-edge bg-bg px-3 py-2">
            <summary className="-my-2 cursor-pointer py-2.5 font-semibold">{I.helpTitle(NAMES.length)}</summary>
            <ul className="mt-2 space-y-2">
              {(Object.keys(I.commands) as CmdName[]).map((n) => (
                <li key={n} className="min-w-0">
                  <code className="block overflow-x-auto whitespace-pre font-mono text-sm font-bold">{I.commands[n].example}</code>
                  <span className="text-sm text-muted">
                    {I.kinds[kindOf(n)]} · {I.commands[n].desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">
              <Rich text={I.helpMore} />
            </p>
          </details>
        </div>

        {/* 실행 기록 */}
        <div className="order-4 min-w-0 md:col-start-2 md:row-start-2">
          <p className="font-bold">{I.logTitle}</p>
          {cur < 0 ? (
            <p className="mt-1 text-muted">{I.logEmpty}</p>
          ) : (
            <ol className="mt-1 space-y-1.5">
              {steps.slice(0, cur + 1).map((s, k) => (
                <li key={`${code.length}-${k}`} className={`row-in flex gap-2 text-[0.9375rem] leading-snug ${k === cur ? 'font-semibold' : ''}`}>
                  <span aria-hidden="true" className={`w-4 shrink-0 text-center font-bold ${s.ok ? (k === cur ? 'text-accent' : 'text-ok') : 'text-fail'}`}>
                    {s.ok ? (k === cur ? '▶' : '✓') : '✕'}
                  </span>
                  <span className="min-w-0 break-words">
                    <Rich text={entryOf(s)} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* 그림 */}
        <div className="order-3 min-w-0 md:col-span-2 md:row-start-3">
          <p className="break-words rounded-lg border-[1.5px] border-edge bg-bg px-3 py-2 text-[0.9375rem] leading-snug">
            {step ? (
              <>
                <span aria-hidden="true" className={`mr-1.5 font-bold ${step.ok ? 'text-accent' : 'text-fail'}`}>
                  {step.ok ? '▶' : '✕'}
                </span>
                <Rich text={entryOf(step)} />
              </>
            ) : (
              <span className="text-muted">{I.now.idle}</span>
            )}
          </p>
          <div ref={figBox} className="mt-3">
            <div className={wide ? 'mx-auto max-w-[64rem]' : 'mx-auto max-w-[30rem]'}>
              <PipelineFig trace={trace} cur={cur} wide={wide} reduced={reduced} />
            </div>
          </div>
          <p className="mt-2 text-center text-sm text-muted">{I.legend}</p>
        </div>

        {/* 리포트 + ETL/ELT 카드 */}
        <div className="order-5 min-w-0 md:col-start-1 md:row-start-4">
          <ReportCard snap={step?.snap ?? EMPTY} />
        </div>
        <div className="order-6 min-w-0 md:col-start-2 md:row-start-4">
          <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
            {(trace.shape === 'etl' || trace.shape === 'elt') && <p className="font-mono text-sm font-bold text-muted">{I.modes[trace.shape]}</p>}
            <p className="font-semibold">{I.shape[trace.shape]}</p>
            {(trace.shape === 'etl' || trace.shape === 'elt') && (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold">{I.prosTitle}</p>
                    <p className="mt-0.5">{I[trace.shape].pros}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{I.consTitle}</p>
                    <p className="mt-0.5">{I[trace.shape].cons}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted">{I.common}</p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="sr-only" role="log" aria-live="polite">
        {live.map((m) => (
          <p key={m.k}>{m.text}</p>
        ))}
      </div>
    </InteractionFrame>
  )
}
