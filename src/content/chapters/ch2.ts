import type { ChapterContent } from '../types'

// Ch2. 첫 파이프라인 — ETL과 배치 — 스토리보드: docs/storyboard/03-ch2.md

export interface OrderRow {
  id: string
  date: string
  product: string
  price: string
  addr: string
}

/** 6월 9일에 새로 들어온 주문 6행(장면 3~5 공통 원본). 2042는 결제 버튼이 두 번 눌려 두 줄이에요. */
export const RAW_ORDERS: OrderRow[] = [
  { id: '2041', date: '2026-06-09', product: '주방세제', price: '5000', addr: '서울 마포구' },
  { id: '2042', date: '06/09/2026', product: '고무장갑', price: '4,000원', addr: '부산 해운대구' },
  { id: '2042', date: '06/09/2026', product: '고무장갑', price: '4,000원', addr: '부산 해운대구' },
  { id: '2043', date: '2026.6.9', product: '수세미', price: '3000', addr: '' },
  { id: '2044', date: '2026-06-09', product: '주방세제', price: '5,000원', addr: '대전 서구' },
  { id: '2045', date: '2026-06-09', product: '칫솔', price: '2000', addr: '광주 북구' },
]

/** 정제 뒤 5행: 중복 제거 · 결측치 '미입력' 표시 · 가격은 숫자, 날짜는 한 가지 모양 */
export const CLEAN_ORDERS: OrderRow[] = [
  { id: '2041', date: '2026-06-09', product: '주방세제', price: '5000', addr: '서울 마포구' },
  { id: '2042', date: '2026-06-09', product: '고무장갑', price: '4000', addr: '부산 해운대구' },
  { id: '2043', date: '2026-06-09', product: '수세미', price: '3000', addr: '미입력' },
  { id: '2044', date: '2026-06-09', product: '주방세제', price: '5000', addr: '대전 서구' },
  { id: '2045', date: '2026-06-09', product: '칫솔', price: '2000', addr: '광주 북구' },
]

const etl = {
  extract: ['추출', 'Extract'],
  transform: ['변환', 'Transform'],
  load: ['적재', 'Load'],
} as const

/** 받침에 따라 '으로'/'로'(한글이 아니면 '(으)로') */
const ro = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  if (!(c >= 0 && c <= 11171)) return '(으)로'
  const jong = c % 28
  return jong === 0 || jong === 8 ? '로' : '으로'
}
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const ids = (list: string[]) => list.join('·')

// 인터랙션: 파이프라인 코드 실행기. 아래 명령만 알아듣는 작은 해석기(src/chapters/Ch02/pipeline.ts)가 RAW_ORDERS로 계산한다.
const interaction = {
  title: '파이프라인 코드 실행기',
  hint: '주니가 짠 야간 배치 코드예요. **▶ 실행**을 누르면 코드가 한 줄씩 돌면서, 주문이 어떻게 꺼내지고 정리돼 실리는지 그림으로 보여 줘요. 코드는 직접 고쳐도 되고, 실험 버튼으로 바꿔도 돼요.',
  note: (n: number) => `진짜 파이썬이 아니라, 아래 명령 ${n}가지만 알아듣는 연습용 실행기예요. 실제로는 더 복잡해서, 분석용 DB 안에서 하는 변환은 보통 SQL 같은 다른 코드로 따로 써요.`,

  editorLabel: '파이프라인 코드 (고쳐도 돼요)',
  /** 처음 코드. 줄마다 명령 하나 */
  code: [
    'data = extract("운영 DB", "orders", 날짜="어제")',
    'data = remove_duplicates(data)',
    'data = fill_missing(data, 배송지="미입력")',
    'data = to_number(data, "가격")',
    'data = fix_dates(data)',
    'load(data, "분석용 DB")',
    'report()',
  ],

  experimentsTitle: '실험',
  experiments: {
    noDedupe: { label: '중복 제거 줄 지우기', watch: '중복 제거 줄을 지웠어요. ▶ 실행을 누르고 아침 리포트의 주문 수를 보세요.' },
    elt: { label: 'load를 위로 올리기 (ELT로 바꾸기)', watch: 'load 줄을 extract 바로 아래로 올렸어요. ▶ 실행을 누르고 정리가 어디에서 일어나는지 보세요.' },
    noNumber: { label: '가격 숫자로 바꾸기 빼기', watch: 'to_number 줄을 지웠어요. ▶ 실행을 누르고 매출 합계를 보세요.' },
    reset: { label: '처음 코드로', watch: '처음 코드로 돌아왔어요.' },
  },
  same: '이미 그렇게 바뀌어 있어요. ▶ 실행을 눌러 보세요.',

  controls: { run: '실행', pause: '멈춤', step: '한 줄씩', reset: '처음부터' },
  progress: (done: number, all: number) => `${all}줄 중 ${done}줄 실행`,

  helpTitle: (n: number) => `알아듣는 명령 ${n}가지`,
  helpMore: '맨 앞의 `data =`는 빼도 되고, 따옴표도 빼도 돼요. `#` 뒤는 메모(주석)라서 실행하지 않아요.',
  /** 명령 이름(코드) → 종류·짧은 이름·예시·설명. 종류가 스테이션 아이콘을 정한다. alias는 실행하지 않고 '혹시 …인가요?' 추천에만 쓴다 */
  commands: {
    extract: { kind: 'extract', short: '꺼내기', alias: ['추출', '꺼내기', '수거'], example: 'data = extract("운영 DB", "orders", 날짜="어제")', desc: '운영 DB에서 어제 주문을 복사해 꺼내요.' },
    remove_duplicates: { kind: 'transform', short: '중복 제거', alias: ['중복 제거', 'drop_duplicates', 'dedupe'], example: 'data = remove_duplicates(data)', desc: '주문번호가 같은 줄은 하나만 남겨요.' },
    fill_missing: { kind: 'transform', short: '빈칸 채우기', alias: ['빈칸 채우기', '결측치 처리', 'fillna'], example: 'data = fill_missing(data, 배송지="미입력")', desc: '빈칸을 정한 값으로 채워요.' },
    to_number: { kind: 'transform', short: '숫자로', alias: ['숫자로', '숫자로 바꾸기', 'to_numeric'], example: 'data = to_number(data, "가격")', desc: "'4,000원'처럼 글자로 된 가격을 숫자로 바꿔요." },
    fix_dates: { kind: 'transform', short: '날짜 통일', alias: ['날짜 통일', '날짜 맞추기', 'to_datetime'], example: 'data = fix_dates(data)', desc: '모양이 제각각인 날짜를 한 가지 모양으로 맞춰요.' },
    load: { kind: 'load', short: '싣기', alias: ['적재', '싣기', '배송', 'save'], example: 'load(data, "분석용 DB")', desc: '분석용 DB에 표로 실어요.' },
    report: { kind: 'report', short: '리포트', alias: ['리포트', '보고서', 'print', 'show'], example: 'report()', desc: '분석용 DB에 실린 표로 아침 리포트를 계산해요.' },
  },
  /** 해석기가 알아듣는 값(띄어쓰기·대소문자는 무시) */
  words: {
    data: 'data',
    sources: ['운영 DB', 'oltp'],
    tables: ['orders', '주문'],
    dateKeys: ['날짜', 'date'],
    yesterday: ['어제', 'yesterday'],
    targets: ['분석용 DB', '분석용 저장소', 'warehouse'],
    /** 칸 이름. 첫 번째가 화면에 쓰는 이름 */
    cols: { id: ['주문번호', 'id'], date: ['주문일', '날짜', 'date'], product: ['상품', 'product'], price: ['가격', 'price'], addr: ['배송지', '주소', 'addr'] },
  },

  /** 스테이션 종류(택배 물류센터 비유와 같은 이름) */
  kinds: { extract: '수거', transform: '분류·포장', load: '배송', report: '리포트' },

  fig: {
    source: '운영 DB',
    sourceSub: 'orders',
    srcCount: (n: number) => `어제 주문 ${n}건`,
    srcKeep: ['꺼내도', '원본은 그대로'],
    store: '분석용 DB',
    belt: 'data',
    tables: { main: '주문', orig: '주문_원본', clean: '주문_정리본' },
    count: (n: number) => `${n}건`,
    clean: '정리됨',
    dirty: (n: number) => `고칠 곳 ${n}`,
    heads: { id: '주문번호', date: '주문일', price: '가격', region: '지역' },
    dup: '중복',
    blank: '빈칸',
    stop: '멈춤',
  },
  legend: '따옴표 "…" = 글자로 저장된 값 · 점선 = 고칠 곳 · 반듯한 블록 = 정리 끝난 줄',

  now: {
    idle: '아직 실행 전이에요. ▶ 실행이나 한 줄씩을 누르면, 실행 중인 줄이 이 그림에서 어떻게 움직이는지 보여 줘요.',
  },
  logTitle: '실행 기록',
  logEmpty: '실행하면 줄마다 무슨 일이 있었는지 여기에 쌓여요.',
  log: {
    entry: (n: number, name: string, inside: boolean, text: string) => `${n}줄 \`${name}\`${inside ? ' (분석용 DB 안에서)' : ''}: ${text}`,
    error: (n: number, text: string) => `${n}줄에서 멈췄어요. ${text}`,
    extract: (n: number, found: string[]) =>
      `운영 DB에서 어제 주문 ${n}건을 복사해 꺼냈어요. 운영 DB의 주문은 그대로예요. ` + (found.length ? `살펴보니 ${found.join(', ')}이 섞여 있어요.` : '고칠 곳은 없어요.'),
    found: {
      dup: (n: number) => `중복 ${n}건`,
      blank: (n: number) => `빈칸 ${n}곳`,
      text: (n: number) => `글자로 된 가격 ${n}칸`,
      date: (n: number) => `모양이 다른 날짜 ${n}칸`,
    },
    copyFirst: "원본 표는 그대로 두고, 복사한 '주문_정리본' 표를 정리해요. ",
    dedupe: (before: number, after: number, dup: string[]) => (after < before ? `${before}건 → ${after}건, ${ids(dup)}번이 두 번 있었어요.` : `중복이 없어요. ${after}건 그대로예요.`),
    fill: (col: string, value: string, filled: string[]) =>
      filled.length ? `${col} 빈칸 ${filled.length}곳(${ids(filled)}번)을 '${value}'${ro(value)} 채웠어요.` : `${col}에는 빈칸이 없어요. 그대로예요.`,
    toNumber: (n: number, from: string, to: string) => (n ? `글자로 된 가격 ${n}칸을 숫자로 바꿨어요. '${from}' → ${to}처럼요. 이제 합계에 들어가요.` : '가격이 이미 모두 숫자예요.'),
    fixDates: (n: number, kinds: number, to: string) => (n ? `날짜 모양 ${kinds}가지를 ${to} 한 가지 모양으로 맞췄어요. ${n}칸이 바뀌었어요.` : '날짜 모양이 이미 한 가지예요.'),
    load: (n: number, table: string) => `${n}건을 분석용 DB의 '${table}' 표에 실었어요.`,
    loadRaw: (n: number, table: string, partial: boolean) =>
      partial
        ? `위에서 일부만 정리한 ${n}건을 분석용 DB의 '${table}' 표에 그대로 실었어요. 나머지 정리는 실은 다음 저장소 안에서 해요.`
        : `정리하기 전 ${n}건을 분석용 DB의 '${table}' 표에 그대로 실었어요. 정리는 실은 다음 저장소 안에서 해요.`,
    report: (n: number, sum: number) => `분석용 DB에서 아침 리포트를 계산했어요. 주문 ${n}건, 매출 ${won(sum)}.`,
    reportEmpty: '분석용 DB가 비어 있어서 계산할 게 없어요. load 줄이 먼저 실행돼야 해요.',
  },
  err: {
    nothing: '실행할 줄이 없어요. 처음 코드로 버튼을 눌러 보세요.',
    unknown: (name: string, near: string | null) => `모르는 명령이에요: ${name}.` + (near ? ` 혹시 ${near}인가요?` : ''),
    known: (names: string[]) => `알아듣는 명령은 ${names.join(', ')}예요. 편집기 아래 '알아듣는 명령' 목록에 쓰는 법이 있어요.`,
    unreadable: '이 줄을 읽지 못했어요. 명령은 이름(…) 모양으로 써요.',
    noParen: (name: string) => `${name} 뒤에 괄호 ( )가 빠졌어요.`,
    unclosed: '여는 괄호 (와 닫는 괄호 )의 짝이 맞지 않아요.',
    quote: '따옴표의 짝이 맞지 않아요.',
    variable: (v: string) => `이 실행기는 data라는 이름 하나만 기억해요. 맨 앞의 '${v} ='를 'data ='로 바꿔 주세요.`,
    dataArg: (v: string) => `이 실행기는 data라는 이름 하나만 기억해요. 괄호 안의 '${v}'를 'data'로 바꿔 주세요.`,
    noData: '아직 꺼낸 데이터가 없어요. 이 줄보다 위에 extract 줄이 있어야 해요.',
    twiceExtract: 'extract는 한 번만 써요. 이미 위에서 꺼내 왔어요.',
    twiceLoad: 'load는 한 번만 써요. 두 번 실으면 같은 주문이 두 번 들어가요.',
    source: (v: string) => `'${v}'에서는 꺼낼 수 없어요. 꺼내 올 곳은 '운영 DB'예요.`,
    table: (v: string) => `'${v}' 표는 없어요. 이 연습의 표는 orders(주문) 하나예요.`,
    date: (v: string) => `날짜는 '어제'만 돼요. '${v}'의 주문은 이 연습 데이터에 없어요.`,
    target: (v: string) => `'${v}'에는 실을 수 없어요. 실을 곳은 '분석용 DB'예요.`,
    column: (v: string, cols: string[]) => `'${v}'라는 칸은 없어요. 칸 이름은 ${cols.join(', ')}예요.`,
    numberCol: (v: string) => `'${v}' 칸은 숫자로 바꾸지 않아요. 숫자로 바꿀 칸은 '가격'이에요.`,
    dateCol: (v: string) => `'${v}' 칸은 날짜가 아니에요. 날짜 칸은 '주문일'이에요.`,
    fillWhat: '어느 칸을 무엇으로 채울지 적어요.',
    fillEmpty: '채울 값이 비어 있어요.',
    extra: (v: string) => `'${v}'는 이 명령에 쓰지 않는 값이에요.`,
    tryThis: (example: string) => `이렇게 써 보세요: \`${example}\``,
    internal: '이 줄을 실행하다가 예상하지 못한 문제가 생겼어요. 처음 코드로 버튼을 눌러 다시 해 보세요.',
  },

  report: {
    title: '아침 리포트',
    from: (table: string) => `분석용 DB '${table}' 표에서 계산`,
    empty: '분석용 DB가 아직 비어 있어요. load 줄이 실행되면 여기서 숫자를 계산해요.',
    labels: { count: '주문 수', revenue: '매출 합계', regions: '지역별 주문', dates: '날짜별 주문' },
    count: (n: number) => `${n}건`,
    won,
    pair: (k: string, n: number) => `${k} ${n}`,
    datePair: (k: string, n: number) => `${k} ${n}건`,
    blankRegion: '(빈칸)',
    right: '실제와 같아요',
    wrong: (v: string) => `실제는 ${v}`,
    differs: '실제와 달라요',
    why: {
      dup: (dup: string[]) => `${ids(dup)}번 주문이 두 번 세어졌어요.`,
      dupPrice: (dup: string[]) => `${ids(dup)}번 가격이 두 번 더해졌어요.`,
      text: (n: number) => `글자로 된 가격 ${n}칸은 숫자가 아니라서 합계에서 빠졌어요.`,
      blank: (n: number) => `배송지가 빈 주문 ${n}건은 어느 지역인지 몰라 (빈칸)으로 묶였어요.`,
      filledReal: (v: string) => `빈 배송지를 '${v}'${ro(v)} 채워서, 주소를 모르는 주문이 그 지역 주문으로 세어졌어요.`,
      dates: (k: number) => `같은 날 주문인데 날짜 모양이 ${k}가지라서 ${k}칸으로 쪼개졌어요.`,
    },
  },

  modes: { etl: 'ETL', elt: 'ELT' },
  shape: {
    etl: '지금 코드는 ETL 순서예요. 추출 → 변환 → 적재, 정리를 싣기 전에 해요.',
    elt: '지금 코드는 ELT 순서예요. 추출 → 적재 → 변환, 정리를 분석용 DB 안에서 해요.',
    copy: "지금 코드에는 정리하는 줄이 없어요. 주니가 처음 했던 '그대로 복사'와 같아요.",
    none: '지금 코드에는 load 줄이 없어서, 분석용 DB에 아무것도 싣지 않아요.',
  },
  prosTitle: '좋은 점',
  consTitle: '조심할 점',
  etl: {
    pros: '저장소에는 정리된 데이터만 들어가요. 정리 전 값을 실수로 셀 일이 없어요.',
    cons: '저장소에 원본이 남지 않아요. 정리 규칙을 바꾸면 운영 DB에서 처음부터 다시 꺼내 와야 해요.',
  },
  elt: {
    pros: '원본이 그대로 남아요. 규칙이 바뀌면 저장소 안에서 다시 변환하면 돼요.',
    cons: "저장소 안에 정리 안 된 원본이 쌓여요. 원본을 바로 세면 '6건' 같은 틀린 숫자가 나올 수 있어요.",
  },
  common: '어느 쪽도 틀리지 않아요. 원본을 다시 쓸 일이 있는지, 저장소가 넉넉한지에 따라 골라요.',
  live: { reset: '처음으로 되돌렸어요. 아직 아무 줄도 실행하지 않았어요.' },
}

const figures = {
  // 장면 2. 문제
  noDirect: '직접 조회 금지',
  storeQ: '분석용 저장소 ?',
  forOrders: '주문·결제용',
  forAnalysis: '분석용',
  days: ['월', '화', '수', '목', '금'],
  forgot: '깜빡함',

  // 장면 3. 시도와 실패
  cols: { id: '주문번호', date: '주문일', product: '상품', price: '가격', addr: '배송지' },
  srcTable: '운영 DB · 주문',
  copyTable: '분석용 저장소 · 주문(복사본)',
  copyArrow: '그대로 복사',
  orders: (n: number) => `어제 주문 ${n}건`,
  revenueWrong: '어제 매출 10,000원',
  revenueRight: '어제 매출 19,000원',
  realOrders: '실제 5건',
  realRevenue: '실제 19,000원',
  dup: '= 중복',
  textTag: '글자',
  dupNote: '바구니의 초기 주문 표는 같은 주문번호가 두 번 들어가는 걸 막지 못했어요.',
  sumNote: '도구에 따라서는 합계가 아예 오류로 멈추기도 해요.',
  byDate: '날짜별 주문 수',
  count: (n: number) => `${n}건`,
  byRegion: '지역별 주문',
  regions: [
    ['서울', '1'],
    ['부산', '2'],
    ['대전', '1'],
    ['광주', '1'],
    ['(빈칸)', '1'],
  ],

  // 장면 4. 비유와 ETL
  boxStations: ['수거', '분류·포장', '배송'],
  etlStations: [etl.extract, etl.transform, etl.load],
  source: ['운영 DB', 'OLTP'],
  store: ['분석용', '저장소'],
  bypass: '주니의 복사: 변환 없음',
  transformNote: '변환에는 정리 말고도 합치기·계산하기가 들어갈 수 있어요.',
  cells: ['중복 제거', '결측치 처리', '형식 통일'],
  missing: '미입력',
  cleanTable: '분석용 저장소 · 주문_정리본',
  report: '어제 리포트',
  missingCount: '배송지 미입력 1건',
  oneDay: '6월 9일',

  // 장면 5. ETL과 ELT
  rawName: '주문_원본',
  cleanName: '주문_정리본',
  beforeTag: '정리 전',
  storeName: '분석용 저장소',
  choice: '정답은 없어요 · 순서의 선택',

  // 장면 6. 해결
  dayRange: '6월 9일 00:00 ~ 24:00',
  hours: ['00:00', '06:00', '12:00', '18:00', '24:00'],
  nextDay: '다음 날',
  orderTimes: ['09:12', '11:40', '14:05', '19:30', '22:48'],
  basket: '어제 주문',
  flag: '야간 ETL 배치 실행 · 03:00',
  flagTime: '03:00',
  batchNote: '배치 주기는 하루가 아니어도 돼요. 한 시간마다 돌리기도 해요.',
  phone: ['6월 9일', '주문 5건', '매출 19,000원', '배송지 미입력 1건'],
  ceoPhone: '윤 대표의 휴대폰',
}

export const ch2: ChapterContent<'problem' | 'attempt' | 'analogy' | 'definition' | 'solution', typeof interaction, typeof figures> = {
  id: 'ch2',
  opening: {
    alt: '주니의 책상. 노트북 한 대와 머그컵이 있고, 노트북에는 Ch1에서 붙인 임시 규칙 포스트잇이 붙어 있어요: 큰 분석은 운영 DB에서 멈추기, 손님 적은 시간에만, 짧은 기간만. 주니에게 질문하러 오는 동료는 아직 없어요.',
    lines: [
      { who: 'seok', text: '포스트잇 규칙으론 오래 못 버텨요.' },
      { who: 'seok', text: '운영 DB는 이제 건드리지 말고, 밤마다 복사해서 따로 분석해요.' },
      { who: 'juni', mood: 'panic', text: '밤마다요? 어떻게 옮기는지부터 모르겠어요.' },
      { who: 'juni', mood: 'focus', text: '…일단 해볼게요!' },
    ],
  },
  scenes: {
    problem: {
      title: '분석할 곳이 따로 없어요',
      steps: [
        {
          text: '운영 DB에서 무거운 분석을 돌리면 결제가 느려질 수 있어요. 지난번에 겪은 일이죠. 그렇다고 숫자를 안 볼 수는 없어요.',
          lines: [{ who: 'ceo', text: '그래서 어제 몇 개 팔렸어요?' }],
          alt: '파이프라인 맵 노드 4개. 쇼핑몰 앱·웹에서 CSV 파일을 거쳐 주니의 노트북으로, 쇼핑몰 앱·웹에서 운영 DB로 실선이 이어져요. 운영 DB에서 노트북으로 가는 직접 쿼리 점선은 흐려졌고, 가운데에 빨간 ✕와 직접 조회 금지 표시가 있어요.',
        },
        {
          text: '그래서 분석만 하는 곳을 따로 둬요. 이런 곳을 분석용 저장소(Analytical data store, 운영 DB와 떨어져 분석만 맡는 저장소)라고 해요. 여기선 무거운 쿼리를 돌려도 결제와 상관없어요.',
          alt: '운영 DB 오른쪽에 점선 테두리의 빈 상자 분석용 저장소 ?. 두 상자 사이는 비어 있고 회색 물음표 하나. 아래에 각각 주문·결제용, 분석용 라벨.',
        },
        {
          text: '남은 문제는 데이터를 옮기는 방법이에요. 지금처럼 주니가 아침마다 손으로 CSV를 내보내면 빠뜨리기 쉽고 늦어요.',
          lines: [{ who: 'juni', mood: 'focus', text: '밤마다 새 주문을 그대로 복사하면 되겠죠?' }],
          alt: '운영 DB와 분석용 저장소 ? 사이에 손 아이콘과 CSV 파일. 아래 요일 띠에서 월·화·목·금 칸에는 CSV가 놓였고, 수요일 칸만 비어 깜빡함.',
        },
      ],
    },
    attempt: {
      title: '그대로 복사했더니',
      steps: [
        {
          text: '주니는 밤마다 그날 새로 들어온 주문을 그대로 복사하는 짧은 프로그램(스크립트)을 만들었어요. 원본의 행이 한 글자도 바뀌지 않고 옮겨져요.',
          lines: [{ who: 'juni', mood: 'focus', text: '복사 끝! 이제 마음껏 셀 수 있어요.' }],
          alt: '위는 운영 DB의 주문 표, 아래는 분석용 저장소의 주문(복사본) 표. 6월 9일에 들어온 주문 6행이 그대로 복사돼 두 표가 똑같아요. 2042번이 두 줄, 2043번은 배송지가 비어 있고, 가격과 날짜의 모양이 행마다 달라요.',
        },
        {
          text: '다음 날 리포트에 어제 주문이 6건으로 나왔어요. 결제 버튼이 두 번 눌려, 2042번 주문이 두 줄로 저장돼 있었거든요.',
          lines: [{ who: 'ceo', text: '6건이요? 제가 확인한 건 5건인데요.' }],
          alt: '리포트 카드: 어제 주문 6건 ✕ 실제 5건. 복사본 표에서 2042번 두 행이 빨간 테두리로 묶이고 오른쪽에 = 중복 표시.',
        },
        {
          text: "매출은 10,000원으로 나왔어요. 가격 칸에 '4,000원'처럼 글자가 섞인 값은 숫자로 바뀌지 않아 합계에서 빠졌거든요. 날짜도 모양이 제각각이라, 날짜별로 묶으니 같은 6월 9일이 세 칸으로 쪼개졌어요.",
          alt: "리포트 카드: 어제 매출 10,000원 ✕ 실제 19,000원. 가격 열의 '4,000원' 두 칸과 '5,000원' 한 칸에 빨간 밑줄과 글자 표시. 아래 날짜별 막대 세 개: 2026-06-09 3건, 06/09/2026 2건, 2026.6.9 1건.",
        },
        {
          text: '2043번 주문은 배송지가 비어 있어요. 이런 빈 값을 결측치(Missing value, 있어야 할 값이 비어 있는 것)라고 해요. 그대로 옮기면 원본의 지저분한 값도 그대로 따라와요.',
          lines: [{ who: 'juni', mood: 'panic', text: '그대로 복사했을 뿐인데, 왜 다 틀리죠?' }],
          alt: '2043번 행의 빈 배송지 칸에 점선 테두리. 그 칸에서 이어진 선이 지역별 주문 표의 (빈칸) 1 행에 닿고, 그 행에 빨간 ✕. 표는 서울 1, 부산 2, 대전 1, 광주 1, (빈칸) 1. 옆에 당황한 주니.',
        },
      ],
    },
    analogy: {
      title: '비유: 택배 물류센터',
      steps: [
        {
          text: '택배 물류센터를 떠올려 봐요. 상자를 수거하고, 분류·포장해서, 배송해요. 제멋대로 들어온 상자도 나갈 땐 반듯해요.',
          alt: '컨베이어 벨트와 스테이션 세 개: 수거, 분류·포장, 배송. 왼쪽엔 찌그러지고 크기가 제각각인 상자들, 오른쪽엔 크기가 똑같은 반듯한 상자들과 트럭. 벨트 위 상자 하나가 분류·포장을 지나며 반듯해졌어요.',
        },
        {
          text: '데이터도 똑같아요. 꺼내고, 정리하고, 싣는 과정을 ETL(Extract·Transform·Load, 추출·변환·적재)이라고 해요. 주니가 빠뜨린 건 가운데 단계예요.',
          alt: '스테이션 라벨이 추출 Extract, 변환 Transform, 적재 Load로 바뀌었어요. 벨트 왼쪽 끝은 운영 DB, 오른쪽 끝은 분석용 저장소. 아래에 원본 6행이 울퉁불퉁한 블록 6개로 놓여 있어요. 변환만 강조색 테두리이고, 그 위로 변환을 건너뛰는 회색 점선 주니의 복사: 변환 없음.',
        },
        {
          text: "변환에서는 중복을 지우고, 빈칸을 처리하고, 가격은 숫자로·날짜는 한 가지 모양으로 맞춰요. 이 일을 정제(Cleansing, 틀리거나 지저분한 값을 바로잡는 일)라고 해요. 실제로는 더 복잡하지만, 여기선 빈 배송지에 '미입력' 표시만 해요.",
          alt: "변환 안의 세 칸: 중복 제거, 결측치 처리, 형식 통일. 그 아래 반듯해진 블록 5개: 2042번은 하나만 남고, 2043번 배송지는 '미입력', 가격은 5000·4000·3000·5000·2000 숫자로 오른쪽 정렬, 주문일은 모두 2026-06-09.",
        },
        {
          text: '정리된 블록이 분석용 저장소에 차곡차곡 실려요. 같은 리포트를 다시 계산하면 이제 숫자가 맞아요.',
          lines: [{ who: 'juni', mood: 'focus', text: '정리하는 단계가 빠져 있었네요.' }],
          alt: '분석용 저장소 안 주문_정리본 표 5행. 리포트 카드: 어제 주문 5건 ✓, 어제 매출 19,000원 ✓, 배송지 미입력 1건. 막대 세 개가 합쳐져 6월 9일 막대 하나(5건).',
        },
      ],
    },
    definition: {
      title: '정의: ETL과 ELT는 순서의 선택',
      steps: [
        {
          text: '순서를 바꿀 수도 있어요. 원본부터 싣고, 정리는 나중에 하는 거예요. 이걸 ELT(Extract·Load·Transform, 먼저 싣고 저장소 안에서 변환하는 방식)라고 해요.',
          alt: '스테이션 순서가 추출, 적재, 변환. 변환은 분석용 저장소 상자 안으로 옮겨졌어요. 저장소 안에 주문_원본(울퉁불퉁한 블록 6개, 정리 전)과 주문_정리본(반듯한 블록 5개)이 나란히 있어요.',
        },
        {
          text: '저장·연산이 싸고 쉽게 늘릴 수 있는 분석용 저장소가 흔해지면서 ELT가 많이 쓰이게 됐어요. 원본을 넉넉히 쌓아 두고, 저장소 안에서 필요할 때 다시 정리할 수 있거든요.',
          alt: '두 줄 비교. 위 ETL: 추출, 변환, 적재 순서이고 저장소엔 주문_정리본만. 아래 ELT: 추출, 적재 다음 저장소 안에서 변환, 저장소엔 주문_원본과 주문_정리본. 아래 줄 저장소 상자가 더 넓어요.',
        },
        {
          text: 'ETL이 틀린 게 아니에요. 정리한 다음 실을지, 실은 다음 정리할지 순서를 고르는 거예요. 아래 코드에서 줄 순서를 직접 바꿔 보세요.',
          lines: [{ who: 'juni', mood: 'focus', text: '정리하는 곳이 저장소 밖이냐, 안이냐네요.' }],
          alt: '두 줄 가운데 라벨: 정답은 없어요 · 순서의 선택. 위 줄 변환은 저장소 밖, 아래 줄 변환은 저장소 안에 있고 둘 다 점선 원으로 표시돼 있어요.',
        },
      ],
    },
    solution: {
      title: '매일 밤 한 번, 야간 배치',
      steps: [
        {
          text: '주니는 밤마다 돌리던 복사를 ETL로 바꿨어요. 이렇게 하루치를 모아 한밤중에 한 번에 처리하는 방식을 배치(Batch, 데이터를 모아 두었다가 정해진 때 한꺼번에 처리하는 방식)라고 해요. 주문이 드문 시간에 운영 DB를 한 번만 읽으니 결제 부담도 적어요.',
          alt: '6월 9일 00:00부터 다음 날 03:00까지의 세로 시간 띠. 09:12, 11:40, 14:05(두 건), 19:30, 22:48의 주문 6건이 어제 주문 바구니에 모였다가, 03:00 깃발 야간 ETL 배치 실행에서 한꺼번에 컨베이어로 쏟아졌어요.',
        },
        {
          text: "맵에 '야간 ETL 배치'와 분석용 저장소인 '분석용 DB'가 생겼어요. 운영 DB에서 노트북으로 바로 가던 점선은 사라졌어요.",
          lines: [{ who: 'juni', mood: 'focus', text: '당분간은 매일 새벽 제가 직접 실행할게요.' }],
          alt: '맵: 쇼핑몰 앱·웹, 운영 DB, 야간 ETL 배치(매일 03:00), 분석용 DB, 주니의 노트북이 실선으로 이어져요. 쇼핑몰 앱·웹에서 CSV 파일을 거쳐 노트북으로 가는 실선은 아직 남아 있고, 운영 DB와 노트북 사이 점선은 없어요.',
        },
        {
          text: "아침마다 손으로 내보내던 CSV 파일도 이제 필요 없어요. 노트북 자리는 배치가 끝나면 채워지는 '아침 리포트'가 됐어요.",
          alt: '맵 노드 5개: 쇼핑몰 앱·웹, 운영 DB, 야간 ETL 배치, 분석용 DB, 아침 리포트(매일 08:00). CSV 파일 노드와 그 연결선은 사라졌어요.',
        },
        {
          text: "다음 날 아침, 윤 대표가 리포트를 직접 열어 봐요. 이제 '몇 개예요?'라고 묻지 않아도 돼요.",
          lines: [
            { who: 'ceo', text: '5건, 1만 9천 원. 이제 안 물어봐도 되겠네요.' },
            { who: 'juni', mood: 'proud', text: '어젯밤에 정리해서 실어 뒀어요!' },
          ],
          alt: '맵의 아침 리포트에서 실선 화살표가 윤 대표의 휴대폰으로 이어져요. 휴대폰 화면의 리포트 카드: 6월 9일, 주문 5건 ✓, 매출 19,000원 ✓, 배송지 미입력 1건.',
        },
      ],
    },
  },
  interaction,
  figures,
  summary: '옮기기만 해서는 숫자가 틀리니, 꺼내고·정리하고·싣는 과정(ETL)을 정해진 때 한꺼번에(배치) 돌려야 믿을 수 있는 리포트가 매일 아침 나와요.',
  quiz: {
    question: '주니가 운영 DB의 주문을 그대로 복사했더니 리포트의 주문 수·매출·지역별 집계가 틀렸어요. ETL에서 바로 이 문제를 막으려고 있는 단계는 무엇일까요?',
    options: [
      { id: 'a', text: '추출(Extract)을 더 자주 한다', feedback: '자주 꺼내도 원본에 있던 중복·빈칸·글자로 된 가격은 그대로 따라와요. 틀린 숫자를 더 자주 보게 될 뿐이에요.' },
      {
        id: 'b',
        text: '변환(Transform)에서 중복을 지우고 빈칸과 형식을 정리한다',
        correct: true,
        feedback: '숫자가 틀린 건 원본이 분석하기 좋은 모양이 아니었기 때문이에요. 변환 단계의 정제가 중복 제거·결측치 처리·형식 통일로 집계를 맞게 만들어요.',
      },
      { id: 'c', text: '적재(Load)할 때 더 큰 저장소를 쓴다', feedback: '저장소 크기는 숫자의 정확도와 상관없어요. 지저분한 데이터는 큰 저장소에 실어도 지저분해요.' },
      { id: 'd', text: '리포트를 볼 때마다 사람이 눈으로 고친다', feedback: '매일 손으로 고치면 빠뜨리기 쉽고 사람마다 다르게 고쳐요. 정리 규칙을 파이프라인에 한 번 넣어 두려고 ETL을 만드는 거예요.' },
    ],
    explanation: "ETL의 핵심은 '옮기기'가 아니라 '분석할 수 있는 모양으로 만들어 옮기기'예요. ELT도 순서만 다를 뿐 변환 단계는 똑같이 필요해요.",
  },
  growth: {
    line: { who: 'juni', mood: 'proud', text: '네, 이렇게 하면 돼요. 밤마다 꺼내고, 정리하고, 싣는 거예요.' },
    mapNote: "야간 ETL 배치와 분석용 DB가 생기고, CSV 파일과 '직접 쿼리' 점선은 사라졌어요. 주니의 노트북 자리는 아침 리포트가 됐어요.",
  },
}
