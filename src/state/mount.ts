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

export function useMountedUpTo() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => upTo,
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
}
