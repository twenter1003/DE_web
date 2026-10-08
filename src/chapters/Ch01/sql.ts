import { ch1, ORDERS, PRODUCTS, TODAY } from '../../content/chapters/ch1'

// SQL 실행기의 작은 해석기. 도움말 목록에 적은 SQL만 알아듣는다(진짜 SQL 엔진이 아니다).
// 결과는 공통 데이터(ORDERS·PRODUCTS)를 SQL의 논리적 처리 순서(FROM → JOIN → WHERE → GROUP BY → SELECT)대로 계산한다.
// 모르는 문법은 던지지 않고 { ok: false, error }로 돌려준다.

const I = ch1.interaction
const E = I.err
const H = I.hints
const L = I.log

export type Table = 'orders' | 'products'
export type ColId = `${Table}.${string}`
export type Val = string | number
export type Clause = 'SELECT' | 'FROM' | 'JOIN' | 'WHERE' | 'GROUP BY'

const TABLES: Record<Table, readonly string[]> = {
  orders: ['order_id', 'product_id', 'qty', 'price', 'ordered_at'],
  products: ['product_id', 'name'],
}
const ALL_COLS = [...new Set(Object.values(TABLES).flat())]
const NUM = new Set(['order_id', 'qty', 'price'])
const OPS = ['=', '<>', '!=', '>', '>=', '<', '<=']
const ORDER: Clause[] = ['SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY']
/** 절을 시작하는 말. AS 바로 뒤에 와도 별칭이 아니라 절로 본다(초보자는 AS 뒤 이름을 빠뜨리기 쉽다) */
const CLAUSE_WORDS = new Set(['SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP', 'INNER'])
/** 바꿔 써야 할 기호 */
const SYMBOL_FIX: Record<string, string> = { '≥': '>=', '≤': '<=', '≠': '<>', '＊': '*', '，': ',', '（': '(', '）': ')', '＝': '=', '；': ';', '＞': '>', '＜': '<' }
const UNSUPPORTED: Record<string, string> = {
  HAVING: 'HAVING', LIMIT: 'LIMIT', OFFSET: 'OFFSET', LEFT: 'LEFT JOIN', RIGHT: 'RIGHT JOIN', FULL: 'FULL JOIN',
  OUTER: 'OUTER JOIN', CROSS: 'CROSS JOIN', UNION: 'UNION', DISTINCT: 'DISTINCT', INSERT: 'INSERT', UPDATE: 'UPDATE', DELETE: 'DELETE',
  DROP: 'DROP', CREATE: 'CREATE', ALTER: 'ALTER', BETWEEN: 'BETWEEN', LIKE: 'LIKE', IN: 'IN', IS: 'IS', NOT: 'NOT', CASE: 'CASE', WITH: 'WITH',
}

export const bare = (c: ColId) => c.slice(c.indexOf('.') + 1)

export interface SqlError {
  /** 0부터 센 줄 번호 */
  line: number | null
  msg: string
  /** 바른 모양(코드) */
  hint?: string
  /** 철자가 비슷한 말 */
  near?: string
}

interface Tok {
  t: 'w' | 'n' | 's' | 'p'
  v: string
  up: string
  line: number
  /** 원문에서의 [시작, 끝) 글자 위치 */
  pos: number
  end: number
}
interface Ref {
  col: ColId
  text: string
  next: number
}
export type AggItem = { kind: 'agg'; fn: 'SUM' | 'COUNT'; args: ColId[]; text: string; alias?: string }
type Item = { kind: 'star'; table?: Table } | { kind: 'col'; col: ColId; text: string; alias?: string } | AggItem
export type Cond = { kind: 'date'; days: number } | { kind: 'cmp'; col: ColId; op: string; value: Val; text: string; lit: string }

export interface Row {
  id: number
  v: Record<string, Val>
}
export interface Group {
  key: Val[]
  ids: number[]
  aggs: (number | null)[]
}
/** 결과 열: 원본 열(col) 또는 합친 값(agg = aggItems 번호) */
export interface ResCol {
  label: string
  col?: ColId
  agg?: number
}
export interface Step {
  clause: Clause
  /** 0부터 센 [첫 줄, 끝 줄] */
  lines: [number, number]
  /** 원문에서 이 절이 차지하는 [시작, 끝) 글자 위치(편집기 강조용) */
  range: [number, number]
  log: string
  tag: string
  head: string
  text: string
}
export interface Run {
  join: boolean
  cond?: Cond
  groupBy?: ColId[]
  aggregated: boolean
  /** FROM(+JOIN) 직후의 행 */
  rows: Row[]
  /** WHERE를 통과한 행 id */
  kept: number[]
  groups: Group[]
  aggItems: AggItem[]
  cols: ResCol[]
  out: string[][]
  steps: Step[]
}

class Fail {
  constructor(readonly e: SqlError) {}
}
function fail(line: number | null, msg: string, extra?: Omit<SqlError, 'line' | 'msg'>): never {
  throw new Fail({ line, msg, ...extra })
}

/** 철자가 조금 다른 후보(글자 하나 틀림·빠짐·자리 바뀜. 4글자 넘으면 둘까지). 똑같으면 없음 */
function nearest(word: string, cands: readonly string[]): string | undefined {
  const w = word.toLowerCase()
  const limit = w.length <= 4 ? 1 : 2
  let best: string | undefined
  let bestD = limit + 1
  for (const c of cands) {
    const a = c.toLowerCase()
    // 최적 문자열 정렬 거리(Damerau-Levenshtein의 간단판)
    const d = Array.from({ length: w.length + 1 }, (_, i) => Array.from({ length: a.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)))
    for (let i = 1; i <= w.length; i++)
      for (let j = 1; j <= a.length; j++) {
        const cost = w[i - 1] === a[j - 1] ? 0 : 1
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
        if (i > 1 && j > 1 && w[i - 1] === a[j - 2] && w[i - 2] === a[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    const dist = d[w.length][a.length]
    if (dist > 0 && dist < bestD) {
      bestD = dist
      best = c
    }
  }
  return best
}

function lex(src: string): Tok[] {
  const toks: Tok[] = []
  let off = 0
  src
    .replace(/[‘’]/g, "'")
    .split('\n')
    .forEach((raw, line) => {
      const s = raw.replace(/--.*$/, '')
      const re = /\s+|([\p{L}_][\p{L}\p{N}_]*)|(\d+)|('[^']*'?)|(>=|<=|<>|!=|[=<>*,.();+-])/uy
      let i = 0
      while (i < s.length) {
        re.lastIndex = i
        const m = re.exec(s)
        if (!m) {
          const ch = String.fromCodePoint(s.codePointAt(i)!)
          if ('"“”'.includes(ch)) fail(line, E.doubleQuote, { hint: H.quote })
          fail(line, E.symbol(ch), { near: SYMBOL_FIX[ch] })
        }
        const pos = off + i
        i = re.lastIndex
        const [, w, n, str, p] = m
        const at = { line, pos, end: off + i }
        if (w) toks.push({ t: 'w', v: w, up: w.toUpperCase(), ...at })
        else if (n) toks.push({ t: 'n', v: n, up: n, ...at })
        else if (str) {
          if (str.length < 2 || !str.endsWith("'")) fail(line, E.quote, { hint: "product_id = 'P1'" })
          toks.push({ t: 's', v: str.slice(1, -1), up: str, ...at })
        } else if (p) toks.push({ t: 'p', v: p, up: p, ...at })
      }
      off += raw.length + 1
    })
  return toks
}

interface Seg {
  kw: Clause
  toks: Tok[]
  line: number
  end: number
  /** 원문 글자 위치 [시작, 끝) */
  pos: number
  stop: number
}

/** 절 키워드에서 끊는다 */
function split(toks: Tok[]): Seg[] {
  const segs: Seg[] = []
  for (let i = 0; i < toks.length; i++) {
    const k = toks[i]
    if (k.v === ';' && k.t === 'p') {
      if (i !== toks.length - 1) fail(k.line, E.semicolon)
      continue
    }
    if (k.t === 'w' && (toks[i - 1]?.up !== 'AS' || CLAUSE_WORDS.has(k.up))) {
      if (k.up === 'ORDER' && toks[i + 1]?.up === 'BY') fail(k.line, E.unsupported('ORDER BY'))
      if (UNSUPPORTED[k.up]) fail(k.line, E.unsupported(UNSUPPORTED[k.up]))
      if (k.up === 'AND' || k.up === 'OR') fail(k.line, E.andOr)
      let kw: Clause | null = null
      if (k.up === 'INNER' && toks[i + 1]?.up === 'JOIN') {
        kw = 'JOIN'
        i++
      } else if (k.up === 'GROUP' || k.up === 'BY') {
        if (k.up === 'BY' || toks[i + 1]?.up !== 'BY') fail(k.line, E.groupBy, { hint: toks.some((t) => t.up === 'JOIN') ? H.groupBy : H.groupByOne })
        kw = 'GROUP BY'
        i++
      } else if ((ORDER as string[]).includes(k.up)) kw = k.up as Clause
      if (kw) {
        segs.push({ kw, toks: [], line: k.line, end: toks[i].line, pos: k.pos, stop: toks[i].end })
        continue
      }
      const near = ![...ALL_COLS, ...Object.keys(TABLES)].includes(k.v.toLowerCase()) && nearest(k.up, ['SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP', 'GROUP BY'])
      if (near) fail(k.line, E.unknownWord(k.v), { near })
    }
    const cur = segs.at(-1)
    if (!cur) return fail(k.line, E.start, { hint: H.start })
    cur.toks.push(k)
    cur.end = k.line
    cur.stop = k.end
  }
  return segs
}

/** 괄호 밖의 쉼표로 나눈다 */
function commas(toks: Tok[]): Tok[][] {
  const parts: Tok[][] = [[]]
  let depth = 0
  for (const t of toks) {
    if (t.v === '(') depth++
    if (t.v === ')') depth--
    if (t.v === ',' && depth === 0) parts.push([])
    else parts.at(-1)!.push(t)
  }
  return parts
}

function resolve(tab: Tok | null, c: Tok, join: boolean): ColId {
  const col = c.v.toLowerCase()
  if (tab) {
    const tn = tab.v.toLowerCase()
    if (!(tn in TABLES)) fail(tab.line, E.table(tab.v), { near: nearest(tn, Object.keys(TABLES)) })
    const t = tn as Table
    if (t === 'products' && !join) fail(c.line, E.needJoin(`products.${c.v}`), { hint: H.join })
    if (!TABLES[t].includes(col)) fail(c.line, E.tableCol(t, c.v, TABLES[t].join(', ')), { near: nearest(col, TABLES[t]) })
    return `${t}.${col}`
  }
  const owners = (join ? (['orders', 'products'] as const) : (['orders'] as const)).filter((t) => TABLES[t].includes(col))
  if (owners.length === 2) fail(c.line, E.ambiguous, { hint: `orders.${col}` })
  if (owners.length === 1) return `${owners[0]}.${col}`
  if (TABLES.products.includes(col)) fail(c.line, E.needJoin(c.v), { hint: H.join })
  return fail(c.line, E.column(c.v), { near: nearest(col, ALL_COLS) ?? (col.length >= 3 ? ALL_COLS.find((x) => x.startsWith(col)) : undefined) })
}

/** t[i]부터 열 이름(표.열 또는 열). 열 이름 모양이 아니면 null */
function ref(t: Tok[], i: number, join: boolean): Ref | null {
  const a = t[i]
  if (a?.t !== 'w') return null
  if (t[i + 1]?.v === '.') {
    const b = t[i + 2]
    if (b?.t !== 'w') return null
    return { col: resolve(a, b, join), text: `${a.v}.${b.v}`, next: i + 3 }
  }
  return { col: resolve(null, a, join), text: a.v, next: i + 1 }
}

function item(p: Tok[], join: boolean, line0: number): Item {
  if (!p.length) return fail(line0, E.emptyItem)
  const line = p[0].line
  let alias: string | undefined
  const asAt = p.findIndex((t) => t.up === 'AS')
  if (asAt >= 0) {
    const a = p[asAt + 1]
    if (asAt === 0 || a?.t !== 'w' || asAt + 2 !== p.length) fail(line, E.alias, { hint: H.alias })
    alias = a.v
    p = p.slice(0, asAt)
  }
  const [a, b, c] = p
  if (p.filter((t) => t.v === '(').length !== p.filter((t) => t.v === ')').length) fail(line, E.paren, { hint: H.sum })
  if (p.length === 1 && a.v === '*') return alias ? fail(line, E.alias, { hint: H.alias }) : { kind: 'star' }
  if (p.length === 3 && b.v === '.' && c.v === '*') {
    const tn = a.v.toLowerCase()
    if (!(tn in TABLES)) fail(line, E.table(a.v), { near: nearest(tn, Object.keys(TABLES)) })
    if (tn === 'products' && !join) fail(line, E.needJoin('products.*'), { hint: H.join })
    return { kind: 'star', table: tn as Table }
  }
  if (a.t === 'w' && b?.v === '(') {
    const fn = a.up
    if (fn !== 'SUM' && fn !== 'COUNT') fail(line, E.func(a.v), { hint: H.sum })
    const close = p.findIndex((t) => t.v === ')')
    if (close < 0) fail(line, fn === 'SUM' ? E.sumArg : E.countArg, { hint: fn === 'SUM' ? H.sum : H.count })
    if (close !== p.length - 1) fail(line, E.missingComma, { hint: H.comma })
    const inner = p.slice(2, -1)
    if (fn === 'COUNT') {
      if (inner.length === 1 && inner[0].v === '*') return { kind: 'agg', fn, args: [], text: 'COUNT(*)', alias }
      // COUNT(열)은 비어 있지 않은 값을 센다. 이 데이터엔 빈 값이 없어서 COUNT(*)와 같다
      const r = ref(inner, 0, join)
      if (!r || r.next !== inner.length) fail(line, E.countArg, { hint: H.count })
      return { kind: 'agg', fn, args: [], text: `COUNT(${r.text})`, alias }
    }
    const r1 = ref(inner, 0, join)
    let args: Ref[] = []
    if (r1 && r1.next === inner.length) args = [r1]
    else if (r1 && inner[r1.next]?.v === '*') {
      const r2 = ref(inner, r1.next + 1, join)
      if (r2 && r2.next === inner.length) args = [r1, r2]
    }
    if (!args.length || args.some((r) => !NUM.has(bare(r.col)))) fail(line, E.sumArg, { hint: H.sum })
    return { kind: 'agg', fn, args: args.map((r) => r.col), text: `SUM(${args.map((r) => r.text).join(' * ')})`, alias }
  }
  const r = ref(p, 0, join)
  if (r && r.next === p.length) return { kind: 'col', col: r.col, text: r.text, alias }
  if (r && p[r.next]?.t === 'w') fail(line, E.missingComma, { hint: H.comma })
  return fail(line, E.generic(p.map((t) => (t.t === 's' ? `'${t.v}'` : t.v)).join(' ')))
}

function condition(seg: Seg, join: boolean): Cond {
  const t = seg.toks
  const line = seg.line
  function bad(msg: string = E.whereForm, hint: string = H.where): never {
    return fail(line, msg, { hint })
  }
  if (!t.length) bad()
  if (t[0].up === 'DATE') {
    const r = t[1]?.v === '(' ? ref(t, 2, join) : null
    if (!r || r.col !== 'orders.ordered_at' || t[r.next]?.v !== ')' || t[r.next + 1]?.v !== '=' || t[r.next + 2]?.up !== 'CURRENT_DATE') bad(E.dateForm, H.date)
    let i = r.next + 3
    let days = 0
    if (t[i]?.v === '-') {
      if (t[i + 1]?.t !== 'n') bad(E.dateForm, H.date)
      days = Number(t[i + 1].v)
      if (days > MAX_DAYS) bad(E.dateFar(MAX_DAYS), H.date)
      i += 2
    }
    if (i !== t.length) bad(E.dateForm, H.date)
    return { kind: 'date', days }
  }
  const r = ref(t, 0, join)
  if (!r) return bad()
  const op = t[r.next]
  const lit = t[r.next + 1]
  if (r.col === 'orders.ordered_at') bad(E.dateForm, H.date)
  if (op?.t !== 'p' || !OPS.includes(op.v) || !lit || r.next + 2 !== t.length) bad()
  const isNum = NUM.has(bare(r.col))
  if (isNum && lit.t === 's') fail(line, E.noQuote(r.text), { hint: `${r.text} ${op.v} 2` })
  if (isNum && lit.t !== 'n') bad(E.whereForm, `${r.text} ${op.v} 2`)
  if (!isNum && lit.t !== 's') {
    const sample = lit.t === 'w' ? lit.v : bare(r.col) === 'name' ? PRODUCTS[0].name : PRODUCTS[0].product_id
    fail(line, E.needQuote(r.text), { hint: `${r.text} = '${sample}'` })
  }
  if (!isNum && !['=', '<>', '!='].includes(op.v)) fail(line, E.textOp(r.text), { hint: `${r.text} = '${lit.v}'` })
  return { kind: 'cmp', col: r.col, op: op.v, value: isNum ? Number(lit.v) : lit.v, text: r.text, lit: lit.v }
}

const MAX_DAYS = 9999
// 데이터에는 연도가 없어서 모든 주문과 오늘을 같은 해(2000년, 이야기 속 아무 해)로 본다
const YEAR = 2000
const md = (s: string) => s.split(' ')[0].split('/').map(Number)
/** 이야기 속 오늘에서 n일 전 */
function dayOf(days: number) {
  const [m, d] = md(TODAY)
  return new Date(YEAR, m - 1, d - days)
}
/** 화면에 보일 날짜(월/일, 해가 다르면 'n년 전 ' 앞붙임) */
function dayText(days: number) {
  const dt = dayOf(days)
  const y = YEAR - dt.getFullYear()
  return `${y ? L.yearsAgo(y) : ''}${dt.getMonth() + 1}/${dt.getDate()}`
}

export const fmt = (col: ColId | undefined, v: Val | null | undefined) =>
  v === null || v === undefined ? I.nullValue : typeof v === 'number' && (!col || bare(col) !== 'order_id') ? v.toLocaleString('ko-KR') : String(v)

const cmpVal = (a: Val, b: Val) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ko'))

function test(c: Cond, r: Row) {
  if (c.kind === 'date') {
    const [m, d] = md(String(r.v['orders.ordered_at']))
    return new Date(YEAR, m - 1, d).getTime() === dayOf(c.days).getTime()
  }
  const a = r.v[c.col]
  const b = c.value
  switch (c.op) {
    case '=':
      return a === b
    case '<>':
    case '!=':
      return a !== b
    case '>':
      return Number(a) > Number(b)
    case '>=':
      return Number(a) >= Number(b)
    case '<':
      return Number(a) < Number(b)
    default:
      return Number(a) <= Number(b)
  }
}

function compileOrThrow(src: string): Run {
  const segs = split(lex(src))
  if (!segs.length) fail(null, E.empty)
  if (segs[0].kw !== 'SELECT') fail(segs[0].line, E.start, { hint: H.start })
  let last = -1
  for (const s of segs) {
    const k = ORDER.indexOf(s.kw)
    if (k === last) fail(s.line, E.dup(s.kw))
    if (k < last) fail(s.line, E.order(s.kw, ORDER[last]))
    last = k
  }
  const get = (k: Clause) => segs.find((s) => s.kw === k)
  const selS = segs[0]
  const fromS = get('FROM') ?? fail(selS.line, E.noFrom, { hint: H.from })
  const joinS = get('JOIN')
  const whereS = get('WHERE')
  const groupS = get('GROUP BY')
  const join = !!joinS

  if (fromS.toks.length !== 1 || fromS.toks[0].v.toLowerCase() !== 'orders')
    fail(fromS.line, E.fromTable, { hint: H.from, near: fromS.toks.length === 1 ? nearest(fromS.toks[0].v, ['orders']) : undefined })
  if (joinS) {
    const text = joinS.toks.map((t) => (t.t === 'w' ? t.v.toLowerCase() : t.v)).join(' ')
    const ok = ['orders . product_id = products . product_id', 'products . product_id = orders . product_id'].map((s) => `products on ${s}`)
    if (!ok.includes(text)) fail(joinS.line, E.join, { hint: H.join })
  }

  if (!selS.toks.length) fail(selS.line, E.selectEmpty, { hint: H.select })
  const sel = commas(selS.toks).map((p) => item(p, join, selS.line))
  const cond = whereS ? condition(whereS, join) : undefined
  const groupRefs = groupS
    ? commas(groupS.toks).map((p) => {
        const r = ref(p, 0, join)
        return r && r.next === p.length ? r : fail(groupS.line, E.groupForm, { hint: join ? H.groupBy : H.groupByOne })
      })
    : undefined
  const groupBy = groupRefs?.map((r) => r.col)

  const aggItems = sel.filter((i): i is AggItem => i.kind === 'agg')
  const aggregated = aggItems.length > 0 || !!groupBy
  if (aggregated && sel.some((i) => i.kind === 'star')) fail(selS.line, E.star)
  if (aggregated) {
    const missing = [...new Set(sel.flatMap((i) => (i.kind === 'col' && !groupBy?.includes(i.col) ? [i.text] : [])))]
    if (missing.length)
      fail(groupS?.line ?? selS.line, E.groupMissing(missing.join(', ')), { hint: `GROUP BY ${[...(groupRefs?.map((r) => r.text) ?? []), ...missing].join(', ')}` })
  }

  // ── 실행: FROM → JOIN → WHERE → GROUP BY → SELECT ──
  const rows: Row[] = ORDERS.flatMap((o) => {
    const v: Record<string, Val> = {}
    for (const c of TABLES.orders) v[`orders.${c}`] = (o as Record<string, Val>)[c]
    if (!join) return [{ id: o.order_id, v }]
    const p = PRODUCTS.find((x) => x.product_id === o.product_id)
    if (!p) return []
    for (const c of TABLES.products) v[`products.${c}`] = (p as Record<string, Val>)[c]
    return [{ id: o.order_id, v }]
  })
  const byId = new Map(rows.map((r) => [r.id, r]))
  const keptRows = cond ? rows.filter((r) => test(cond, r)) : rows
  const kept = keptRows.map((r) => r.id)

  let groups: Group[] = []
  if (aggregated) {
    const keys = groupBy ?? []
    const map = new Map<string, Group>()
    for (const r of keptRows) {
      const key = keys.map((c) => r.v[c])
      const k = JSON.stringify(key)
      if (!map.has(k)) map.set(k, { key, ids: [], aggs: [] })
      map.get(k)!.ids.push(r.id)
    }
    if (!keys.length && !map.size) map.set('[]', { key: [], ids: [], aggs: [] })
    groups = [...map.values()].sort((a, b) => {
      for (let i = 0; i < a.key.length; i++) {
        const d = cmpVal(a.key[i], b.key[i])
        if (d) return d
      }
      return 0
    })
    for (const g of groups)
      g.aggs = aggItems.map((a) =>
        a.fn === 'COUNT' ? g.ids.length : g.ids.length ? g.ids.reduce((s, id) => s + a.args.reduce((p, c) => p * Number(byId.get(id)!.v[c]), 1), 0) : null,
      )
  }

  const starCols = (t?: Table): ColId[] =>
    (t ? [t] : join ? (['orders', 'products'] as const) : (['orders'] as const)).flatMap((tn) => TABLES[tn].map((c) => `${tn}.${c}` as ColId))
  let k = 0
  const cols: ResCol[] = sel.flatMap((i): ResCol[] =>
    i.kind === 'star' ? starCols(i.table).map((col) => ({ label: bare(col), col })) : i.kind === 'col' ? [{ label: i.alias ?? bare(i.col), col: i.col }] : [{ label: i.alias ?? i.text, agg: k++ }],
  )
  const out = aggregated
    ? groups.map((g) => cols.map((c) => (c.agg !== undefined ? fmt(undefined, g.aggs[c.agg]) : fmt(c.col, g.key[groupBy!.indexOf(c.col!)]))))
    : keptRows.map((r) => cols.map((c) => fmt(c.col, r.v[c.col!])))

  // ── 실행 기록(논리적 처리 순서) ──
  const steps: Step[] = []
  const add = (s: Seg, clause: Clause, head: string, text: string) => {
    const tag = I.lineTag(s.line + 1, s.end + 1)
    steps.push({ clause, lines: [s.line, s.end], range: [s.pos, s.stop], tag, head, text, log: I.logLine(tag, head, text) })
  }
  add(fromS, 'FROM', 'FROM orders', L.from(ORDERS.length))
  if (joinS) add(joinS, 'JOIN', 'JOIN products', L.join(rows.length))
  if (whereS && cond) {
    const desc = cond.kind === 'date' ? L.condDate(L.dayLabel(cond.days), dayText(cond.days)) : L.condCmp(cond.text, typeof cond.value === 'string' ? `'${cond.lit}'` : cond.lit, cond.op)
    const outIds = rows.filter((r) => !kept.includes(r.id)).map((r) => r.id)
    const outText = !outIds.length ? L.whereNone : outIds.length <= 5 ? L.whereOut(outIds.join('·')) : L.whereOutMany(outIds.length)
    add(whereS, 'WHERE', 'WHERE', L.where(desc, rows.length, kept.length, outText))
  }
  const aggText = aggItems.map((a) => a.text).join(', ')
  if (groupS && groupBy) {
    const detail = groups.length && groups.length <= 4 ? L.groupDetail(groups.map((g) => L.groupPart(g.key.map((v, i) => fmt(groupBy[i], v)).join('·'), g.ids.length))) : ''
    add(groupS, 'GROUP BY', 'GROUP BY', L.group(groupRefs!.map((r) => r.text).join(', '), kept.length, groups.length, detail) + (aggItems.length ? L.aggs(aggText) : ''))
  }
  const onlyStar = sel.length === 1 && sel[0].kind === 'star' && !sel[0].table
  let selText = onlyStar ? L.selectStar(out.length) : L.select(cols.map((c) => c.label).join(', '), out.length)
  if (aggregated && !groupBy) selText = L.selectOne(kept.length, aggText) + selText
  if (out.length && out.length <= 4) selText += L.preview(out.map((r) => r.join(' ')).join(' / '))
  if (groups.some((g) => g.aggs.includes(null))) selText += L.nullNote
  add(selS, 'SELECT', 'SELECT', selText)

  return { join, cond, groupBy, aggregated, rows, kept, groups, aggItems, cols, out, steps }
}

export function compile(src: string): { ok: true; run: Run } | { ok: false; error: SqlError } {
  try {
    return { ok: true, run: compileOrThrow(src) }
  } catch (e) {
    return { ok: false, error: e instanceof Fail ? e.e : { line: null, msg: E.internal } }
  }
}
