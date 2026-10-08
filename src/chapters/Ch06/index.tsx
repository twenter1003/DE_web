import { ch6 as c } from '../../content/chapters/ch6'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, BrokerFig, buildAttempt, buildBroker, buildProblem, buildSolution, buildWindow, ProblemFig, SolutionFig, WindowFig } from './scenes'

export function Ch06() {
  return (
    <ChapterShell id="ch6">
      <ChapterOpening id="ch6" opening={c.opening} visitors={2} board="neat" />
      <StepScene id="ch6-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} tall />
      <StepScene id="ch6-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch6-broker" kind="concept" scene={c.scenes.broker} diagram={() => <BrokerFig />} build={buildBroker} tall />
      <StepScene id="ch6-window" kind="concept" scene={c.scenes.window} diagram={() => <WindowFig />} build={buildWindow} tall />
      <StepScene id="ch6-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch6" quiz={c.quiz} />
      <ChapterGrowth id="ch6" growth={c.growth} />
    </ChapterShell>
  )
}
