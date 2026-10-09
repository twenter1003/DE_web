import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'

// 빌드 때 첫 화면(히어로·HUD·챕터 자리)을 HTML로 미리 그려 둔다. 자바스크립트가 오기 전에 글이 보이게.
// main.tsx가 이 HTML을 그대로 이어받으므로(hydrateRoot) 같은 트리(StrictMode 포함)를 그린다.
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
