import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { goTo } from './lib/nav'
import { refreshTriggers } from './lib/refresh'

const container = document.getElementById('root')!
if (import.meta.env.DEV && location.search.includes('debug=')) {
  // 개발 전용 점검 화면(프로덕션 빌드에서는 이 분기가 통째로 빠진다)
  import('./dev').then(({ DevRoot }) => createRoot(container).render(<DevRoot />))
} else {
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  )
  // 빌드가 미리 그려 둔 첫 화면(scripts/prerender.mjs)은 버리지 않고 이어받는다(hydration).
  // 다시 그리면 첫 화면 전체를 지우고 새로 만들어 배치하느라 모바일에서 메인 스레드가 오래 막힌다.
  if (container.firstElementChild) hydrateRoot(container, app)
  else createRoot(container).render(app)
}

// 주소에 #ch5 같은 앵커가 있으면 그 챕터까지 마운트한 뒤 이동
if (location.hash.length > 1) setTimeout(() => goTo(decodeURIComponent(location.hash.slice(1))), 0)

// 웹폰트는 첫 화면을 그린 뒤 불러온다(첫 그리기를 막지 않게). 글꼴이 바뀌면 글줄 높이가 바뀌므로 트리거 위치를 다시 계산
const loadFonts = () => import('./styles/fonts.css').then(() => document.fonts?.ready).then(() => refreshTriggers())
if (document.readyState === 'complete') loadFonts()
else addEventListener('load', loadFonts, { once: true })
