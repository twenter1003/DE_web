import { UI } from './content/ui'
import { CHAPTERS } from './chapters/registry'
import { DeferredChapter } from './components/Deferred'
import { Hero } from './components/Hero'
import { ChapterRail, Hud } from './components/Hud'
import { STAGES, stageVars } from './lib/stages'
import { EnvProvider } from './state/env'
import { ProgressProvider } from './state/progress'

export function App() {
  return (
    <EnvProvider>
      <ProgressProvider>
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-ink text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:px-4 focus-visible:py-2"
        >
          {UI.skip}
        </a>
        <Hud />
        <ChapterRail />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          {CHAPTERS.map(({ id, steps, Component }, i) => (
            <DeferredChapter key={id} id={id} index={i} steps={steps} Component={Component} />
          ))}
        </main>
        <footer className="paper-grid text-ink" style={stageVars(STAGES[11]) as React.CSSProperties}>
          <div className="mx-auto max-w-[80rem] px-4 py-10 text-sm text-muted md:px-8 lg:pl-[calc(var(--rail-w)+2rem)]">
            {UI.footer.note}
          </div>
        </footer>
      </ProgressProvider>
    </EnvProvider>
  )
}
