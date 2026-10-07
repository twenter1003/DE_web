import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ch2 } from '../../content/chapters/ch2'
import { InteractionFrame } from '../../components/Chapter'
import { gsap, useGSAP } from '../../lib/gsap'
import { useEnv } from '../../state/env'
import { blockPts } from './parts'

const I = ch2.interaction
type Mode = 'etl' | 'elt'
type StationKey = keyof typeof I.stations

const SVGNS = 'http://www.w3.org/2000/svg'

/** 흘려보낼 칩(DOM에 직접 붙인다). 반듯한 꼭짓점을 data-neat에 둬서 points 트윈으로 반듯해진다 */
function chipNode(i: number, bumpy: boolean) {
  const svg = document.createElementNS(SVGNS, 'svg')
  svg.setAttribute('viewBox', '0 0 20 16')
  svg.setAttribute('width', '20')
  svg.setAttribute('height', '16')
  const poly = document.createElementNS(SVGNS, 'polygon')
  poly.setAttribute('points', blockPts(2, 2, 16, 12, bumpy ? `chip${i}` : undefined, 2.2))
  poly.dataset.neat = blockPts(2, 2, 16, 12)
  poly.style.fill = 'var(--accent)'
  svg.appendChild(poly)
  return svg
}

function Chip({ i, bumpy, kind }: { i: number; bumpy: boolean; kind: 'raw' | 'clean' }) {
  return (
    <span data-chip={kind} className="inline-block h-4 w-5">
      <svg viewBox="0 0 20 16" width={20} height={16} aria-hidden="true">
        <polygon points={blockPts(2, 2, 16, 12, bumpy ? `chip${i}` : undefined, 2.2)} style={{ fill: 'var(--accent)' }} />
      </svg>
    </span>
  )
}

function Arrow() {
  return (
    <span aria-hidden="true" className="self-center font-mono text-lg leading-none text-muted">
      <span className="md:hidden">↓</span>
      <span className="hidden md:inline">→</span>
    </span>
  )
}

function Station({ k, n }: { k: StationKey; n: number }) {
  return (
    <div
      data-flip={k}
      className={`flex min-w-[5.5rem] items-center justify-center gap-2 rounded-lg border-[1.5px] bg-surface px-3 py-2.5 md:flex-col md:gap-1 ${k === 'transform' ? 'border-accent' : 'border-ink'}`}
    >
      <span className="inline-flex size-5 items-center justify-center rounded-full border border-muted font-mono text-xs leading-none text-muted">{I.order[n]}</span>
      <span className="font-bold">{I.stations[k]}</span>
    </div>
  )
}

function Table({ kind }: { kind: 'raw' | 'clean' }) {
  const n = kind === 'raw' ? 6 : 5
  return (
    <div className="min-w-0 rounded-lg border-[1.5px] border-edge bg-surface px-3 py-2">
      <p className="flex flex-wrap items-baseline gap-x-2 text-[0.9375rem]">
        <span className="font-mono font-bold">{I.tables[kind].name}</span>
        <span>{I.tables[kind].rows}</span>
        {kind === 'raw' ? (
          <span className="rounded-full border border-muted px-2 text-xs leading-5">{I.tables.raw.tag}</span>
        ) : (
          <span className="text-muted">· {I.tables.clean.sum}</span>
        )}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {Array.from({ length: n }, (_, i) => (
          <Chip key={i} i={i} bumpy={kind === 'raw'} kind={kind} />
        ))}
      </div>
    </div>
  )
}

export function EtlToggle() {
  const [mode, setMode] = useState<Mode>('etl')
  const [live, setLive] = useState('')
  const { reduced } = useEnv()
  const name = useId()
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const snap = useRef<Map<string, DOMRect> | null>(null)
  const flowTl = useRef<gsap.core.Timeline | null>(null)
  const pending = useRef<gsap.core.Tween | null>(null)
  const { contextSafe } = useGSAP({ scope: root })

  /** 현재 순서대로 블록 6개를 흘려보낸다(약 2초) */
  const flow = contextSafe(() => {
    const st = stage.current
    const ly = layer.current
    if (!st || !ly || reduced) return
    flowTl.current?.kill()
    ly.replaceChildren()
    const base = st.getBoundingClientRect()
    // 스테이션은 아래쪽 테두리를 따라 지나간다(이름 글자를 가리지 않게)
    const center = (sel: string) => {
      const r = st.querySelector(sel)!.getBoundingClientRect()
      return { x: r.left - base.left + r.width / 2, y: r.bottom - base.top - 2 }
    }
    const src = center('[data-flip="source"]')
    const ex = center('[data-flip="extract"]')
    const tr = center('[data-flip="transform"]')
    const ld = center('[data-flip="load"]')
    const raw = Array.from(st.querySelectorAll<HTMLElement>('[data-chip="raw"]'))
    const clean = Array.from(st.querySelectorAll<HTMLElement>('[data-chip="clean"]'))
    // 순서는 지금 그려진 DOM에서 읽는다(지연 호출·관찰자의 클로저가 이전 mode를 쥐고 있어도 어긋나지 않게)
    const elt = raw.length > 0
    const spot = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 }
    }
    const make = (i: number, bumpy: boolean, p: { x: number; y: number }) => {
      const d = document.createElement('span')
      d.className = 'absolute left-0 top-0 block h-4 w-5'
      d.appendChild(chipNode(i, bumpy))
      ly.appendChild(d)
      gsap.set(d, { x: p.x - 10, y: p.y - 8 })
      return d
    }
    const to = (p: { x: number; y: number }) => ({ x: p.x - 10, y: p.y - 8 })
    const neat = (d: HTMLElement) => {
      const poly = d.querySelector('polygon') as SVGPolygonElement
      return { target: poly, points: poly.dataset.neat ?? '' }
    }
    const tl = gsap.timeline({ onComplete: () => ly.replaceChildren() })
    tl.set([...raw, ...clean], { opacity: 0 })
    const STAG = 0.08
    if (!elt) {
      // 추출 → 변환(반듯해지고 6 → 5) → 적재 → 정리본
      let k = 0
      for (let i = 0; i < 6; i++) {
        const d = make(i, true, src)
        const t = i * STAG
        const dup = i === 2
        tl.to(d, { ...to(ex), duration: 0.32, ease: 'power1.inOut' }, t)
        tl.to(d, { ...to(tr), duration: 0.32, ease: 'power1.inOut' }, t + 0.32)
        const n = neat(d)
        tl.to(n.target, { attr: { points: n.points }, duration: 0.14 }, t + 0.64)
        if (dup) {
          tl.to(d, { opacity: 0, scale: 0.4, duration: 0.14 }, t + 0.64)
          continue
        }
        const target = clean[k++]
        tl.to(d, { ...to(ld), duration: 0.3, ease: 'power1.inOut' }, t + 0.78)
        tl.to(d, { ...to(spot(target)), duration: 0.32, ease: 'power2.out' }, t + 1.08)
        tl.set(target, { opacity: 1 }, t + 1.4)
        tl.set(d, { opacity: 0 }, t + 1.4)
      }
    } else {
      // 추출 → 적재 → 원본(모양 그대로) → 저장소 안 변환 → 정리본
      for (let i = 0; i < 6; i++) {
        const d = make(i, true, src)
        const t = i * STAG
        tl.to(d, { ...to(ex), duration: 0.3, ease: 'power1.inOut' }, t)
        tl.to(d, { ...to(ld), duration: 0.3, ease: 'power1.inOut' }, t + 0.3)
        tl.to(d, { ...to(spot(raw[i])), duration: 0.3, ease: 'power2.out' }, t + 0.6)
        tl.set(raw[i], { opacity: 1 }, t + 0.9)
        tl.set(d, { opacity: 0 }, t + 0.9)
      }
      clean.forEach((target, i) => {
        const from = spot(raw[i < 2 ? i : i + 1])
        const d = make(i, true, from)
        gsap.set(d, { opacity: 0 })
        const t = 1.3 + i * STAG
        tl.set(d, { opacity: 1 }, t)
        tl.to(d, { ...to(tr), duration: 0.22, ease: 'power1.inOut' }, t)
        const n = neat(d)
        tl.to(n.target, { attr: { points: n.points }, duration: 0.12 }, t + 0.22)
        tl.to(d, { ...to(spot(target)), duration: 0.26, ease: 'power2.out' }, t + 0.32)
        tl.set(target, { opacity: 1 }, t + 0.58)
        tl.set(d, { opacity: 0 }, t + 0.58)
      })
    }
    flowTl.current = tl
  })

  const flip = contextSafe((before: Map<string, DOMRect>) => {
    const st = stage.current
    if (!st) return
    st.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const b = before.get(el.dataset.flip ?? '')
      if (!b) return
      const a = el.getBoundingClientRect()
      gsap.fromTo(el, { x: b.left - a.left, y: b.top - a.top }, { x: 0, y: 0, duration: 0.45, ease: 'power2.inOut' })
    })
    pending.current?.kill()
    pending.current = gsap.delayedCall(0.5, flow)
  })

  const choose = (m: Mode) => {
    if (m === mode) return
    if (!reduced) {
      flowTl.current?.progress(1)
      const st = stage.current
      snap.current = st ? new Map(Array.from(st.querySelectorAll<HTMLElement>('[data-flip]')).map((el) => [el.dataset.flip ?? '', el.getBoundingClientRect()])) : null
    }
    setMode(m)
    setLive(I.live[m])
  }

  // 순서가 바뀌면: 스테이션이 새 자리로 미끄러지고(FLIP), 블록이 한 번 흐른다
  useLayoutEffect(() => {
    const before = snap.current
    snap.current = null
    if (before) flip(before)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // 처음 화면에 들어왔을 때 한 번 자동 재생
  useEffect(() => {
    const el = stage.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect()
          flow()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div ref={root}>
        <div role="radiogroup" aria-label={I.groupLabel} className="inline-flex gap-1 rounded-xl border-[1.5px] border-ink bg-bg p-1">
          {(['etl', 'elt'] as Mode[]).map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-lg px-5 py-2 font-bold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                mode === m ? 'bg-ink text-bg' : 'hover:bg-surface'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={m}
                checked={mode === m}
                onChange={() => choose(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') choose(m)
                }}
                className="sr-only"
              />
              {I.modes[m]}
            </label>
          ))}
        </div>

        <div ref={stage} className="relative mt-6">
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <div data-flip="source" className="rounded-lg border-[1.5px] border-dashed border-ink px-3 py-2.5 text-center font-bold">
              {I.source}
            </div>
            <Arrow />
            <Station k="extract" n={0} />
            <Arrow />
            {mode === 'etl' ? (
              <>
                <Station k="transform" n={1} />
                <Arrow />
                <Station k="load" n={2} />
              </>
            ) : (
              <Station k="load" n={1} />
            )}
            <Arrow />
            <div data-flip="store" className="min-w-0 flex-1 rounded-xl border-[1.5px] border-ink bg-bg p-3">
              <p className="font-bold">{I.store}</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                {mode === 'elt' && (
                  <>
                    <Station k="transform" n={2} />
                    <Arrow />
                  </>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {mode === 'elt' && <Table kind="raw" />}
                  <Table kind="clean" />
                </div>
              </div>
            </div>
          </div>
          <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
            <p className="font-bold">{I.prosTitle}</p>
            <p className="mt-1">{I[mode].pros}</p>
          </div>
          <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
            <p className="font-bold">{I.consTitle}</p>
            <p className="mt-1">{I[mode].cons}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <p className="min-w-0 grow basis-72 font-semibold">{I.common}</p>
          {!reduced && (
            <button type="button" className="btn btn-sm" onClick={() => flow()}>
              <span aria-hidden="true">↻</span> {I.replay}
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </InteractionFrame>
  )
}
