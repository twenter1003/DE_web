import { Suspense, useEffect, useRef, type ComponentType } from 'react'
import { tocOf } from '../content/toc'
import type { ChapterId } from '../content/types'
import { refreshTriggers } from '../lib/refresh'
import { STAGES, stageVars } from '../lib/stages'
import { ensureMounted, onArmed, useMountedUpTo } from '../state/mount'

/** 아직 마운트하지 않은 챕터 자리. 같은 id를 가져서 앵커·내비게이션이 그대로 동작한다 */
function Placeholder({ id, index, steps }: { id: ChapterId; index: number; steps: number }) {
  const ref = useRef<HTMLElement>(null)
  const toc = tocOf(id)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let io: IntersectionObserver | undefined
    const off = onArmed(() => {
      io = new IntersectionObserver(([e]) => e.isIntersecting && ensureMounted(index), { rootMargin: '0px 0px 150% 0px' })
      io.observe(el)
    })
    return () => {
      off()
      io?.disconnect()
    }
  }, [index])
  return (
    <section
      ref={ref}
      id={id}
      data-placeholder=""
      aria-labelledby={`${id}-heading`}
      className="paper-grid text-ink"
      style={{ ...(stageVars(STAGES[toc.stage]) as React.CSSProperties), minHeight: `${(steps * 1.2 + 1.5) * 100}svh` }}
    >
      <div className="mx-auto max-w-[80rem] px-4 pt-[16svh] md:px-8 lg:pl-[calc(var(--rail-w)+2rem)]">
        <p className="font-mono text-sm text-muted">{toc.label}</p>
        <h2 id={`${id}-heading`} className="mt-3 text-[2.5rem] font-extrabold leading-[1.12] md:text-[4rem]">
          {toc.title}
        </h2>
      </div>
    </section>
  )
}

/** 실제 챕터가 그려지면 트리거 위치를 다시 계산(아래쪽 내용이 밀리므로) */
function Ready({ Component }: { Component: ComponentType }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => refreshTriggers())
    return () => cancelAnimationFrame(id)
  }, [])
  return <Component />
}

export function DeferredChapter({ id, index, steps, Component }: { id: ChapterId; index: number; steps: number; Component: ComponentType }) {
  const upTo = useMountedUpTo()
  const placeholder = <Placeholder id={id} index={index} steps={steps} />
  if (index > upTo) return placeholder
  return (
    <Suspense fallback={placeholder}>
      <Ready Component={Component} />
    </Suspense>
  )
}
