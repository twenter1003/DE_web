import type { ChapterId } from './types'

// 진화하는 파이프라인 맵 (스토리 바이블 0-7).
// 시간축 t = 스테이지 번호. Ch10만 세부 단계가 있다:
//   10.00 제안이 붙은 상태 / 10.25 클라이맥스(안 만들기로 결정) / 10.50 Build vs Buy / 10.75 ML·Reverse ETL
// 노드는 from ≤ t < until 일 때 보인다.

export const T = {
  prologue: 0,
  ch1: 1,
  ch2: 2,
  ch3: 3,
  ch4: 4,
  ch5: 5,
  ch6: 6,
  ch7: 7,
  ch8: 8,
  ch9: 9,
  ch10Proposal: 10,
  ch10Climax: 10.25,
  ch10Buy: 10.5,
  ch10Final: 10.75,
  epilogue: 11,
} as const

export type NodeKind = 'source' | 'store' | 'process' | 'serve' | 'control' | 'doc' | 'proposal'

export interface MapNodeDef {
  id: string
  /** 시점별 라벨: [t, 라벨, 보조 라벨] — t 이상에서 적용 */
  labels: [number, string, string?][]
  kind: NodeKind
  from: number
  until?: number
  /** 클릭하면 이동할 챕터 */
  chapter: ChapterId
  /** 시점별 위치: [t, x, y] */
  at: [number, number, number][]
  w?: number
  h?: number
}

export type EdgeKind = 'data' | 'control' | 'warn' | 'proposal' | 'note'

export interface MapEdgeDef {
  from: string
  to: string
  kind: EdgeKind
  start: number
  until?: number
  label?: string
  /** 품질 검사 배지(Ch7부터) */
  check?: boolean
  /** 끝점 위치를 노드 중심 기준으로 지정(다른 노드를 피해 가야 할 때) */
  toAnchor?: [number, number]
}

export const MAP_NODES: MapNodeDef[] = [
  { id: 'app', labels: [[0, '쇼핑몰 앱·웹', '사용자 행동']], kind: 'source', from: 0, chapter: 'prologue', at: [[0, 90, 170]] },
  { id: 'csv', labels: [[0, 'CSV 파일', '주문 내역']], kind: 'doc', from: 0, until: 2, chapter: 'prologue', at: [[0, 290, 170]] },
  {
    id: 'bi',
    labels: [
      [0, '주니의 노트북', '스프레드시트'],
      [2, '아침 리포트', '매일 08:00'],
      [4, 'BI 대시보드', '지표 화면'],
    ],
    kind: 'serve',
    from: 0,
    chapter: 'prologue',
    at: [
      [0, 490, 170],
      [2, 1090, 390],
    ],
  },
  { id: 'oltp', labels: [[1, '운영 DB', 'OLTP']], kind: 'store', from: 1, chapter: 'ch1', at: [[0, 90, 390]] },
  { id: 'etl', labels: [[2, '야간 ETL 배치', '매일 03:00']], kind: 'process', from: 2, until: T.ch10Buy, chapter: 'ch2', at: [[0, 290, 390]] },
  {
    id: 'warehouse',
    labels: [
      [2, '분석용 DB', '운영 DB와 분리'],
      [4, '데이터 웨어하우스', '열 기반'],
    ],
    kind: 'store',
    from: 2,
    until: 8,
    chapter: 'ch4',
    at: [[0, 690, 390]],
  },
  { id: 'orch', labels: [[3, '오케스트레이터', 'Airflow 등']], kind: 'control', from: 3, chapter: 'ch3', at: [[0, 420, 720]] },
  {
    id: 'alert',
    labels: [
      [3, '실패 알림', '메신저'],
      [7, '모니터링·알림', '테스트·신선도'],
    ],
    kind: 'control',
    from: 3,
    chapter: 'ch3',
    at: [[0, 640, 720]],
  },
  { id: 'model', labels: [[4, '모델링·지표 정의', 'dbt 등']], kind: 'process', from: 4, chapter: 'ch4', at: [[0, 890, 390]] },
  { id: 'media', labels: [[5, '리뷰·상품 이미지', '비정형']], kind: 'source', from: 5, chapter: 'ch5', at: [[0, 90, 610]] },
  { id: 'lake', labels: [[5, '데이터 레이크', '오브젝트 스토리지']], kind: 'store', from: 5, until: 8, chapter: 'ch5', at: [[0, 290, 610]] },
  {
    id: 'spark',
    labels: [[5, '분산 처리', 'Spark 등']],
    kind: 'process',
    from: 5,
    chapter: 'ch5',
    at: [[0, 490, 610]],
  },
  { id: 'kafka', labels: [[6, '이벤트 브로커', 'Kafka 등']], kind: 'process', from: 6, chapter: 'ch6', at: [[0, 490, 170]] },
  { id: 'cdc', labels: [[6, 'CDC', '변경 데이터 캡처']], kind: 'process', from: 6, until: T.ch10Buy, chapter: 'ch6', at: [[0, 190, 280]] },
  { id: 'fraud', labels: [[6, '이상 결제 탐지', '스트림 처리']], kind: 'serve', from: 6, chapter: 'ch6', at: [[0, 690, 60]] },
  { id: 'stock', labels: [[6, '실시간 재고 화면', '타임세일']], kind: 'serve', from: 6, until: T.ch10Climax, chapter: 'ch6', at: [[0, 690, 170]] },
  { id: 'contract', labels: [[7, '데이터 계약', '필드·타입·의미']], kind: 'doc', from: 7, chapter: 'ch7', at: [[0, 90, 60]] },
  { id: 'lakehouse', labels: [[8, '레이크하우스', 'Bronze · Silver · Gold']], kind: 'store', from: 8, chapter: 'ch8', at: [[0, 490, 445]], w: 180, h: 150 },
  { id: 'catalog', labels: [[9, '카탈로그·접근 제어', '권한·마스킹']], kind: 'control', from: 9, chapter: 'ch9', at: [[0, 890, 720]] },
  { id: 'cost', labels: [[9, '비용 모니터', '읽은 양·저장 계층']], kind: 'control', from: 9, chapter: 'ch9', at: [[0, 1090, 720]] },
  { id: 'rtAgg', labels: [[10, '실시간 집계', '제안']], kind: 'proposal', from: T.ch10Proposal, until: T.ch10Climax, chapter: 'ch10', at: [[0, 690, 280]] },
  { id: 'cache', labels: [[10, '실시간 캐시 DB', '제안']], kind: 'proposal', from: T.ch10Proposal, until: T.ch10Climax, chapter: 'ch10', at: [[0, 890, 280]] },
  { id: 'rtDash', labels: [[10, '실시간 대시보드', '제안']], kind: 'proposal', from: T.ch10Proposal, until: T.ch10Climax, chapter: 'ch10', at: [[0, 1090, 280]] },
  { id: 'newTool', labels: [[10, '새 분석 툴', '제안']], kind: 'proposal', from: T.ch10Proposal, until: T.ch10Climax, chapter: 'ch10', at: [[0, 890, 170]] },
  { id: 'reverse', labels: [[10, 'Reverse ETL', '→ CRM·마케팅 툴']], kind: 'serve', from: T.ch10Final, chapter: 'ch10', at: [[0, 1090, 500]] },
  { id: 'ml', labels: [[10, 'ML 학습 데이터', '추천 모델']], kind: 'serve', from: T.ch10Final, chapter: 'ch10', at: [[0, 1090, 610]] },
]

export const MAP_EDGES: MapEdgeDef[] = [
  { from: 'app', to: 'csv', kind: 'data', start: 0, until: 2 },
  { from: 'csv', to: 'bi', kind: 'data', start: 0, until: 2 },
  { from: 'app', to: 'oltp', kind: 'data', start: 1 },
  { from: 'oltp', to: 'bi', kind: 'warn', start: 1, until: 2, label: '직접 쿼리' },
  { from: 'oltp', to: 'etl', kind: 'data', start: 2, until: T.ch10Buy },
  { from: 'etl', to: 'warehouse', kind: 'data', start: 2, until: 8, check: true },
  { from: 'warehouse', to: 'bi', kind: 'data', start: 2, until: 4 },
  { from: 'orch', to: 'etl', kind: 'control', start: 3, until: T.ch10Buy, toAnchor: [40, 27] },
  { from: 'orch', to: 'alert', kind: 'control', start: 3 },
  { from: 'warehouse', to: 'model', kind: 'data', start: 4, until: 8 },
  { from: 'model', to: 'bi', kind: 'data', start: 4, check: true },
  { from: 'app', to: 'lake', kind: 'data', start: 5, until: 6 },
  { from: 'media', to: 'lake', kind: 'data', start: 5, until: 8 },
  { from: 'lake', to: 'spark', kind: 'data', start: 5, until: 8 },
  { from: 'spark', to: 'warehouse', kind: 'data', start: 5, until: 8, check: true },
  { from: 'orch', to: 'spark', kind: 'control', start: 5 },
  { from: 'app', to: 'kafka', kind: 'data', start: 6 },
  { from: 'kafka', to: 'lake', kind: 'data', start: 6, until: 8, check: true },
  { from: 'oltp', to: 'cdc', kind: 'data', start: 6, until: T.ch10Buy },
  { from: 'cdc', to: 'kafka', kind: 'data', start: 6, until: T.ch10Buy },
  { from: 'kafka', to: 'fraud', kind: 'data', start: 6 },
  { from: 'kafka', to: 'stock', kind: 'data', start: 6, until: T.ch10Climax },
  { from: 'contract', to: 'app', kind: 'note', start: 7 },
  { from: 'kafka', to: 'lakehouse', kind: 'data', start: 8, check: true },
  { from: 'etl', to: 'lakehouse', kind: 'data', start: 8, until: T.ch10Buy, check: true },
  { from: 'media', to: 'lakehouse', kind: 'data', start: 8 },
  { from: 'lakehouse', to: 'spark', kind: 'data', start: 8 },
  { from: 'lakehouse', to: 'model', kind: 'data', start: 8, check: true },
  { from: 'catalog', to: 'lakehouse', kind: 'control', start: 9 },
  { from: 'cost', to: 'lakehouse', kind: 'control', start: 9 },
  { from: 'kafka', to: 'rtAgg', kind: 'proposal', start: T.ch10Proposal, until: T.ch10Climax },
  { from: 'rtAgg', to: 'cache', kind: 'proposal', start: T.ch10Proposal, until: T.ch10Climax },
  { from: 'cache', to: 'rtDash', kind: 'proposal', start: T.ch10Proposal, until: T.ch10Climax },
  { from: 'newTool', to: 'cache', kind: 'proposal', start: T.ch10Proposal, until: T.ch10Climax },
  { from: 'oltp', to: 'lakehouse', kind: 'data', start: T.ch10Buy, label: 'Zero-ETL' },
  { from: 'model', to: 'reverse', kind: 'data', start: T.ch10Final },
  { from: 'lakehouse', to: 'ml', kind: 'data', start: T.ch10Final },
]
