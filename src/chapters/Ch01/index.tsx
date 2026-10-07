import { ch1 as c } from '../../content/chapters/ch1'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import {
  AnalogyFig,
  AttemptFig,
  buildAnalogy,
  buildAttempt,
  buildOltp,
  buildOverload,
  buildProblem,
  buildSolution,
  OltpFig,
  OverloadFig,
  ProblemFig,
  SolutionFig,
} from './scenes'
import { SqlPlayground } from './SqlPlayground'

export function Ch01() {
  return (
    <ChapterShell id="ch1">
      <ChapterOpening id="ch1" opening={c.opening} visitors={0} />
      <StepScene id="ch1-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch1-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <SqlPlayground />
      <StepScene id="ch1-overload" kind="attempt" scene={c.scenes.overload} diagram={() => <OverloadFig />} build={buildOverload} tall />
      <StepScene id="ch1-analogy" kind="concept" scene={c.scenes.analogy} diagram={() => <AnalogyFig />} build={buildAnalogy} />
      <StepScene id="ch1-oltp" kind="concept" scene={c.scenes.oltp} diagram={() => <OltpFig />} build={buildOltp} />
      <StepScene id="ch1-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} />
      <Summary text={c.summary} />
      <Quiz id="ch1" quiz={c.quiz} />
      <ChapterGrowth id="ch1" growth={c.growth} />
    </ChapterShell>
  )
}
