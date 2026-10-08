import { ch4 as c } from '../../content/chapters/ch4'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, buildAttempt, buildProblem, buildSolution, buildStar, buildWarehouse, MeetingFig, ProblemFig, SolutionFig, StarFig, WarehouseFig } from './scenes'

export function Ch04() {
  return (
    <ChapterShell id="ch4">
      <ChapterOpening id="ch4" opening={c.opening} visitors={1} />
      <MeetingFig />
      <StepScene id="ch4-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch4-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch4-warehouse" kind="concept" scene={c.scenes.warehouse} diagram={() => <WarehouseFig />} build={buildWarehouse} tall />
      <StepScene id="ch4-star" kind="concept" scene={c.scenes.star} diagram={() => <StarFig />} build={buildStar} tall />
      <StepScene id="ch4-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch4" quiz={c.quiz} />
      <ChapterGrowth id="ch4" growth={c.growth} />
    </ChapterShell>
  )
}
