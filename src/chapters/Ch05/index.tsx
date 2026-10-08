import { ch5 as c } from '../../content/chapters/ch5'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, buildAttempt, buildDistributed, buildProblem, buildSolution, buildStorage, DistributedFig, ProblemFig, SolutionFig, StorageFig } from './scenes'
import { WorkerSlider } from './WorkerSlider'

export function Ch05() {
  return (
    <ChapterShell id="ch5">
      <ChapterOpening id="ch5" opening={c.opening} visitors={2} />
      <StepScene id="ch5-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch5-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} />
      <StepScene id="ch5-distributed" kind="concept" scene={c.scenes.distributed} diagram={() => <DistributedFig />} build={buildDistributed} tall />
      <WorkerSlider />
      <StepScene id="ch5-storage" kind="concept" scene={c.scenes.storage} diagram={() => <StorageFig />} build={buildStorage} tall />
      <StepScene id="ch5-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch5" quiz={c.quiz} />
      <ChapterGrowth id="ch5" growth={c.growth} />
    </ChapterShell>
  )
}
