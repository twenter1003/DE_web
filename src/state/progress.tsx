import { createContext, useCallback, useContext, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { CHAPTER_IDS, QUIZ_CHAPTERS, type ChapterId } from '../content/types'
import type { Level, StatKey } from '../content/people'
import { load, remove, save } from '../lib/storage'
import { levelOf, ownedLetters, statsOf } from './derive'

// 학습 진행도. localStorage에 저장하되, 실패해도 메모리 상태로 동작한다.

interface Saved {
  v: 1
  completed: ChapterId[]
  answers: Partial<Record<ChapterId, string>>
  climax: boolean
  /** 가장 멀리 도달한 스테이지 */
  furthest: number
}

const KEY = 'de-atoz:progress'
const EMPTY: Saved = { v: 1, completed: [], answers: {}, climax: false, furthest: 0 }

/** 저장된 값이 깨졌거나 다른 버전이어도 안전하게 읽는다 */
function sanitize(raw: unknown): Saved {
  if (!raw || typeof raw !== 'object' || (raw as Saved).v !== 1) return EMPTY
  const r = raw as Partial<Saved>
  const ids = new Set<string>(CHAPTER_IDS)
  const completed = Array.isArray(r.completed) ? r.completed.filter((c): c is ChapterId => ids.has(c)) : []
  const answers: Saved['answers'] = {}
  if (r.answers && typeof r.answers === 'object')
    for (const [k, v] of Object.entries(r.answers)) if (ids.has(k) && typeof v === 'string') answers[k as ChapterId] = v
  const furthest = typeof r.furthest === 'number' && r.furthest >= 0 && r.furthest <= 11 ? Math.floor(r.furthest) : 0
  return { v: 1, completed: [...new Set(completed)], answers, climax: r.climax === true, furthest }
}

type Action =
  | { type: 'answer'; id: ChapterId; option: string }
  | { type: 'climax' }
  | { type: 'reach'; stage: number }
  | { type: 'reset' }

function reducer(s: Saved, a: Action): Saved {
  switch (a.type) {
    case 'answer':
      if (s.answers[a.id]) return s
      return { ...s, answers: { ...s.answers, [a.id]: a.option }, completed: s.completed.includes(a.id) ? s.completed : [...s.completed, a.id] }
    case 'climax':
      return s.climax ? s : { ...s, climax: true }
    case 'reach':
      return a.stage > s.furthest ? { ...s, furthest: a.stage } : s
    case 'reset':
      return EMPTY
  }
}

interface ProgressApi {
  completed: ReadonlySet<ChapterId>
  answers: Saved['answers']
  climax: boolean
  furthest: number
  level: Level
  stats: Record<StatKey, number>
  cards: Set<string>
  /** 완료한 퀴즈 챕터 비율 0~1 */
  ratio: number
  /** 이번 방문에서 방금 완료한 챕터인가(성장 연출 자동 재생용) */
  isFresh: (id: ChapterId) => boolean
  answer: (id: ChapterId, option: string) => void
  markClimax: () => void
  reach: (stage: number) => void
  reset: () => void
}

type ProgressActions = Pick<ProgressApi, 'answer' | 'markClimax' | 'reach' | 'reset'>

const Ctx = createContext<ProgressApi | null>(null)
// 동작만 쓰는 곳(ChapterShell 등)은 진행도가 바뀔 때마다 다시 그려지지 않게 따로 내려준다
const ActionsCtx = createContext<ProgressActions | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    (s: Saved, a: Action) => {
      const next = reducer(s, a)
      if (next !== s) {
        if (a.type === 'reset') remove(KEY)
        else save(KEY, next)
      }
      return next
    },
    undefined,
    () => sanitize(load<unknown>(KEY, EMPTY)),
  )
  const fresh = useRef(new Set<ChapterId>())

  const answer = useCallback((id: ChapterId, option: string) => {
    fresh.current.add(id)
    dispatch({ type: 'answer', id, option })
  }, [])
  const markClimax = useCallback(() => dispatch({ type: 'climax' }), [])
  const reach = useCallback((stage: number) => dispatch({ type: 'reach', stage }), [])
  const reset = useCallback(() => {
    fresh.current.clear()
    dispatch({ type: 'reset' })
  }, [])
  const isFresh = useCallback((id: ChapterId) => fresh.current.has(id), [])

  const value = useMemo<ProgressApi>(() => {
    const completed = new Set(state.completed)
    return {
      completed,
      answers: state.answers,
      climax: state.climax,
      furthest: state.furthest,
      level: levelOf(completed, state.climax),
      stats: statsOf(completed),
      cards: ownedLetters(completed),
      ratio: QUIZ_CHAPTERS.filter((c) => completed.has(c)).length / QUIZ_CHAPTERS.length,
      isFresh,
      answer,
      markClimax,
      reach,
      reset,
    }
  }, [state, isFresh, answer, markClimax, reach, reset])
  const actions = useMemo<ProgressActions>(() => ({ answer, markClimax, reach, reset }), [answer, markClimax, reach, reset])

  return (
    <ActionsCtx.Provider value={actions}>
      <Ctx.Provider value={value}>{children}</Ctx.Provider>
    </ActionsCtx.Provider>
  )
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx)
  if (!v) throw new Error('ProgressProvider 밖에서 useProgress 사용')
  return v
}

/** 진행도 값 없이 동작만. 진행도가 바뀌어도 다시 그려지지 않는다 */
export function useProgressActions(): ProgressActions {
  const v = useContext(ActionsCtx)
  if (!v) throw new Error('ProgressProvider 밖에서 useProgressActions 사용')
  return v
}
