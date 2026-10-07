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
// 정의는 각 챕터 스토리보드(docs/storyboard/NN-*.md)의 '카드 정의'와 같다.
export const CARDS: Card[] = [
  { letter: 'A', term: 'Airflow', def: '작업들을 DAG로 정의해 순서대로 실행하고 재시도·알림·실행 이력을 관리하는 대표적인 오케스트레이터', chapter: 'ch3' },
  { letter: 'B', term: 'Batch', ko: '배치', def: '데이터를 하루·한 시간 같은 단위로 모아 두었다가 정해진 때에 한꺼번에 처리하는 방식', chapter: 'ch2' },
  { letter: 'C', term: 'CDC', ko: '변경 데이터 캡처', def: '데이터베이스의 행 삽입·수정·삭제를 변경 기록 등에서 읽어 이벤트로 흘려보내는 방식', chapter: 'ch6' },
  { letter: 'D', term: 'DAG', def: '방향이 있고 되돌아오는 고리가 없는 그래프로, 작업 사이의 실행 순서와 의존 관계를 나타낸 것', chapter: 'ch3' },
  { letter: 'E', term: 'ETL / ELT', def: '데이터를 꺼내(E) 분석에 맞게 정리하고(T) 저장소에 싣는(L) 과정. ELT는 먼저 싣고 안에서 정리하는 순서', chapter: 'ch2' },
  { letter: 'F', term: 'Fact table', ko: '팩트 테이블', def: '주문 항목처럼 측정할 사건을 한 행씩 담고, 수량·금액 같은 측정값과 디멘션을 가리키는 키를 가진 중심 테이블', chapter: 'ch4' },
  { letter: 'G', term: 'Governance', ko: '거버넌스', def: '조직 안에서 데이터를 누가 어떻게 쓰고 누가 책임지는지 정해 둔 규칙·절차·역할 분담의 전체 체계', chapter: 'ch9' },
  { letter: 'H', term: 'Hadoop', def: '분산 파일 시스템과 MapReduce로 여러 컴퓨터에 데이터를 나눠 저장하고 처리하는 방식을 대표하는 도구', chapter: 'ch5' },
  { letter: 'I', term: 'Idempotency', ko: '멱등성', def: '같은 작업을 여러 번 실행해도 한 번 실행한 것과 결과가 같은 성질로, 안전한 재시도·백필의 바탕', chapter: 'ch3' },
  { letter: 'J', term: 'Join', ko: '조인', def: '두 테이블에서 같은 열 값을 가진 행끼리 이어 붙여 하나의 결과 표로 합치는 연산', chapter: 'ch1' },
  { letter: 'K', term: 'Kafka', def: '이벤트를 레인(파티션)마다 순서대로 기록·보관하고, 여러 컨슈머가 각자 속도로 읽게 하는 대표적인 이벤트 브로커', chapter: 'ch6' },
  { letter: 'L', term: 'Lineage', ko: '리니지', def: '데이터가 어디서 와서 어떤 변환을 거쳐 어디로 가는지를 차례로 이어 놓은 계보', chapter: 'ch7' },
  { letter: 'M', term: 'Medallion', ko: '메달리온 아키텍처', def: '데이터를 원본(Bronze)·정제(Silver)·집계(Gold) 세 층으로 나눠 단계적으로 다듬어 쌓는 설계 방식', chapter: 'ch8' },
  { letter: 'N', term: 'Normalization', ko: '정규화', def: '같은 정보가 여러 곳에 반복해 적히지 않도록 테이블을 나눠, 중복을 줄이고 한 곳만 고치면 되게 하는 설계 방식', chapter: 'ch4' },
  { letter: 'O', term: 'OLTP vs OLAP', def: '짧은 읽기·쓰기를 빠르게 많이 하는 운영용 처리와 많은 행을 훑어 집계하는 분석용 처리의 구분', chapter: 'ch1' },
  { letter: 'P', term: 'Partitioning', ko: '파티셔닝', def: '날짜 같은 기준으로 데이터를 폴더나 구역별로 나눠 저장해, 쿼리가 필요한 구역만 골라 읽게 하는 저장 방식', chapter: 'ch5' },
  { letter: 'Q', term: 'Quality', ko: '데이터 품질', def: '데이터가 비거나 겹치지 않고 허용 범위 안에서 제때 도착해, 믿고 쓸 수 있는 정도', chapter: 'ch7' },
  { letter: 'R', term: 'Reverse ETL', ko: '리버스 ETL', def: '웨어하우스나 레이크하우스에서 만든 결과를 CRM·마케팅 툴 같은 업무 도구로 되돌려 보내는 방식', chapter: 'ch10' },
  { letter: 'S', term: 'Schema', ko: '스키마', def: '데이터에 어떤 항목이 어떤 값의 종류로 들어가는지 미리 정해 둔 데이터의 설계도', chapter: 'prologue' },
  { letter: 'T', term: 'Time travel', ko: '타임 트래블', def: '테이블이 버전마다 남겨 둔 기록으로, 보관 기간 안의 과거 시점 데이터를 그대로 다시 조회하는 기능', chapter: 'ch8' },
  { letter: 'U', term: 'Unstructured data', ko: '비정형 데이터', def: '리뷰 글·사진·음성처럼 미리 정한 표의 칸이나 항목 구조 없이 만들어지는 데이터', chapter: 'prologue' },
  { letter: 'V', term: '3V', ko: 'Volume·Velocity·Variety', def: '빅데이터를 양(Volume)·속도(Velocity)·다양성(Variety) 세 가지 특징으로 설명하는 대표적인 틀', chapter: 'ch5' },
  { letter: 'W', term: 'Warehouse', ko: '데이터 웨어하우스', def: '여러 시스템에서 모은 데이터를 분석하기 좋은 모양으로 정리해, 큰 집계를 빠르게 하도록 만든 분석 전용 저장소', chapter: 'ch4' },
  { letter: 'X', term: 'eXactly-once', ko: '정확히 한 번', def: '이벤트를 빠뜨리지 않으면서, 중복 전달돼도 결과에는 딱 한 번만 반영되게 하는 처리 방식', chapter: 'ch6' },
  { letter: 'Y', term: 'YAML', def: '들여쓰기로 구조를 나타내는 읽기 쉬운 설정 파일 형식으로, 테스트·설정을 코드로 선언하는 데 쓰임', chapter: 'ch7' },
  { letter: 'Z', term: 'Zero-ETL', ko: '제로 ETL', def: '운영 DB 데이터를 분석 저장소로 자동 복제해 주는 관리형 연동. 지원 조합이 한정되고 변환·품질 관리는 남음', chapter: 'ch10' },
]

export const cardsOf = (chapter: ChapterId) => CARDS.filter((c) => c.chapter === chapter)
