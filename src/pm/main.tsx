import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/index.css'
import { PmApp } from './PmApp'
import { refreshTriggers } from '../lib/refresh'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PmApp />
  </StrictMode>,
)

// 웹폰트는 첫 화면을 그린 뒤 불러온다. 글꼴이 바뀌면 글줄 높이가 바뀌므로 트리거 위치를 다시 계산
const loadFonts = () => import('../styles/fonts.css').then(() => document.fonts?.ready).then(() => refreshTriggers())
if (document.readyState === 'complete') loadFonts()
else addEventListener('load', loadFonts, { once: true })
