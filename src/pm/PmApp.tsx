import { EnvProvider } from '../state/env'
import { PmProgressProvider } from './progress'
import { P1 } from './P1'

// PM 트랙(바구니 유니버스) 페이지. 지금은 첫 장(P1)만 있다. 스토리보드: docs/storyboard/pm/
export function PmApp() {
  return (
    <EnvProvider>
      <PmProgressProvider>
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-ink text-bg focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus-visible:px-4 focus-visible:py-2"
        >
          본문으로 건너뛰기
        </a>
        <header className="paper-grid sticky top-0 z-40 border-b border-edge text-ink" style={{ background: 'var(--bg, #ECEFE6)' }}>
          <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-4 px-4 py-3 md:px-8">
            <a href="./" className="font-mono text-sm text-muted underline-offset-4 hover:underline">
              ← 데이터 엔지니어링 A to Z
            </a>
            <span className="font-mono text-sm font-bold">PM 트랙 · 시범판</span>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="outline-none">
          <P1 />
        </main>
        <footer className="paper-grid text-ink">
          <div className="mx-auto max-w-[80rem] px-4 py-10 text-sm text-muted md:px-8">
            바구니는 가상의 쇼핑몰이에요. 이야기 속 수치는 모두 가상 설정이에요. 이 트랙은 시범판이라 첫 장만 열려 있어요.
          </div>
        </footer>
      </PmProgressProvider>
    </EnvProvider>
  )
}
