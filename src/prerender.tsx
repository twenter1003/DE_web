import { renderToString } from 'react-dom/server'
import { App } from './App'

// 빌드 때 첫 화면(히어로·HUD·챕터 자리)을 HTML로 미리 그려 둔다. 자바스크립트가 오기 전에 글이 보이게.
export function render() {
  return renderToString(<App />)
}
