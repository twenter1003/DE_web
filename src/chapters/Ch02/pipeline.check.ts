// 해석기 자가 점검: npx jiti src/chapters/Ch02/pipeline.check.ts (실패하면 예외로 멈춘다)
import { ch2 } from '../../content/chapters/ch2'
import { regionKey, reportOf, run, TRUTH } from './pipeline'

const I = ch2.interaction
const ok = (c: unknown, msg: string) => {
  if (!c) throw new Error(`✕ ${msg}`)
}
const final = (code: string) => {
  const t = run(code)
  const last = t.steps.at(-1)!
  return { t, last, r: reportOf(last.snap.rows) }
}
const code = I.code.join('\n')
const without = (name: string) => I.code.filter((l) => !l.includes(name)).join('\n')

// 처음 코드: ETL, 5건 · 19,000원
{
  const { t, last, r } = final(code)
  ok(t.shape === 'etl' && t.steps.length === 7 && t.steps.every((s) => s.ok), '처음 코드는 7줄 모두 성공')
  ok(last.snap.where === 'store' && r.count === 5 && r.revenue === 19000 && r.issues.total === 0, '정리본 5건, 19,000원')
}
// 중복 제거를 빼면 6건, 2042번 가격이 두 번 더해진다
{
  const { r } = final(without('remove_duplicates'))
  ok(r.count === 6 && r.revenue === 23000 && r.issues.dup.join() === '2042', '중복 제거 없음')
}
// 가격 숫자로 바꾸기를 빼면 글자 가격이 빠져 10,000원
ok(final(without('to_number')).r.revenue === 10000, '숫자 변환 없음 → 10,000원')
// ELT: 원본 6건이 남고, 변환은 저장소 안에서
{
  const lines = [...I.code]
  const load = lines.splice(5, 1)[0]
  lines.splice(1, 0, load)
  const { t, last, r } = final(lines.join('\n'))
  ok(t.shape === 'elt' && last.snap.orig?.length === 6 && r.count === 5 && last.snap.table === I.fig.tables.clean, 'ELT 원본 유지')
  ok(t.steps.filter((s) => s.kind === 'transform').every((s) => s.inside), 'ELT 변환은 저장소 안')
}
// 너그러운 문법: data = 생략, 따옴표 생략, 주석, 빈 줄
{
  const { t, r } = final('extract(운영 DB, orders, 날짜=어제)\n\n# 메모\nremove_duplicates()\nfill_missing(data, "배송지", "모름")\nto_number(data)\nfix_dates(data)\nload(data)')
  ok(t.steps.every((s) => s.ok) && r.count === 5 && r.revenue === 19000, '너그러운 문법')
}
// 오타·순서 오류는 친절한 오류로 멈춘다(예외 없음)
{
  const typo = run(code.replace('remove_duplicates', 'remove_duplicate'))
  const err = typo.steps.at(-1)!
  ok(!err.ok && err.line === 1 && err.text.includes('remove_duplicates(data)'), '오타 → 가까운 명령 추천')
  ok(!run('load(data, "분석용 DB")').steps[0].ok, 'extract 전 load는 오류')
  ok(!run(`${I.code[0]}\n${I.code[0]}`).steps[1].ok, 'extract 두 번은 오류')
}
// 초보자 실수: 대소문자, 한국어 이름, 빼기·점, 괄호 안 다른 이름, 날짜 자리, // 메모
{
  ok(final(code.replace('extract', 'Extract').replace('data = remove', 'DATA = remove')).t.steps.every((s) => s.ok), '대소문자 무시')
  for (const [typed, want] of [['중복제거(data)', 'remove_duplicates'], ['중복 제거(data)', 'remove_duplicates'], ['추출()', 'extract'], ['remove-duplicates(data)', 'remove_duplicates'], ['data.fill_missing()', 'fill_missing'], ['print(data)', 'report']])
    ok(run(`${I.code[0]}\n${typed}`).steps[1].text.includes(`${want}인가요`), `추천: ${typed} → ${want}`)
  ok(run(`${I.code[0]}\nremove_duplicates(df)`).steps[1].text.includes("'df'를 'data'로"), '괄호 안 다른 이름')
  ok(run('extract("운영 DB", "orders", "어제")').steps[0].ok && run('extract(orders)').steps[0].ok, '날짜·표 자리 너그럽게')
  ok(run(`// 메모\n${code}`).steps.every((s) => s.ok), '// 메모 건너뜀')
  ok(run(code.replace('fill_missing', 'fill_mising')).shape === 'etl', '오타 줄도 순서 판단에 센다')
  const fake = final(code.replace('"미입력"', '"서울 마포구"')).r
  ok(fake.regions.some(([k, n]) => k === '서울' && n === 2), '진짜 지역으로 채우면 그 지역으로 세어진다')
  ok(regionKey(final(code.replace('"미입력"', '"서울 마포구"')).last.snap.rows) !== TRUTH.regionKey, '진짜 지역으로 채우면 실제와 다르다')
  ok(regionKey(final(code.replace('"미입력"', '"모름"')).last.snap.rows) === TRUTH.regionKey, "'모름'으로 채워도 실제와 같다")
}
for (const junk of ['(', ')', '"', 'data =', '= =', '123', 'extract(', 'fill_missing(data, 가격)', 'load(data, "엑셀")', 'x = extract()', '중복제거(data)', '\u0000', 'a'.repeat(5000), '_', '-', '.', '//', 'data = data', 'remove_duplicates((data))', 'extract("운영 DB"', [I.code[0], ...Array(60).fill('to_number(data)')].join('\n')])
  ok(run(junk).steps.every((s) => typeof s.text === 'string'), `예외 없음: ${junk.slice(0, 20)}`)

console.log('pipeline: 모든 점검 통과')
