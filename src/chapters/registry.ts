import type { ComponentType } from 'react'
import type { ChapterId } from '../content/types'
import { Prologue } from './Prologue'
import { Ch01 } from './Ch01'
import { Ch02 } from './Ch02'

// 챕터 순서. 각 챕터는 src/chapters/<Id>/ 의 독립 컴포넌트.
export const CHAPTERS: { id: ChapterId; Component: ComponentType }[] = [
  { id: 'prologue', Component: Prologue },
  { id: 'ch1', Component: Ch01 },
  { id: 'ch2', Component: Ch02 },
]
