import type { ChapterContent } from '../types'

// Ch1. "어제 몇 개 팔렸어요?" — SQL과 데이터베이스 — 스토리보드: docs/storyboard/02-ch1.md

// 이 챕터의 공통 데이터(장면 2·3과 SQL 놀이터에서 같은 값을 쓴다). 이야기 속 오늘은 6월 3일, 어제는 6월 2일.
export const ORDERS = [
  { order_id: 2001, product_id: 'P1', qty: 2, price: 3000, ordered_at: '6/1 10:02' },
  { order_id: 2002, product_id: 'P2', qty: 1, price: 2000, ordered_at: '6/1 13:15' },
  { order_id: 2003, product_id: 'P3', qty: 1, price: 5000, ordered_at: '6/1 19:40' },
  { order_id: 2004, product_id: 'P1', qty: 1, price: 3000, ordered_at: '6/2 09:12' },
  { order_id: 2005, product_id: 'P4', qty: 2, price: 4000, ordered_at: '6/2 11:30' },
  { order_id: 2006, product_id: 'P1', qty: 3, price: 3000, ordered_at: '6/2 14:05' },
  { order_id: 2007, product_id: 'P2', qty: 2, price: 2000, ordered_at: '6/2 16:48' },
  { order_id: 2008, product_id: 'P3', qty: 1, price: 5000, ordered_at: '6/2 21:20' },
  { order_id: 2009, product_id: 'P4', qty: 1, price: 4000, ordered_at: '6/3 08:10' },
  { order_id: 2010, product_id: 'P1', qty: 1, price: 3000, ordered_at: '6/3 08:55' },
] as const

export const PRODUCTS = [
  { product_id: 'P1', name: '수세미' },
  { product_id: 'P2', name: '칫솔' },
  { product_id: 'P3', name: '주방세제' },
  { product_id: 'P4', name: '고무장갑' },
] as const

/** 이야기 속 어제 */
export const YESTERDAY = '6/2'

const interaction = {
  title: 'SQL 놀이터',
  hint: '조각을 골라 쿼리를 완성해 보세요. 진짜 데이터베이스가 아니라 연습용 주문 10건으로 결과를 보여 줘요.',
  caption: '연습용 주문 10건 · 이야기 속 오늘은 6월 3일',
  groups: {
    select: { legend: '보여줄 것 · SELECT', options: { all: '전체 주문', count: '상품별 개수', revenue: '상품별 매출' } },
    period: { legend: '기간 · WHERE', options: { all: '전체 기간', yesterday: '어제' } },
    join: { legend: '상품 이름 · JOIN', options: { off: '끔', on: '켬' } },
  },
  codeLabel: '조립된 쿼리',
  sql: {
    selectAll: 'SELECT *',
    selectAllJoin: 'SELECT orders.*, products.name',
    selectGroup: (agg: string) => `SELECT product_id, ${agg}`,
    selectGroupJoin: (agg: string) => `SELECT orders.product_id, name, ${agg}`,
    agg: { count: 'SUM(qty) AS 판매개수', revenue: 'SUM(qty * price) AS 매출' },
    from: 'FROM orders',
    join: 'JOIN products ON orders.product_id = products.product_id',
    where: 'WHERE DATE(ordered_at) = CURRENT_DATE - 1',
    whereComment: '-- 어제(6/2)',
    groupBy: 'GROUP BY product_id',
    groupByJoin: 'GROUP BY orders.product_id, name',
  },
  codeNote: '※ 날짜를 쓰는 문법은 데이터베이스마다 조금씩 달라요. 결과는 보기 쉽게 정렬했어요(실제로는 ORDER BY로 순서를 정해요).',
  changed: '← 바뀐 줄',
  tableCaption: (n: number) => `쿼리 결과 · ${n}행`,
  cols: {
    order_id: 'order_id',
    product_id: 'product_id',
    qty: 'qty',
    price: 'price',
    ordered_at: 'ordered_at',
    name: 'name',
    count: '판매개수',
    revenue: '매출',
  },
  /** 한 줄 해설: `${보여줄 것}-${기간}` */
  explain: {
    'all-all': '주문 10건이 모두 보여요. 아직 거르거나 묶지 않았어요.',
    'all-yesterday': 'WHERE가 6월 2일 주문 5건만 남겼어요.',
    'count-all': 'GROUP BY가 상품마다 한 줄로 묶었어요. 모두 더하면 15개예요.',
    'count-yesterday': '어제는 모두 9개가 팔렸어요. 대표님 질문의 답이에요.',
    'revenue-all': 'SUM(qty * price)는 개수 × 개당 가격을 더해요. 모두 더하면 49,000원이에요.',
    'revenue-yesterday': '어제 매출은 모두 29,000원이에요. P1이 12,000원으로 가장 많아요.',
  },
  /** 해설 뒤에 붙는 문장 */
  joinNote: {
    off: 'P1~P4가 무슨 상품인지 궁금하면 JOIN을 켜 보세요.',
    on: 'name 열은 products 테이블에서 JOIN으로 붙여 온 거예요.',
  },
  live: (n: number, text: string) => `결과가 바뀌었어요. ${n}행. ${text}`,
}

const figures = {
  // 장면 2. 문제
  csvFile: '주문내역.csv',
  opsDb: '운영 DB',
  exportLabel: '내보내기',
  seokInitial: '석',
  seokName: '석 리드',
  juniName: '주니',
  cardOrders: 'orders (주문)',
  cardProducts: 'products (상품)',
  ordersTitle: 'orders',
  ordersCaption: '6월 1일부터의 주문만 · 일부 열',
  productsTitle: 'products',
  rowLabel: '행 = 주문 한 건',
  colLabel: '열 = 항목',

  // 장면 3. 시도와 실패 ①
  code: [
    'SELECT *\nFROM orders;',
    'SELECT *\nFROM orders\nWHERE DATE(ordered_at) = CURRENT_DATE - 1;  -- 어제(6/2)',
    'SELECT product_id, SUM(qty) AS 판매개수\nFROM orders\nWHERE DATE(ordered_at) = CURRENT_DATE - 1\nGROUP BY product_id;',
    'SELECT orders.product_id, name, SUM(qty) AS 판매개수\nFROM orders\nJOIN products ON orders.product_id = products.product_id\nWHERE DATE(ordered_at) = CURRENT_DATE - 1\nGROUP BY orders.product_id, name;',
  ],
  codeNotes: ['* = 모든 열', 'CURRENT_DATE - 1 = 오늘의 하루 전 · -- 뒤는 사람이 읽는 메모(주석)', 'SUM = 더하기 · AS = 결과 열에 붙이는 이름', ''],
  tableCaption1: 'orders · 6월 1일부터의 주문만',
  todayCaption: '이야기 속 오늘은 6월 3일',
  excluded: '제외',
  resultTitle: '쿼리 결과',
  groupByArrow: 'GROUP BY', // 화살표는 그림으로 그린다(→ 글자까지 넣으면 두 표 사이에 꽉 낀다)
  sumP1: '1 + 3',

  // 장면 4. 시도와 실패 ②
  bigQuery:
    'SELECT customers.name, products.name, SUM(qty * price) AS 매출\nFROM orders\nJOIN products ON orders.product_id = products.product_id\nJOIN customers ON orders.customer_id = customers.customer_id\nGROUP BY customers.name, products.name;  -- 기간 조건 없음: 전체 기간',
  customersNote: 'customers = 고객 테이블',
  sqlTag: 'SQL',
  stop: '■ 중지',
  stopped: '쿼리 중지됨 ✕',
  gaugeLabel: '운영 DB 부하',
  pct: (n: number) => `${n}%`,
  overload: '과부하',
  payments: ['결제 #2011', '결제 #2012', '결제 #2013'],
  waiting: '대기',
  done: '완료',
  taeoInitial: '태',
  taeoName: '태오',
  loadNote: '※ 알아보기 쉽게 부하를 크게 그렸어요. 가게가 작을 땐 티가 덜 나도, 데이터가 쌓일수록 실제로 생기는 일이에요.',

  // 장면 5. 계산대와 장부 정리
  counter: '계산대',
  office: '뒤쪽 사무실',
  ledger: '1년치 장부',
  legendDone: '✓ 계산 끝',
  legendWait: '⏸ 기다리는 중',

  // 장면 6. OLTP와 OLAP
  oltpDb: '운영 DB (OLTP)',
  pokes: [
    ['새 주문 저장', '1행 쓰기'],
    ['내 주문 보기', '1행 읽기'],
    ['주문 취소', '1행 고치기'],
  ],
  olap: 'OLAP',
  salesByProduct: '상품별 매출',
  compare: {
    head: ['', 'OLTP (운영용)', 'OLAP (분석용)'],
    rows: [
      [['바구니 예시'], ['주문 저장, 결제'], ['고객별·상품별', '전체 매출']],
      [['한 번에', '다루는 행'], ['몇 개'], ['아주 많이']],
      [['중요한 것'], ['빠른 응답'], ['많이 훑는 힘']],
    ],
  },
  compareNote: '※ 단순화한 비교예요.',
  sameDbLoad: '같은 DB에서 함께 돌리면 → 부하',

  // 장면 7. 해결
  rules: ['① 큰 분석은 운영 DB에서 멈추기', '② 손님 적은 시간에만', '③ 짧은 기간만 (어제 하루처럼)'],
  loadWarn: '부하 경고',
  directLoadWarn: '직접 쿼리 · 부하 경고',
  analytics: '분석용?',
  mapCaption: '파이프라인 맵 · 노드 4개',
}

export const ch1: ChapterContent<'problem' | 'attempt' | 'overload' | 'analogy' | 'oltp' | 'solution', typeof interaction, typeof figures> = {
  id: 'ch1',
  opening: {
    alt: '아침, 주니의 책상. 노트북 한 대에 판매 개수를 손으로 세어 적은 포스트잇이 붙어 있고, 옆에 머그컵이 있어요. 주니는 당황한 얼굴이에요.',
    lines: [
      { who: 'ceo', text: '주니 씨, 어제 몇 개 팔렸어요?' },
      { who: 'juni', mood: 'panic', text: '자, 잠깐만요! 파일 받아서 세어 볼게요.' },
      { who: 'ceo', text: '어제도 그랬잖아요. 그래서 몇 개예요?' },
      { who: 'juni', mood: 'panic', text: '매일 손으로 세는 건… 아닌 것 같은데.' },
    ],
  },
  scenes: {
    problem: {
      title: '운영 DB 속의 표',
      steps: [
        {
          text: '주문이 늘수록 손으로 세는 시간도 늘어요. 주니는 석 리드에게 물어보러 갔고, 석 리드는 CSV의 출처부터 보여 줬어요.',
          lines: [
            { who: 'juni', mood: 'panic', text: '이거 어떻게 해요?' },
            { who: 'seok', text: '운영 DB에 다 있어요. SQL 써 봐요.' },
          ],
          alt: '석 리드의 모니터에 원통 모양 노드 운영 DB. 운영 DB에서 주니가 든 파일 주문내역.csv로 실선 화살표가 이어지고, 화살표 라벨은 내보내기예요.',
        },
        {
          text: "데이터베이스(Database, 데이터를 정리해 저장하고 꺼내 쓰게 해 주는 시스템)에는 표가 여러 개 담겨 있어요. 표 하나하나는 테이블(Table, 엑셀 시트 같은 표)이라고 해요. 바구니가 장사에 쓰는 이 데이터베이스를 '운영 DB'라고 불러요(DB는 데이터베이스의 줄임말).",
          alt: '원통 운영 DB의 뚜껑이 열려 있고, 안에서 나온 테이블 카드 두 장 orders (주문)과 products (상품)이 위에 나란히 놓여 있어요.',
        },
        {
          text: 'orders 테이블의 가로 한 줄이 행(Row, 데이터 한 건)이고, 세로 한 줄이 열(Column, 데이터의 항목)이에요. 옆의 products 테이블과는 `product_id`라는 같은 열을 나눠 갖고 있죠.',
          alt: '위에 orders 표 10행(6월 1일부터의 주문만, 일부 열), 아래에 products 표 4행. 2001 행에 가로 띠와 라벨 행 = 주문 한 건, qty 열에 세로 띠와 라벨 열 = 항목. 두 표의 product_id 열에 같은 점선 테두리.',
        },
      ],
    },
    attempt: {
      title: '첫 SQL은 통했어요',
      steps: [
        {
          text: "SQL(Structured Query Language, 데이터베이스에 데이터를 묻고 다루는 언어)로 쓴 질문 하나를 쿼리(Query, 데이터베이스에 보내는 질문)라고 해요. `SELECT`는 '보여 줘', `FROM`은 '어느 표에서'예요.",
          alt: '코드 창에 SELECT *, FROM orders; 두 줄. 풀이: * = 모든 열. 아래에 orders 표 10행이 모두 보통 밝기로 보여요(6월 1일부터의 주문만).',
        },
        {
          text: "`WHERE`는 조건이에요. '주문 날짜가 어제인 것만'이라고 적자 6월 2일 주문 5건만 남았어요.",
          alt: '코드 창에 WHERE DATE(ordered_at) = CURRENT_DATE - 1; -- 어제(6/2) 줄이 더해졌어요. 표에서 2004·2005·2006·2007·2008 행은 강조 테두리, 나머지 다섯 행은 흐리고 제외 라벨. 캡션: 이야기 속 오늘은 6월 3일.',
        },
        {
          text: '`GROUP BY`는 같은 값끼리 묶어요. 상품별로 묶고 `SUM(qty)`로 수량을 더하니, 상품마다 숫자 하나로 모였어요.',
          lines: [{ who: 'juni', mood: 'focus', text: '어제는 모두 9개! P1이 4개로 제일 많아요.' }],
          alt: '코드 창에 SELECT product_id, SUM(qty) AS 판매개수 … GROUP BY product_id; 쿼리. 결과 표 product_id와 판매개수: P1 4, P2 2, P3 1, P4 2.',
        },
        {
          text: '그런데 대표님은 P1이 뭔지 모르시겠죠. 조인(JOIN, 두 테이블을 같은 열 값끼리 이어 붙이는 것)으로 products 테이블의 상품 이름을 붙였어요.',
          lines: [{ who: 'ceo', text: '수세미가 제일 잘 나가네요!' }],
          alt: '코드 창에 JOIN products ON orders.product_id = products.product_id 줄이 더해진 쿼리. 결과 표: P1 수세미 4, P2 칫솔 2, P3 주방세제 1, P4 고무장갑 2. 오른쪽 products 표와 product_id가 같은 행끼리 선 4개로 이어져 있어요.',
        },
      ],
    },
    overload: {
      title: '운영 DB에 던진 큰 쿼리',
      steps: [
        {
          text: '신이 난 주니는 더 큰 질문을 던졌어요. 문을 연 날부터의 주문 전부에 상품·고객을 이어 붙여 고객별·상품별 매출을 구하는 쿼리였죠.',
          lines: [
            { who: 'seok', text: '이걸 운영 DB에 직접요? 음…' },
            { who: 'juni', mood: 'focus', text: '일단 해 볼게요!' },
          ],
          alt: '코드 창에 products와 customers를 JOIN해 고객별·상품별 매출을 구하는 긴 쿼리, 주석: 기간 조건 없음: 전체 기간. 풀이: customers = 고객 테이블. 아래 운영 DB 원통과 게이지 운영 DB 부하 15%. 결제 카드 자리는 비어 있어요. 석 리드가 뒤에서 화면을 보고 있어요.',
        },
        {
          text: '쿼리가 쌓인 주문을 전부 훑고 고객·상품 표까지 이어 붙이느라 운영 DB가 바빠졌어요. 그 일에 힘을 쏟는 사이, 손님들의 결제 처리가 느려졌어요.',
          lines: [{ who: 'taeo', text: '결제 페이지가 왜 이렇게 느리죠?' }],
          alt: '운영 DB 안의 orders 표 전체를 굵은 빛줄기가 덮었어요. 게이지 98% 과부하. 결제 카드 3장 결제 #2011, #2012, #2013이 모두 ⏸ 대기. 오른쪽에서 태오가 노트북을 들고 다가와요.',
        },
        {
          text: '주니가 급히 쿼리를 멈추자 밀렸던 결제가 하나씩 끝났어요. 질문 자체보다, 그 질문을 던진 장소가 문제였죠.',
          lines: [{ who: 'juni', mood: 'panic', text: '제, 제 쿼리 때문이었나 봐요!' }],
          alt: '코드 창 위에 쿼리 중지됨 ✕. 빛줄기는 사라졌고 게이지는 15%. 결제 카드 3장이 모두 ✓ 완료. 태오가 노트북을 들고 옆에 서 있어요.',
        },
      ],
    },
    analogy: {
      title: '계산대와 장부 정리',
      steps: [
        {
          text: '가게 계산대를 떠올려 보세요. 한 명 계산은 금방 끝나지만, 그 일이 하루 종일 이어져요.',
          alt: '손그림 계산대와 계산원, 줄 선 손님 4명. 앞의 손님 2명 위에 ✓ 계산 끝.',
        },
        {
          text: '계산원이 계산대에서 1년치 장부 정리를 시작하면 어떨까요? 그동안 손님들은 한참을 기다려야 해요.',
          alt: '계산대 위에 두꺼운 1년치 장부. 계산원이 장부를 넘기고 있고, 줄 선 손님 4명 위에 모두 ⏸ 기다리는 중.',
        },
        {
          text: '그래서 장부 정리는 보통 뒤쪽 사무실에서 해요. 둘 다 가게 숫자를 다루지만 일의 성격이 달라요.',
          alt: '위쪽 계산대는 줄이 다시 움직이고 손님 위에 ✓. 아래쪽 뒤쪽 사무실 책상 위에 1년치 장부가 놓여 있어요.',
        },
      ],
    },
    oltp: {
      title: 'OLTP와 OLAP',
      steps: [
        {
          text: '계산대 같은 일을 OLTP(Online Transaction Processing, 짧은 읽기·쓰기를 아주 많이, 빠르게 처리하는 방식)라고 해요. 바구니의 운영 DB가 하는 일로, 주문 저장처럼 한 번에 몇 행만 건드려요.',
          alt: '원통 운영 DB (OLTP) 안의 orders 표. 짧은 화살표 3개가 각각 행 하나씩 가리켜요: 새 주문 저장 · 1행 쓰기, 내 주문 보기 · 1행 읽기, 주문 취소 · 1행 고치기. 가리킨 행마다 ✓.',
        },
        {
          text: "장부 정리 같은 일은 OLAP(Online Analytical Processing, 많은 행을 훑어 모으고 계산하는 분석 방식)이에요. '고객별·상품별 전체 매출'처럼 한 번에 아주 많은 행을 읽어요.",
          alt: '같은 orders 표 전체를 빛줄기 하나가 덮고 있어요. 표 오른쪽에 OLAP 상품별 매출 막대 4개(수세미, 칫솔, 주방세제, 고무장갑), 숫자 없이 길이만.',
        },
        {
          text: '같은 DB에서 무거운 OLAP을 돌리면 OLTP가 쓸 힘을 빼앗을 수 있어요. 실제로는 데이터 크기·쿼리 모양·컴퓨터 성능에 따라 영향이 달라요.',
          alt: '비교 표. 바구니 예시: OLTP 주문 저장, 결제 / OLAP 고객별·상품별 전체 매출. 한 번에 다루는 행: 몇 개 / 아주 많이. 중요한 것: 빠른 응답 / 많이 훑는 힘. 아래에 게이지 아이콘과 같은 DB에서 함께 돌리면 → 부하. 캡션: 단순화한 비교예요.',
        },
      ],
    },
    solution: {
      title: '운영 DB는 계산대에 맡기기',
      steps: [
        {
          text: '주니는 당장 지킬 규칙부터 세웠어요. 운영 DB에는 손님이 적은 시간에만, 짧은 기간만 물어보기로요.',
          alt: '주니의 노트북 옆에 포스트잇 3장: ① 큰 분석은 운영 DB에서 멈추기, ② 손님 적은 시간에만, ③ 짧은 기간만 (어제 하루처럼). 노트북 화면 구석의 작은 게이지 운영 DB 부하 15%.',
        },
        {
          text: "파이프라인 맵에 운영 DB가 생겼어요. 앱에서 생긴 주문이 쌓이는 곳이죠. 운영 DB에서 노트북으로 곧장 가는 '직접 쿼리' 점선엔 경고가 붙었어요.",
          alt: '파이프라인 맵 노드 4개. 쇼핑몰 앱·웹 → CSV 파일 → 주니의 노트북 실선은 그대로, 새 실선 쇼핑몰 앱·웹 → 운영 DB (OLTP). 운영 DB에서 주니의 노트북으로 빨간 경고 점선, 라벨 직접 쿼리와 게이지 아이콘 부하 경고.',
        },
        {
          text: '하지만 규칙만으로는 오래 못 버텨요. 주문도, 대표님의 질문도 매일 늘어날 테니까요.',
          lines: [
            { who: 'juni', mood: 'focus', text: '분석용은 따로 둬야겠어요.' },
            { who: 'seok', text: '운영 DB는 안 건드리고요? 어떻게 옮길지가 숙제네요.' },
          ],
          alt: '석 리드의 책상 앞. 주니가 든 손그림 종이에 운영 DB 옆으로 연필 점선 상자 분석용?이 그려져 있어요. 주니는 집중한 얼굴이에요.',
        },
      ],
    },
  },
  interaction,
  figures,
  summary: 'SQL로 표에 질문하면 손으로 세지 않아도 되지만, 손님을 받는 운영 DB(OLTP)에서 무거운 분석(OLAP)을 돌리면 서비스가 느려질 수 있어요.',
  quiz: {
    question: '주니가 "분석용은 따로 둬야겠어요"라고 결론 내린 가장 큰 이유는 무엇일까요?',
    options: [
      {
        id: 'a',
        text: '분석 쿼리가 운영 DB의 주문 기록을 고쳐 버릴 수 있어서',
        feedback: '주니가 쓴 SELECT는 데이터를 읽기만 하고 바꾸지 않아요. 기록이 바뀐 게 아니라, 무거운 읽기가 운영 DB를 바쁘게 만든 게 문제였어요.',
      },
      {
        id: 'b',
        text: '많은 행을 훑는 분석(OLAP)이 주문·결제처럼 빨라야 하는 운영 일(OLTP)의 힘을 빼앗기 때문에',
        correct: true,
        feedback: '맞아요. 전체 기간을 훑는 큰 쿼리가 운영 DB를 바쁘게 만드는 동안 손님의 결제가 기다려야 했어요. 일의 성격이 다르니 자리를 나누는 거예요.',
      },
      {
        id: 'c',
        text: '운영 DB에는 상품 이름이 없어서 JOIN을 할 수 없기 때문에',
        feedback: 'products 테이블이 운영 DB 안에 있었고, JOIN으로 이름을 잘 붙였어요.',
      },
      {
        id: 'd',
        text: '운영 DB의 주문 숫자가 CSV보다 부정확해서',
        feedback: 'CSV는 운영 DB에서 뽑은 사본이에요. 숫자가 틀린 게 아니라, 무거운 질문이 손님의 결제를 늦춘 게 문제였어요.',
      },
    ],
    explanation: '같은 데이터라도 손님을 받는 일과 장부를 정리하는 일은 성격이 달라요. 그래서 다음 챕터에서 주니는 분석할 데이터를 운영 DB 밖으로 옮기는 방법을 찾아요.',
  },
  growth: {
    line: { who: 'juni', mood: 'focus', text: 'SQL은 재밌는데… 물어볼 곳은 따로 있어야겠어요!' },
    mapNote: "운영 DB(OLTP)가 쇼핑몰 앱·웹 뒤에 생겼어요. 노트북으로 곧장 가는 '직접 쿼리' 경고 점선은 다음 챕터에서 정리해요.",
  },
}
