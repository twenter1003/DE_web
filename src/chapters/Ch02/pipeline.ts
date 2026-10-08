import { ch2, RAW_ORDERS, type OrderRow } from '../../content/chapters/ch2'

// 파이프라인 코드 실행기의 해석기. 진짜 파이썬이 아니라 I.commands 7가지만 알아듣는다.
// 코드를 한 번에 끝까지 돌려 줄마다 상태 사진(Snap)을 남기고, 화면은 그 사진을 한 장씩 넘겨 보여 준다.
// 어떤 입력에도 예외를 던지지 않는다: 못 알아들은 줄은 친절한 오류 한 줄로 멈춘다.

const I = ch2.interaction
const W = I.words
export type CmdName = keyof typeof I.commands
export type Kind = 'extract' | 'transform' | 'load' | 'report'
export type Col = keyof OrderRow
export const NAMES = Object.keys(I.commands) as CmdName[]
export const kindOf = (n: CmdName) => I.commands[n].kind as Kind

export interface Row extends OrderRow {
  uid: number
  /** fill_missing으로 채운 칸 */
  filled: Col[]
}
export interface Snap {
  /** 데이터가 어디 있나: 아직 없음 / 벨트 위 / 분석용 DB 안 */
  where: 'none' | 'belt' | 'store'
  rows: Row[]
  /** 지워진 줄과 지워질 때의 자리(사라지는 모습을 그리려고) */
  gone: { row: Row; slot: number }[]
  /** ELT: 저장소 안에 그대로 남은 원본 */
  orig: Row[] | null
  table: string
  /** 이번 줄에서 바뀐 칸 `${uid}:${col}` */
  changed: string[]
}
export interface Step {
  /** 0부터 센 코드 줄 번호 */
  line: number
  name: string
  kind: Kind | null
  /** 분석용 DB 안에서 실행됐나 */
  inside: boolean
  ok: boolean
  text: string
  snap: Snap
}
export type Shape = 'etl' | 'elt' | 'copy' | 'none'
export interface Trace {
  steps: Step[]
  shape: Shape
  /** 실행할 줄 수(빈 줄·주석 제외) */
  total: number
}

export const EMPTY: Snap = { where: 'none', rows: [], gone: [], orig: null, table: '', changed: [] }

// ── 읽기 ──────────────────────────────────────────────────────

const squash = (s: string) => s.replace(/\s+/g, '').toLowerCase()
const isOneOf = (v: string, list: readonly string[]) => list.some((w) => squash(w) === squash(v))
const unquote = (s: string) => s.trim().replace(/^(["'`])(.*)\1$/, '$2').trim()

interface Call {
  name: string
  pos: string[]
  kw: [string, string][]
}
type Parsed = { skip: true } | { skip: false; call?: Call; error?: string; near?: CmdName }

/** 따옴표 밖의 문자만 보며 f를 부른다. 따옴표 짝이 안 맞으면 false */
function scan(s: string, f: (c: string, i: number) => boolean | void): boolean {
  let q = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === q) q = ''
    } else if (c === '"' || c === "'") q = c
    else if (f(c, i) === true) return true
  }
  return !q
}

function splitArgs(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  scan(s, (c, i) => {
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0) {
      out.push(s.slice(from, i))
      from = i + 1
    }
  })
  out.push(s.slice(from))
  return out.map((a) => a.trim()).filter(Boolean)
}

/** 편집 거리(오타 추천용) */
function dist(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= b.length; j++) {
      const t = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = t
    }
  }
  return d[b.length]
}
/** 비교용 열쇠: 대소문자·밑줄·빼기·점·띄어쓰기를 무시한다(remove-duplicates, removeDuplicates, 중복 제거) */
const key = (s: string) => s.toLowerCase().replace(/[\s_\-.·]/g, '')
function nearest(name: string): CmdName | null {
  const n = key(name)
  if (!n) return null
  const alias = NAMES.find((c) => [c, ...I.commands[c].alias].some((a) => key(a) === n))
  if (alias) return alias
  let best: CmdName | null = null
  let bd = Infinity
  for (const c of NAMES) {
    const k = key(c)
    const v = k.startsWith(n) || n.startsWith(k) ? 1 : dist(n, k)
    if (v < bd) [best, bd] = [c, v]
  }
  return bd <= Math.max(2, Math.floor(n.length / 3)) ? best : null
}

const isCmd = (n: string): n is CmdName => (NAMES as string[]).includes(n)

const NAME = '[A-Za-z_가-힣][\\w가-힣.\\-]*'
const CALL = new RegExp(`^(?:([\\w가-힣]+)\\s*=\\s*)?(${NAME})\\s*(?:\\(([\\s\\S]*)\\))?$`)
const HEAD = new RegExp(`^(?:[\\w가-힣]+\\s*=\\s*)?(${NAME})`)

export function parseLine(raw: string): Parsed {
  let s = raw
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/＝/g, '=')
  // # 뒤는 주석(따옴표 안의 #은 글자)
  let cut = -1
  scan(s, (c, i) => {
    if (c === '#') {
      cut = i
      return true
    }
  })
  if (cut >= 0) s = s.slice(0, cut)
  s = s.trim().replace(/;$/, '').trim()
  // 빈 줄, 그리고 다른 언어 습관의 // 메모도 건너뛴다
  if (!s || s.startsWith('//')) return { skip: true }

  const head = (HEAD.exec(s)?.[1] ?? '').toLowerCase()
  // 쓰려던 명령 짐작: '중복 제거(data)'처럼 띄어 쓴 이름도 괄호 앞 글자 전체로 찾아본다
  const before = s.replace(/^[\w가-힣]+\s*=\s*/, '').split('(')[0]
  const near: CmdName | undefined = isCmd(head) ? head : (nearest(before) ?? nearest(head) ?? undefined)
  let depth = 0
  let bad = false
  const closed = scan(s, (c) => {
    if (c === '(') depth++
    else if (c === ')' && --depth < 0) bad = true
  })
  if (!closed) return { skip: false, error: I.err.quote, near }
  if (bad || depth !== 0) return { skip: false, error: I.err.unclosed, near }

  const m = CALL.exec(s)
  if (!m) {
    const error = !near ? `${I.err.unreadable} ${I.err.known(NAMES)}` : isCmd(head) ? I.err.unreadable : I.err.unknown(before.trim(), near)
    return { skip: false, error, near }
  }
  const [, variable, typed, inner] = m
  // 명령 이름은 대소문자를 가리지 않는다(Extract, EXTRACT도 extract)
  const name = typed.toLowerCase()
  if (!isCmd(name)) {
    const guess = nearest(name)
    return { skip: false, error: guess ? I.err.unknown(typed, guess) : `${I.err.unknown(typed, null)} ${I.err.known(NAMES)}`, near: guess ?? undefined }
  }
  if (variable && variable.toLowerCase() !== W.data) return { skip: false, error: I.err.variable(variable), near: name }
  if (inner === undefined) return { skip: false, error: I.err.noParen(name), near: name }
  const pos: string[] = []
  const kw: [string, string][] = []
  for (const a of splitArgs(inner)) {
    const k = /^([\w가-힣]+)\s*=\s*([\s\S]*)$/.exec(a)
    if (k) kw.push([k[1], unquote(k[2])])
    else pos.push(unquote(a))
  }
  return { skip: false, call: { name, pos, kw } }
}

/** 이 줄이 쓰려던 명령(오타가 있어도 가장 가까운 명령). 실험 버튼과 ETL/ELT 판단이 쓴다 */
export function commandOf(line: string): CmdName | null {
  return intent(parseLine(line))
}
const intent = (p: Parsed): CmdName | null => (p.skip ? null : p.call && isCmd(p.call.name) ? p.call.name : (p.near ?? null))

// ── 데이터 살피기 ───────────────────────────────────────────────

const COL_KEYS = Object.keys(W.cols) as Col[]
const colLabel = (c: Col) => W.cols[c][0]
const colOf = (v: string): Col | null => COL_KEYS.find((c) => isOneOf(v, W.cols[c])) ?? null

export const isNum = (price: string) => /^\d+$/.test(price)
export const isStdDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)
export const region = (addr: string) => addr.trim().split(/\s+/)[0] ?? ''

/** '06/09/2026'·'2026.6.9'처럼 숫자 셋으로 된 날짜를 YYYY-MM-DD로. 못 읽으면 그대로 */
export function stdDate(d: string): string {
  const n = d.match(/\d+/g)
  if (!n || n.length !== 3) return d
  const [y, mo, da] = n[0].length === 4 ? n : n[2].length === 4 ? [n[2], n[0], n[1]] : [null, null, null]
  if (!y || !mo || !da) return d
  return `${y}-${mo.padStart(2, '0')}-${da.padStart(2, '0')}`
}

export interface Issues {
  dup: string[]
  dupRows: Set<number>
  blank: number
  text: number
  date: number
  total: number
}
export function issuesOf(rows: Row[]): Issues {
  const seen = new Set<string>()
  const dupRows = new Set<number>()
  const dup: string[] = []
  let blank = 0
  let text = 0
  let date = 0
  for (const r of rows) {
    if (seen.has(r.id)) {
      dupRows.add(r.uid)
      if (!dup.includes(r.id)) dup.push(r.id)
    }
    seen.add(r.id)
    blank += COL_KEYS.filter((c) => r[c].trim() === '').length
    if (!isNum(r.price)) text++
    if (!isStdDate(r.date)) date++
  }
  return { dup, dupRows, blank, text, date, total: dupRows.size + blank + text + date }
}

export interface Report {
  count: number
  revenue: number
  /** 지역 → 건수. 채운 칸은 FILLED, 빈칸은 BLANK로 센다 */
  regions: [string, number][]
  dates: [string, number][]
  issues: Issues
}
export const BLANK = '\u0000blank'
const FILLED = '\u0000filled'
/** 원본에 실제로 있는 지역들 */
const REAL = new Set(RAW_ORDERS.filter((r) => r.addr.trim()).map((r) => region(r.addr)))
/** 빈 배송지를 진짜 지역 이름으로 채웠나(모르는 주소가 그 지역으로 세어진다) */
export const filledReal = (r: Row) => r.filled.includes('addr') && REAL.has(region(r.addr))
/** 리포트의 지역 칸: 빈칸 / 채운 값 그대로 / 지역 */
const regionOf = (r: Row) => (r.addr.trim() === '' ? BLANK : r.filled.includes('addr') && !filledReal(r) ? r.addr.trim() : region(r.addr))
const tally = (keys: string[]) => {
  const m = new Map<string, number>()
  keys.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1))
  return [...m]
}
export function reportOf(rows: Row[]): Report {
  return {
    count: rows.length,
    // 글자로 된 가격은 합계에서 빠진다(장면 3과 같은 규칙)
    revenue: rows.reduce((a, r) => a + (isNum(r.price) ? Number(r.price) : 0), 0),
    regions: tally(rows.map(regionOf)),
    dates: tally(rows.map((r) => r.date)),
    issues: issuesOf(rows),
  }
}
/** 비교용 열쇠: '미입력'·'모름'처럼 채운 표시는 글자가 달라도 '채움' 하나로 본다. 진짜 지역 이름으로 채우면 그 지역으로 센다 */
export const regionKey = (rows: Row[]) =>
  JSON.stringify(tally(rows.map((r) => (r.filled.includes('addr') && !filledReal(r) ? FILLED : regionOf(r)))).sort())

// ── 실행 ───────────────────────────────────────────────────────

const RAW_ISSUES = issuesOf(RAW_ORDERS.map((r, uid) => ({ ...r, uid, filled: [] }))).total

class Stop extends Error {}
const fail = (msg: string): never => {
  throw new Stop(msg)
}

interface State {
  snap: Snap
  extracted: boolean
  loaded: boolean
}

/** 첫 칸의 data는 있어도 되고 없어도 된다 */
function dropData(call: Call): string[] {
  const p = [...call.pos]
  if (!p.length) return p
  if (squash(p[0]) === W.data) p.shift()
  // remove_duplicates(df)처럼 data가 아닌 이름을 넘기면
  else if (/^[A-Za-z_]\w*$/.test(p[0]) && !colOf(p[0]) && !isOneOf(p[0], W.targets)) fail(I.err.dataArg(p[0]))
  return p
}
const noMore = (rest: string[], kw: [string, string][]) => {
  if (rest.length) fail(I.err.extra(rest[0]))
  if (kw.length) fail(I.err.extra(kw[0][0]))
}

function apply(call: Call, st: State, rawAfter: boolean): { text: string; inside: boolean } {
  const L = I.log
  const name = call.name as CmdName
  const kind = kindOf(name)
  const s = st.snap
  const inside = st.loaded && kind === 'transform'

  if (name === 'extract') {
    if (st.extracted) fail(I.err.twiceExtract)
    const [first, second, when, ...more] = call.pos
    // extract("orders")처럼 표 이름만 써도 된다
    const [src, table]: (string | undefined)[] = first !== undefined && second === undefined && isOneOf(first, W.tables) ? [undefined, first] : [first, second]
    if (src !== undefined && !isOneOf(src, W.sources)) fail(I.err.source(src))
    if (table !== undefined && !isOneOf(table, W.tables)) fail(I.err.table(table))
    noMore(more, [])
    // 날짜는 날짜="어제"로 써도, 세 번째 칸에 "어제"로 써도 된다
    const dates = call.kw.filter(([k]) => isOneOf(k, W.dateKeys) || fail(I.err.extra(k))).map(([, v]) => v)
    for (const v of when === undefined ? dates : [when, ...dates]) if (!isOneOf(v, W.yesterday)) fail(I.err.date(v))
    const rows: Row[] = RAW_ORDERS.map((r, uid) => ({ ...r, uid, filled: [] }))
    st.extracted = true
    st.snap = { ...EMPTY, where: 'belt', rows }
    const is = issuesOf(rows)
    const F = L.found
    const found = [is.dupRows.size && F.dup(is.dupRows.size), is.blank && F.blank(is.blank), is.text && F.text(is.text), is.date && F.date(is.date)].filter(
      (x): x is string => typeof x === 'string',
    )
    return { text: L.extract(rows.length, found), inside: false }
  }

  if (name === 'report') {
    st.snap = { ...s, changed: [] }
    if (!st.loaded) return { text: L.reportEmpty, inside: false }
    const r = reportOf(s.rows)
    return { text: L.report(r.count, r.revenue), inside: false }
  }

  if (!st.extracted) fail(I.err.noData)
  const rest = dropData(call)

  if (name === 'load') {
    if (st.loaded) fail(I.err.twiceLoad)
    const [target, ...more] = rest
    if (target !== undefined && !isOneOf(target, W.targets)) fail(I.err.target(target))
    noMore(more, call.kw)
    st.loaded = true
    const table = rawAfter ? I.fig.tables.orig : I.fig.tables.main
    st.snap = { ...s, where: 'store', table, changed: [] }
    const partial = issuesOf(s.rows).total < RAW_ISSUES
    return { text: rawAfter ? L.loadRaw(s.rows.length, table, partial) : L.load(s.rows.length, table), inside: false }
  }

  // 변환: 저장소 안이면 원본을 남기고 정리본에서 한다
  let rows = s.rows.map((r) => ({ ...r, filled: [...r.filled] }))
  let prefix = ''
  const next: Snap = { ...s, changed: [] }
  if (inside && !s.orig) {
    next.orig = s.rows
    next.table = I.fig.tables.clean
    prefix = L.copyFirst
  }
  const changed = next.changed
  let text = ''

  if (name === 'remove_duplicates') {
    noMore(rest, call.kw)
    const seen = new Set<string>()
    const dup: string[] = []
    const gone = [...s.gone]
    rows = rows.filter((r, slot) => {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        return true
      }
      if (!dup.includes(r.id)) dup.push(r.id)
      gone.push({ row: r, slot })
      return false
    })
    next.gone = gone
    text = L.dedupe(s.rows.length, rows.length, dup)
  } else if (name === 'fill_missing') {
    const pairs: [string, string][] = [...call.kw]
    if (rest.length === 2) pairs.push([rest[0], rest[1]])
    else if (rest.length) fail(rest.length === 1 ? I.err.fillWhat : I.err.extra(rest[2]))
    if (!pairs.length) fail(I.err.fillWhat)
    const parts: string[] = []
    for (const [k, v] of pairs) {
      const col = colOf(k) ?? fail(I.err.column(k, COL_KEYS.map(colLabel)))
      if (!v) fail(I.err.fillEmpty)
      const hit: string[] = []
      for (const r of rows) {
        if (r[col].trim() !== '') continue
        r[col] = v
        r.filled.push(col)
        hit.push(r.id)
        changed.push(`${r.uid}:${col}`)
      }
      parts.push(L.fill(colLabel(col), v, hit))
    }
    text = parts.join(' ')
  } else if (name === 'to_number') {
    const [target = colLabel('price'), ...more] = rest
    noMore(more, call.kw)
    const col = colOf(target) ?? fail(I.err.column(target, COL_KEYS.map(colLabel)))
    if (col !== 'price') fail(I.err.numberCol(colLabel(col)))
    let first: [string, string] | null = null
    let n = 0
    for (const r of rows) {
      if (isNum(r.price)) continue
      const digits = r.price.replace(/\D/g, '')
      if (!digits) continue
      first ??= [r.price, digits]
      r.price = digits
      n++
      changed.push(`${r.uid}:price`)
    }
    text = L.toNumber(n, first?.[0] ?? '', first?.[1] ?? '')
  } else {
    // fix_dates
    const [c, ...more] = rest
    noMore(more, call.kw)
    if (c !== undefined) {
      const col = colOf(c) ?? fail(I.err.column(c, COL_KEYS.map(colLabel)))
      if (col !== 'date') fail(I.err.dateCol(colLabel(col)))
    }
    const kinds = new Set(rows.map((r) => r.date)).size
    let n = 0
    for (const r of rows) {
      const d = stdDate(r.date)
      if (d === r.date) continue
      r.date = d
      n++
      changed.push(`${r.uid}:date`)
    }
    text = L.fixDates(n, kinds, rows.find((r) => isStdDate(r.date))?.date ?? '')
  }

  next.rows = rows
  st.snap = next
  return { text: prefix + text, inside }
}

export function run(code: string): Trace {
  const lines = code.split('\n')
  const parsed = lines.map(parseLine)
  // 줄 순서(ETL/ELT)는 쓰려던 명령으로 판단한다: 오타가 난 줄도 자리는 센다
  const calls = parsed.map(intent)
  const firstLoad = calls.indexOf('load')
  const transforms = calls.flatMap((c, i) => (c && kindOf(c) === 'transform' ? [i] : []))
  const shape: Shape = firstLoad < 0 ? 'none' : !transforms.length ? 'copy' : transforms.some((i) => i > firstLoad) ? 'elt' : 'etl'

  const st: State = { snap: EMPTY, extracted: false, loaded: false }
  const steps: Step[] = []
  for (let line = 0; line < lines.length; line++) {
    const p = parsed[line]
    if (p.skip) continue
    const want = intent(p)
    const name = want ?? ''
    const kind = want ? kindOf(want) : null
    try {
      if (!p.call) fail(p.error ?? I.err.unreadable)
      const rawAfter = line === firstLoad && transforms.some((i) => i > line)
      const r = apply(p.call!, st, rawAfter)
      steps.push({ line, name, kind, inside: r.inside, ok: true, text: r.text, snap: st.snap })
    } catch (e) {
      const msg = e instanceof Stop ? e.message : I.err.internal
      const ex = p.near ?? (p.call ? (p.call.name as CmdName) : null)
      steps.push({
        line,
        name,
        kind,
        inside: st.loaded && kind === 'transform',
        ok: false,
        text: ex ? `${msg} ${I.err.tryThis(I.commands[ex].example)}` : msg,
        snap: { ...st.snap, changed: [] },
      })
      break
    }
  }
  return { steps, shape, total: parsed.filter((p) => !p.skip).length }
}

/** 처음 코드를 돌린 결과 = 리포트가 맞았는지 견줄 '실제' 값 */
const truthSnap = run(I.code.join('\n')).steps.at(-1)?.snap ?? EMPTY
export const TRUTH = { report: reportOf(truthSnap.rows), regionKey: regionKey(truthSnap.rows) }
