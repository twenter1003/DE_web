import { prologue as c } from '../../content/chapters/prologue'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { StepScene } from '../../components/StepScene'
import { AttemptFig, buildAttempt, buildEvents, buildProblem, buildShapes, buildSolution, EventsFig, ProblemFig, ShapesFig, SolutionFig } from './scenes'
import { ShopPlayground } from './ShopPlayground'

export function Prologue() {
  return (
    <ChapterShell id="prologue">
      <ChapterOpening id="prologue" opening={c.opening} csv />
      <StepScene id="prologue-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="prologue-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} />
      <StepScene id="prologue-events" kind="concept" scene={c.scenes.events} diagram={() => <EventsFig />} build={buildEvents} />
      <ShopPlayground />
      <StepScene id="prologue-shapes" kind="concept" scene={c.scenes.shapes} diagram={() => <ShapesFig />} build={buildShapes} />
      <StepScene id="prologue-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} />
      <Summary text={c.summary} />
      <Quiz id="prologue" quiz={c.quiz} />
      <ChapterGrowth id="prologue" growth={c.growth} />
    </ChapterShell>
  )
}
