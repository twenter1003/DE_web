import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { Rich } from '../lib/rich'
import { UI } from '../content/ui'
import type { SceneText, Step } from '../content/types'
import { useEnv } from '../state/env'
import { Bubble } from './people'

// ── 모션 문법 ────────────────────────────────────────────────
// 장면 = sticky 다이어그램 + 스크롤되는 step 텍스트 + 타임라인 하나.
// step i의 전환은 타임라인 시간 [i, i+1) 안에 넣고, i + 0.9 전에 끝낸다.
// scrub 모드: 가운데 기준선이 step i 블록을 지나는 비율 = 타임라인 시간 i + 비율.
// 정지 모드(모션 줄이기): step마다 다이어그램을 하나씩 그리고 그 step의 끝 상태에 멈춘다.

export type Q = (sel: string) => Element[]
export interface SceneEnv {
  mobile: boolean
}
export type SceneBuild = (q: Q, tl: gsap.core.Timeline, env: SceneEnv) => void
export type SceneKind = keyof typeof UI.sceneKinds

/** step i 전환의 시작 시각 */
export const at = (i: number, offset = 0.08) => i + offset
/** 한 step 전환의 기본 길이 */
export const DUR = 0.72

interface Props {
  id: string
  kind: SceneKind
  scene: SceneText
  /** 다이어그램을 그리는 함수. 정지 모드에서는 step 수만큼 호출된다 */
  diagram: () => ReactNode
  build: SceneBuild
  /** step에 들어설 때(클라이맥스 처리 등) */
  onStep?: (i: number) => void
  /** 다이어그램 영역 높이 비율 조정(표처럼 세로로 긴 그림) */
  tall?: boolean
}

export function StepScene(props: Props) {
  const { reduced } = useEnv()
  return reduced ? <StaticScene {...props} /> : <ScrubScene {...props} />
}

function SceneHeader({ id, kind, scene }: Pick<Props, 'id' | 'kind' | 'scene'>) {
  return (
    <header className="pb-2 pt-[12svh] md:pt-[18svh]">
      <p className="font-mono text-sm text-muted">{UI.sceneKinds[kind]}</p>
      <h3 id={`${id}-title`} className="mt-1 text-[1.375rem] font-bold leading-snug md:text-[1.625rem]">
        {scene.title}
      </h3>
    </header>
  )
}

function StepBody({ step, i, n, srAlt = true }: { step: Step; i: number; n: number; srAlt?: boolean }) {
  return (
    <div className="max-w-[34rem]">
      <p className="mb-2 font-mono text-xs text-muted" aria-hidden="true">
        {i + 1}/{n}
      </p>
      <p className="text-[1.0625rem] leading-[1.85] md:text-[1.1875rem]">
        <Rich text={step.text} />
      </p>
      {step.lines?.length ? (
        <div className="mt-5 space-y-3">
          {step.lines.map((l, k) => (
            <Bubble key={k} line={l} />
          ))}
        </div>
      ) : null}
      {srAlt && (
        <p className="sr-only">
          {UI.figure}: {step.alt}
        </p>
      )}
    </div>
  )
}

const padTo = (tl: gsap.core.Timeline, n: number) => {
  if (tl.duration() < n) tl.set({}, {}, n)
}

function ScrubScene({ id, kind, scene, diagram, build, onStep, tall }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const diag = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const { mobile } = useEnv()
  const n = scene.steps.length
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep

  useGSAP(
    (_ctx, contextSafe) => {
      if (!diag.current || !list.current) return
      const q = gsap.utils.selector(diag.current) as Q
      const tl = gsap.timeline({ paused: true })
      build(q, tl, { mobile })
      padTo(tl, n)

      const items = Array.from(list.current.querySelectorAll<HTMLElement>('[data-step]'))
      const anchor = mobile ? 0.74 : 0.5
      let last = -1
      const update = contextSafe!(() => {
        const y = window.innerHeight * anchor
        let t = 0
        let idx = 0
        for (let i = 0; i < items.length; i++) {
          const r = items[i].getBoundingClientRect()
          if (y >= r.bottom) {
            t = i + 1
            idx = i
            continue
          }
          if (y >= r.top) {
            t = i + (y - r.top) / r.height
            idx = i
          }
          break
        }
        gsap.to(tl, { time: Math.min(Math.max(t, 0), n), duration: 0.45, ease: 'power1.out', overwrite: true })
        if (idx !== last && t > 0) {
          last = idx
          onStepRef.current?.(idx)
        }
      })
      ScrollTrigger.create({
        trigger: list.current,
        start: `top ${anchor * 100}%`,
        end: `bottom ${anchor * 100}%`,
        onUpdate: update,
        onRefresh: update,
        onLeave: update,
        onLeaveBack: update,
      })
    },
    { scope: root, dependencies: [mobile, n], revertOnUpdate: true },
  )

  return (
    <section ref={root} id={id} aria-labelledby={`${id}-title`} className="relative flex flex-col md:grid md:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
      <div
        className={`sticky top-0 z-10 -mx-4 border-b border-edge bg-bg px-4 pb-3 pt-[3.75rem] md:bg-transparent md:col-start-2 md:row-start-1 md:mx-0 md:h-svh md:self-start md:border-0 md:px-0 md:py-[7svh] ${
          tall ? 'h-[60svh]' : 'h-[56svh]'
        }`}
      >
        <div ref={diag} role="img" aria-label={scene.title} className="mx-auto h-full w-full max-w-[36rem]">
          {diagram()}
        </div>
      </div>
      <div className="md:col-start-1 md:row-start-1">
        <SceneHeader id={id} kind={kind} scene={scene} />
        <ol ref={list} className="pb-[44svh] md:pb-[40svh]">
          {scene.steps.map((s, i) => (
            <li key={i} data-step className="flex min-h-[78svh] items-start pt-[4svh] md:min-h-[82svh] md:items-center md:pt-0">
              <StepBody step={s} i={i} n={n} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Snapshot({ diagram, build, n, i }: { diagram: () => ReactNode; build: SceneBuild; n: number; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { mobile } = useEnv()
  useGSAP(
    () => {
      if (!ref.current) return
      const tl = gsap.timeline({ paused: true })
      build(gsap.utils.selector(ref.current) as Q, tl, { mobile })
      padTo(tl, n)
      tl.time(Math.min(i + 0.97, n))
    },
    { scope: ref, dependencies: [mobile, n, i], revertOnUpdate: true },
  )
  return (
    <div ref={ref} className="mx-auto h-full w-full max-w-[36rem]">
      {diagram()}
    </div>
  )
}

function StaticScene({ id, kind, scene, diagram, build, onStep, tall }: Props) {
  const n = scene.steps.length
  const list = useRef<HTMLOListElement>(null)
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep

  useEffect(() => {
    if (!list.current) return
    const items = Array.from(list.current.querySelectorAll<HTMLElement>('[data-step]'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onStepRef.current?.(items.indexOf(e.target as HTMLElement))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [n])

  return (
    <section id={id} aria-labelledby={`${id}-title`}>
      <SceneHeader id={id} kind={kind} scene={scene} />
      <ol ref={list}>
        {scene.steps.map((s, i) => (
          <li
            key={i}
            data-step
            className="grid gap-6 border-t border-edge py-10 first:border-t-0 md:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] md:gap-x-12 md:py-14 lg:gap-x-16"
          >
            <figure className={`md:order-2 ${tall ? 'h-[52svh] md:h-[66svh]' : 'h-[42svh] md:h-[56svh]'}`} role="img" aria-label={s.alt}>
              <Snapshot diagram={diagram} build={build} n={n} i={i} />
            </figure>
            <div className="self-center md:order-1">
              <StepBody step={s} i={i} n={n} srAlt={false} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
