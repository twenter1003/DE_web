import { useSyncExternalStore } from 'react'
import type { ChapterId } from '../content/types'

// 지금 화면 가운데에 있는 챕터. 스크롤마다 바뀌므로 React 컨텍스트 대신 작은 외부 저장소로 둔다.

let active: ChapterId | 'hero' = 'hero'
const listeners = new Set<() => void>()

export function setActive(id: ChapterId | 'hero') {
  if (id === active) return
  active = id
  listeners.forEach((l) => l())
}

export function useActive() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => active,
  )
}
