import { ch9 as c } from '../../content/chapters/ch9'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, buildAttempt, buildCost, buildProblem, buildSecurity, CostFig, ProblemFig, SecurityFig } from './scenes'
import { buildSolution, SolutionFig } from './solution'

export function Ch09() {
  return (
    <ChapterShell id="ch9">
      <ChapterOpening id="ch9" opening={c.opening} visitors={3} board="neat" />
      <StepScene id="ch9-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch9-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} />
      <StepScene id="ch9-cost" kind="concept" scene={c.scenes.cost} diagram={() => <CostFig />} build={buildCost} />
      <StepScene id="ch9-security" kind="concept" scene={c.scenes.security} diagram={() => <SecurityFig />} build={buildSecurity} tall />
      <StepScene id="ch9-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch9" quiz={c.quiz} />
      <ChapterGrowth id="ch9" growth={c.growth} />
    </ChapterShell>
  )
}
