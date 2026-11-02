import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useReducer, type ReactNode } from 'react'
import { load, remove, save } from '../lib/storage'

// PM 트랙 진행도. DE 트랙과 저장 키를 따로 써서 서로 영향을 주지 않는다. localStorage가 막혀도 메모리 상태로 동작.

interface Saved {
  v: 1
  answers: Record<string, string>
}
const KEY = 'pm-atoz:progress'
const EMPTY: Saved = { v: 1, answers: {} }

function sanitize(raw: unknown): Saved {
  if (!raw || typeof raw !== 'object' || (raw as Saved).v !== 1) return EMPTY
  const a = (raw as Saved).answers
  const answers: Record<string, string> = {}
  if (a && typeof a === 'object') for (const [k, v] of Object.entries(a)) if (typeof v === 'string') answers[k] = v
  return { v: 1, answers }
}

type Action = { type: 'load'; saved: Saved } | { type: 'answer'; id: string; option: string } | { type: 'reset' }

interface Api {
  answers: Record<string, string>
  answer: (id: string, option: string) => void
  reset: () => void
}
const Ctx = createContext<Api | null>(null)

export function PmProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: Saved, a: Action): Saved => {
    const next: Saved =
      a.type === 'load' ? a.saved : a.type === 'reset' ? EMPTY : s.answers[a.id] ? s : { v: 1, answers: { ...s.answers, [a.id]: a.option } }
    if (next !== s && a.type !== 'load') {
      if (a.type === 'reset') remove(KEY)
      else save(KEY, next)
    }
    return next
  }, EMPTY)
  useLayoutEffect(() => {
    const raw = load<unknown>(KEY, null)
    if (raw) dispatch({ type: 'load', saved: sanitize(raw) })
  }, [])
  const answer = useCallback((id: string, option: string) => dispatch({ type: 'answer', id, option }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const value = useMemo(() => ({ answers: state.answers, answer, reset }), [state.answers, answer, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePmProgress(): Api {
  const v = useContext(Ctx)
  if (!v) throw new Error('PmProgressProvider 밖에서 usePmProgress 사용')
  return v
}
