import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ch8, type TTRow } from '../../content/chapters/ch8'
import { InteractionFrame } from '../../components/Chapter'
import { useEnv } from '../../state/env'

// 타임 트래블 슬라이더: Silver 주문 테이블의 v1~v4를 되감아 본다.
// 네이티브 range(1~4) + 양옆 버튼. 키보드: ←↓ 이전, →↑ 다음, Home v1, End v4(브라우저 기본 동작).
// 바뀐 칸은 늘 '번호가 하나 앞인 버전' 대비로 표시한다. 위치는 저장하지 않고 v4에서 시작한다.

const I = ch8.interaction
const VS = I.versions
const LAST = VS.length
type Col = keyof TTRow
const COLS: Col[] = ['id', 'status', 'amount']

/** 순매출(취소만 뺀 단순 계산) */
const netOf = (rows: TTRow[]) => rows.reduce((a, r) => a + (r.status === I.cancelStatus ? 0 : r.amount), 0)

// 표가 스토리보드 숫자와 어긋나면 개발 중 콘솔 에러로 바로 드러난다(스크린샷 점검에서 잡힘)
if (import.meta.env.DEV) {
  const want = [89800, 89800, 0, 57800]
  VS.forEach((v, i) => netOf(v.rows) !== want[i] && console.error('ch8 타임 트래블 순매출이 스토리보드와 달라요', v.v, netOf(v.rows)))
}

/** 눈금 k(0부터)의 가로 위치(엄지 24px 기준) */
const pos = (k: number) => `calc(12px + (100% - 24px) * ${k / (LAST - 1)})`

const SLIDER = [
  'block h-11 w-full cursor-pointer appearance-none bg-transparent',
  '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
  '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
].join(' ')

/** 값이 바뀐 칸만 200ms 크로스페이드(모션 줄이기면 즉시) */
function Fade({ value, children }: { value: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const first = useRef(true)
  const { reduced } = useEnv()
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!reduced) ref.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' })
  }, [value, reduced])
  return (
    <span ref={ref} className="inline-flex items-center gap-1.5">
      {children}
    </span>
  )
}

/** 순매출 숫자: 이전 값에서 새 값으로 짧게 센다(화면용). 스크린리더는 따로 둔 최종 값을 읽는다 */
function useCount(target: number, reduced: boolean) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    from.current = target
    if (reduced || start === target) {
      setShown(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 320)
      setShown(Math.round(start + (target - start) * (1 - (1 - p) ** 2)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced])
  return shown
}

export function TimeTravel() {
  const [v, setV] = useState(LAST)
  const slider = useRef<HTMLInputElement>(null)
  const { reduced } = useEnv()
  const cur = VS[v - 1]
  const prev = v > 1 ? VS[v - 2] : null
  const net = netOf(cur.rows)
  const shown = useCount(net, reduced)
  const bad = cur.rows.some((r) => r.amount === 0)
  const fixedUp = v === LAST
  const go = (n: number) => setV(Math.min(LAST, Math.max(1, n)))
  /** 버튼으로 끝 버전에 닿으면 그 버튼이 비활성이 되므로 포커스를 슬라이더로 옮긴다 */
  const step = (d: number) => {
    const n = Math.min(LAST, Math.max(1, v + d))
    setV(n)
    if (n === 1 || n === LAST) slider.current?.focus()
  }
  const text = (r: TTRow, c: Col) => (c === 'amount' ? I.num(r.amount) : r[c])

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div className="space-y-6">
        {/* 조작: 이전 · 슬라이더 · 다음 */}
        <div>
          {/* 버전을 바꾸면 안내도 읽어 준다(변경 기록·순매출 아래쪽 live 영역과 따로) */}
          <p aria-live="polite" aria-atomic="true" className="max-w-[44rem] rounded-lg border-l-4 border-accent bg-bg px-4 py-3 font-semibold">
            {cur.guide}
          </p>
          <div className="mt-5 grid grid-cols-2 items-center gap-x-4 gap-y-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
            {/* DOM 순서 = 데스크톱 화면 순서(이전 · 슬라이더 · 다음) → Tab 순서가 보이는 순서와 같다. 모바일은 슬라이더를 위 줄에 둔다 */}
            <button type="button" className="btn col-start-1 row-start-2 justify-self-start md:col-start-1 md:row-start-1 md:-mt-6" disabled={v === 1} onClick={() => step(-1)}>
              <span aria-hidden="true">◀</span> {I.prev}
            </button>
            <div className="col-span-2 row-start-1 md:col-span-1 md:col-start-2 md:row-start-1">
              <input
                ref={slider}
                type="range"
                min={1}
                max={LAST}
                step={1}
                value={v}
                onChange={(e) => go(Number(e.target.value))}
                aria-label={I.sliderLabel}
                aria-valuetext={cur.valueText}
                className={SLIDER}
              />
              <div className="relative mt-1.5 h-6 font-mono text-sm" aria-hidden="true">
                {VS.map((x, k) => (
                  <span key={x.v} className={`absolute -translate-x-1/2 ${x.v === v ? 'font-extrabold text-ink' : 'text-muted'}`} style={{ left: pos(k) }}>
                    {I.tick(x.v)}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" className="btn col-start-2 row-start-2 justify-self-end md:col-start-3 md:row-start-1 md:-mt-6" disabled={v === LAST} onClick={() => step(1)}>
              {I.next} <span aria-hidden="true">▶</span>
            </button>
          </div>
          <p className="mt-2 max-w-[48rem] text-sm text-muted">{I.fixed}</p>
        </div>

        {/* 결과: 이 버전의 주문 테이블 */}
        <div className="max-w-[40rem] rounded-xl border-[1.5px] border-edge bg-bg p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-bold">{I.tableTitle}</h4>
            <span className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-0.5 font-mono text-sm font-bold ${fixedUp ? 'border-ink bg-ink text-bg' : 'border-ink'}`}>
              {I.tick(v)}
              {fixedUp && <span className="font-sans">· {I.current}</span>}
            </span>
          </div>
          <table className="mt-3 w-full table-fixed border-collapse text-left text-[0.9375rem]">
            <colgroup>
              <col className="w-[31%]" />
              <col className="w-[33%]" />
              <col className="w-[36%]" />
            </colgroup>
            <thead>
              <tr className="border-b-[1.5px] border-ink">
                {COLS.map((c) => (
                  <th key={c} scope="col" className={`px-2 py-2 font-bold ${c === 'amount' ? 'text-right' : ''}`}>
                    {I.cols[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cur.rows.map((r, i) => {
                const added = !prev
                return (
                  <tr key={r.id} className={`border-b border-edge ${added ? 'bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]' : ''}`}>
                    {COLS.map((c) => {
                      const changed = prev ? prev.rows[i][c] !== r[c] : false
                      const zero = c === 'amount' && r.amount === 0
                      const bg = zero ? 'bg-[color-mix(in_srgb,var(--fail)_30%,transparent)]' : changed ? 'bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]' : ''
                      return (
                        <td key={c} className={`px-2 py-2 font-mono ${c === 'status' ? 'font-sans' : ''} ${bg} ${c === 'amount' ? 'text-right' : ''}`}>
                          <Fade value={`${text(r, c)}${changed}`}>
                            {zero && (
                              <span aria-hidden="true" className="font-bold text-fail">
                                ✕
                              </span>
                            )}
                            <span>{text(r, c)}</span>
                            {changed && <span className="font-sans text-xs font-bold">{I.changed}</span>}
                            {added && c === 'id' && <span className="font-sans text-xs font-bold">{I.added}</span>}
                          </Fade>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div aria-live="polite" aria-atomic="true" className="mt-4 space-y-3">
            <p className="text-[0.9375rem]">
              <span className="font-bold">{I.logLabel}</span> <span className="font-mono text-[0.875rem]">{cur.log}</span>
            </p>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border-[1.5px] border-edge bg-surface px-4 py-3">
              <span className="text-sm font-semibold">{I.netLabel}</span>
              <span className={`font-mono text-2xl font-extrabold ${bad ? 'text-fail' : ''}`}>
                <span aria-hidden="true">{I.won(shown)}</span>
                <span className="sr-only">{I.won(net)}</span>
                {bad && (
                  <span className="ml-2">
                    <span aria-hidden="true">✕</span>
                    <span className="sr-only">{I.netBad}</span>
                  </span>
                )}
                {fixedUp && (
                  <span className="ml-2 text-ok">
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only">{I.netOk}</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </InteractionFrame>
  )
}
