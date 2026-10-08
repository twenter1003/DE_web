import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ch7 as c, LEVEL_DESK } from '../../content/chapters/ch7'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { Desk } from '../../components/Desk'
import { Txt } from '../../components/fig'
import { ChapterGrowth } from '../../components/Growth'
import { Bubble } from '../../components/people'
import { Quiz } from '../../components/Quiz'
import { RRect } from '../../components/sketch'
import { StepScene } from '../../components/StepScene'
import { useProgress } from '../../state/progress'
import { Shield } from './parts'
import { AttemptFig, buildAttempt, buildContract, buildProblem, buildSolution, buildTest, ContractFig, ProblemFig, SolutionFig, TestFig } from './scenes'

const F = c.figures

/** 오프닝 책상 위에 벽시계 08:50, 회의실 문 '09:00 경영 회의', 맨 앞 방문자(윤 대표)가 내민 노트북 '0원'을 덧그린다(Desk와 같은 좌표: Lv3, 방문자 3명) */
function OpeningProps() {
  const hand = (deg: number, len: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `M 48 36 L ${48 + len * Math.cos(a)} ${36 + len * Math.sin(a)}`
  }
  return (
    <svg viewBox="20 0 594 300" aria-hidden="true" className="diagram pointer-events-none absolute inset-0 h-full w-full">
      <circle cx={48} cy={36} r={17} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.8} />
      <path d={`${hand(265, 9)} ${hand(300, 13)}`} style={{ stroke: 'var(--line)', fill: 'none' }} strokeWidth={2} strokeLinecap="round" />
      <Txt x={48} y={70} size={12} weight={800} anchor="middle" mono>
        {F.deskClock}
      </Txt>
      <RRect x={84} y={6} w={64} h={104} seed="op-door" rough={0.3} dash="5 4" strokeWidth={1.2} />
      <RRect x={90} y={22} w={52} h={38} seed="op-sign" rough={0.25} fill="var(--surface)" />
      <Txt x={116} y={38} size={11.5} weight={800} anchor="middle" mono>
        {F.deskSign[0]}
      </Txt>
      <Txt x={116} y={53} size={10.5} weight={700} anchor="middle">
        {F.deskSign[1]}
      </Txt>
      {/* 윤 대표(맨 앞 방문자)가 주니 쪽으로 돌려 내민 노트북 */}
      <RRect x={440} y={138} w={46} h={32} seed="op-ceo-lap" rough={0.3} fill="var(--surface)" />
      <RRect x={434} y={170} w={56} h={6} seed="op-ceo-kb" rough={0.25} fill="var(--surface)" />
      <Txt x={463} y={159} size={13} weight={800} anchor="middle">
        {F.zero}
      </Txt>
    </svg>
  )
}

// ponytail: 공용 ChapterOpening에 책상 소품 슬롯이 없어 figure에 포털로 겹친다(Ch3와 같은 방식). Desk에 소품 옵션이 생기면 교체.
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
      <ChapterOpening id="ch7" opening={c.opening} visitors={3} />
      {fig && createPortal(<OpeningProps />, fig)}
    </div>
  )
}

/** 승급 뒤 책상(Lv4): 화이트보드의 정돈된 아키텍처에 품질 검사 배지, 질문하러 온 동료 3명 */
function LevelDesk() {
  const { completed } = useProgress()
  if (!completed.has('ch7')) return null
  return (
    <section aria-label={LEVEL_DESK.label} className="pt-[4svh]">
      <p className="font-mono text-sm text-muted">{LEVEL_DESK.label}</p>
      <div className="mt-4 grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <figure role="img" aria-label={LEVEL_DESK.alt} className="relative max-w-[34rem]">
          <Desk level={4} mood="relaxed" visitors={3} board="neat" />
          <svg viewBox="20 0 594 300" aria-hidden="true" className="diagram pointer-events-none absolute inset-0 h-full w-full">
            {[346, 426].map((x) => (
              <Shield key={x} x={x} y={30} s={0.55} />
            ))}
            <Shield x={366} y={45} s={0.55} />
          </svg>
        </figure>
        <div className="space-y-3">
          {LEVEL_DESK.lines.map((l, i) => (
            <Bubble key={i} line={l} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function Ch07() {
  return (
    <ChapterShell id="ch7">
      <Opening />
      <StepScene id="ch7-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch7-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch7-test" kind="concept" scene={c.scenes.test} diagram={() => <TestFig />} build={buildTest} tall />
      <StepScene id="ch7-contract" kind="concept" scene={c.scenes.contract} diagram={() => <ContractFig />} build={buildContract} tall />
      <StepScene id="ch7-solution" kind="solution" scene={c.scenes.solution} diagram={() => <SolutionFig />} build={buildSolution} tall />
      <Summary text={c.summary} />
      <Quiz id="ch7" quiz={c.quiz} />
      <LevelDesk />
      <ChapterGrowth id="ch7" growth={c.growth} />
    </ChapterShell>
  )
}
