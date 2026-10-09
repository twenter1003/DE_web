import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { refreshTriggers, scrollToY } from '../lib/refresh'
import { load, save } from '../lib/storage'

// 화면 환경: 모션 줄이기(시스템 설정 + 페이지 토글)와 모바일 여부.

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

// 첫 화면은 빌드 때 미리 그린 HTML을 이어받는다(main.tsx의 hydrateRoot). 이어받는 첫 렌더는 서버와 같은 값
// (모션 그대로·데스크톱·'시스템 따름')으로 그리고, 바로 다음 렌더에서 이 기기의 실제 값으로 바꾼다 → 세 값 모두 외부 저장소로 둔다.

const mqls = new Map<string, MediaQueryList>()
const mql = (q: string) => mqls.get(q) ?? mqls.set(q, window.matchMedia(q)).get(q)!

/** 미디어 쿼리 값을 따라가는 상태 */
function useMedia(q: string) {
  const subscribe = useCallback(
    (on: () => void) => {
      const m = mql(q)
      m.addEventListener('change', on)
      return () => m.removeEventListener('change', on)
    },
    [q],
  )
  return useSyncExternalStore(subscribe, () => mql(q).matches, () => false)
}

/** 페이지 토글 값(localStorage). 처음 읽을 때 한 번만 저장소에서 가져온다 */
let prefNow: MotionPref | null = null
const prefListeners = new Set<() => void>()
function readPref(): MotionPref {
  if (prefNow === null) {
    const p = load<MotionPref>(PREF_KEY, 'system')
    prefNow = p === 'reduce' || p === 'full' ? p : 'system'
  }
  return prefNow
}
function writePref(p: MotionPref) {
  prefNow = p
  save(PREF_KEY, p)
  prefListeners.forEach((l) => l())
}
function subscribePref(l: () => void) {
  prefListeners.add(l)
  return () => void prefListeners.delete(l)
}

// 모션 모드를 바꾸면 장면이 스크롤 장면 ↔ 정지 그림으로 통째로 바뀌어 높이가 달라진다.
// 바꾸기 직전에 화면 가운데 있던 step(장면 id + 순번 + 그 안의 비율)을 기억했다가, 바뀐 뒤 같은 자리로 돌아간다.
type Anchor = { scene: string; i: number; f: number } | { el: Element; top: number }

function captureAnchor(): Anchor | null {
  const y = innerHeight / 2
  for (const li of document.querySelectorAll<HTMLElement>('section[id] li[data-step]')) {
    const r = li.getBoundingClientRect()
    if (r.top <= y && r.bottom > y) {
      const scene = li.closest('section[id]')!
      return { scene: scene.id, i: [...scene.querySelectorAll('li[data-step]')].indexOf(li), f: (y - r.top) / r.height }
    }
  }
  const el = document.elementFromPoint(innerWidth / 2, y)
  return el ? { el, top: el.getBoundingClientRect().top } : null
}

function restoreAnchor(a: Anchor) {
  let dy = 0
  if ('scene' in a) {
    const li = document.getElementById(a.scene)?.querySelectorAll<HTMLElement>('li[data-step]')[a.i]
    if (!li) return
    const r = li.getBoundingClientRect()
    dy = r.top + a.f * r.height - innerHeight / 2
  } else if (a.el.isConnected) dy = a.el.getBoundingClientRect().top - a.top
  if (dy) scrollToY(scrollY + dy)
}

export function EnvProvider({ children }: { children: ReactNode }) {
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)')
  const mobile = useMedia('(max-width: 767px)')
  const pref = useSyncExternalStore(subscribePref, readPref, () => 'system' as const)
  const anchor = useRef<Anchor | null>(null)

  const reduced = pref === 'reduce' || (pref === 'system' && systemReduced)

  const setPref = useCallback(
    (p: MotionPref) => {
      if ((p === 'reduce' || (p === 'system' && systemReduced)) !== reduced) anchor.current = captureAnchor()
      writePref(p)
    },
    [reduced, systemReduced],
  )

  // 자식(장면)들이 새 모드로 그려진 뒤, 칠해지기 전에 제자리로
  useLayoutEffect(() => {
    if (anchor.current) restoreAnchor(anchor.current)
    anchor.current = null
  }, [reduced])

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full'
    // 레이아웃이 바뀌었으니 트리거 위치를 다시 계산
    const id = requestAnimationFrame(() => refreshTriggers())
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
