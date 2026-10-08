import { ch8 as c } from '../../content/chapters/ch8'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, buildAttempt, buildConcept, buildMedallion, buildProblem, buildSolution, ConceptFig, MedallionFig, ProblemFig, SolutionFig } from './scenes'
import { TimeTravel } from './TimeTravel'

export function Ch08() {
  return (
    <ChapterShell id="ch8">
      <ChapterOpening id="ch8" opening={c.opening} visitors={3} board="neat" />
      <StepScene id="ch8-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch8-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} />
      <StepScene id="ch8-concept" kind="concept" scene={c.scenes.concept} diagram={() => <ConceptFig />} build={buildConcept} tall />
      <StepScene id="ch8-medallion" kind="concept" scene={c.scenes.medallion} diagram={() => <MedallionFig />} build={buildMedallion} tall />
      <TimeTravel />
      <StepScene id="ch8-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch8" quiz={c.quiz} />
      <ChapterGrowth id="ch8" growth={c.growth} />
    </ChapterShell>
  )
}
