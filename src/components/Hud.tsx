import { useRef, useState } from 'react'
import { CARDS } from '../content/cards'
import { T } from '../content/map'
import { LEVELS } from '../content/people'
import { TOC, tocOf } from '../content/toc'
import { UI } from '../content/ui'
import type { ChapterId } from '../content/types'
import { goTo } from '../lib/nav'
import { STAGES, stageVars } from '../lib/stages'
import { useActive } from '../state/active'
import { useEnv, type MotionPref } from '../state/env'
import { useProgress } from '../state/progress'
import { Radar, TermCard } from './Collection'
import { PipelineMap } from './PipelineMap'
import { StageCtx } from './sketch'

const useActiveStage = () => {
  const active = useActive()
  return active === 'hero' ? 0 : tocOf(active).stage
}

/** 지금까지 도달한 지점의 맵 시점 */
function hudMapT(furthest: number, climax: boolean) {
  if (furthest >= 11) return T.epilogue
  if (furthest === 10) return climax ? T.ch10Final : T.ch10Proposal
  return furthest
}

export function MotionToggle({ compact }: { compact?: boolean }) {
  const { reduced, pref, setPref, systemReduced } = useEnv()
  if (compact)
    return (
      <button
        type="button"
        className="btn btn-sm"
        aria-pressed={reduced}
        onClick={() => setPref(reduced ? 'full' : 'reduce')}
        title={reduced ? UI.motion.toggleOn : UI.motion.toggleOff}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path d="M3 10 Q 6.5 4 10 10 T 17 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          {reduced && <line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
        <span className="hidden sm:inline">{UI.motion.label}</span>
        <span className="sr-only sm:hidden">{UI.motion.label}</span>
      </button>
    )
  return (
    <fieldset>
      <legend className="font-bold">{UI.motion.label}</legend>
      <p className="mt-1 text-sm text-muted">{UI.motion.desc}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['system', 'reduce', 'full'] as MotionPref[]).map((p) => (
          <label key={p} className="btn btn-sm has-[:checked]:bg-ink has-[:checked]:text-bg has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--accent)]">
            <input type="radio" name="motion-pref" className="sr-only" checked={pref === p} onChange={() => setPref(p)} />
            {UI.motion.options[p]}
          </label>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{UI.motion.systemNow(systemReduced)}</p>
    </fieldset>
  )
}

type Tab = keyof typeof UI.panel.tabs

function Panel({ close }: { close: () => void }) {
  const p = useProgress()
  const active = useActive()
  const [tab, setTab] = useState<Tab>('cards')
  const [confirm, setConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const tabs = Object.keys(UI.panel.tabs) as Tab[]
  const go = (id: ChapterId) => {
    close()
    requestAnimationFrame(() => goTo(id))
  }
  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.indexOf(tab)
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
      setTab(next)
      document.getElementById(`hud-tab-${next}`)?.focus()
    }
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4">
        <h2 className="text-xl font-extrabold">{UI.panel.title}</h2>
        <button type="button" className="btn btn-sm" onClick={close}>
          {UI.panel.close}
        </button>
      </div>
      <div role="tablist" aria-label={UI.panel.title} className="flex gap-1 overflow-x-auto border-b border-edge px-3 pt-2" onKeyDown={onKey}>
        {tabs.map((t) => (
          <button
            key={t}
            id={`hud-tab-${t}`}
            role="tab"
            type="button"
            aria-selected={tab === t}
            aria-controls={`hud-panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-t-lg px-4 py-2.5 font-semibold ${tab === t ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
          >
            {UI.panel.tabs[t]}
          </button>
        ))}
      </div>
      <div id={`hud-panel-${tab}`} role="tabpanel" aria-labelledby={`hud-tab-${tab}`} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tab === 'cards' && (
          <>
            <p className="font-bold">{UI.panel.cardsCount(p.cards.size)}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {CARDS.map((c) => (
                <TermCard key={c.letter} card={c} owned={p.cards.has(c.letter)} variant="row" />
              ))}
            </ul>
          </>
        )}
        {tab === 'stats' && (
          <>
            <p className="font-bold">{UI.hud.level(p.level, LEVELS[p.level])}</p>
            <Radar values={p.stats} className="mx-auto mt-4 w-full max-w-[26rem]" />
            <p className="mt-4 text-sm text-muted">{UI.panel.radarNote}</p>
          </>
        )}
        {tab === 'map' && (
          <>
            <p className="text-sm text-muted">{UI.panel.mapHint}</p>
            <div className="mt-4 h-[62svh]">
              <PipelineMap t={hudMapT(p.furthest, p.climax)} interactive onNavigate={go} />
            </div>
          </>
        )}
        {tab === 'toc' && (
          <ol className="space-y-1">
            {TOC.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    go(t.id)
                  }}
                  aria-current={active === t.id ? 'location' : undefined}
                  className="flex items-baseline gap-3 rounded-lg px-3 py-2 hover:bg-surface"
                >
                  <span className="w-16 shrink-0 font-mono text-sm text-muted">{t.label}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{t.title}</span>
                    <span className="block text-sm text-muted">{t.topic}</span>
                  </span>
                  {p.completed.has(t.id) && <span className="font-mono text-sm text-ok">✓ {UI.panel.tocDone}</span>}
                  {active === t.id && <span className="sr-only">{UI.panel.tocHere}</span>}
                </a>
              </li>
            ))}
          </ol>
        )}
        {tab === 'settings' && (
          <div className="space-y-8">
            <MotionToggle />
            <div>
              {!confirm ? (
                <button type="button" className="btn" onClick={() => (setConfirm(true), setResetDone(false))}>
                  {UI.panel.reset}
                </button>
              ) : (
                <div role="alertdialog" aria-label={UI.panel.reset} className="rounded-xl border-[1.5px] border-edge p-4">
                  <p>{UI.panel.resetConfirm}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn btn-solid"
                      onClick={() => {
                        p.reset()
                        setConfirm(false)
                        setResetDone(true)
                      }}
                    >
                      {UI.panel.resetYes}
                    </button>
                    <button type="button" className="btn" onClick={() => setConfirm(false)} autoFocus>
                      {UI.panel.resetNo}
                    </button>
                  </div>
                </div>
              )}
              <p aria-live="polite" className="mt-2 text-sm text-muted">
                {resetDone ? UI.panel.resetDone : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function Hud() {
  const stage = STAGES[useActiveStage()]
  const p = useProgress()
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const close = () => dialog.current?.close()
  return (
    <StageCtx.Provider value={stage}>
      <div className="fixed right-3 top-3 z-40 flex items-center gap-2 text-ink md:right-5 md:top-4" style={stageVars(stage) as React.CSSProperties}>
        <MotionToggle compact />
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`${UI.hud.open}. ${UI.hud.level(p.level, LEVELS[p.level])}, ${UI.hud.progress(Math.round(p.ratio * 100))}, ${UI.hud.cards(p.cards.size)}`}
          onClick={() => {
            dialog.current?.showModal()
            setOpen(true)
          }}
          className="btn btn-sm gap-3"
        >
          <span className="font-mono font-bold">Lv{p.level}</span>
          <span className="hidden sm:inline">{LEVELS[p.level]}</span>
          <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-edge" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.round(p.ratio * 100)}%` }} />
          </span>
          <span className="font-mono text-xs">{p.cards.size}/26</span>
        </button>
      </div>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && close()}
        aria-label={UI.panel.title}
        style={stageVars(stage) as React.CSSProperties}
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[44rem] border-0 border-l border-edge bg-bg p-0 text-ink shadow-2xl"
      >
        {open && <Panel close={close} />}
      </dialog>
    </StageCtx.Provider>
  )
}

export function ChapterRail() {
  const active = useActive()
  const stage = STAGES[useActiveStage()]
  const { completed } = useProgress()
  return (
    <nav aria-label={UI.rail.label} className="fixed left-0 top-1/2 z-30 hidden w-[var(--rail-w)] -translate-y-1/2 lg:block" style={stageVars(stage) as React.CSSProperties}>
      <ol className="flex flex-col items-center gap-1">
        {TOC.map((t) => {
          const here = active === t.id
          return (
            <li key={t.id} className="group relative">
              <a
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  goTo(t.id)
                }}
                aria-current={here ? 'location' : undefined}
                className={`flex h-8 w-10 items-center justify-center rounded-md font-mono text-xs ${here ? 'bg-ink font-bold text-bg' : 'text-ink hover:bg-surface'}`}
              >
                <span aria-hidden="true">{completed.has(t.id) ? `${t.short}✓` : t.short}</span>
                <span className="sr-only">
                  {t.label} {t.title}
                  {completed.has(t.id) ? `, ${UI.rail.done}` : ''}
                </span>
              </a>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-edge bg-surface px-3 py-1 text-sm text-ink group-hover:block group-focus-within:block"
              >
                {t.label} {t.title}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
