import type { ChapterContent } from '../types'

// Ch1. "어제 몇 개 팔렸어요?" — SQL과 데이터베이스 — 스토리보드: docs/storyboard/02-ch1.md

// 이 챕터의 공통 데이터(장면 2·3과 SQL 실행기에서 같은 값을 쓴다). 이야기 속 오늘은 6월 3일, 어제는 6월 2일.
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

/** 이야기 속 오늘(SQL 실행기의 CURRENT_DATE) */
export const TODAY = '6/3'

const COLS_TEXT = 'order_id, product_id, qty, price, ordered_at, name'

/** 장면 3 마지막 쿼리. SQL 실행기 편집기에 처음 들어 있는 코드 */
const FINAL_QUERY = [
  'SELECT orders.product_id, name, SUM(qty) AS 판매개수',
  'FROM orders',
  'JOIN products ON orders.product_id = products.product_id',
  `WHERE DATE(ordered_at) = CURRENT_DATE - 1  -- 어제(${YESTERDAY})`,
  'GROUP BY orders.product_id, name;',
].join('\n')

/** WHERE 조건의 비교 기호를 말로 */
const OP_WORDS: Record<string, (v: string) => string> = {
  '=': (v) => `${v}인`,
  '<>': (v) => `${v} 말고 다른`,
  '!=': (v) => `${v} 말고 다른`,
  '>': (v) => `${v}보다 큰`,
  '>=': (v) => `${v} 이상인`,
  '<': (v) => `${v}보다 작은`,
  '<=': (v) => `${v} 이하인`,
}

const interaction = {
  title: 'SQL 실행기',
  hint: (n: number) =>
    `쿼리를 고쳐 쓰거나 실험 버튼을 눌러 보고, **▶ 실행**으로 쿼리가 표를 어떻게 바꾸는지 지켜보세요. 진짜 데이터베이스가 아니라 연습용 주문 ${n}건으로 처리해요.`,
  caption: (n: number, today: string) => {
    const [m, d] = today.split('/')
    return `연습용 주문 ${n}건 · 이야기 속 오늘은 ${m}월 ${d}일`
  },
  initial: FINAL_QUERY,

  experimentsLabel: '실험 · 누르면 쿼리가 바뀌어요',
  experiments: [
    { id: 'all', label: '전부 보기 (SELECT *)', code: 'SELECT *\nFROM orders;', note: '가장 단순한 쿼리예요. FROM이 꺼낸 주문이 거르지도 묶지도 않은 채 그대로 결과가 돼요.' },
    {
      id: 'where',
      label: '어제만 보기 (WHERE 넣기)',
      code: `SELECT *\nFROM orders\nWHERE DATE(ordered_at) = CURRENT_DATE - 1;  -- 어제(${YESTERDAY})`,
      note: 'WHERE 줄을 넣었어요. 실행하면 어제 주문이 아닌 행에 ✕ 제외가 붙어요.',
    },
    {
      id: 'group',
      label: '상품별로 묶기 (GROUP BY)',
      code: 'SELECT product_id, SUM(qty) AS 판매개수\nFROM orders\nWHERE DATE(ordered_at) = CURRENT_DATE - 1\nGROUP BY product_id;',
      note: 'GROUP BY가 같은 product_id끼리 모으고, SUM(qty)이 묶음 안의 qty를 더해 숫자 하나로 합쳐요.',
    },
    { id: 'join', label: '상품 이름 붙이기 (JOIN)', code: FINAL_QUERY, note: 'JOIN 줄이 products 표에서 상품 이름을 가져와요. 쓰기는 SELECT가 먼저지만, 처리는 FROM부터예요.' },
    {
      id: 'revenue',
      label: '매출로 바꾸기 (SUM(qty * price))',
      code: FINAL_QUERY.replace('SUM(qty) AS 판매개수', 'SUM(qty * price) AS 매출'),
      note: '개수 대신 개수 × 개당 가격을 더해요. 한 줄만 바뀌었는데 결과 열이 달라져요.',
    },
    {
      id: 'broken',
      label: '일부러 틀려 보기 (GROUP BY 빼기)',
      code: FINAL_QUERY.split('\n').slice(0, 4).join('\n').replace('CURRENT_DATE - 1  --', 'CURRENT_DATE - 1;  --'),
      note: 'GROUP BY 줄을 지웠어요. ▶ 실행을 누르면 무엇이 문제인지 알려 줘요.',
    },
  ],

  editorLabel: 'SQL 쿼리 · 고쳐 써도 돼요',
  run: '▶ 실행',
  pause: '⏸ 멈춤',
  step: '한 줄씩',
  reset: '처음부터',
  controlsLabel: '실행 조절',
  status: {
    idle: '⏸ 아직 실행 전이에요',
    running: (k: number, n: number) => `▶ 실행 중 · ${k}/${n}단계`,
    paused: (k: number, n: number) => `⏸ 멈춤 · ${k}/${n}단계`,
    done: (n: number) => `✓ 실행 끝 · ${n}단계를 모두 처리했어요`,
    error: '✕ 쿼리를 고치면 실행할 수 있어요',
  },
  stageLabel: '처리 과정',
  stageEmpty: '▶ 실행이나 한 줄씩을 누르면, 여기에서 표가 단계마다 바뀌어요.',
  stageError: '쿼리를 고치면 여기에서 다시 처리 과정을 볼 수 있어요.',
  logLabel: '실행 기록',
  logEmpty: '아직 실행한 줄이 없어요.',

  /** 그림 속 표 제목 */
  titles: {
    from: (n: number) => `orders · ${n}행`,
    join: (n: number) => `orders + products의 name · ${n}행`,
    where: (n: number) => `WHERE 뒤 · ${n}행 남음`,
    group: (g: number) => `GROUP BY 뒤 · ${g}묶음`,
    result: (n: number) => `결과 · ${n}행`,
    products: 'products',
  },
  excluded: '✕ 제외',
  nullValue: 'NULL',

  /** 실행 기록 한 줄 */
  lineTag: (a: number, b: number) => (a === b ? `${a}줄` : `${a}~${b}줄`),
  logLine: (tag: string, clause: string, text: string) => `${tag} ${clause}: ${text}`,
  log: {
    from: (n: number) => `orders 표에서 주문 ${n}건을 꺼냈어요.`,
    join: (n: number) => `product_id가 같은 products 행을 찾아 ${n}건 모두에 상품 이름(name)을 붙였어요.`,
    dayLabel: (n: number) => (n === 0 ? '오늘' : n === 1 ? '어제' : `${n}일 전`),
    yearsAgo: (y: number) => `${y}년 전 `,
    condDate: (label: string, md: string) => `주문 날짜가 ${label}(${md})인`,
    condCmp: (col: string, v: string, op: string) => `${col} 값이 ${(OP_WORDS[op] ?? OP_WORDS['='])(v)}`,
    where: (cond: string, before: number, after: number, out: string) => `${cond} 주문만 남겨요. ${before}건 → ${after}건${out}`,
    whereOut: (ids: string) => `, ${ids}번은 제외.`,
    whereOutMany: (k: number) => `, ${k}건은 제외.`,
    whereNone: ', 빠진 주문이 없어요.',
    group: (keys: string, before: number, g: number, detail: string) => `${keys} 값이 같은 주문끼리 묶었어요. ${before}건 → ${g}묶음${detail}.`,
    groupDetail: (parts: string[]) => ` (${parts.join(', ')})`,
    groupPart: (key: string, n: number) => `${key} ${n}건`,
    aggs: (list: string) => ` 묶음마다 ${list} 값을 계산해 한 줄로 합쳤어요.`,
    selectOne: (k: number, list: string) => `GROUP BY가 없어서 남은 ${k}건을 한 묶음으로 보고 ${list} 값을 계산했어요. `,
    select: (cols: string, n: number) => `${cols} 열만 남겨 결과 ${n}행을 만들었어요.`,
    selectStar: (n: number) => `*는 모든 열이라 열을 그대로 두고 결과 ${n}행을 만들었어요.`,
    preview: (rows: string) => ` 결과: ${rows}`,
    nullNote: ' 더할 행이 없으면 SUM은 NULL(값 없음)이 돼요.',
  },

  errorTitle: (line: number | null) => (line ? `✕ ${line}줄에서 멈췄어요` : '✕ 실행하지 못했어요'),
  tryThis: '이렇게 써 보세요',
  nearLabel: '비슷한 말',
  err: {
    empty: '쿼리가 비어 있어요. 위의 실험 버튼으로 예시 쿼리를 불러와 보세요.',
    start: 'SQL 쿼리는 SELECT로 시작해요.',
    unknownWord: (w: string) => `'${w}' — 이 실행기가 모르는 말이에요.`,
    unsupported: (kw: string) => `이 실행기는 ${kw}까지는 몰라요. 알아듣는 건 SELECT · FROM · JOIN · WHERE · GROUP BY예요.`,
    andOr: 'WHERE 조건은 하나만 알아들어요. AND나 OR로 조건을 잇는 건 아직 몰라요.',
    groupBy: 'GROUP과 BY는 붙여서 GROUP BY로 써요.',
    order: (kw: string, prev: string) => `${kw} 줄은 ${prev} 줄보다 앞에 와야 해요. 쓰는 순서: SELECT → FROM → JOIN → WHERE → GROUP BY`,
    dup: (kw: string) => `${kw} 줄이 두 번 나왔어요. 한 번만 쓸 수 있어요.`,
    noFrom: '어느 표에서 꺼낼지 알려 주는 FROM 줄이 없어요.',
    fromTable: 'FROM 뒤에는 orders 하나만 써요. products는 JOIN 줄로 붙여요.',
    join: 'JOIN 줄은 이 모양으로만 알아들어요.',
    semicolon: '세미콜론(;)은 쿼리 맨 끝에 한 번만 써요. 이 실행기는 쿼리 하나만 실행해요.',
    quote: "작은따옴표(')가 닫히지 않았어요. 값의 앞뒤에 모두 써 주세요.",
    symbol: (ch: string) => `'${ch}' — 이 실행기가 모르는 기호예요.`,
    doubleQuote: '큰따옴표(")는 이 실행기가 몰라요. 글자 값은 작은따옴표로 감싸고, 결과 열 이름(AS 뒤)은 따옴표 없이 한 단어로 써요.',
    paren: '괄호 ( ) 짝이 맞지 않아요. 여는 괄호마다 닫는 괄호가 하나씩 있어야 해요.',
    selectEmpty: 'SELECT 뒤에 보여 줄 열이 없어요. *나 열 이름을 적어 주세요.',
    emptyItem: '쉼표(,) 사이나 끝에 빈 자리가 있어요.',
    missingComma: '열 사이에 쉼표(,)가 빠진 것 같아요. 결과 열 이름을 붙이려면 AS를 써요.',
    alias: 'AS 뒤에는 결과 열 이름을 한 단어로 적어요.',
    column: (c: string) => `'${c}' 열은 없어요. 쓸 수 있는 열: ${COLS_TEXT}`,
    table: (t: string) => `'${t}' 표는 없어요. 쓸 수 있는 표: orders, products`,
    tableCol: (t: string, c: string, list: string) => `${t} 표에는 '${c}' 열이 없어요. ${t}의 열: ${list}`,
    needJoin: (c: string) => `${c} 열은 products 표에 있어요. JOIN 줄을 넣어야 쓸 수 있어요.`,
    ambiguous: 'JOIN을 하면 product_id가 orders와 products 두 표에 모두 있어서 어느 쪽인지 정할 수 없어요. 앞에 표 이름을 붙여 주세요.',
    func: (f: string) => `'${f}' — 이 실행기는 함수 중에 SUM과 COUNT만 알아들어요.`,
    sumArg: 'SUM 괄호 안에는 숫자 열 하나(qty, price)나 qty * price만 쓸 수 있어요.',
    countArg: 'COUNT는 COUNT(*)처럼 써요.',
    star: 'SELECT *는 묶지 않은 행을 그대로 보여 줄 때만 써요. SUM이나 GROUP BY와 함께라면 묶은 열과 합친 값만 적어 주세요.',
    groupMissing: (cols: string) =>
      `SUM·COUNT로 합친 값과 보통 열(${cols})을 함께 SELECT하면, 그 보통 열을 GROUP BY에 적어야 해요. 무엇끼리 묶을지 모르면 한 줄에 어느 행의 값을 쓸지 정할 수 없거든요. 실제 데이터베이스도 대부분 이 쿼리를 오류로 막아요.`,
    groupForm: 'GROUP BY 뒤에는 묶을 열 이름을 쉼표로 이어 적어요.',
    whereForm: 'WHERE 조건은 하나만, 이런 모양으로 알아들어요.',
    dateForm: '날짜 조건은 이 모양으로 써요(1 대신 다른 숫자를 써도 돼요).',
    dateFar: (max: number) => `며칠 전인지는 ${max} 이하의 숫자로 적어 주세요.`,
    needQuote: (c: string) => `${c} 값은 글자라서 작은따옴표로 감싸요.`,
    noQuote: (c: string) => `${c}는 숫자 열이라 따옴표 없이 써요.`,
    textOp: (c: string) => `이 실행기에서는 ${c} 같은 글자 열을 = 나 <> 로 같은지만 비교해요.`,
    generic: (tok: string) => `'${tok}' 부분을 이해하지 못했어요.`,
    internal: '이 쿼리는 이해하지 못했어요. 실험 버튼으로 예시 쿼리를 불러와 비교해 보세요.',
  },
  /** 오류 안내에 보여 줄 바른 모양(코드) */
  hints: {
    start: 'SELECT * FROM orders',
    from: 'FROM orders',
    join: 'JOIN products ON orders.product_id = products.product_id',
    where: "DATE(ordered_at) = CURRENT_DATE - 1   ·   product_id = 'P1'   ·   qty >= 2",
    date: 'DATE(ordered_at) = CURRENT_DATE - 1',
    alias: 'SUM(qty) AS 판매개수',
    comma: 'product_id, SUM(qty)   ·   SUM(qty) AS 판매개수',
    quote: "product_id = 'P1'   ·   SUM(qty) AS 판매개수",
    sum: 'SUM(qty * price)',
    count: 'COUNT(*)',
    select: 'SELECT *',
    groupBy: 'GROUP BY orders.product_id, name',
    groupByOne: 'GROUP BY product_id',
  },

  help: {
    title: '이 실행기가 알아듣는 SQL',
    order: 'SQL은 쓴 순서가 아니라 **FROM → JOIN → WHERE → GROUP BY → SELECT** 순서로 처리돼요(실제 데이터베이스는 더 똑똑하게 순서를 바꾸기도 해요).',
    items: [
      '`SELECT *` 또는 `SELECT 열, 열` — 열: `order_id` `product_id` `qty` `price` `ordered_at` `name` (`orders.qty`처럼 표 이름을 붙여도 돼요)',
      '`SUM(qty)` · `SUM(qty * price)` · `COUNT(*)` — `AS 판매개수`처럼 결과 열 이름을 붙일 수 있어요',
      '`FROM orders`',
      '`JOIN products ON orders.product_id = products.product_id` (없어도 돼요)',
      "`WHERE` 조건 하나 (없어도 돼요): `DATE(ordered_at) = CURRENT_DATE - 1` · `product_id = 'P1'` · `qty >= 2`",
      '`GROUP BY 열, 열` (없어도 돼요) — SUM·COUNT와 함께 SELECT한 보통 열은 모두 여기에 적어요',
      "`SELECT` 같은 낱말과 열·표 이름은 대소문자를 가리지 않지만, 작은따옴표 안의 값은 가려요(`'P1'`과 `'p1'`은 달라요). `--` 뒤는 사람이 읽는 메모(주석)라 실행하지 않고, 맨 끝 `;`는 있어도 없어도 돼요.",
    ],
  },
  note: '진짜 SQL 엔진이 아니라 위 목록만 알아듣는 연습용 실행기예요. 날짜를 쓰는 문법은 데이터베이스마다 조금씩 달라요. 결과는 보기 쉽게 정렬했어요(실제로는 ORDER BY로 순서를 정해요).',

  /** 표 머리글(장면 그림도 같이 쓴다) */
  cols: {
    order_id: 'order_id',
    product_id: 'product_id',
    qty: 'qty',
    price: 'price',
    ordered_at: 'ordered_at',
    name: 'name',
    count: '판매개수',
  },
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
  // 고객은 이름이 겹칠 수 있어 customer_id로 묶는다
  bigQuery:
    'SELECT customers.name, products.name, SUM(qty * price) AS 매출\nFROM orders  -- 기간 조건 없음: 전체 기간\nJOIN products ON orders.product_id = products.product_id\nJOIN customers ON orders.customer_id = customers.customer_id\nGROUP BY customers.customer_id, customers.name, products.name;',
  customersNote: 'customers = 고객 테이블',
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
          text: '주문이 늘수록 손으로 세는 시간도 늘어요. 주니가 묻자 석 리드는 CSV의 출처부터 보여 줬어요.',
          lines: [
            { who: 'juni', mood: 'panic', text: '이거 어떻게 해요?' },
            { who: 'seok', text: '운영 DB에 다 있어요. 작은 질문부터 SQL로 물어봐요.' },
          ],
          alt: '석 리드의 모니터에 원통 모양 노드 운영 DB. 운영 DB에서 주니가 든 파일 주문내역.csv로 실선 화살표가 이어지고, 화살표 라벨은 내보내기예요.',
        },
        {
          text: "바구니의 주문·상품 정보는 데이터베이스(Database, 데이터를 정리해 저장하고 꺼내 쓰게 해 주는 시스템)에 표 여러 개로 나뉘어 담겨 있어요. 표 하나하나는 테이블(Table, 엑셀 시트 같은 표)이라고 해요. 장사에 쓰는 이 데이터베이스를 '운영 DB'라고 불러요(DB는 데이터베이스의 줄임말).",
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
          alt: '■ 중지 버튼이 눌렸고 그 옆에 쿼리 중지됨 ✕. 빛줄기는 사라졌고 게이지는 15%. 결제 카드 3장이 모두 ✓ 완료. 태오가 노트북을 들고 옆에 서 있어요.',
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
          text: "파이프라인 맵에 운영 DB가 생겼어요. 앱의 주문이 쌓이는 곳이고, CSV도 여기서 내보낸 사본이었죠. 운영 DB에서 노트북으로 곧장 가는 '직접 쿼리' 점선엔 경고가 붙었어요.",
          alt: '파이프라인 맵 노드 4개. 새 실선 쇼핑몰 앱·웹 → 운영 DB (OLTP) → CSV 파일, CSV 파일 → 주니의 노트북 실선은 그대로. 운영 DB에서 주니의 노트북으로 빨간 경고 점선, 라벨 직접 쿼리와 게이지 아이콘 부하 경고.',
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
    mapNote: "운영 DB(OLTP)가 쇼핑몰 앱·웹 뒤에 생겼고, CSV 파일은 운영 DB에서 내보낸 사본으로 이어졌어요. 노트북으로 곧장 가는 '직접 쿼리' 경고 점선은 다음 챕터에서 정리해요.",
  },
}
