import type { ChapterId } from './types'

export interface Card {
  letter: string
  term: string
  /** 한글 이름(있으면) */
  ko?: string
  /** 한 줄 정의 */
  def: string
  chapter: ChapterId
}

// A–Z 용어 카드 26장. 챕터를 마치면(퀴즈 통과) 그 챕터의 카드를 얻는다.
export const CARDS: Card[] = [
  { letter: 'A', term: 'Airflow', def: '작업의 실행 순서·재시도·알림을 관리하는 대표적인 오케스트레이터', chapter: 'ch3' },
  { letter: 'B', term: 'Batch', ko: '배치', def: '데이터를 일정 기간 모아 두었다가 정해진 때 한꺼번에 처리하는 방식', chapter: 'ch2' },
  { letter: 'C', term: 'CDC', ko: '변경 데이터 캡처', def: 'DB에서 일어난 삽입·수정·삭제를 잡아 이벤트로 흘려보내는 방식', chapter: 'ch6' },
  { letter: 'D', term: 'DAG', def: '작업 사이의 선후 관계를 방향은 있고 되돌아오는 고리는 없는 그래프로 나타낸 것', chapter: 'ch3' },
  { letter: 'E', term: 'ETL / ELT', def: '추출·변환·적재. 싣기 전에 변환하면 ETL, 싣고 나서 저장소 안에서 변환하면 ELT', chapter: 'ch2' },
  { letter: 'F', term: 'Fact table', ko: '팩트 테이블', def: '주문처럼 측정할 사건과 수치를 담고 디멘션을 키로 가리키는 중심 테이블', chapter: 'ch4' },
  { letter: 'G', term: 'Governance', ko: '거버넌스', def: '데이터를 누가 어떻게 쓰고 누가 책임지는지 정한 규칙과 절차 전체', chapter: 'ch9' },
  { letter: 'H', term: 'Hadoop', def: '여러 컴퓨터에 데이터를 나눠 저장하고 처리하는 분산 처리의 길을 연 대표 플랫폼', chapter: 'ch5' },
  { letter: 'I', term: 'Idempotency', ko: '멱등성', def: '같은 작업을 여러 번 실행해도 결과가 한 번 실행한 것과 같은 성질', chapter: 'ch3' },
  { letter: 'J', term: 'Join', ko: '조인', def: '공통 열(키)을 기준으로 두 테이블의 행을 이어 붙이는 연산', chapter: 'ch1' },
  { letter: 'K', term: 'Kafka', def: '이벤트를 순서대로 기록해 두고 여러 소비자가 각자 읽게 하는 대표적인 이벤트 브로커', chapter: 'ch6' },
  { letter: 'L', term: 'Lineage', ko: '리니지', def: '데이터가 어디서 와서 어떤 변환을 거쳐 어디로 가는지 나타낸 계보', chapter: 'ch7' },
  { letter: 'M', term: 'Medallion', ko: '메달리온 아키텍처', def: '원본(Bronze) → 정제(Silver) → 비즈니스용(Gold)으로 층을 나눠 데이터를 다듬는 구조', chapter: 'ch8' },
  { letter: 'N', term: 'Normalization', ko: '정규화', def: '중복을 줄이려고 데이터를 여러 테이블로 나눠 담는 설계 방식', chapter: 'ch4' },
  { letter: 'O', term: 'OLTP vs OLAP', def: '짧은 거래를 빠르게 처리하는 운영용 처리와 많은 데이터를 훑어 집계하는 분석용 처리', chapter: 'ch1' },
  { letter: 'P', term: 'Partitioning', ko: '파티셔닝', def: '날짜 같은 기준으로 데이터를 나눠 저장해 필요한 부분만 읽게 하는 것', chapter: 'ch5' },
  { letter: 'Q', term: 'Quality', ko: '데이터 품질', def: '데이터가 빠짐없이, 정확하게, 제때 들어왔는지 테스트로 확인하고 지키는 일', chapter: 'ch7' },
  { letter: 'R', term: 'Reverse ETL', def: '분석 저장소에서 만든 결과를 CRM·마케팅 툴 같은 운영 도구로 되돌려 보내는 것', chapter: 'ch10' },
  { letter: 'S', term: 'Schema', ko: '스키마', def: '데이터에 어떤 항목이 어떤 타입으로 들어가는지 정한 설계도', chapter: 'prologue' },
  { letter: 'T', term: 'Time travel', ko: '타임 트래블', def: '테이블의 과거 버전을 그 시점 그대로 조회하거나 되돌리는 기능', chapter: 'ch8' },
  { letter: 'U', term: 'Unstructured data', ko: '비정형 데이터', def: '리뷰 글·이미지·음성처럼 미리 정한 행·열 구조가 없는 데이터', chapter: 'prologue' },
  { letter: 'V', term: '3V', def: '빅데이터의 세 가지 특징: Volume(양), Velocity(속도), Variety(다양성)', chapter: 'ch5' },
  { letter: 'W', term: 'Warehouse', ko: '데이터 웨어하우스', def: '분석하기 좋게 정리한 데이터를 모아 두는 분석 전용 저장소', chapter: 'ch4' },
  { letter: 'X', term: 'eXactly-once', ko: '정확히 한 번', def: '장애나 재전송이 있어도 각 이벤트가 결과에 딱 한 번만 반영되게 하는 처리 보장', chapter: 'ch6' },
  { letter: 'Y', term: 'YAML', def: '사람이 읽기 쉬운 설정 파일 형식. 데이터 테스트와 설정을 코드로 선언할 때 쓴다', chapter: 'ch7' },
  { letter: 'Z', term: 'Zero-ETL', def: '파이프라인을 직접 만들지 않고 관리형 연동으로 데이터를 복제하는 선택지. 만능은 아니다', chapter: 'ch10' },
]

export const cardsOf = (chapter: ChapterId) => CARDS.filter((c) => c.chapter === chapter)
