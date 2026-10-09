import { useState, type CSSProperties } from 'react'
import { ch10, type ScaleRow } from '../../content/chapters/ch10'
import { InteractionFrame } from '../../components/Chapter'
import { useEnv } from '../../state/env'

// 트레이드오프 저울: 지연시간 5단계(하루 → 1초 이하)를 고르면 비용·운영 복잡도 막대가 바뀐다.
// 값은 스토리보드 표 그대로인 단순화한 상대 모델. 네이티브 range 하나 + 눈금 버튼 5개.
// 키보드: range의 ←↓ / →↑ / Home / End, 버튼은 Enter·Space. 위치는 저장하지 않는다(다시 들어오면 '하루').

const I = ch10.interaction
const ROWS = I.rows
const LAST = ROWS.length - 1

const SLIDER = [
  'block h-11 w-full cursor-pointer appearance-none bg-transparent',
  '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
  '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
].join(' ')

// 비용은 꽉 찬 막대, 운영 복잡도는 빗금 막대(색만으로 구분하지 않음)
const FILL: Record<'cost' | 'ops', CSSProperties> = {
  cost: { background: 'var(--ink)' },
  ops: { backgroundColor: 'var(--surface)', backgroundImage: 'repeating-linear-gradient(135deg, var(--ink) 0 3px, transparent 3px 8px)' },
}

function Bar({ k, value, animate }: { k: 'cost' | 'ops'; value: number; animate: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-sm font-bold">{I.outOf(value)}</span>
      <div className="relative h-40 w-12 overflow-hidden rounded-md border-[1.5px] border-ink bg-bg md:h-48 md:w-14" aria-hidden="true">
        <div
          className={`absolute inset-0 origin-bottom ${animate ? 'transition-transform duration-300 ease-out' : ''}`}
          style={{ ...FILL[k], transform: `scaleY(${value / 10})` }}
        />
        {/* 10칸 눈금 */}
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="flex-1 border-t border-[color-mix(in_srgb,var(--ink)_28%,transparent)] first:border-t-0" />
          ))}
        </div>
      </div>
      <span className="text-sm font-semibold">{I.bars[k]}</span>
    </div>
  )
}

const okText = (r: ScaleRow) => (r.ok ? I.pass : I.fail)

export function TradeoffScale() {
  const [i, setI] = useState(0)
  const { reduced } = useEnv()
  const r = ROWS[i]
  const C = I.cols

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div className="space-y-6">
        {/* 저울: 기울지 않는 저울대 + 두 접시 */}
        <div>
          <div className="relative hidden h-7 sm:block" aria-hidden="true">
            <span className="absolute inset-x-[22%] top-1 h-[3px] rounded bg-ink" />
            <span className="absolute left-1/2 top-1 h-6 w-[3px] -translate-x-1/2 bg-ink" />
            <span className="absolute left-[22%] top-1 h-6 w-[2px] bg-ink" />
            <span className="absolute right-[22%] top-1 h-6 w-[2px] bg-ink" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
            <div className="flex flex-col rounded-xl border-[1.5px] border-edge bg-bg p-4">
              <p className="font-mono text-sm text-muted">{I.gainTitle}</p>
              <p className="flex flex-1 items-center justify-center py-3 text-center text-[1.75rem] font-extrabold leading-tight md:text-[2.125rem]">{r.gain}</p>
            </div>
            <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
              <p className="font-mono text-sm text-muted">{I.giveTitle}</p>
              <div className="mt-3 flex items-end justify-center gap-10">
                <Bar k="cost" value={r.cost} animate={!reduced} />
                <Bar k="ops" value={r.ops} animate={!reduced} />
              </div>
            </div>
          </div>
          <p className="mt-3 rounded-lg border-[1.5px] border-dashed border-edge px-3 py-2 text-sm leading-relaxed text-muted">{I.notice}</p>
        </div>

        {/* 슬라이더 + 눈금 버튼: 버튼(폭 3.75rem / md 4.75rem) 가운데와 엄지(24px) 가운데가 맞도록 슬라이더를 (버튼 폭 − 엄지)/2만큼 들인다 */}
        <div>
          <p className="flex items-center justify-between text-sm font-semibold" aria-hidden="true">
            <span>← {I.slow}</span>
            <span className="text-muted">{I.scaleLabel}</span>
            <span>{I.fast} →</span>
          </p>
          <div className="mx-[1.125rem] mt-1 md:mx-[1.625rem]">
            <input
              type="range"
              min={0}
              max={LAST}
              step={1}
              value={i}
              onChange={(e) => setI(Number(e.target.value))}
              aria-label={I.sliderLabel}
              aria-valuetext={r.tick}
              className={SLIDER}
            />
          </div>
          <div className="mt-1 flex justify-between">
            {ROWS.map((row, k) => (
              <button
                key={row.tick}
                type="button"
                className={`btn btn-sm w-[3.75rem] justify-center whitespace-nowrap px-1 text-[0.8125rem] md:w-[4.75rem] md:text-sm ${k === i ? 'btn-solid' : ''}`}
                style={{ minHeight: '2.75rem' }}
                aria-pressed={k === i}
                aria-label={I.tickGo(row.tick)}
                onClick={() => setI(k)}
              >
                {row.tick}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 세 줄 */}
        <div className="space-y-1.5 leading-relaxed">
          <p>
            <span className="font-bold">{I.needLabel}: </span>
            {r.need}
          </p>
          <p>
            <span className="font-bold">{I.criterion}: </span>
            <span className={`font-bold ${r.ok ? 'text-ok' : 'text-fail'}`}>{okText(r)}</span>
          </p>
          <p className="text-muted">{r.note}</p>
        </div>
        <p className="sr-only" aria-live="polite">
          {I.live(r)}
        </p>

        {/* 모든 단계 한눈에 보기 */}
        <details className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
          {/* 바깥 여백까지 덮어 상자 전체가 누르는 곳이 되게 */}
          <summary className="-m-4 cursor-pointer rounded-xl px-4 py-6 font-bold">{I.tableTitle}</summary>
          <table className="mt-4 hidden w-full border-collapse text-left text-sm md:table">
            <thead>
              <tr className="border-b-[1.5px] border-edge">
                {[C.tick, C.gain, C.cost, C.ops, C.need, C.ok, C.note].map((h) => (
                  <th key={h} scope="col" className="px-2 py-2 align-bottom font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, k) => (
                <tr key={row.tick} className={`border-b border-edge align-top ${k === i ? 'bg-surface' : ''}`}>
                  <th scope="row" className="whitespace-nowrap px-2 py-2 font-bold">
                    {row.tick}
                    {k === i && <span className="mt-0.5 block font-mono text-xs font-normal text-muted">{I.now}</span>}
                  </th>
                  <td className="px-2 py-2">{row.gain}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono">{I.outOf(row.cost)}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono">{I.outOf(row.ops)}</td>
                  <td className="px-2 py-2">{row.need}</td>
                  <td className={`whitespace-nowrap px-2 py-2 font-bold ${row.ok ? 'text-ok' : 'text-fail'}`}>{I.okText(row.ok)}</td>
                  <td className="px-2 py-2 text-muted">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-4 space-y-3 md:hidden">
            {ROWS.map((row, k) => (
              <li key={row.tick} className={`rounded-lg border-[1.5px] p-3 text-sm ${k === i ? 'border-ink bg-surface' : 'border-edge'}`}>
                <p className="font-bold">
                  {row.tick}
                  {k === i && <span className="ml-2 font-mono text-xs font-normal text-muted">{I.now}</span>}
                </p>
                <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                  <dt className="text-muted">{C.gain}</dt>
                  <dd>{row.gain}</dd>
                  <dt className="text-muted">{C.cost}</dt>
                  <dd className="font-mono">{I.outOf(row.cost)}</dd>
                  <dt className="text-muted">{C.ops}</dt>
                  <dd className="font-mono">{I.outOf(row.ops)}</dd>
                  <dt className="text-muted">{C.need}</dt>
                  <dd>{row.need}</dd>
                  <dt className="text-muted">{C.ok}</dt>
                  <dd className={`font-bold ${row.ok ? 'text-ok' : 'text-fail'}`}>{I.okText(row.ok)}</dd>
                </dl>
                <p className="mt-1.5 text-muted">{row.note}</p>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </InteractionFrame>
  )
}
