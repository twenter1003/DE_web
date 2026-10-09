import { useEffect, useRef, type ReactNode } from 'react'
import { LEVELS } from '../content/people'
import { tocOf } from '../content/toc'
import { UI } from '../content/ui'
import { CHAPTER_IDS, type ChapterId, type Opening } from '../content/types'
import { Rich } from '../lib/rich'
import { STAGES, stageVars } from '../lib/stages'
import { setActive } from '../state/active'
import { mountSoon } from '../state/mount'
import { useProgressActions } from '../state/progress'
import { Desk, type Board } from './Desk'
import { Bubble } from './people'
import { StageCtx } from './sketch'

/** 챕터 섹션: 스테이지 팔레트·선 정밀도를 내려주고, 앞 챕터와 텍스트 없는 그라디언트 띠로 이어 붙인다 */
export function ChapterShell({ id, children }: { id: ChapterId; children: ReactNode }) {
  const toc = tocOf(id)
  const stage = STAGES[toc.stage]
  const prev = toc.stage > 0 ? STAGES[toc.stage - 1] : null
  const ref = useRef<HTMLElement>(null)
  const { reach } = useProgressActions()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(id)
          reach(toc.stage)
          mountSoon(CHAPTER_IDS.indexOf(id) + 1)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [id, reach, toc.stage])

  return (
    <StageCtx.Provider value={stage}>
      {prev && (
        <div
          aria-hidden="true"
          className={prev.dark !== stage.dark ? 'h-[50svh]' : 'h-[20svh]'}
          style={{ background: `linear-gradient(${prev.bg}, ${stage.bg})` }}
        />
      )}
      <section id={id} ref={ref} aria-labelledby={`${id}-heading`} style={stageVars(stage) as React.CSSProperties} className="paper-grid text-ink">
        <div className="mx-auto max-w-[80rem] px-4 md:px-8 lg:pl-[calc(var(--rail-w)+2rem)]">{children}</div>
      </section>
    </StageCtx.Provider>
  )
}

interface OpeningProps {
  id: ChapterId
  opening: Opening
  visitors?: number
  csv?: boolean
  newbie?: boolean
  board?: Board
  mood?: Parameters<typeof Desk>[0]['mood']
}

/** 챕터 첫 화면: 번호·제목·규모 + 주니의 책상 + 오프닝 대사 */
export function ChapterOpening({ id, opening, visitors, csv, newbie, board, mood }: OpeningProps) {
  const toc = tocOf(id)
  const juniMood = mood ?? opening.lines.find((l) => l.who === 'juni')?.mood ?? 'focus'
  return (
    <div className="pb-[6svh] pt-[16svh]">
      <header className="max-w-[48rem]">
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
          <span>{toc.label}</span>
          <span>{toc.scale}</span>
          <span>
            주니 {UI.hud.level(toc.level, LEVELS[toc.level])}
          </span>
        </p>
        <h2 id={`${id}-heading`} className="mt-3 text-[2.5rem] font-extrabold leading-[1.12] tracking-[-0.02em] md:text-[4rem]">
          {toc.title}
        </h2>
        <p className="mt-3 text-xl text-muted md:text-2xl">{toc.topic}</p>
      </header>
      <div className="mt-10 grid items-center gap-8 md:mt-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12">
        <figure role="img" aria-label={opening.alt} className="max-w-[40rem]">
          <Desk level={toc.level} mood={juniMood} visitors={visitors} csv={csv} newbie={newbie} board={board} />
        </figure>
        <div className="space-y-4">
          {opening.lines.map((l, i) => (
            <Bubble key={i} line={l} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Summary({ text }: { text: string }) {
  return (
    <section className="py-[10svh]">
      <h3 className="font-mono text-sm text-muted">{UI.summary}</h3>
      <blockquote className="mt-3 max-w-[44rem] border-l-4 border-accent pl-5 text-[1.5rem] font-bold leading-snug md:text-[2rem]">
        <Rich text={text} />
      </blockquote>
    </section>
  )
}

/** 인터랙션 틀: 제목·안내 + 조작부 + 결과(aria-live) */
export function InteractionFrame({ title, hint, note, children }: { title: string; hint: string; note?: string; children: ReactNode }) {
  return (
    <section className="py-[8svh]">
      <div className="rounded-2xl border-[1.5px] border-edge bg-surface p-5 md:p-8">
        <p className="font-mono text-sm text-muted">{UI.interaction.label}</p>
        <h3 className="mt-1 text-[1.375rem] font-bold md:text-[1.625rem]">{title}</h3>
        <p className="mt-2 max-w-[44rem] text-muted">
          <Rich text={hint} />
        </p>
        <div className="mt-6">{children}</div>
        {note && <p className="mt-5 text-sm text-muted">{note}</p>}
      </div>
    </section>
  )
}
