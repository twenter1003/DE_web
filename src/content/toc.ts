import type { ChapterId } from './types'

export interface TocEntry {
  id: ChapterId
  /** 스테이지 번호(팔레트·선 정밀도) */
  stage: number
  label: string
  /** 레일에 표시할 짧은 표기 */
  short: string
  title: string
  topic: string
  scale: string
  /** 이 챕터에서 주니의 레벨(시작 기준) */
  level: 1 | 2 | 3 | 4 | 5
  /** 이 챕터에서 승급하면 오르는 레벨 */
  promotesTo?: 2 | 3 | 4 | 5
}

export const TOC: TocEntry[] = [
  { id: 'prologue', stage: 0, label: 'Prologue', short: 'P', title: '데이터는 어디서 오는가', topic: '이벤트 로그와 트랜잭션, 데이터의 형태', scale: '사용자 100명', level: 1 },
  { id: 'ch1', stage: 1, label: 'Ch1', short: '1', title: '“어제 몇 개 팔렸어요?”', topic: 'SQL과 데이터베이스', scale: '사용자 100명', level: 1 },
  { id: 'ch2', stage: 2, label: 'Ch2', short: '2', title: '첫 파이프라인', topic: 'ETL과 배치', scale: '사용자 100명', level: 1, promotesTo: 2 },
  { id: 'ch3', stage: 3, label: 'Ch3', short: '3', title: '새벽 3시의 장애', topic: '자동화와 오케스트레이션', scale: '사용자 1만 명', level: 2 },
  { id: 'ch4', stage: 4, label: 'Ch4', short: '4', title: '매출이 두 개예요', topic: '웨어하우스와 데이터 모델링', scale: '사용자 1만 명', level: 2, promotesTo: 3 },
  { id: 'ch5', stage: 5, label: 'Ch5', short: '5', title: '데이터가 노트북에 안 들어가요', topic: '빅데이터와 분산 처리', scale: '사용자 100만 명', level: 3 },
  { id: 'ch6', stage: 6, label: 'Ch6', short: '6', title: '지금 이 순간', topic: '스트리밍', scale: '사용자 100만 명', level: 3 },
  { id: 'ch7', stage: 7, label: 'Ch7', short: '7', title: '월요일 아침, 매출이 0원', topic: '데이터 품질과 운영', scale: '사용자 100만 명', level: 3, promotesTo: 4 },
  { id: 'ch8', stage: 8, label: 'Ch8', short: '8', title: '호수와 창고를 합치다', topic: '레이크하우스', scale: '사용자 1,000만 명', level: 4 },
  { id: 'ch9', stage: 9, label: 'Ch9', short: '9', title: '청구서와 개인정보', topic: '비용·보안·거버넌스', scale: '사용자 1,000만 명', level: 4 },
  { id: 'ch10', stage: 10, label: 'Ch10', short: '10', title: '시니어가 되는 순간', topic: '판단, 설계, 그리고 안 만드는 용기', scale: '사용자 1,000만 명', level: 4, promotesTo: 5 },
  { id: 'epilogue', stage: 11, label: 'Epilogue', short: 'E', title: '다시 A부터', topic: '전체 플랫폼, 그리고 순환', scale: '사용자 1,000만 명', level: 5 },
]

export const tocOf = (id: ChapterId) => TOC.find((t) => t.id === id)!
