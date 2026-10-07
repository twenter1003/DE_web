import { useId, useRef, useState } from 'react'
import { ch1, ORDERS, PRODUCTS, YESTERDAY } from '../../content/chapters/ch1'
import { InteractionFrame } from '../../components/Chapter'
import { gsap, useGSAP } from '../../lib/gsap'
import { useEnv } from '../../state/env'
import { norm } from './scenes'

// SQL 놀이터: 조각 3개(SELECT / WHERE / JOIN)를 고르면 쿼리와 결과 표가 바뀐다.
// 실제 SQL 엔진은 없다. 결과는 공통 데이터(ORDERS·PRODUCTS)를 그대로 거르고 묶어 계산한다.

const I = ch1.interaction
type Sel = keyof typeof I.groups.select.options
type Period = keyof typeof I.groups.period.options
type Join = keyof typeof I.groups.join.options
interface Choice {
  select: Sel
  period: Period
  join: Join
}
const INIT: Choice = { select: 'all', period: 'all', join: 'off' }

// ── 쿼리 조립 ──
export function assemble({ select, period, join }: Choice): string[] {
  const S = I.sql
  const agg = select === 'revenue' ? S.agg.revenue : S.agg.count
  const lines: { code: string; comment?: string }[] = [
    { code: select === 'all' ? (join === 'on' ? S.selectAllJoin : S.selectAll) : join === 'on' ? S.selectGroupJoin(agg) : S.selectGroup(agg) },
    { code: S.from },
  ]
  if (join === 'on') lines.push({ code: S.join })
  if (period === 'yesterday') lines.push({ code: S.where, comment: S.whereComment })
  if (select !== 'all') lines.push({ code: join === 'on' ? S.groupByJoin : S.groupBy })
  // 세미콜론은 마지막 줄의 코드 끝, 주석 앞에(주석 뒤면 세미콜론까지 주석이 된다)
  return lines.map((l, i) => {
    const code = i === lines.length - 1 ? `${l.code};` : l.code
    return l.comment ? `${code}  ${l.comment}` : code
  })
}

// ── 결과 계산 ──
type Order = (typeof ORDERS)[number]
const num = (n: number) => n.toLocaleString('ko-KR')
const inPeriod = (p: Period) => (o: Order) => p === 'all' || o.ordered_at.startsWith(`${YESTERDAY} `)
const nameOf = (id: string) => PRODUCTS.find((p) => p.product_id === id)?.name ?? ''
type Mode = 'detail' | 'grouped'
const modeOf = (p: Choice): Mode => (p.select === 'all' ? 'detail' : 'grouped')

interface Col {
  key: string
  label: string
  num?: boolean
}
interface Result {
  cols: Col[]
  rows: { key: string; group: string; cells: Record<string, string> }[]
}

function run(p: Choice): Result {
  const orders = ORDERS.filter(inPeriod(p.period))
  const name: Col[] = p.join === 'on' ? [{ key: 'name', label: I.cols.name }] : []
  if (p.select === 'all') {
    return {
      cols: [
        { key: 'order_id', label: I.cols.order_id },
        { key: 'product_id', label: I.cols.product_id },
        { key: 'qty', label: I.cols.qty, num: true },
        { key: 'price', label: I.cols.price, num: true },
        { key: 'ordered_at', label: I.cols.ordered_at },
        ...name,
      ],
      rows: orders.map((o) => ({
        key: `o${o.order_id}`,
        group: `g${o.product_id}`,
        cells: { order_id: String(o.order_id), product_id: o.product_id, qty: String(o.qty), price: num(o.price), ordered_at: o.ordered_at, name: nameOf(o.product_id) },
      })),
    }
  }
  const value = (o: Order) => (p.select === 'count' ? o.qty : o.qty * o.price)
  return {
    cols: [{ key: 'product_id', label: I.cols.product_id }, ...name, { key: 'v', label: p.select === 'count' ? I.cols.count : I.cols.revenue, num: true }],
    rows: PRODUCTS.filter((pr) => orders.some((o) => o.product_id === pr.product_id)).map((pr) => ({
      key: `g${pr.product_id}`,
      group: `g${pr.product_id}`,
      cells: { product_id: pr.product_id, name: pr.name, v: num(orders.filter((o) => o.product_id === pr.product_id).reduce((a, o) => a + value(o), 0)) },
    })),
  }
}

const explain = (p: Choice) => `${I.explain[`${p.select}-${p.period}` as const]} ${I.joinNote[p.join]}`

// 해설 문장에 적은 합계가 데이터에서 계산한 값과 같은지(개발 중 확인)
if (import.meta.env.DEV) {
  const total = (p: Period, f: (o: Order) => number) => ORDERS.filter(inPeriod(p)).reduce((a, o) => a + f(o), 0)
  const qty = (o: Order) => o.qty
  const rev = (o: Order) => o.qty * o.price
  console.assert(
    I.explain['count-all'].includes(`${total('all', qty)}개`) &&
      I.explain['count-yesterday'].includes(`${total('yesterday', qty)}개`) &&
      I.explain['revenue-all'].includes(`${num(total('all', rev))}원`) &&
      I.explain['revenue-yesterday'].includes(`${num(total('yesterday', rev))}원`),
    'ch1 SQL playground: explanation totals do not match ORDERS',
  )
}

/** FLIP용: 바뀌기 직전 행 위치와 상태 */
interface Before {
  tops: Map<string, number>
  mode: Mode
  join: Join
  select: Sel
}

const GROUPS = Object.keys(I.groups) as (keyof typeof I.groups)[]

export function SqlPlayground() {
  const { reduced } = useEnv()
  const id = useId()
  const [pick, setPick] = useState<Choice>(INIT)
  const [shown, setShown] = useState<Choice>(INIT)
  const [changed, setChanged] = useState<number[]>([])
  const [live, setLive] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const shownRef = useRef(INIT)
  const before = useRef<Before | null>(null)
  const busy = useRef<gsap.core.Timeline | null>(null)

  const res = run(shown)
  const lines = assemble(shown)

  const rowEls = () => Array.from(root.current?.querySelectorAll<HTMLTableRowElement>('tbody tr') ?? [])

  const commit = (next: Choice) => {
    const cur = shownRef.current
    const tops = new Map<string, number>()
    for (const tr of rowEls()) {
      const top = tr.getBoundingClientRect().top
      tops.set(tr.dataset.key!, top)
      if (!tops.has(`first:${tr.dataset.group}`)) tops.set(`first:${tr.dataset.group}`, top)
    }
    before.current = { tops, mode: modeOf(cur), join: cur.join, select: cur.select }
    const old = new Set(assemble(cur).map(norm))
    setChanged(assemble(next).flatMap((l, i) => (old.has(norm(l)) ? [] : [i])))
    shownRef.current = next
    setShown(next)
    setLive(I.live(run(next).rows.length, explain(next)))
  }

  const { contextSafe } = useGSAP({ scope: root })

  // 바뀌기 전 모션: 빠지는 행이 흐려지거나(WHERE) 같은 상품 행으로 모이고(GROUP BY), name 열이 빠진다(JOIN 끔)
  const change = contextSafe((next: Choice) => {
    setPick(next)
    if (busy.current) {
      busy.current.progress(1)
      busy.current = null
      commit(next)
      return
    }
    const cur = shownRef.current
    if (reduced || !root.current) return commit(next)
    const keys = new Set(run(next).rows.map((r) => r.key))
    const trs = rowEls()
    const removed = trs.filter((tr) => !keys.has(tr.dataset.key!))
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = null
        commit(next)
      },
    })
    if (cur.join === 'on' && next.join === 'off') tl.to(root.current.querySelectorAll('[data-col="name"]'), { x: 24, opacity: 0, duration: 0.2 }, 0)
    if (removed.length) {
      if (modeOf(cur) === 'detail' && modeOf(next) === 'grouped') {
        const first = new Map<string, number>()
        for (const tr of trs) if (!first.has(tr.dataset.group!)) first.set(tr.dataset.group!, tr.getBoundingClientRect().top)
        for (const tr of removed) tl.to(tr, { y: first.get(tr.dataset.group!)! - tr.getBoundingClientRect().top, opacity: 0.4, duration: 0.3, ease: 'power2.inOut' }, 0)
      } else tl.to(removed, { opacity: 0, duration: 0.15 }, 0)
    }
    if (!tl.getChildren().length) {
      tl.kill()
      return commit(next)
    }
    busy.current = tl
  })

  // 바뀐 뒤 모션: 남은 행은 제자리로 붙고(FLIP), 묶인 행은 숫자 하나로 합쳐지며, name 열은 오른쪽에서 들어온다
  useGSAP(
    () => {
      const b = before.current
      before.current = null
      if (!b || reduced || !root.current) return
      const mode = modeOf(shown)
      const regroup = b.mode !== mode
      for (const tr of rowEls()) {
        const top = tr.getBoundingClientRect().top
        const old = b.tops.get(tr.dataset.key!)
        if (old !== undefined) {
          if (old !== top) gsap.fromTo(tr, { y: old - top }, { y: 0, duration: 0.15, ease: 'power2.out' })
          continue
        }
        const from = regroup ? (b.tops.get(tr.dataset.group!) ?? b.tops.get(`first:${tr.dataset.group}`)) : undefined
        gsap.fromTo(tr, { y: from === undefined ? 0 : from - top, opacity: 0 }, { y: 0, opacity: 1, duration: regroup ? 0.2 : 0.15, ease: 'power2.out' })
      }
      if (b.join === 'off' && shown.join === 'on') gsap.from(root.current.querySelectorAll('[data-col="name"]'), { x: 24, opacity: 0, duration: 0.3 })
      if (!regroup && mode === 'grouped') gsap.fromTo(root.current.querySelectorAll('td[data-col="v"]'), { opacity: 0.25 }, { opacity: 1, duration: 0.3 })
      const marks = root.current.querySelectorAll('[data-underline]')
      if (marks.length) gsap.fromTo(marks, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power1.out' })
    },
    { scope: root, dependencies: [shown] },
  )

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div ref={root}>
        <p className="font-mono text-sm text-muted">{I.caption}</p>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:flex-wrap md:gap-x-8">
          {GROUPS.map((g) => {
            const group = I.groups[g]
            return (
              <fieldset key={g} className="min-w-0">
                <legend className="mb-2 font-mono text-sm font-bold">{group.legend}</legend>
                <div className="grid w-full auto-cols-fr grid-flow-col overflow-hidden rounded-lg border-[1.5px] border-ink md:inline-grid md:w-auto">
                  {Object.entries(group.options).map(([value, label], k) => (
                    <label
                      key={value}
                      className={`flex min-h-11 cursor-pointer items-center justify-center px-4 py-2 text-center font-semibold leading-snug transition-colors hover:bg-edge has-[:checked]:bg-ink has-[:checked]:text-bg has-[:focus-visible]:outline-3 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-accent ${k > 0 ? 'border-l-[1.5px] border-ink' : ''}`}
                    >
                      <input type="radio" name={`${id}-${g}`} value={value} checked={pick[g] === value} onChange={() => change({ ...pick, [g]: value } as Choice)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          })}
        </div>

        <div className="mt-6">
          <p className="font-mono text-xs text-muted">{I.codeLabel}</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border-[1.5px] border-edge bg-bg p-4 text-[0.8125rem] leading-7 md:text-sm">
            <code>
              {lines.map((l, i) => (
                <span key={`${i}:${l}`} className="relative block w-max">
                  {l}
                  {changed.includes(i) && (
                    <>
                      <span data-underline aria-hidden="true" className="absolute inset-x-0 bottom-0.5 h-0.5 origin-left bg-accent" />
                      {reduced && <span className="ml-3 font-sans font-bold">{I.changed}</span>}
                    </>
                  )}
                </span>
              ))}
            </code>
          </pre>
          <p className="mt-2 text-sm text-muted">{I.codeNote}</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="border-collapse font-mono text-[0.8125rem] md:text-sm">
            <caption className="mb-2 text-left font-sans font-bold">{I.tableCaption(res.rows.length)}</caption>
            <thead>
              <tr>
                {res.cols.map((c) => (
                  <th key={c.key} scope="col" data-col={c.key} className={`whitespace-nowrap border-b-[1.5px] border-ink px-3 py-2 ${c.num ? 'text-right' : 'text-left'}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {res.rows.map((r) => (
                <tr key={r.key} data-key={r.key} data-group={r.group} className="border-b border-edge">
                  {res.cols.map((c) => (
                    <td key={c.key} data-col={c.key} className={`whitespace-nowrap px-3 py-1.5 ${c.num ? 'text-right' : ''}`}>
                      {r.cells[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-semibold">{explain(shown)}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </InteractionFrame>
  )
}
