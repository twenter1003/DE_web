import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ch1, ORDERS, PRODUCTS, TODAY } from '../../content/chapters/ch1'
import { UI } from '../../content/ui'
import { InteractionFrame } from '../../components/Chapter'
import { RRect } from '../../components/sketch'
import { gsap, useGSAP } from '../../lib/gsap'
import { Rich } from '../../lib/rich'
import { useEnv } from '../../state/env'
import { bare, compile, fmt, type ColId, type Row, type Run } from './sql'

// SQL 실행기: 학습자가 쓴(또는 실험 버튼으로 불러온) 쿼리를 작은 해석기(sql.ts)로 풀어,
// SQL의 논리적 처리 순서(FROM → JOIN → WHERE → GROUP BY → SELECT)대로 한 단계씩 표가 바뀌는 모습을 보여 준다.
// 그림은 '단계별 정지 상태(Frame)'의 목록이다. 요소마다 키가 있고, 단계가 바뀌면 같은 키끼리 위치·투명도를 옮긴다.

const I = ch1.interaction

// ── 그림 좌표(viewBox 단위) ──
const RH = 22 // 행 높이
const HY = 26 // 머리글 행 위쪽
const X0 = 2
const PAD = 6
const GAP = 8 // GROUP BY 묶음 사이 틈
const FS = 12
const HS = 11
const TAGW = 44
const BASE_W = 356
const HOLD = 0.2 // ▶ 실행: 한 단계가 끝나고 다음 단계까지 쉬는 시간(초)

interface WCol {
  key: string
  w: number
  end?: boolean
}
/** 작업 표(orders + JOIN한 name)의 열 */
const WCOLS: WCol[] = [
  { key: 'order_id', w: 58 },
  { key: 'product_id', w: 72 },
  { key: 'qty', w: 34, end: true },
  { key: 'price', w: 52, end: true },
  { key: 'ordered_at', w: 76 },
  { key: 'name', w: 60 },
]
const KEY_COL: Record<string, ColId> = {
  order_id: 'orders.order_id',
  product_id: 'orders.product_id',
  qty: 'orders.qty',
  price: 'orders.price',
  ordered_at: 'orders.ordered_at',
  name: 'products.name',
  pp: 'products.product_id',
}
const wc = (k: string) => WCOLS.find((c) => c.key === k)
/** 열이 그림 속 작업 표의 어느 칸에서 오는가(products.product_id는 orders.product_id와 같은 값) */
const srcKey = (c: ColId) => (c === 'products.product_id' ? 'product_id' : bare(c))
const rowTop = (i: number) => HY + RH * (i + 1)
const base = (top: number) => top + 15
/** 글자 폭 어림: 고정폭 0.6em, 한글 1em */
const tw = (s: string, size: number) => Array.from(s).reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 ? size : size * 0.6), 0)

interface LCol {
  x: number
  w: number
  end?: boolean
}
function lay(ws: { w: number; end?: boolean }[]): LCol[] {
  let x = X0
  return ws.map((c) => {
    const r = { x, w: c.w, end: c.end }
    x += c.w
    return r
  })
}
const tx = (c: LCol) => (c.end ? c.x + c.w - PAD : c.x + PAD)
const width = (cs: LCol[]) => cs.reduce((a, c) => a + c.w, 0)

// ── 단계별 정지 상태 ──
type TextCls = 'cell' | 'name' | 'agg' | 'head' | 'title'
type Def = { kind: 'text'; text: string; cls: TextCls; end?: boolean } | { kind: 'rect'; cls: 'bg' | 'line' | 'scan' } | { kind: 'node'; node: ReactNode; z: number }
interface Place {
  x: number
  y: number
  w?: number
  h?: number
  o?: number
  /** 이 단계 안에서 늦게 시작(초) */
  d?: number
  /** 이 요소만의 길이(초) */
  t?: number
  /** 새로 나타날 때 출발점(현재 위치 기준 차이)과 출발 투명도 */
  f?: { x?: number; y?: number; o?: number }
}
type Frame = Map<string, Place>
interface Phase {
  f: Frame
  dur: number
  ease?: string
  /** 이 장면이 끝났을 때 그림의 아래 끝(viewBox 높이) */
  h: number
}
interface Stage {
  defs: Map<string, Def>
  order: [string, Def][]
  steps: Phase[][]
  w: number
  /** 실행 전(첫 단계 크기) viewBox 높이. 단계마다의 높이는 Phase.h */
  h: number
}

const TEXT_STYLE: Record<TextCls, CSSProperties> = {
  cell: { fontSize: FS },
  name: { fontSize: FS, fontWeight: 700 },
  agg: { fontSize: FS, fontWeight: 800 },
  head: { fontSize: HS, fontWeight: 700 },
  title: { fontSize: 11.5, fontWeight: 650 },
}
const RECT_STYLE: Record<'bg' | 'line' | 'scan', CSSProperties> = {
  bg: { fill: 'var(--accent)', fillOpacity: 0.1 },
  line: { fill: 'var(--line)' },
  scan: { fill: 'var(--accent)' },
}
const zOf = (d: Def) => (d.kind === 'node' ? d.z : d.kind === 'text' ? 2 : d.cls === 'scan' ? 3 : 0)

function Tag() {
  return (
    <>
      <rect width={TAGW} height={RH - 6} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--fail)' }} strokeWidth={1.3} />
      <text x={TAGW / 2} y={11.6} textAnchor="middle" className="t-sans" style={{ fontSize: 10.5, fontWeight: 700 }}>
        {I.excluded}
      </text>
    </>
  )
}

/** 해석 결과(Run)로 단계마다의 그림 상태를 만든다. 모든 숫자는 Run에서 온다 */
function buildStage(run: Run): Stage {
  const defs = new Map<string, Def>()
  const steps: Phase[][] = []
  let cur: Frame = new Map()
  const def = (k: string, d: Def) => {
    if (!defs.has(k)) defs.set(k, d)
    return k
  }
  const T = (k: string, text: string, cls: TextCls = 'cell', end?: boolean) => def(k, { kind: 'text', text, cls, end })
  const R = (k: string, cls: 'bg' | 'line' | 'scan') => def(k, { kind: 'rect', cls })
  const N = (k: string, node: ReactNode, z: number) => def(k, { kind: 'node', node, z })
  const phase = (dur: number, edit: (f: Frame) => void, ease?: string): Phase => {
    const f: Frame = new Map()
    for (const [k, p] of cur) f.set(k, { x: p.x, y: p.y, w: p.w, h: p.h, o: p.o })
    edit(f)
    cur = f
    // 노드(묶음 테두리·결과 틀)는 y=0에 두고 h에 아래 끝을 적어 둔다
    let bottom = 0
    for (const p of f.values()) bottom = Math.max(bottom, p.y + (p.h ?? 6))
    return { f, dur, ease, h: Math.ceil(bottom + 8) }
  }
  const drop = (f: Frame, test: (k: string) => boolean) => {
    for (const k of [...f.keys()]) if (test(k)) f.delete(k)
  }
  const title = (f: Frame, s: number, text: string) => {
    drop(f, (k) => k.startsWith('t:'))
    f.set(T(`t:${s}`, text, 'title'), { x: X0, y: 14 })
  }
  const heads = (f: Frame, list: [string, LCol][], w: number) => {
    drop(f, (k) => k.startsWith('h:'))
    for (const [label, c] of list) {
      let k = `h:${label}`
      for (let i = 1; f.has(k); i++) k = `h:${label}#${i}`
      f.set(T(k, label, 'head', c.end), { x: tx(c), y: HY + 15 })
    }
    f.set(R('hl', 'line'), { x: X0, y: HY + RH - 1.5, w, h: 1.5 })
  }
  const C = (r: Row, k: string) => T(`c:${r.id}:${k}`, fmt(KEY_COL[k], r.v[KEY_COL[k]]), k === 'name' ? 'name' : 'cell', wc(k)?.end)
  const bgAt = (top: number, w: number): Place => ({ x: X0, y: top + 1, w, h: RH - 2 })
  const moveRow = (f: Frame, id: number, top: number, w: number) => {
    for (const [k, p] of f) if (k.startsWith(`c:${id}:`)) f.set(k, { ...p, y: base(top) })
    f.set(`bg:${id}`, bgAt(top, w))
  }

  const n = run.rows.length
  const byId = new Map(run.rows.map((r) => [r.id, r]))
  const kept = new Set(run.kept)
  const cols5 = WCOLS.slice(0, 5)
  const W5 = lay(cols5)
  const W6 = lay(WCOLS)
  const workCols = run.join ? WCOLS : cols5
  const working = run.join ? W6 : W5
  const wW = width(working)
  const pair = (cs: WCol[], L: LCol[]) => cs.map((c, j) => [I.cols[c.key as keyof typeof I.cols], L[j]] as [string, LCol])
  const dropProducts = (f: Frame) => drop(f, (k) => /^(pt|phl|ph:|pb:|p:)/.test(k))
  const cleanup = (f: Frame) => {
    dropProducts(f)
    drop(f, (k) => /^(scan|x:|go:)/.test(k) || (/^(c|bg):\d+/.test(k) && !kept.has(Number(k.split(':')[1]))))
  }
  let s = 0
  let gW = 0

  // 1) FROM: orders 표가 나타난다
  steps.push([
    phase(0.4, (f) => {
      title(f, s, I.titles.from(n))
      heads(f, pair(cols5, W5), width(W5))
      run.rows.forEach((r, i) => {
        const d = i * 0.02
        const from = { y: -8 }
        cols5.forEach((c, j) => f.set(C(r, c.key), { x: tx(W5[j]), y: base(rowTop(i)), d, f: from }))
        f.set(R(`bg:${r.id}`, 'bg'), { ...bgAt(rowTop(i), width(W5)), d, f: from })
      })
    }),
  ])

  // 2) JOIN: products 표가 들어오고, 같은 product_id 행의 name이 위로 올라가 붙는다
  if (run.join) {
    s++
    const PL: LCol[] = [
      { x: W6[5].x - 72, w: 72 },
      { x: W6[5].x, w: W6[5].w },
    ]
    const pw = width(PL)
    const top0 = rowTop(n) + 34
    const ptop = (j: number) => top0 + RH * (j + 1)
    const slide = { x: 24 }
    steps.push([
      phase(0.25, (f) => {
        title(f, s, I.titles.join(n))
        f.set(T('pt', I.titles.products, 'title'), { x: PL[0].x, y: top0 - 8, f: slide })
        ;(['product_id', 'name'] as const).forEach((k, j) => f.set(T(`ph:${k}`, I.cols[k], 'head'), { x: tx(PL[j]), y: top0 + 15, f: slide }))
        f.set(R('phl', 'line'), { x: PL[0].x, y: top0 + RH - 1.5, w: pw, h: 1.5, f: slide })
        PRODUCTS.forEach((p, j) => {
          f.set(R(`pb:${p.product_id}`, 'bg'), { ...bgAt(ptop(j), pw), x: PL[0].x, f: slide })
          f.set(T(`p:${p.product_id}:product_id`, p.product_id), { x: tx(PL[0]), y: base(ptop(j)), f: slide })
          f.set(T(`p:${p.product_id}:name`, p.name), { x: tx(PL[1]), y: base(ptop(j)), f: slide })
        })
      }),
      phase(0.5, (f) => {
        heads(f, pair(WCOLS, W6), width(W6))
        run.rows.forEach((r, i) => {
          const j = PRODUCTS.findIndex((p) => p.product_id === r.v['orders.product_id'])
          f.set(`bg:${r.id}`, bgAt(rowTop(i), width(W6)))
          f.set(C(r, 'name'), { x: tx(W6[5]), y: base(rowTop(i)), d: i * 0.025, t: 0.3, f: { y: ptop(j) - rowTop(i), o: 1 } })
        })
      }),
    ])
  }

  // 3) WHERE: 조건 열을 훑는 선이 내려가며, 맞지 않는 행이 흐려지고 '✕ 제외'가 붙는다
  if (run.cond) {
    s++
    const ck = run.cond.kind === 'date' ? 'ordered_at' : srcKey(run.cond.col)
    const cc = working[Math.max(0, workCols.findIndex((c) => c.key === ck))]
    const tagX = !run.join ? X0 + wW + 4 : ck === 'name' ? X0 + 2 : W6[5].x + (W6[5].w - TAGW) / 2
    const SCAN = 0.5
    steps.push([
      phase(0.15, (f) => {
        dropProducts(f)
        title(f, s, I.titles.where(run.kept.length))
        f.set(R('scan', 'scan'), { x: cc.x, y: HY + RH - 2, w: cc.w, h: 3 })
      }),
      phase(
        SCAN,
        (f) => {
          f.set('scan', { x: cc.x, y: rowTop(n) - 2, w: cc.w, h: 3 })
          run.rows.forEach((r, i) => {
            if (kept.has(r.id)) return
            const d = ((i + 0.5) / n) * SCAN
            for (const [k, p] of f) if (k.startsWith(`c:${r.id}:`) || k === `bg:${r.id}`) f.set(k, { ...p, o: 0.65, d, t: 0.1 }) // 흐려도 값은 읽히게(옅은 띠 위에서도 4.5:1 이상)
            f.set(N(`x:${r.id}`, <Tag />, 3), { x: tagX, y: rowTop(i) + 3, d, t: 0.1 })
          })
        },
        'none',
      ),
      phase(0.12, (f) => f.delete('scan')),
    ])
  }

  // 4) GROUP BY: 남은 행이 묶음별로 모였다가(틈과 테두리), 묶음마다 한 줄로 합쳐진다
  if (run.groupBy) {
    s++
    const keys = run.groupBy
    const nk = keys.length
    const aggW = (k: number) => Math.ceil(Math.max(tw(run.aggItems[k].text, HS), ...run.groups.map((g) => tw(fmt(undefined, g.aggs[k]), FS)))) + 2 * PAD
    const GL = lay([...keys.map((c) => wc(srcKey(c))!), ...run.aggItems.map((_, k) => ({ w: aggW(k), end: true }))])
    gW = width(GL)
    const slot = new Map<number, [number, number]>()
    let q = 0
    run.groups.forEach((g, gi) => g.ids.forEach((id) => slot.set(id, [q++, gi])))
    steps.push([
      phase(0.34, (f) => {
        cleanup(f)
        title(f, s, I.titles.group(run.groups.length))
        for (const [id, [sl, gi]] of slot) moveRow(f, id, rowTop(sl) + gi * GAP, wW)
        run.groups.forEach((g, gi) => {
          if (!g.ids.length) return
          const top = rowTop(slot.get(g.ids[0])![0]) + gi * GAP
          const box = <RRect x={X0 - 1} y={top - 1} w={wW + 2} h={RH * g.ids.length + 2} rough={0.4} seed={`sr-go${gi}`} stroke="var(--accent)" strokeWidth={1.6} />
          f.set(N(`go:${gi}`, box, 1), { x: 0, y: 0, h: top + RH * g.ids.length + 4 })
        })
      }),
      phase(0.3, (f) => {
        drop(f, (k) => k.startsWith('go:'))
        heads(f, [...keys.map((c, j) => [bare(c), GL[j]] as [string, LCol]), ...run.aggItems.map((a, k) => [a.text, GL[nk + k]] as [string, LCol])], gW)
        run.groups.forEach((g, gi) => {
          const top = rowTop(gi)
          for (const id of g.ids) {
            const r = byId.get(id)!
            const used = new Set<string>()
            keys.forEach((c, j) => {
              used.add(srcKey(c))
              f.set(C(r, srcKey(c)), { x: tx(GL[j]), y: base(top) })
            })
            // 합칠 값의 칸(qty, price)이 합친 값 자리로 날아간다
            run.aggItems.forEach((a, ai) =>
              a.args.forEach((c) => {
                if (used.has(srcKey(c))) return
                used.add(srcKey(c))
                f.set(C(r, srcKey(c)), { x: tx(GL[nk + ai]), y: base(top) })
              }),
            )
            drop(f, (k) => k.startsWith(`c:${id}:`) && !used.has(k.split(':')[2]))
            f.set(`bg:${id}`, bgAt(top, gW))
          }
        })
      }),
      phase(0.16, (f) => {
        run.groups.forEach((g, gi) => {
          const top = rowTop(gi)
          const members = new Set(g.ids.map(String))
          drop(f, (k) => /^(c|bg):/.test(k) && members.has(k.split(':')[1]))
          keys.forEach((c, j) => f.set(T(`g:${gi}:${c}`, fmt(c, g.key[j]), 'cell', GL[j].end), { x: tx(GL[j]), y: base(top) }))
          run.aggItems.forEach((_, ai) => f.set(T(`a:${gi}:${ai}`, fmt(undefined, g.aggs[ai]), 'agg', true), { x: tx(GL[nk + ai]), y: base(top) }))
          f.set(R(`gb:${gi}`, 'bg'), bgAt(top, gW))
        })
      }),
    ])
  }

  // 5) SELECT: 고른 열만 남아 결과 표가 된다
  s++
  const out = run.out
  const RL = lay(
    run.cols.map((c, j) => {
      const vals = out.map((r) => r[j])
      if (c.agg !== undefined || !c.col) return { w: Math.ceil(Math.max(tw(c.label, HS), ...vals.map((v) => tw(v, FS)))) + 2 * PAD, end: true }
      const w0 = wc(srcKey(c.col))!
      return { w: Math.max(w0.w, Math.ceil(tw(c.label, HS)) + 2 * PAD), end: w0.end }
    }),
  )
  const rW = width(RL)
  const resHeads = run.cols.map((c, j) => [c.label, RL[j]] as [string, LCol])
  const rf = N('rf', <RRect x={X0 - 3} y={HY - 3} w={rW + 6} h={RH * (out.length + 1) + 6} rough={0.5} seed="sr-rf" stroke="var(--accent)" strokeWidth={2} />, 1)
  const rfAt: Place = { x: 0, y: 0, h: HY + RH * (out.length + 1) + 6 }
  const finish = (f: Frame, frame = true) => {
    title(f, s, I.titles.result(out.length))
    heads(f, resHeads, rW)
    if (frame) f.set(rf, { ...rfAt, d: 0.15 })
  }
  const compact = (): Phase => phase(0.3, (f) => {
    cleanup(f)
    run.kept.forEach((id, sl) => moveRow(f, id, rowTop(sl), wW))
  })
  const needCompact = run.kept.length < n || (run.join && !run.cond)

  if (run.aggregated && run.groupBy) {
    steps.push([
      phase(0.42, (f) => {
        finish(f)
        run.groups.forEach((_, gi) => {
          const used = new Set<string>()
          run.cols.forEach((c, j) => {
            let k = c.agg !== undefined ? `a:${gi}:${c.agg}` : `g:${gi}:${c.col}`
            if (used.has(k)) k = T(`${k}#${j}`, out[gi][j], c.agg !== undefined ? 'agg' : 'cell', RL[j].end)
            used.add(k)
            f.set(k, { x: tx(RL[j]), y: base(rowTop(gi)) })
          })
          drop(f, (k) => (k.startsWith(`g:${gi}:`) || k.startsWith(`a:${gi}:`)) && !used.has(k))
          f.set(`gb:${gi}`, bgAt(rowTop(gi), rW))
        })
      }),
    ])
  } else if (run.aggregated) {
    // GROUP BY 없이 SUM·COUNT만: 남은 행 전체가 한 묶음으로 합쳐진다
    const g = run.groups[0]
    const phases: Phase[] = needCompact ? [compact()] : []
    phases.push(
      phase(0.34, (f) => {
        cleanup(f)
        finish(f, false)
        for (const id of run.kept) {
          const r = byId.get(id)!
          const used = new Set<string>()
          run.aggItems.forEach((a, ai) =>
            a.args.forEach((c) => {
              if (used.has(srcKey(c))) return
              used.add(srcKey(c))
              f.set(C(r, srcKey(c)), { x: tx(RL[run.cols.findIndex((rc) => rc.agg === ai)]), y: base(rowTop(0)) })
            }),
          )
          drop(f, (k) => k.startsWith(`c:${id}:`) && !used.has(k.split(':')[2]))
          f.set(`bg:${id}`, bgAt(rowTop(0), rW))
        }
      }),
      phase(0.16, (f) => {
        drop(f, (k) => /^(c|bg):/.test(k))
        run.cols.forEach((c, j) => f.set(T(`a:0:${c.agg}#${j}`, fmt(undefined, g.aggs[c.agg!]), 'agg', true), { x: tx(RL[j]), y: base(rowTop(0)) }))
        f.set(R('gb:0', 'bg'), bgAt(rowTop(0), rW))
        f.set(rf, rfAt)
      }),
    )
    steps.push(phases)
  } else {
    const phases: Phase[] = needCompact ? [compact()] : []
    phases.push(
      phase(0.42, (f) => {
        cleanup(f)
        finish(f)
        run.kept.forEach((id, sl) => {
          const r = byId.get(id)!
          const used = new Set<string>()
          run.cols.forEach((c, j) => {
            let k = C(r, c.col === 'products.product_id' ? 'pp' : bare(c.col!))
            if (used.has(k)) k = T(`${k}#${j}`, out[sl][j], 'cell', RL[j].end)
            used.add(k)
            f.set(k, { x: tx(RL[j]), y: base(rowTop(sl)) })
          })
          drop(f, (k) => k.startsWith(`c:${id}:`) && !used.has(k))
          f.set(`bg:${id}`, bgAt(rowTop(sl), rW))
        })
      }),
    )
    steps.push(phases)
  }

  const w = Math.max(BASE_W, X0 + wW + (run.cond && !run.join ? TAGW + 8 : 0), X0 + gW + 4, X0 + rW + 6)
  const order = [...defs].sort((a, b) => zOf(a[1]) - zOf(b[1]))
  return { defs, order, steps, w, h: steps[0][0].h }
}

// ── 재생 ──
const EMPTY: Frame = new Map()
const visible = (p?: Place) => !!p && (p.o ?? 1) > 0
const same = (a: Place, b: Place) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && (a.o ?? 1) === (b.o ?? 1)
function vars(d: Def, p: Place, dx = 0, dy = 0, o = p.o ?? 1): gsap.TweenVars {
  return d.kind === 'rect' ? { attr: { x: p.x + dx, y: p.y + dy, width: p.w ?? 0, height: p.h ?? 0 }, opacity: o } : { x: p.x + dx, y: p.y + dy, opacity: o }
}
const viewBox = (stage: Stage, h: number) => ({ attr: { viewBox: `0 0 ${stage.w} ${h}` } })
/** 지금 단계의 그림 높이(실행 전이면 첫 단계 크기) */
const heightAt = (stage: Stage, cursor: number) => (cursor ? stage.steps[cursor - 1].at(-1)!.h : stage.h)
function setFrame(stage: Stage, nodes: Map<string, Element>, f: Frame) {
  for (const [k, el] of nodes) {
    const p = f.get(k)
    const d = stage.defs.get(k)
    if (d) gsap.set(el, p ? vars(d, p) : { opacity: 0 })
  }
}
/** from 상태에서 단계의 장면들을 차례로 타임라인에 싣는다 */
function playPhases(tl: gsap.core.Timeline, stage: Stage, svg: SVGSVGElement, nodes: Map<string, Element>, from: Frame, fromH: number, phases: Phase[]) {
  let at = 0
  let prev = from
  let prevH = fromH
  for (const ph of phases) {
    // 그림 틀 높이도 장면마다 맞춘다: 커질 땐 먼저 빨리, 작아질 땐 내용이 옮겨 가는 동안 함께
    if (ph.h !== prevH) tl.to(svg, { ...viewBox(stage, ph.h), duration: ph.h > prevH ? Math.min(0.25, ph.dur) : ph.dur, ease: 'power2.inOut' }, at)
    prevH = ph.h
    let len = ph.dur
    for (const k of new Set([...prev.keys(), ...ph.f.keys()])) {
      const el = nodes.get(k)
      const d = stage.defs.get(k)
      if (!el || !d) continue
      const a = prev.get(k)
      const b = ph.f.get(k)
      if (!b) {
        if (visible(a)) tl.to(el, { opacity: 0, duration: Math.min(0.2, ph.dur) }, at)
        continue
      }
      const delay = b.d ?? 0
      const dur = b.t ?? ph.dur
      len = Math.max(len, delay + dur)
      if (!visible(a)) {
        tl.set(el, vars(d, b, b.f?.x, b.f?.y, b.f?.o ?? 0), at)
        tl.to(el, { ...vars(d, b), duration: dur, ease: ph.ease ?? 'power2.out' }, at + delay)
      } else if (!same(a!, b)) tl.to(el, { ...vars(d, b), duration: dur, ease: ph.ease ?? 'power2.inOut' }, at + delay)
    }
    at += len
    prev = ph.f
  }
}

// 합자 끔: >= 가 ≥ 로 보이면 학습자가 그 기호를 따라 쓴다
const MONO: CSSProperties = { fontFamily: "'JetBrains Mono Variable', 'Pretendard Variable', ui-monospace, monospace", fontVariantLigatures: 'none' }
const LH = 24 // 편집기 줄 높이(px)
const PY = 12 // 편집기 위아래 여백(px)
/** textarea와 그 뒤 강조 거울(mirror)이 똑같이 글자를 늘어놓도록 같은 클래스를 쓴다 */
const ED_TEXT = 'whitespace-pre px-3 text-base md:text-[0.8125rem]'

export function SqlRunner() {
  const { reduced } = useEnv()
  const id = useId()
  const [code, setCode] = useState(I.initial)
  const [cursor, setCursor] = useState(0) // 실행한 단계 수
  const [playing, setPlaying] = useState(false)
  const [burst, setBurst] = useState(false) // 모션 줄이기에서 한 번에 끝까지 실행했는가
  const [showErr, setShowErr] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const compiled = useMemo(() => compile(code), [code])
  const run = compiled.ok ? compiled.run : null
  const stage = useMemo(() => (run ? buildStage(run) : null), [run])
  const steps = run?.steps ?? []
  const total = steps.length
  const root = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const ta = useRef<HTMLTextAreaElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const shown = useRef<{ stage: Stage | null; cursor: number; frame: Frame }>({ stage: null, cursor: 0, frame: EMPTY })

  // 단계가 바뀌면 그림을 옮긴다(바로 다음 단계면 재생, 아니면 즉시)
  useGSAP(
    () => {
      tl.current?.progress(1, true).kill()
      tl.current = null
      if (!stage || !svg.current) return
      const nodes = new Map(Array.from(svg.current.querySelectorAll<SVGElement>('[data-k]'), (el) => [el.dataset.k!, el]))
      const s = shown.current
      const target = cursor ? stage.steps[cursor - 1].at(-1)!.f : EMPTY
      const fresh = s.stage !== stage
      if (!fresh && !reduced && cursor > 0 && cursor !== s.cursor && (cursor === s.cursor + 1 || cursor === 1)) {
        let from = s.frame
        let fromH = heightAt(stage, s.cursor)
        if (cursor === 1 && s.cursor !== 0) {
          setFrame(stage, nodes, EMPTY)
          from = EMPTY
          fromH = stage.h
          gsap.set(svg.current, viewBox(stage, fromH))
        }
        const t = gsap.timeline()
        playPhases(t, stage, svg.current, nodes, from, fromH, stage.steps[cursor - 1])
        tl.current = t
      } else {
        setFrame(stage, nodes, target)
        gsap.set(svg.current, viewBox(stage, heightAt(stage, cursor)))
      }
      shown.current = { stage, cursor, frame: target }
    },
    { scope: root, dependencies: [stage, cursor, reduced] },
  )

  // ▶ 실행: 한 단계가 끝나면 잠깐 쉬고 다음 단계로
  useEffect(() => {
    if (!playing || cursor >= total) return
    if (reduced) {
      // 재생 중에 모션 줄이기를 켜면 남은 단계를 한 번에 보여 준다
      setPlaying(false)
      setCursor(total)
      setBurst(true)
      return
    }
    const cur = tl.current
    const left = cur ? Math.max(0, cur.duration() - cur.time()) : 0
    const t = window.setTimeout(
      () => {
        setCursor(cursor + 1)
        if (cursor + 1 >= total) setPlaying(false)
      },
      cursor === 0 ? 0 : (left + HOLD) * 1000,
    )
    return () => window.clearTimeout(t)
  }, [playing, cursor, total, reduced])

  // 지금 처리하는 절이 편집기 밖(가로 스크롤 너머)에 있으면 보이게 옮긴다
  useEffect(() => {
    const t = ta.current
    const m = mirror.current?.querySelector('mark')
    if (!t || !m) return
    const l = m.offsetLeft
    if (l < t.scrollLeft || l + Math.min(m.offsetWidth, t.clientWidth / 2) > t.scrollLeft + t.clientWidth) t.scrollLeft = Math.max(0, l - 24)
    mirror.current!.scrollLeft = t.scrollLeft
  }, [cursor, code])

  const load = (text: string, n: string | null = null) => {
    setCode(text)
    setCursor(0)
    setPlaying(false)
    setBurst(false)
    setShowErr(false)
    setNote(n)
  }
  const canRun = () => {
    if (compiled.ok) return true
    setShowErr(true)
    setPlaying(false)
    return false
  }
  const onRun = () => {
    if (!canRun()) return
    setBurst(false)
    if (playing) return setPlaying(false)
    if (reduced) {
      setCursor(total)
      setBurst(true)
      return
    }
    if (cursor >= total) setCursor(0)
    setPlaying(true)
  }
  const onStep = () => {
    if (!canRun()) return
    setPlaying(false)
    setBurst(false)
    setCursor((c) => (c >= total ? 1 : c + 1))
  }
  const onReset = () => {
    setPlaying(false)
    setBurst(false)
    setCursor(0)
  }

  const lines = code.split('\n')
  const err = showErr && !compiled.ok ? compiled.error : null
  const curStep = cursor ? steps[cursor - 1] : null
  const errLine = err?.line ?? null
  const band = errLine !== null ? { a: errLine, b: errLine } : curStep ? { a: curStep.lines[0], b: curStep.lines[1] } : null
  const glyph = (i: number) => (errLine === i ? '✕' : !err && curStep && curStep.lines[0] === i ? '▶' : '')
  // 실험 설명은 아래 자기 자리(aria-live)에서 읽힌다. 여기는 실행 기록만(처음부터를 눌러도 다시 읽지 않게)
  const live = burst ? steps.map((x) => x.log).join(' ') : (curStep?.log ?? '')
  const status = err
    ? I.status.error
    : cursor === 0
      ? I.status.idle
      : cursor >= total
        ? I.status.done(total)
        : playing
          ? I.status.running(cursor, total)
          : I.status.paused(cursor, total)
  const range = !err && curStep ? curStep.range : null
  const syncScroll = () => {
    if (ta.current && mirror.current) mirror.current.scrollLeft = ta.current.scrollLeft
  }

  return (
    <InteractionFrame title={I.title} hint={I.hint(ORDERS.length)} note={`※ ${UI.simplified}. ${I.note}`}>
      <div ref={root} className="grid gap-6 [grid-template-areas:'a'_'s'_'l'] md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-8 md:[grid-template-areas:'a_s'_'l_s']">
        <div className="min-w-0 [grid-area:a]">
          <div role="group" aria-labelledby={`${id}-exp`}>
            <p id={`${id}-exp`} className="font-mono text-sm font-bold">
              {I.experimentsLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {I.experiments.map((e) => (
                <button key={e.id} type="button" className="btn btn-sm" aria-pressed={code === e.code} onClick={() => load(e.code, e.note)}>
                  {e.label}
                </button>
              ))}
            </div>
            <p className="text-sm [&:not(:empty)]:mt-2" aria-live="polite">
              {note}
            </p>
          </div>

          <label htmlFor={`${id}-ed`} className="mt-5 block font-mono text-sm font-bold">
            {I.editorLabel}
          </label>
          <div className="mt-2 flex overflow-hidden rounded-lg border-[1.5px] border-ink bg-bg focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-accent" style={MONO}>
            <div aria-hidden="true" className="shrink-0 select-none border-r border-edge px-2 text-right text-[0.8125rem] text-muted" style={{ paddingBlock: PY, lineHeight: `${LH}px` }}>
              {lines.map((_, i) => (
                <div key={i} className={`flex items-center justify-end gap-1 ${band && i >= band.a && i <= band.b ? 'font-bold text-ink' : ''}`} style={{ height: LH }}>
                  <span className={`w-3 text-center ${err ? 'text-fail' : ''}`}>{glyph(i)}</span>
                  <span className="min-w-[2ch]">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="relative min-w-0 flex-1">
              {errLine !== null && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0"
                  style={{ top: PY + errLine * LH, height: LH, background: 'color-mix(in srgb, var(--fail) 15%, transparent)' }}
                />
              )}
              {/* 거울: textarea 뒤에 같은 글자를 투명하게 깔고, 지금 처리하는 절만 강조색 바탕 + 밑줄로 칠한다 */}
              <div ref={mirror} aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden text-transparent ${ED_TEXT}`} style={{ ...MONO, paddingBlock: PY, lineHeight: `${LH}px` }}>
                {range ? (
                  <>
                    {code.slice(0, range[0])}
                    <mark className="rounded-sm text-transparent" style={{ background: 'color-mix(in srgb, var(--accent) 22%, transparent)', boxShadow: 'inset 0 -2px 0 var(--accent)' }}>
                      {code.slice(range[0], range[1])}
                    </mark>
                    {code.slice(range[1])}
                  </>
                ) : null}
              </div>
              <textarea
                ref={ta}
                id={`${id}-ed`}
                value={code}
                onScroll={syncScroll}
                onChange={(e) => load(e.target.value)}
                rows={lines.length}
                wrap="off"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                aria-describedby={`${id}-help${err ? ` ${id}-err` : ''}`}
                className={`relative block w-full resize-none overflow-x-auto overflow-y-hidden bg-transparent text-ink ${ED_TEXT}`}
                style={{ ...MONO, paddingBlock: PY, lineHeight: `${LH}px`, outline: 'none' }}
              />
            </div>
          </div>

          <div role="group" aria-label={I.controlsLabel} className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-solid" onClick={onRun}>
              {playing ? I.pause : I.run}
            </button>
            <button type="button" className="btn" onClick={onStep}>
              {I.step}
            </button>
            <button type="button" className="btn" onClick={onReset}>
              {I.reset}
            </button>
            <p className="ml-1 text-sm font-semibold text-muted">{status}</p>
          </div>

          {err && (
            <div id={`${id}-err`} role="alert" className="mt-3 rounded-lg border-[1.5px] border-fail bg-bg p-4 text-sm [&_code]:[font-variant-ligatures:none]">
              <p className="font-bold">{I.errorTitle(err.line === null ? null : err.line + 1)}</p>
              <p className="mt-1">{err.msg}</p>
              {err.near && (
                <p className="mt-2">
                  {I.nearLabel}: <code className="rounded bg-surface px-1.5 py-0.5 font-bold">{err.near}</code>
                </p>
              )}
              {err.hint && (
                <p className="mt-2">
                  {I.tryThis}: <code className="rounded bg-surface px-1.5 py-0.5 whitespace-pre-wrap">{err.hint}</code>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 [grid-area:s]">
          <p className="font-mono text-sm font-bold">{I.stageLabel}</p>
          <p className="text-xs text-muted">{I.caption(ORDERS.length, TODAY)}</p>
          <div className="relative mt-2 rounded-lg border-[1.5px] border-edge bg-surface p-2 md:p-3">
            {stage ? (
              <svg ref={svg} viewBox={`0 0 ${stage.w} ${stage.h}`} className="diagram block h-auto max-h-[36rem] w-full" aria-hidden="true">
                {stage.order.map(([k, d]) =>
                  d.kind === 'rect' ? (
                    <rect key={k} data-k={k} style={RECT_STYLE[d.cls]} opacity={0} />
                  ) : d.kind === 'text' ? (
                    <text key={k} data-k={k} textAnchor={d.end ? 'end' : 'start'} className={d.cls === 'title' ? 't-sans t-muted' : undefined} style={TEXT_STYLE[d.cls]} opacity={0}>
                      {d.text}
                    </text>
                  ) : (
                    <g key={k} data-k={k} opacity={0}>
                      {d.node}
                    </g>
                  ),
                )}
              </svg>
            ) : (
              <div className="aspect-[356/290]" />
            )}
            {cursor === 0 && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">{err ? I.stageError : I.stageEmpty}</p>}
          </div>
        </div>

        <div className="min-w-0 [grid-area:l]">
          <p id={`${id}-log`} className="font-mono text-sm font-bold">
            {I.logLabel}
          </p>
          {cursor === 0 ? (
            <p className="mt-1 text-sm text-muted">{I.logEmpty}</p>
          ) : (
            <ol aria-labelledby={`${id}-log`} className="mt-2 space-y-2 text-sm leading-relaxed">
              {steps.slice(0, cursor).map((x, i) => (
                <li key={`${i}:${x.log}`} className={`row-in border-l-[3px] pl-3 ${i === cursor - 1 ? 'border-accent' : 'border-edge'}`}>
                  <span className="font-mono font-bold">
                    {i === cursor - 1 ? '▶ ' : ''}
                    {x.tag} {x.head}
                  </span>{' '}
                  {x.text}
                </li>
              ))}
            </ol>
          )}
          <p className="sr-only" aria-live="polite">
            {live}
          </p>
        </div>
      </div>

      <div id={`${id}-help`} className="mt-6 rounded-lg border-[1.5px] border-edge bg-bg p-4 [&_code]:[font-variant-ligatures:none]">
        <p className="font-bold">{I.help.title}</p>
        <p className="mt-1 text-sm">
          <Rich text={I.help.order} />
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {I.help.items.map((t) => (
            <li key={t}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </div>
    </InteractionFrame>
  )
}
