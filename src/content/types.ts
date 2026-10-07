// 콘텐츠 타입. 문구는 전부 src/content/ 아래에 있고, 컴포넌트는 이 타입만 안다.

export const CHAPTER_IDS = [
  'prologue',
  'ch1',
  'ch2',
  'ch3',
  'ch4',
  'ch5',
  'ch6',
  'ch7',
  'ch8',
  'ch9',
  'ch10',
  'epilogue',
] as const
export type ChapterId = (typeof CHAPTER_IDS)[number]

/** 퀴즈가 있는(완료 처리되는) 챕터 */
export const QUIZ_CHAPTERS = CHAPTER_IDS.filter((id) => id !== 'epilogue')

export type Who = 'juni' | 'ceo' | 'seok' | 'taeo' | 'sora' | 'minjae' | 'daon' | 'ria' | 'saebom'
export type Mood = 'panic' | 'focus' | 'proud' | 'relaxed'

export interface Line {
  who: Who
  text: string
  mood?: Mood
}

export interface Step {
  /** 텍스트 블록(2~3문장). **강조**, `코드` 마크업 허용 */
  text: string
  /** 말풍선 0~2줄 */
  lines?: Line[]
  /** 이 step의 그림 설명. 모션 줄이기 모드의 정지 그림 캡션이자 스크린리더용 설명 */
  alt: string
}

export interface SceneText {
  /** 장면 제목(화면에 작게 표시) */
  title: string
  steps: Step[]
}

export interface QuizOption {
  id: string
  text: string
  correct?: boolean
  /** 이 보기를 골랐을 때(또는 해설 펼침) 보여줄 1~2문장 */
  feedback: string
}

export interface Quiz {
  question: string
  options: QuizOption[]
  /** 정답 확인 후 모두에게 보여줄 공통 해설 */
  explanation: string
}

export interface Opening {
  /** 오프닝 대사 2~4줄 */
  lines: Line[]
  /** 책상 그림 설명(스크린리더용) */
  alt: string
}

export interface Growth {
  /** 성장 연출에서 주니가 하는 한마디 */
  line: Line
  /** 맵 변화 설명 한 줄 */
  mapNote: string
}

export interface ChapterContent<S extends string = string, I = undefined> {
  id: ChapterId
  opening: Opening
  scenes: Record<S, SceneText>
  /** 챕터 전용 인터랙션 문구(형태는 챕터마다 다름) */
  interaction: I
  summary: string
  quiz: Quiz
  growth: Growth
}
