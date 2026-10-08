import { useRef, useState } from 'react'
import { prologue, PRODUCTS } from '../../content/chapters/prologue'
import { InteractionFrame } from '../../components/Chapter'
import { won } from '../../components/fig'
import { gsap, useGSAP } from '../../lib/gsap'
import { useEnv } from '../../state/env'

const I = prologue.interaction
type Act = 'click' | 'search' | 'cart' | 'buy'
interface Row {
  id: number
  time: string
  text: string
}

const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const priceOf = (name: string) => PRODUCTS.find((p) => p.name === name)?.price ?? 0

interface State {
  acts: number
  ev: Row[]
  tx: Row[]
  evCount: number
  txCount: number
  clock: number
  order: number
  lastCart: { name: string; qty: number } | null
  cycle: Record<'click' | 'search' | 'cart', number>
  pressed: Act[]
  shown: string[]
  note: string | null
  live: string
  newest: { ev?: number; tx?: number }
}

const INIT: State = {
  acts: 0,
  ev: [],
  tx: [],
  evCount: 0,
  txCount: 0,
  clock: I.startMinutes,
  order: I.firstOrder,
  lastCart: null,
  cycle: { click: 0, search: 0, cart: 0 },
  pressed: [],
  shown: [],
  note: null,
  live: '',
  newest: {},
}

let rowId = 0

function step(s: State, act: Act): State {
  const clock = s.clock + 1
  const time = hhmm(clock)
  const pressed = s.pressed.includes(act) ? s.pressed : [...s.pressed, act]
  const cycle = { ...s.cycle }
  let evText = ''
  let tx: Row | null = null
  let lastCart = s.lastCart
  let order = s.order
  if (act === 'click') {
    evText = I.evLine.click(I.clickCycle[cycle.click % 4])
    cycle.click++
  } else if (act === 'search') {
    evText = I.evLine.search(I.searchCycle[cycle.search % 4])
    cycle.search++
  } else if (act === 'cart') {
    lastCart = I.cartCycle[cycle.cart % 4]
    evText = I.evLine.cart(lastCart.name, lastCart.qty)
    cycle.cart++
  } else {
    const item = s.lastCart ?? I.cartCycle[0]
    evText = I.evLine.buy(order)
    tx = { id: ++rowId, time, text: I.txLine(order, item.name, item.qty, won(item.qty * priceOf(item.name))) }
    order++
  }
  const evRow = { id: ++rowId, time, text: evText }
  const ev = [evRow, ...s.ev].slice(0, 4)
  const txList = tx ? [tx, ...s.tx].slice(0, 4) : s.tx
  const evCount = s.evCount + 1
  const txCount = s.txCount + (tx ? 1 : 0)

  // 안내 문구: 가장 최근에 달성한 것 하나, 각 문구는 한 번씩
  const shown = [...s.shown]
  let note = s.note
  const unlock = (k: keyof typeof I.notes) => {
    if (!shown.includes(k)) {
      shown.push(k)
      note = I.notes[k]
    }
  }
  if (act === 'cart') unlock('cart')
  if (act === 'buy') unlock('buy')
  if (pressed.length === 4) unlock('all')

  const what = I.buttons[act]
  return {
    acts: s.acts + 1,
    ev,
    tx: txList,
    evCount,
    txCount,
    clock,
    order,
    lastCart,
    cycle,
    pressed,
    shown,
    note,
    live: tx ? I.live.both(evCount, txCount) : I.live.event(what, evCount, txCount),
    newest: { ev: evRow.id, tx: tx?.id },
  }
}

function Box({ title, count, rows, newest, icon, boxRef }: { title: string; count: number; rows: Row[]; newest?: number; icon: 'note' | 'receipt'; boxRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={boxRef} className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold">
          <span aria-hidden="true" className="font-mono">
            {icon === 'note' ? '▤' : '▥'}
          </span>
          {title}
        </p>
        <p className="font-mono text-sm">{I.count(count)}</p>
      </div>
      <ol className="mt-3 min-h-[8.5rem] space-y-1.5 font-mono text-[0.8125rem]">
        {rows.length === 0 && <li className="text-muted">{I.empty}</li>}
        {rows.map((r) => (
          <li key={r.id} className={`flex gap-2 ${r.id === newest ? 'row-in' : ''}`}>
            {r.id === newest && <span className="shrink-0 rounded bg-accent px-1.5 text-[0.6875rem] font-bold leading-5 text-white">{I.newTag}</span>}
            <span className="shrink-0 text-muted">{r.time}</span>
            <span className="min-w-0 break-all">{r.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function ShopPlayground() {
  const [s, setS] = useState(INIT)
  const { reduced } = useEnv()
  const root = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const evBox = useRef<HTMLDivElement>(null)
  const txBox = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP({ scope: root })

  const fly = contextSafe((from: HTMLElement, targets: HTMLElement[]) => {
    if (reduced || !layer.current || !root.current) return
    const base = root.current.getBoundingClientRect()
    const a = from.getBoundingClientRect()
    const sx = a.left + a.width / 2 - base.left
    const sy = a.top + a.height / 2 - base.top
    // 동시에 떠 있는 입자는 최대 12개
    while (layer.current.childElementCount >= 12) layer.current.firstElementChild?.remove()
    targets.forEach((t, k) => {
      const b = t.getBoundingClientRect()
      const ex = b.left + 28 - base.left
      const ey = b.top + 22 - base.top
      const dot = document.createElement('span')
      dot.className = 'absolute size-3 rounded-full bg-accent'
      dot.style.left = '0'
      dot.style.top = '0'
      layer.current!.appendChild(dot)
      const mx = targets.length > 1 ? (sx + (b.left - base.left + 28)) / 2 : ex
      const my = targets.length > 1 ? (sy + ey) / 2 : sy
      gsap.set(dot, { x: sx - 6, y: sy - 6 })
      const t2 = gsap.timeline({ onComplete: () => dot.remove() })
      if (targets.length > 1) t2.to(dot, { x: mx - 6, y: my - 6, duration: 0.25, ease: 'power1.out' })
      t2.to(dot, { x: ex - 6, y: ey - 6, duration: targets.length > 1 ? 0.35 : 0.6, ease: 'power2.out', delay: k * 0.02 })
    })
  })

  const press = (act: Act) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    setS((prev) => step(prev, act))
    const targets = [evBox.current, act === 'buy' ? txBox.current : null].filter(Boolean) as HTMLElement[]
    fly(btn, targets)
  }

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div ref={root} className="relative">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-extrabold">
            {I.shop}
            <span className="ml-3 font-mono text-sm font-normal text-muted">
              {I.clockLabel} {hhmm(s.clock)}
            </span>
          </p>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {(Object.keys(I.buttons) as Act[]).map((k) => (
              <button key={k} type="button" className={`btn ${k === 'buy' ? 'btn-solid' : ''}`} onClick={press(k)}>
                {I.buttons[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Box title={I.boxes.events} count={s.evCount} rows={s.ev} newest={s.newest.ev} icon="note" boxRef={evBox} />
          <Box title={I.boxes.tx} count={s.txCount} rows={s.tx} newest={s.newest.tx} icon="receipt" boxRef={txBox} />
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-full sm:basis-0">
            <p className="font-semibold">{I.summary(s.acts, s.evCount, s.txCount)}</p>
            {s.note && <p className="mt-1 text-muted">{s.note}</p>}
          </div>
          <button type="button" className="btn btn-sm" onClick={() => setS({ ...INIT, live: I.live.reset })}>
            {I.reset}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {s.live}
        </p>
        <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" />
      </div>
    </InteractionFrame>
  )
}
