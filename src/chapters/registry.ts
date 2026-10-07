import type { ComponentType } from 'react'
import type { ChapterId } from '../content/types'
import { Prologue } from './Prologue'

// 챕터 순서. 각 챕터는 src/chapters/<Id>/ 의 독립 컴포넌트.
export const CHAPTERS: { id: ChapterId; Component: ComponentType }[] = [{ id: 'prologue', Component: Prologue }]
