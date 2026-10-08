import { ch2 as c } from '../../content/chapters/ch2'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { CodeRunner } from './CodeRunner'
import { AnalogyFig, AttemptFig, buildAnalogy, buildAttempt, buildDefinition, buildProblem, buildSolution, DefinitionFig, ProblemFig, SolutionFig } from './scenes'

export function Ch02() {
  return (
    <ChapterShell id="ch2">
      <ChapterOpening id="ch2" opening={c.opening} visitors={0} />
      <StepScene id="ch2-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch2-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch2-analogy" kind="concept" scene={c.scenes.analogy} diagram={() => <AnalogyFig />} build={buildAnalogy} tall />
      <StepScene id="ch2-definition" kind="concept" scene={c.scenes.definition} diagram={() => <DefinitionFig />} build={buildDefinition} />
      <CodeRunner />
      <StepScene id="ch2-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch2" quiz={c.quiz} />
      <ChapterGrowth id="ch2" growth={c.growth} />
    </ChapterShell>
  )
}
