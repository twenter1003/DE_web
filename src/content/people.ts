import type { ChapterId, Who } from './types'

// 등장인물
export const PEOPLE: Record<Who, { name: string; role: string }> = {
  juni: { name: '주니', role: '데이터 엔지니어' },
  ceo: { name: '윤 대표', role: '바구니 대표' },
  seok: { name: '석 리드', role: '개발 리드' },
  taeo: { name: '태오', role: '앱 개발자' },
  sora: { name: '소라', role: '마케터' },
  minjae: { name: '민재', role: '재무 담당' },
  daon: { name: '다온', role: '데이터 분석가' },
  ria: { name: '리아', role: 'ML 엔지니어' },
  saebom: { name: '새봄', role: '새로 온 신입' },
}

// 레벨
export const LEVELS = {
  1: '신입',
  2: '주니어',
  3: '미드레벨',
  4: '시니어 직전',
  5: '시니어',
} as const
export type Level = keyof typeof LEVELS

// 역량 축
export const STAT_KEYS = ['sql', 'pipeline', 'scale', 'ops', 'design', 'lead'] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_LABELS: Record<StatKey, string> = {
  sql: 'SQL·모델링',
  pipeline: '파이프라인·자동화',
  scale: '대규모 처리',
  ops: '품질·운영',
  design: '설계·판단',
  lead: '소통·리딩',
}

// 챕터를 마치면 더해지는 역량 (스토리 바이블 0-5)
export const STAT_DELTAS: Record<ChapterId, Partial<Record<StatKey, number>>> = {
  prologue: { sql: 5, design: 3, lead: 2 },
  ch1: { sql: 20, design: 3, lead: 2 },
  ch2: { sql: 5, pipeline: 20, ops: 5, design: 3, lead: 2 },
  ch3: { pipeline: 20, ops: 10, design: 5, lead: 2 },
  ch4: { sql: 20, pipeline: 5, ops: 5, design: 10, lead: 8 },
  ch5: { sql: 5, pipeline: 5, scale: 30, design: 8, lead: 2 },
  ch6: { pipeline: 10, scale: 25, ops: 5, design: 8, lead: 3 },
  ch7: { sql: 5, pipeline: 5, ops: 30, design: 8, lead: 10 },
  ch8: { sql: 5, pipeline: 5, scale: 10, ops: 5, design: 15, lead: 5 },
  ch9: { sql: 5, ops: 10, design: 15, lead: 15 },
  ch10: { design: 20, lead: 35 },
  epilogue: {},
}
