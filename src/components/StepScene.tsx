import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
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
        <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
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

/**
 * 화면에 가까워졌는가(아래·위로 화면 높이의 1.5배 안). 한 번 가까워지면 계속 true.
 * 장면 그림(SVG 수백 요소)과 그 타임라인은 이때 만든다: 챕터를 마운트할 때 모든 장면 그림을 한꺼번에 그리고 배치하면
 * 느린 폰에서 메인 스레드가 1초 가까이 멈춘다. 그림 칸은 높이가 고정이라 늦게 그려도 레이아웃이 밀리지 않는다.
 */
function useNear(ref: RefObject<Element | null>) {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '150% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, near])
  return near
}

/**
 * 그림 칸이 설계 크기(440×480)보다 작은가. 태블릿에서는 글과 나란히 두느라 그림이 0.85~0.95배로 줄어 작은 라벨이 8~9px이 된다
 * → 모바일(index.css)처럼 작은 라벨을 키운다(--fs-lift, diagram.tsx fs()). 글자 폭을 재는 장면도 있어서
 * 그림을 그리기 전에 정하고, 창 크기가 바뀌어 값이 달라지면 타임라인을 다시 만든다.
 */
function useSmallFigure(ref: RefObject<HTMLElement | null>) {
  const [small, setSmall] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setSmall(el.clientWidth < 440 || el.clientHeight < 480)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return small
}
const LIFT = { '--fs-lift': '7px' } as CSSProperties

// GSAP은 요소의 transform을 처음 다룰 때 계산된 스타일(transform-origin 등)을 읽는데, SVG 요소에서는 이 읽기가 레이아웃을 강제한다.
// 첫 렌더에서 tween마다 '읽기 → 쓰기'가 번갈아 일어나면 대상 수만큼 레이아웃을 다시 계산한다(장면 하나에 수십 번, 느린 폰에서 수백 ms).
// 첫 렌더 전에 transform을 다룰 대상을 한꺼번에 읽어 GSAP 캐시에 넣어 두면 레이아웃은 한 번만 계산된다.
const TRANSFORM_KEYS = new Set(['x', 'y', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY', 'rotation', 'rotate', 'skewX', 'skewY', 'transformOrigin', 'svgOrigin', 'motionPath'])
function primeTransforms(tl: gsap.core.Timeline) {
  const els = new Set<Element>()
  for (const child of tl.getChildren(true, true, false)) {
    const { vars } = child as gsap.core.Tween
    const keys = [...Object.keys(vars), ...Object.keys((vars.startAt as object | undefined) ?? {})]
    if (keys.some((k) => TRANSFORM_KEYS.has(k))) for (const t of (child as gsap.core.Tween).targets()) if (t instanceof Element) els.add(t)
  }
  for (const el of els) gsap.getProperty(el, 'x')
}

function ScrubScene({ id, kind, scene, diagram, build, onStep, tall }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const diag = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const { mobile } = useEnv()
  const near = useNear(root)
  const small = useSmallFigure(diag)
  const n = scene.steps.length
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep

  useGSAP(
    (_ctx, contextSafe) => {
      if (!near || !diag.current || !list.current) return
      const q = gsap.utils.selector(diag.current) as Q
      const tl = gsap.timeline({ paused: true })
      build(q, tl, { mobile })
      padTo(tl, n)
      primeTransforms(tl)
      // 멈춘 타임라인은 시간 0을 그리지 않는다 → 시작 상태(tl.set(...,0))를 즉시 적용
      tl.time(1e-4).time(0)

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
    { scope: root, dependencies: [mobile, n, near, small], revertOnUpdate: true },
  )

  return (
    <section ref={root} id={id} className="relative flex flex-col md:grid md:grid-cols-[minmax(0,min(30rem,40%))_minmax(0,1fr)] lg:grid-cols-[minmax(0,min(30rem,45%))_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
      {/* 모바일: 위쪽 띠에 고정(HUD 아래), 옆 여백을 줄여 그림을 조금이라도 크게.
          그림 설명은 step마다 화면 밖 글자(StepBody)로 읽히므로 그림 자체는 낭독에서 뺀다 */}
      <div
        aria-hidden="true"
        className={`sticky top-0 z-10 -mx-4 border-b border-edge bg-bg px-2 pb-3 pt-[3.5rem] md:bg-transparent md:col-start-2 md:row-start-1 md:mx-0 md:h-svh md:self-start md:border-0 md:px-0 md:py-[7svh] ${
          tall ? 'h-[60svh]' : 'h-[56svh]'
        }`}
      >
        <div ref={diag} className="mx-auto h-full w-full max-w-[36rem]" style={small ? LIFT : undefined}>
          {near && diagram()}
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
  const near = useNear(ref)
  const small = useSmallFigure(ref)
  useGSAP(
    () => {
      if (!near || !ref.current) return
      const tl = gsap.timeline({ paused: true })
      build(gsap.utils.selector(ref.current) as Q, tl, { mobile })
      padTo(tl, n)
      primeTransforms(tl)
      tl.time(Math.min(i + 0.97, n))
    },
    { scope: ref, dependencies: [mobile, n, i, near, small], revertOnUpdate: true },
  )
  return (
    <div ref={ref} className="mx-auto h-full w-full max-w-[36rem]" style={small ? LIFT : undefined}>
      {near && diagram()}
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
    <section id={id}>
      <SceneHeader id={id} kind={kind} scene={scene} />
      <ol ref={list}>
        {scene.steps.map((s, i) => (
          <li
            key={i}
            data-step
            className="grid gap-6 border-t border-edge py-10 first:border-t-0 md:grid-cols-[minmax(0,min(30rem,40%))_minmax(0,1fr)] lg:grid-cols-[minmax(0,min(30rem,45%))_minmax(0,1fr)] md:gap-x-12 md:py-14 lg:gap-x-16"
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
