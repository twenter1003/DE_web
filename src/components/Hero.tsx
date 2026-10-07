import { useEffect, useRef } from 'react'
import { CARDS } from '../content/cards'
import { TOC } from '../content/toc'
import { UI } from '../content/ui'
import { goTo } from '../lib/nav'
import { STAGES, stageVars } from '../lib/stages'
import { setActive } from '../state/active'
import { useProgress } from '../state/progress'
import { Desk } from './Desk'
import { RRect, StageCtx } from './sketch'

/** 첫 화면: 무엇을 배우는지, 스크롤하면 진행된다는 것, 걸리는 시간을 5초 안에 */
export function Hero() {
  const { furthest, cards } = useProgress()
  const ref = useRef<HTMLElement>(null)
  const resumeAt = furthest > 0 ? TOC.find((t) => t.stage === furthest) : undefined

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setActive('hero'), { rootMargin: '-50% 0px -50% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <StageCtx.Provider value={STAGES[0]}>
      <header ref={ref} id="top" className="paper-grid text-ink" style={stageVars(STAGES[0]) as React.CSSProperties}>
        <div className="mx-auto flex min-h-svh max-w-[80rem] flex-col justify-center px-4 pb-10 pt-24 md:px-8 lg:pl-[calc(var(--rail-w)+2rem)]">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14">
            <div>
              <h1 className="text-[3rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[5.25rem]">
                Data Engineering
                <br />
                A to Z
              </h1>
              <p className="mt-3 font-mono text-lg md:text-xl">{UI.subtitle}</p>
              <p className="mt-6 max-w-[34rem] text-[1.125rem] leading-[1.8] md:text-[1.25rem]">{UI.hero.lede}</p>
              <dl className="mt-8 grid max-w-[36rem] gap-3 sm:grid-cols-3">
                {UI.hero.facts.map((f) => (
                  <div key={f.k} className="border-t-2 border-ink pt-2">
                    <dt className="font-mono text-xs text-muted">{f.k}</dt>
                    <dd className="mt-1 font-semibold leading-snug">{f.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn btn-solid" onClick={() => goTo('prologue')}>
                  {UI.hero.start}
                </button>
                {resumeAt && (
                  <button type="button" className="btn" onClick={() => goTo(resumeAt.id)}>
                    {UI.hero.resume(resumeAt.label)}
                  </button>
                )}
              </div>
            </div>
            <figure role="img" aria-label={UI.hero.sceneAlt} className="max-w-[36rem]">
              <Desk level={1} mood="focus" csv />
            </figure>
          </div>

          <div className="mt-14">
            <ol className="flex flex-wrap gap-1.5" aria-label={UI.hero.cardsCaption}>
              {CARDS.map((c) => {
                const owned = cards.has(c.letter)
                return (
                  <li key={c.letter} className="relative h-11 w-8 md:h-12 md:w-9">
                    <svg viewBox="0 0 36 48" className="diagram absolute inset-0 h-full w-full" aria-hidden="true">
                      <RRect x={2} y={2} w={32} h={44} rough={0.6} seed={`hero-${c.letter}`} fill={owned ? 'var(--ink)' : 'var(--surface)'} />
                    </svg>
                    <span className={`relative flex h-full items-center justify-center font-mono text-sm font-bold ${owned ? 'text-bg' : ''}`}>
                      {c.letter}
                      <span className="sr-only">{owned ? ` ${c.term}` : ''}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
            <p className="mt-3 max-w-[40rem] text-muted">{UI.hero.cardsCaption}</p>
          </div>

          <p className="mt-12 flex items-center gap-3 font-mono text-sm">
            <svg viewBox="0 0 16 28" width="14" height="24" aria-hidden="true">
              <path d="M8 2 L8 24 M2 18 L8 25 L14 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {UI.hero.scrollCue}
          </p>
        </div>
      </header>
    </StageCtx.Provider>
  )
}
