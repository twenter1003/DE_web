import { Summary } from '../../components/Chapter'
import { QuizView } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { p1 as c } from '../../content/pm/p1'
import { usePmProgress } from '../progress'
import { TrackGrowth, TrackOpening, TrackShell } from '../Track'
import { RuleSwitches } from './RuleSwitches'
import { AttemptFig, buildAttempt, buildConcept, buildProblem, buildSolution, ConceptFig, ProblemFig, SolutionFig } from './scenes'

export function P1() {
  const { answers, answer } = usePmProgress()
  return (
    <TrackShell id="p1">
      <TrackOpening chapter={c} />
      <StepScene id="p1-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} tall />
      <StepScene id="p1-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="p1-concept" kind="concept" scene={c.scenes.concept} diagram={() => <ConceptFig />} build={buildConcept} tall />
      <div id="p1-rules">
        <RuleSwitches />
      </div>
      <StepScene id="p1-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <QuizView id="p1" quiz={c.quiz} saved={answers.p1} onAnswer={(o) => answer('p1', o)} />
      <div id="p1-growth">
        <TrackGrowth chapter={c} />
      </div>
    </TrackShell>
  )
}
