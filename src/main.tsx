import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { goTo } from './lib/nav'
import { refreshTriggers } from './lib/refresh'

const root = createRoot(document.getElementById('root')!)
if (import.meta.env.DEV && location.search.includes('debug=')) {
  // 개발 전용 점검 화면(프로덕션 빌드에서는 이 분기가 통째로 빠진다)
  import('./dev').then(({ DevRoot }) => root.render(<DevRoot />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// 주소에 #ch5 같은 앵커가 있으면 그 챕터까지 마운트한 뒤 이동
if (location.hash.length > 1) setTimeout(() => goTo(decodeURIComponent(location.hash.slice(1))), 0)

// 웹폰트는 첫 화면을 그린 뒤 불러온다(첫 그리기를 막지 않게). 글꼴이 바뀌면 글줄 높이가 바뀌므로 트리거 위치를 다시 계산
const loadFonts = () => import('./styles/fonts.css').then(() => document.fonts?.ready).then(() => refreshTriggers())
if (document.readyState === 'complete') loadFonts()
else addEventListener('load', loadFonts, { once: true })
