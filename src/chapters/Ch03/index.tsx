import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ch3 as c, VISIT } from '../../content/chapters/ch3'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { Desk } from '../../components/Desk'
import { ChapterGrowth } from '../../components/Growth'
import { Bubble } from '../../components/people'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { DagSimulator } from './DagSimulator'
import { DeskPatch } from './parts'
import { AnalogyFig, AttemptFig, buildAnalogy, buildAttempt, buildDefinition, buildProblem, buildSolution, DefinitionFig, ProblemFig, SolutionFig } from './scenes'

/** 오프닝: 공용 책상의 외장 모니터에 예약 카드, 포스트잇, 석 리드의 머그컵을 덧그린다 */
// ponytail: 공용 ChapterOpening에 책상 소품 슬롯이 없어 figure에 포털로 겹친다. Desk에 화면 옵션이 생기면 교체.
function Opening() {
  const box = useRef<HTMLDivElement>(null)
  const [fig, setFig] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const f = box.current?.querySelector('figure')
    if (!f) return
    f.style.position = 'relative'
    setFig(f)
  }, [])
  return (
    <div ref={box}>
      <ChapterOpening id="ch3" opening={c.opening} visitors={1} />
      {fig && createPortal(<DeskPatch screen="card" hold="mug" />, fig)}
    </div>
  )
}

export function Ch03() {
  return (
    <ChapterShell id="ch3">
      <Opening />
      <StepScene id="ch3-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch3-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch3-analogy" kind="concept" scene={c.scenes.analogy} diagram={() => <AnalogyFig />} build={buildAnalogy} />
      <StepScene id="ch3-definition" kind="concept" scene={c.scenes.definition} diagram={() => <DefinitionFig />} build={buildDefinition} tall />
      <DagSimulator />
      <StepScene id="ch3-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch3" quiz={c.quiz} />
      <section aria-label={VISIT.label} className="pt-[4svh]">
        <p className="font-mono text-sm text-muted">{VISIT.label}</p>
        <div className="mt-4 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
          <figure role="img" aria-label={VISIT.alt} className="relative max-w-[30rem]">
            <Desk level={2} mood="proud" visitors={1} />
            <DeskPatch screen="dag" hold="laptop" />
          </figure>
          <div className="space-y-3">
            {VISIT.lines.map((l, i) => (
              <Bubble key={i} line={l} />
            ))}
          </div>
        </div>
      </section>
      <ChapterGrowth id="ch3" growth={c.growth} />
    </ChapterShell>
  )
}
