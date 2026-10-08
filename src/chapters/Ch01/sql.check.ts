// SQL 실행기 해석기 자체 점검. 실행: npx jiti src/chapters/Ch01/sql.check.ts
// 기대값은 스토리보드(docs/storyboard/02-ch1.md)의 결과 표에서 왔다.
import { ch1 } from '../../content/chapters/ch1'
import { compile } from './sql'

const I = ch1.interaction
const E = I.err
const ex = Object.fromEntries(I.experiments.map((e) => [e.id, e.code]))
const show = (v: unknown) => JSON.stringify(v)
function ok(src: string) {
  const r = compile(src)
  if (!r.ok) throw new Error(`실행돼야 함: ${show(src)} → ${r.error.msg}`)
  return r.run
}
function bad(src: string, msg: string, near?: string) {
  const r = compile(src)
  if (r.ok || !r.error.msg.startsWith(msg.slice(0, 12)) || (near && r.error.near !== near)) throw new Error(`오류여야 함: ${show(src)} → ${r.ok ? '실행됨' : show(r.error)}`)
}
function eq(a: unknown, b: unknown, what: string) {
  if (show(a) !== show(b)) throw new Error(`${what}: ${show(a)} ≠ ${show(b)}`)
}

const fin = ok(I.initial)
eq(fin.out, [['P1', '수세미', '4'], ['P2', '칫솔', '2'], ['P3', '주방세제', '1'], ['P4', '고무장갑', '2']], '최종 쿼리')
eq(fin.steps.map((s) => s.clause), ['FROM', 'JOIN', 'WHERE', 'GROUP BY', 'SELECT'], '논리적 처리 순서')
eq(fin.steps.map((s) => s.lines), [[1, 1], [2, 2], [3, 3], [4, 4], [0, 0]], '단계별 줄')
eq(ok(ex.revenue).out.map((r) => r[2]), ['12,000', '4,000', '5,000', '8,000'], '어제 매출')
eq(ok(ex.all).out.length, 10, 'SELECT *')
eq(ok(ex.where).kept, [2004, 2005, 2006, 2007, 2008], '어제 주문')
eq(ok(ex.group).out, [['P1', '4'], ['P2', '2'], ['P3', '1'], ['P4', '2']], '상품별 개수')
bad(ex.broken, E.groupMissing(''))
eq(ok('select sum(qty) as n from orders where date(ordered_at) = current_date - 1').out, [['9']], '어제 전체 개수')
eq(ok('SELECT product_id, SUM(qty * price) AS 매출 FROM orders GROUP BY product_id').out.map((r) => r[1]), ['21,000', '6,000', '10,000', '12,000'], '전체 기간 매출')
eq(ok('SELECT COUNT(*) AS c FROM orders WHERE qty >= 2').out, [['4']], 'COUNT + qty 조건')
eq(ok("SELECT * FROM orders JOIN products ON products.product_id = orders.product_id WHERE name = '수세미'").out.length, 4, '이름 조건')
eq(ok('SELECT * FROM orders WHERE DATE(ordered_at) = CURRENT_DATE').kept, [2009, 2010], '오늘')
eq(ok("select * from orders where product_id = 'P9'").out.length, 0, '없는 상품')
eq(ok("select sum(qty) from orders where product_id = 'P9'").out, [[I.nullValue]], '빈 SUM')
eq(ok('SELECT * FROM orders JOIN products ON orders.product_id = products.product_id').cols.length, 7, 'JOIN한 *')

bad('', E.empty)
bad('SELCT * FROM orders', E.unknownWord('SELCT'), 'SELECT')
bad('SELECT * FORM orders', E.unknownWord('FORM'), 'FROM')
bad('SELECT qyt FROM orders', E.column('qyt'), 'qty')
bad('SELECT name FROM orders', E.needJoin('name'))
bad('SELECT product_id FROM orders JOIN products ON orders.product_id = products.product_id', E.ambiguous)
bad('SELECT * FROM orders ORDER BY qty', E.unsupported('ORDER BY'))
bad('SELECT * FROM orders WHERE qty >= 2 AND price > 1', E.andOr)
bad("SELECT * FROM orders WHERE product_id = 'P1", E.quote)
bad('SELECT * FROM orders; SELECT 1', E.semicolon)
bad('SELECT *, SUM(qty) FROM orders', E.star)
bad('FROM orders SELECT *', E.start)
bad('SELECT * FROM orders GROUP BY product_id WHERE qty = 1', E.order('WHERE', 'GROUP BY'))
bad('SELECT AVG(qty) FROM orders', E.func('AVG'))
bad('SELECT qty price FROM orders', E.missingComma)
bad('SELECT * FROM products', E.fromTable)
bad('SELECT * FROM orders WHERE product_id = P1', E.needQuote('product_id'))
bad("SELECT * FROM orders WHERE qty = '2'", E.noQuote('qty'))
bad('SELECT * FROM orders WHERE ordered_at = 1', E.dateForm)
bad('SELECT @ FROM orders', E.symbol('@'))
bad('SELECT * FROM orders WHERE product_id = "P1"', E.doubleQuote)
bad('SELECT * FROM orders WHERE qty ≥ 2', E.symbol('≥'), '>=')
bad('SELECT * FROM order', E.fromTable, 'orders')
bad('SELECT order.qty FROM orders', E.table('order'), 'orders')
bad('SELECT qty AS FROM orders', E.alias)
bad('SELECT product_id, SUM(qty)) FROM orders GROUP BY product_id', E.paren)
bad('SELECT * FROM orders WHERE qty = price', E.whereForm)
bad('SELECT * FROM orders WHERE DATE(ordered_at) = CURRENT_DATE - 99999999999', E.dateFar(9999))
eq(ok('SELECT * FROM orders WHERE DATE(ordered_at) = CURRENT_DATE - 366').kept, [], '366일 전(같은 월/일이라도 다른 해)')
// 편집기 강조: 단계마다 그 절의 글자 범위
eq(fin.steps.map((s) => I.initial.slice(...s.range).split(' ')[0]), ['FROM', 'JOIN', 'WHERE', 'GROUP', 'SELECT'], '절 글자 범위')

// 망가뜨린 쿼리도 던지지 않고, 내부 오류 문구 대신 구체적인 안내가 나와야 한다
let n = 0
for (const src of [I.initial, ...Object.values(ex)])
  for (let i = 0; i <= src.length; i++)
    for (const v of [src.slice(0, i), src.slice(0, i) + src.slice(i + 1), src.slice(0, i) + 'x' + src.slice(i)]) {
      const r = compile(v)
      n++
      if (!r.ok && r.error.msg === E.internal) throw new Error(`내부 오류: ${show(v)}`)
    }
console.log(`sql.check: 통과 (망가뜨린 쿼리 ${n}개 포함)`)
