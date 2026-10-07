import type { ComponentType } from 'react'
import type { ChapterId } from '../content/types'
import { Prologue } from './Prologue'
import { Ch01 } from './Ch01'
import { Ch02 } from './Ch02'
import { Ch03 } from './Ch03'
import { Ch04 } from './Ch04'
import { Ch05 } from './Ch05'
import { Ch06 } from './Ch06'
import { Ch07 } from './Ch07'
import { Ch08 } from './Ch08'
import { Ch09 } from './Ch09'
import { Ch10 } from './Ch10'
import { Epilogue } from './Epilogue'

// 챕터 순서. 각 챕터는 src/chapters/<Id>/ 의 독립 컴포넌트.
export const CHAPTERS: { id: ChapterId; Component: ComponentType }[] = [
  { id: 'prologue', Component: Prologue },
  { id: 'ch1', Component: Ch01 },
  { id: 'ch2', Component: Ch02 },
  { id: 'ch3', Component: Ch03 },
  { id: 'ch4', Component: Ch04 },
  { id: 'ch5', Component: Ch05 },
  { id: 'ch6', Component: Ch06 },
  { id: 'ch7', Component: Ch07 },
  { id: 'ch8', Component: Ch08 },
  { id: 'ch9', Component: Ch09 },
  { id: 'ch10', Component: Ch10 },
  { id: 'epilogue', Component: Epilogue },
]
