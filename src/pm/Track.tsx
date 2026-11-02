import { useId, type ReactNode } from 'react'
import type { Level } from '../content/people'
import { PEOPLE } from '../content/people'
import { PM_AXES, PM_AXIS_LABELS, PM_LEVELS, type TrackChapter } from '../content/pm/types'
import { Bubble } from '../components/people'
import { RLine, RPath, RRect, StageCtx } from '../components/sketch'
import { STAGES, stageVars } from '../lib/stages'
import { Rich } from '../lib/rich'

// 직군 트랙 공통 부품: 장(섹션) 틀, 오프닝, 성장 연출. DE 트랙의 ChapterShell/ChapterOpening/ChapterGrowth에 해당하지만
// 주니·DE 목차에 묶이지 않는다.

const STAGE = STAGES[2]

export function TrackShell({ id, children }: { id: string; children: ReactNode }) {
  return (
    <StageCtx.Provider value={STAGE}>
      <section id={id} aria-labelledby={`${id}-heading`} style={stageVars(STAGE) as React.CSSProperties} className="paper-grid text-ink">
        <div className="mx-auto max-w-[80rem] px-4 md:px-8">{children}</div>
      </section>
    </StageCtx.Provider>
  )
}

/** 지후의 책상(Lv1): 노트북, 머그컵, 포스트잇, 작은 화이트보드 */
function PmDesk({ postits = ['경영 대시보드', '주간 보고', '광고', '정산'] }: { postits?: string[] }) {
  const colors = ['#F2D96B', '#9CCBE8', '#EDA5B8', '#A9D9A0']
  return (
    <svg viewBox="0 0 400 260" className="diagram h-auto w-full" aria-hidden="true">
      {/* 화이트보드 */}
      <RRect x={282} y={24} w={100} h={80} seed="pm-board" rough={0.5} fill="var(--surface)" />
      <RLine x1={296} y1={50} x2={366} y2={50} seed="pm-board-l1" rough={0.4} strokeWidth={1} dash="3 5" />
      {/* 책상 */}
      <RLine x1={16} y1={196} x2={384} y2={196} seed="pm-desk" rough={0.5} />
      {/* 노트북 */}
      <RRect x={56} y={118} w={104} h={66} seed="pm-laptop" rough={0.5} fill="var(--surface)" />
      <RPath d="M44 196 L176 196 L168 184 L52 184 Z" seed="pm-laptop-base" rough={0.5} fill="var(--surface)" />
      <text x={108} y={158} textAnchor="middle" className="t-sans t-muted" style={{ fontSize: 11 }}>
        매출 ?
      </text>
      {/* 머그컵 */}
      <RRect x={196} y={166} w={26} h={30} seed="pm-mug" rough={0.5} fill="var(--surface)" />
      <RPath d="M222 172 C 236 172, 236 190, 222 190" seed="pm-mug-handle" rough={0.5} />
      {/* 포스트잇 */}
      {postits.slice(0, 4).map((p, i) => (
        <g key={p}>
          <rect x={22 + i * 62} y={40 + (i % 2) * 8} width={54} height={46} rx={2} style={{ fill: colors[i] }} opacity={0.85} />
          <text x={22 + i * 62 + 27} y={66 + (i % 2) * 8} textAnchor="middle" className="t-sans" style={{ fontSize: 10, fontWeight: 700, fill: '#20252B' }}>
            {p.length > 5 ? [p.slice(0, 3), p.slice(3)].map((t, k) => <tspan key={k} x={22 + i * 62 + 27} dy={k ? 12 : -4}>{t}</tspan>) : p}
          </text>
        </g>
      ))}
      <text x={290} y={230} textAnchor="middle" className="t-sans t-muted" style={{ fontSize: 12 }}>
        지후 · PM · 입사 5일째
      </text>
    </svg>
  )
}

export function TrackOpening({ chapter }: { chapter: TrackChapter }) {
  return (
    <div className="pb-[6svh] pt-[16svh]">
      <header className="max-w-[48rem]">
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
          <span>{chapter.label}</span>
          <span>{chapter.scale}</span>
          <span>
            지후 Lv{chapter.level} {PM_LEVELS[chapter.level]}
          </span>
        </p>
        <h2 id={`${chapter.id}-heading`} className="mt-3 text-[2.5rem] font-extrabold leading-[1.12] tracking-[-0.02em] md:text-[4rem]">
          {chapter.title}
        </h2>
        <p className="mt-3 text-xl text-muted md:text-2xl">{chapter.topic}</p>
      </header>
      <div className="mt-10 grid items-center gap-8 md:mt-14 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12">
        <figure role="img" aria-label={chapter.opening.alt} className="max-w-[40rem]">
          <PmDesk />
        </figure>
        <div className="space-y-4">
          {chapter.opening.lines.map((l, i) => (
            <Bubble key={i} line={l} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** 성장 연출: 새로 얻은 카드, PM 역량 6축 변화, 지후의 한마디. 자동 재생 없이 정지 상태로 보여 준다 */
export function TrackGrowth({ chapter }: { chapter: TrackChapter }) {
  const heading = useId()
  const name = PEOPLE[chapter.growth.line.who].name
  return (
    <section aria-labelledby={heading} className="py-[8svh]">
      <h3 id={heading} className="font-mono text-sm text-muted">
        성장
      </h3>
      <div className="mt-4 grid max-w-[60rem] gap-8 md:grid-cols-2">
        <div>
          <p className="font-bold">새로 얻은 카드</p>
          <ul className="mt-3 space-y-3">
            {chapter.cards.map((c) => (
              <li key={c.letter} className="flex gap-4 rounded-xl border-[1.5px] border-edge bg-surface p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink font-mono text-2xl font-extrabold" aria-hidden="true">
                  {c.letter}
                </span>
                <span>
                  <span className="block font-bold">{c.term}</span>
                  <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">{c.def}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold">
            역량 변화 <span className="font-mono text-sm font-normal text-muted">Lv{chapter.level} {PM_LEVELS[chapter.level]}</span>
          </p>
          <ul className="mt-3 space-y-2">
            {PM_AXES.map((k) => {
              const d = chapter.stats[k] ?? 0
              return (
                <li key={k} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                  <span>{PM_AXIS_LABELS[k]}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-[var(--edge)]" aria-hidden="true">
                    <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, d * 2.5)}%` }} />
                  </span>
                  <span className="text-right font-mono">{d ? `+${d}` : '—'}</span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-sm text-muted">레이더는 학습을 돕는 장치예요. 실제 역량 평가가 아니에요.</p>
        </div>
      </div>
      <div className="mt-8 max-w-[34rem]">
        <p className="sr-only">{name}의 한마디</p>
        <Bubble line={chapter.growth.line} />
        {chapter.growth.note && <p className="mt-3 text-sm text-muted"><Rich text={chapter.growth.note} /></p>}
      </div>
    </section>
  )
}

export type { Level }
