import { UI } from './content/ui'
import { CHAPTERS } from './chapters/registry'
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
          href="#prologue"
          className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        >
          {UI.skip}
        </a>
        <Hud />
        <ChapterRail />
        <main>
          <Hero />
          {CHAPTERS.map(({ id, Component }) => (
            <Component key={id} />
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
