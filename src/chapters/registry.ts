import { lazy, type ComponentType } from 'react'
import type { ChapterId } from '../content/types'

// 챕터 순서. 각 챕터는 src/chapters/<Id>/ 의 독립 컴포넌트이고, 따로 내려받는다(코드 분할).
// steps: 그 챕터의 scrub step 수 — 마운트 전 자리 높이를 어림하는 데만 쓴다.
export const CHAPTERS: { id: ChapterId; steps: number; Component: ComponentType }[] = [
  { id: 'prologue', steps: 17, Component: lazy(() => import('./Prologue').then((m) => ({ default: m.Prologue }))) },
  { id: 'ch1', steps: 19, Component: lazy(() => import('./Ch01').then((m) => ({ default: m.Ch01 }))) },
  { id: 'ch2', steps: 18, Component: lazy(() => import('./Ch02').then((m) => ({ default: m.Ch02 }))) },
  { id: 'ch3', steps: 18, Component: lazy(() => import('./Ch03').then((m) => ({ default: m.Ch03 }))) },
  { id: 'ch4', steps: 18, Component: lazy(() => import('./Ch04').then((m) => ({ default: m.Ch04 }))) },
  { id: 'ch5', steps: 16, Component: lazy(() => import('./Ch05').then((m) => ({ default: m.Ch05 }))) },
  { id: 'ch6', steps: 17, Component: lazy(() => import('./Ch06').then((m) => ({ default: m.Ch06 }))) },
  { id: 'ch7', steps: 18, Component: lazy(() => import('./Ch07').then((m) => ({ default: m.Ch07 }))) },
  { id: 'ch8', steps: 17, Component: lazy(() => import('./Ch08').then((m) => ({ default: m.Ch08 }))) },
  { id: 'ch9', steps: 17, Component: lazy(() => import('./Ch09').then((m) => ({ default: m.Ch09 }))) },
  { id: 'ch10', steps: 20, Component: lazy(() => import('./Ch10').then((m) => ({ default: m.Ch10 }))) },
  { id: 'epilogue', steps: 14, Component: lazy(() => import('./Epilogue').then((m) => ({ default: m.Epilogue }))) },
]
