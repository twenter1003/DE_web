import { useEffect, useRef, useState } from 'react'
import { cardsOf } from '../content/cards'
import { LEVELS, STAT_DELTAS, STAT_KEYS, STAT_LABELS, type StatKey } from '../content/people'
import { tocOf } from '../content/toc'
import { UI } from '../content/ui'
import { CHAPTER_IDS, type ChapterId, type Growth } from '../content/types'
import { gsap, useGSAP } from '../lib/gsap'
import { MAP_T_AFTER, mapStateAt } from '../state/derive'
import { useEnv } from '../state/env'
import { useProgress } from '../state/progress'
import { Radar, radarPoints, TermCard } from './Collection'
import { PipelineMap, mapTransition } from './PipelineMap'
import { Bubble } from './people'
import type { Q } from './StepScene'

const minus = (a: Record<StatKey, number>, d: Partial<Record<StatKey, number>>) =>
  Object.fromEntries(STAT_KEYS.map((k) => [k, a[k] - (d[k] ?? 0)])) as Record<StatKey, number>

/** 성장 연출: 맵 변화 + 카드 획득 + 역량 변화 + (승급 챕터) 레벨업. 처음 보일 때 한 번 재생, 다시 보기 가능 */
export function ChapterGrowth({ id, growth }: { id: ChapterId; growth: Growth }) {
  const toc = tocOf(id)
  const idx = CHAPTER_IDS.indexOf(id)
  const tPrev = idx > 0 ? MAP_T_AFTER[CHAPTER_IDS[idx - 1]] : -1
  const tNow = MAP_T_AFTER[id]
  const { completed, stats, climax } = useProgress()
  const { reduced, mobile } = useEnv()
  const done = completed.has(id)
  const cards = cardsOf(id)
  const delta = STAT_DELTAS[id]
  const before = minus(stats, done ? delta : {})
  const promo = toc.promotesTo
  const promoted = promo !== undefined && (id === 'ch10' ? climax : done)
  const nPrev = mapStateAt(tPrev).nodes.length
  const nNow = mapStateAt(tNow).nodes.length

  const root = useRef<HTMLElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  useGSAP(
    () => {
      const q = gsap.utils.selector(root) as Q
      const t = gsap.timeline({ paused: true })
      mapTransition(q, t, 0.05, { dur: 0.9, ghosts: id === 'ch10' })
      const cardEls = q('[data-el="gcard"]')
      if (done && cardEls.length) t.fromTo(cardEls, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, 0.55)
      const poly = q('[data-el="gradar-poly"]')
      if (done && poly.length) t.fromTo(poly, { attr: { points: radarPoints(before) } }, { attr: { points: radarPoints(stats) }, duration: 0.55 }, 0.6)
      const stamp = q('[data-el="stamp"]')
      if (promoted && stamp.length) t.fromTo(stamp, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, 0.8)
      tl.current = t
      if (reduced) t.progress(1)
      else if (seen) t.play(0)
    },
    { scope: root, dependencies: [done, promoted, reduced, mobile, seen], revertOnUpdate: true },
  )

  const deltas = STAT_KEYS.filter((k) => delta[k])

  return (
    <section ref={root} aria-labelledby={`${id}-growth`} className="pb-[16svh] pt-[6svh]">
      <div className="flex items-center justify-between gap-4">
        <p id={`${id}-growth`} className="font-mono text-sm text-muted">
          {UI.growth.title}
        </p>
        {!reduced && (
          <button type="button" className="btn btn-sm" onClick={() => tl.current?.restart()}>
            <span aria-hidden="true">↻</span> {UI.growth.replay}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-12">
        <div className="min-w-0">
          <div className="max-w-[34rem]">
            <Bubble line={growth.line} />
          </div>

          {promo !== undefined &&
            (promoted ? (
              <div data-el="stamp" className="mt-8 inline-flex flex-col rounded-xl border-[3px] border-ink bg-surface px-6 py-4">
                <span className="font-mono text-sm text-muted">{UI.growth.levelUp}</span>
                <span className="text-[2rem] font-extrabold leading-tight">{UI.hud.level(promo, LEVELS[promo])}</span>
              </div>
            ) : (
              <p className="mt-8 text-muted">{UI.growth.levelUpLocked(promo, LEVELS[promo])}</p>
            ))}

          <h4 className="mt-10 font-bold">{UI.growth.cards}</h4>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
            {cards.map((c) => (
              <TermCard key={c.letter} card={c} owned={done} el="gcard" />
            ))}
          </div>

          <h4 className="mt-10 font-bold">{UI.growth.stats}</h4>
          {done ? (
            <div className="mt-3 grid items-center gap-4 sm:grid-cols-[minmax(0,15rem)_1fr]">
              <Radar values={stats} prev={before} el="gradar" className="w-full max-w-[15rem]" />
              <ul className="space-y-1 font-mono text-sm">
                {deltas.map((k) => (
                  <li key={k}>
                    <span className="inline-block w-10 text-right font-bold">+{delta[k]}</span> {STAT_LABELS[k]}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-muted">{UI.growth.statsLocked}</p>
          )}
        </div>

        <figure className="min-w-0">
          <figcaption>
            <span className="font-bold">{UI.growth.map}</span>
            <span className="ml-3 font-mono text-sm text-muted">{UI.growth.nodes(nPrev, nNow)}</span>
            <span className="mt-1 block text-muted">{growth.mapNote}</span>
          </figcaption>
          <div className={`mt-4 ${mobile ? 'h-[72svh]' : 'h-[58svh]'}`}>
            <PipelineMap t={tNow} from={tPrev} tags ghosts={id === 'ch10'} label={`${UI.growth.map}: ${growth.mapNote}`} />
          </div>
        </figure>
      </div>
    </section>
  )
}
