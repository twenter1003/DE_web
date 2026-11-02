import type { Line, Opening, Quiz, SceneText } from '../types'

// 직군 트랙(PM 등) 챕터 콘텐츠. DE 트랙의 ChapterContent와 달리 챕터 id가 자유 문자열이고,
// 레벨·역량·카드가 그 트랙 자체의 것이다. 스토리보드: docs/storyboard/pm/

/** PM 역량 6축 */
export const PM_AXES = ['problem', 'data', 'priority', 'experiment', 'execute', 'decide'] as const
export type PmAxis = (typeof PM_AXES)[number]
export const PM_AXIS_LABELS: Record<PmAxis, string> = {
  problem: '문제 정의',
  data: '지표·데이터',
  priority: '우선순위',
  experiment: '실험·검증',
  execute: '실행·협업',
  decide: '소통·의사결정',
}

export const PM_LEVELS = { 1: '신입 PM', 2: '주니어 PM', 3: '미드레벨 PM', 4: '시니어 직전', 5: '시니어 PM' } as const
export type PmLevel = keyof typeof PM_LEVELS

export interface TrackCard {
  letter: string
  term: string
  /** 사전식 한 줄 정의 */
  def: string
}

export interface TrackChapter<S extends string = string> {
  id: string
  label: string
  title: string
  topic: string
  scale: string
  level: PmLevel
  opening: Opening
  scenes: Record<S, SceneText>
  summary: string
  quiz: Quiz
  cards: TrackCard[]
  stats: Partial<Record<PmAxis, number>>
  growth: { line: Line; note?: string }
}
