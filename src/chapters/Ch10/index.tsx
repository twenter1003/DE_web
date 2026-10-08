import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ch10 as c } from '../../content/chapters/ch10'
import { tocOf } from '../../content/toc'
import { ChapterOpening, ChapterShell, Summary } from '../../components/Chapter'
import { Desk } from '../../components/Desk'
import { Txt } from '../../components/fig'
import { ChapterGrowth } from '../../components/Growth'
import { Quiz } from '../../components/Quiz'
import { RArrow, RPath, RRect, StageCtx } from '../../components/sketch'
import { StepScene } from '../../components/StepScene'
import { refreshTriggers } from '../../lib/refresh'
import { STAGES } from '../../lib/stages'
import { useEnv } from '../../state/env'
import { useProgress } from '../../state/progress'
import {
  AttemptFig,
  BuyFig,
  DecisionFig,
  ProblemFig,
  ServeFig,
  TradeoffFig,
  buildAttempt,
  buildBuy,
  buildDecision,
  buildProblem,
  buildServe,
  buildTradeoff,
} from './scenes'
import { Initial } from './parts'
import { TradeoffScale } from './TradeoffScale'

const F = c.figures
// 클라이맥스 뒤로는 손떨림 없는 정밀한 선(roughness 0)으로 그린다
const PRECISE = { ...STAGES[tocOf('ch10').stage], roughness: 0, bowing: 0 }

/** 오프닝 책상(Lv4, 동료 3명) 화이트보드 위에 요청 포스트잇 세 장과 덧그린 화살표, 위쪽 캡션 */
function OpeningProps() {
  const notes: [number, number][] = [
    [298, 2],
    [384, 20],
    [318, 50],
  ]
  return (
    <>
      <p className="absolute -top-8 left-0 font-mono text-sm text-muted md:-top-9" aria-hidden="true">
        {F.openingCaption}
      </p>
      <svg viewBox="20 0 594 300" aria-hidden="true" className="diagram pointer-events-none absolute inset-0 h-full w-full">
        {F.postits.map((t, i) => {
          const [x, y] = notes[i]
          const w = t.length * 10.2 + 16
          return (
            <g key={t}>
              <RRect x={x} y={y} w={w} h={24} rough={0.3} seed={`op-note${i}`} fill="var(--surface)" />
              <rect x={x} y={y} width={w} height={5} style={{ fill: 'var(--accent)' }} />
              <Txt x={x + w / 2} y={y + 18} size={10.5} weight={800} anchor="middle">
                {t}
              </Txt>
            </g>
          )
        })}
        <RArrow x1={330} y1={28} x2={350} y2={44} seed="op-ar1" rough={0.6} />
        <RArrow x1={430} y1={46} x2={414} y2={64} seed="op-ar2" rough={0.6} />
        <RPath d="M 306 76 Q 330 90 360 78" rough={0.6} seed="op-ar3" />
      </svg>
    </>
  )
}

// ponytail: 공용 ChapterOpening에 화이트보드 소품 슬롯이 없어 figure에 포털로 겹친다(Ch3·Ch7과 같은 방식).
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
      <ChapterOpening id="ch10" opening={c.opening} visitors={3} board="crowded" />
      {fig && createPortal(<OpeningProps />, fig)}
    </div>
  )
}

/** 승급 뒤 책상(Lv5): 모니터 하나, 단순한 그림 한 장, 멘티용 의자에 다온. 클라이맥스를 지난 뒤에만 */
function LevelDesk() {
  const { climax, completed } = useProgress()
  // 승급 순간에 이 칸이 생기며 아래 내용(다음 챕터 장면)이 밀리므로 트리거 위치를 다시 계산한다
  useEffect(() => {
    if (!climax) return
    const id = requestAnimationFrame(() => refreshTriggers())
    return () => cancelAnimationFrame(id)
  }, [climax])
  if (!climax) return null
  const a = F.after
  return (
    <section aria-label={a.label} className="pt-[4svh]">
      <p className="font-mono text-sm text-muted">{a.label}</p>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <figure role="img" aria-label={a.deskAlt} className="relative max-w-[34rem]">
          <Desk level={5} mood="relaxed" visitors={3} board="simple" />
          {/* 멘티용 의자에 앉은 다온(Desk와 같은 좌표: Lv5, 방문자 3명) */}
          <svg viewBox="20 0 679 300" aria-hidden="true" className="diagram pointer-events-none absolute inset-0 h-full w-full">
            <RPath d="M 480 212 C 480 186, 486 168, 494 167 C 502 168, 508 186, 508 212 L 532 212 L 532 286" rough={0.4} seed="daon-b" />
            <Initial x={494} y={150} r={13} who="daon" />
          </svg>
        </figure>
        <div className="space-y-2">
          <p className="text-lg font-bold">{a.level}</p>
          {completed.has('ch10') && <p className="text-muted">{a.tech}</p>}
        </div>
      </div>
    </section>
  )
}

export function Ch10() {
  const { markClimax } = useProgress()
  const { reduced } = useEnv()
  // 클라이맥스: 결정 장면의 step 2(안 만들기로 한 순간)나 step 3이 화면 가운데 선을 지나면 Lv5 승급.
  // 빠르게 스크롤해 step 3에 닿아도, 아래에서 거슬러 올라와도 승급하고, 장면을 통째로 건너뛰면(레일·목차 점프, 새로고침) 승급하지 않는다.
  // 두 모드 모두 같은 관찰자로 판단해 결과가 같다(모드가 바뀌면 step 요소가 새로 그려지므로 다시 관찰)
  useEffect(() => {
    const steps = Array.from(document.querySelectorAll('#ch10-decision [data-step]')).slice(1)
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && markClimax(), { rootMargin: '-50% 0px -50% 0px' })
    steps.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [markClimax, reduced])
  // markClimax는 바뀌지 않는다. 진행도가 바뀔 때마다(챕터 도달·퀴즈) 챕터 전체를 다시 그리지 않게 트리를 고정한다.
  // 진행도를 읽는 부품(LevelDesk·Quiz·ChapterGrowth)은 각자 구독한다
  return useMemo(() => (
    <ChapterShell id="ch10">
      <Opening />
      <StepScene id="ch10-problem" kind="problem" scene={c.scenes.problem} diagram={() => <ProblemFig />} build={buildProblem} />
      <StepScene id="ch10-attempt" kind="attempt" scene={c.scenes.attempt} diagram={() => <AttemptFig />} build={buildAttempt} tall />
      <StepScene id="ch10-tradeoff" kind="concept" scene={c.scenes.tradeoff} diagram={() => <TradeoffFig />} build={buildTradeoff} />
      <TradeoffScale />
      {/* 클라이맥스(Lv5 승급)는 위 useEffect의 관찰자가 맡는다 */}
      <StepScene id="ch10-decision" kind="solution" scene={c.scenes.decision} diagram={() => <DecisionFig />} build={buildDecision} tall />
      <StageCtx.Provider value={PRECISE}>
        <StepScene id="ch10-buy" kind="concept" scene={c.scenes.buy} diagram={() => <BuyFig />} build={buildBuy} />
        <StepScene id="ch10-serve" kind="solution" scene={c.scenes.serve} diagram={() => <ServeFig />} build={buildServe} tall />
        <Summary text={c.summary} />
        <Quiz id="ch10" quiz={c.quiz} />
        <LevelDesk />
        <ChapterGrowth id="ch10" growth={c.growth} />
      </StageCtx.Provider>
    </ChapterShell>
  ), [markClimax])
}
