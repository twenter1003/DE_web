import { useSyncExternalStore } from 'react'

// 챕터 지연 마운트. 첫 화면을 빠르게 그리려고 챕터는 독자가 다가갈 때 마운트한다.
// 규칙: 챕터 k를 마운트하면 그 앞 챕터도 모두 마운트한다 → 화면 위쪽 높이가 나중에 바뀌지 않는다.
// ?mount=all 이면(스크린샷·검증용) 처음부터 전부 마운트.

let upTo =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('mount') === 'all' ? Number.POSITIVE_INFINITY : -1
const listeners = new Set<() => void>()

export function ensureMounted(index: number) {
  if (index <= upTo) return
  upTo = index
  listeners.forEach((l) => l())
}

export const mountedUpTo = () => upTo

/**
 * 한가할 때 미리 마운트. 챕터 마운트는 무거운 동기 작업(수십~백여 ms)이라,
 * 스크롤이 자리에 닿을 때(IntersectionObserver) 하면 그 스크롤이 끊긴다. 지금 챕터에 들어서면 다음 챕터를 미리 그려 둔다.
 */
export function mountSoon(index: number) {
  if (index <= upTo || typeof window === 'undefined') return
  const run = () => ensureMounted(index)
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 300)
}

export function useMountedUpTo() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => upTo,
    () => -1,
  )
}

// 첫 사용자 동작(스크롤·키·터치) 또는 몇 초 뒤에야 지연 마운트를 시작한다(첫 화면 그리기를 막지 않게).
let armed = false
const armers = new Set<() => void>()
export function onArmed(fn: () => void) {
  if (armed) fn()
  else armers.add(fn)
  return () => armers.delete(fn)
}
function arm() {
  if (armed) return
  armed = true
  armers.forEach((f) => f())
  armers.clear()
  for (const ev of ['scroll', 'keydown', 'pointerdown', 'touchstart', 'wheel'] as const) removeEventListener(ev, arm)
}
if (typeof window !== 'undefined') {
  for (const ev of ['scroll', 'keydown', 'pointerdown', 'touchstart', 'wheel'] as const) addEventListener(ev, arm, { passive: true, once: true })
  setTimeout(arm, 4000)
  // 첫 챕터(프롤로그)는 첫 스크롤을 기다리지 않고 첫 화면을 다 그린 뒤 한가할 때 마운트
  const first = () => mountSoon(0)
  if (document.readyState === 'complete') first()
  else addEventListener('load', first, { once: true })
}
