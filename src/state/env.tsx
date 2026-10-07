import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { load, save } from '../lib/storage'

// 화면 환경: 모션 줄이기(시스템 설정 + 페이지 토글)와 모바일 여부.
// 미디어 쿼리 분기는 gsap.matchMedia()로 처리한다.

export type MotionPref = 'system' | 'reduce' | 'full'

interface Env {
  /** 지금 모션을 줄여야 하는가 */
  reduced: boolean
  /** 시스템이 모션 줄이기를 요청했는가 */
  systemReduced: boolean
  pref: MotionPref
  setPref: (p: MotionPref) => void
  mobile: boolean
}

const PREF_KEY = 'de-atoz:motion'
const EnvCtx = createContext<Env | null>(null)

const initialMatch = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches

export function EnvProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(() => initialMatch('(prefers-reduced-motion: reduce)'))
  const [mobile, setMobile] = useState(() => initialMatch('(max-width: 767px)'))
  const [pref, setPrefState] = useState<MotionPref>(() => {
    const p = load<MotionPref>(PREF_KEY, 'system')
    return p === 'reduce' || p === 'full' ? p : 'system'
  })

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(
      { reduce: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' },
      (ctx) => {
        const c = ctx.conditions as { reduce: boolean; mobile: boolean }
        setSystemReduced(c.reduce)
        setMobile(c.mobile)
      },
    )
    return () => mm.revert()
  }, [])

  const setPref = useCallback((p: MotionPref) => {
    setPrefState(p)
    save(PREF_KEY, p)
  }, [])

  const reduced = pref === 'reduce' || (pref === 'system' && systemReduced)

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
    // 레이아웃이 바뀌었으니 트리거 위치를 다시 계산
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [reduced, mobile])

  const value = useMemo(() => ({ reduced, systemReduced, pref, setPref, mobile }), [reduced, systemReduced, pref, setPref, mobile])
  return <EnvCtx.Provider value={value}>{children}</EnvCtx.Provider>
}

export function useEnv(): Env {
  const v = useContext(EnvCtx)
  if (!v) throw new Error('EnvProvider 밖에서 useEnv 사용')
  return v
}
