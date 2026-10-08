import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { ScrollTrigger } from './lib/gsap'
import { App } from './App'
import { goTo } from './lib/nav'
import { DevMaps } from './DevMaps'
import { DevScene } from './DevScene'
import { EnvProvider } from './state/env'
import { ProgressProvider } from './state/progress'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && location.search.includes('debug=map') ? (
      <DevMapsShell />
    ) : import.meta.env.DEV && location.search.includes('debug=scene') ? (
      <EnvProvider>
        <ProgressProvider>
          <DevScene />
        </ProgressProvider>
      </EnvProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)

// 주소에 #ch5 같은 앵커가 있으면 그 챕터까지 마운트한 뒤 이동
if (location.hash.length > 1) setTimeout(() => goTo(decodeURIComponent(location.hash.slice(1))), 0)

// 웹폰트가 늦게 들어오면 글줄 높이가 바뀌어 트리거 위치가 어긋난다
document.fonts?.ready.then(() => ScrollTrigger.refresh())

function DevMapsShell() {
  return (
    <EnvProvider>
      <DevMaps vertical={location.search.includes('vertical')} />
    </EnvProvider>
  )
}
