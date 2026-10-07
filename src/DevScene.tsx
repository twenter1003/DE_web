import { ChapterShell } from './components/Chapter'
import { Node } from './components/diagram'
import { StepScene, at, DUR } from './components/StepScene'

// 개발 전용: ?debug=scene — StepScene 엔진 확인용 장면
const scene = {
  title: '엔진 점검 장면',
  steps: [
    { text: '첫 번째 step이에요. 노드 A가 나타나요.', alt: '노드 A' },
    { text: '두 번째 step이에요. 노드 B가 나타나요.', alt: '노드 A, B' },
    { text: '세 번째 step이에요. 노드 C가 나타나요.', alt: '노드 A, B, C' },
  ],
}

export function DevScene() {
  return (
    <main>
      <div style={{ height: '60vh' }} />
      <ChapterShell id="prologue">
        <StepScene
          id="dev-scene"
          kind="concept"
          scene={scene}
          diagram={() => (
            <svg viewBox="0 0 600 300" className="diagram h-full w-full">
              <g data-el="a"><Node x={100} y={150} label="A" /></g>
              <g data-el="b"><Node x={300} y={150} label="B" /></g>
              <g data-el="c"><Node x={500} y={150} label="C" /></g>
            </svg>
          )}
          build={(q, tl) => {
            tl.set([q('[data-el=a]'), q('[data-el=b]'), q('[data-el=c]')], { opacity: 0 }, 0)
            tl.to(q('[data-el=a]'), { opacity: 1, duration: DUR }, at(0))
            tl.to(q('[data-el=b]'), { opacity: 1, duration: DUR }, at(1))
            tl.to(q('[data-el=c]'), { opacity: 1, duration: DUR }, at(2))
          }}
        />
      </ChapterShell>
      <div style={{ height: '100vh' }} />
    </main>
  )
}
