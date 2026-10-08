import { Fragment, useId, useState, type CSSProperties } from 'react'
import { ch5 } from '../../content/chapters/ch5'
import { InteractionFrame } from '../../components/Chapter'
import { useEnv } from '../../state/env'

// 워커 수 슬라이더: 예상 시간 = 960 ÷ N + (N − 1) × 1 + 20 (설명용 단순화 모델, 값은 스토리보드 표 그대로).
// 네이티브 range 하나로 7단계(1·2·4·8·16·32·64대)를 고른다. 키보드: ←↓ / →↑ / Home / End.

const I = ch5.interaction
const ROWS = I.rows
const LAST = ROWS.length - 1
const FULL = ROWS[0].total
const KNEE = 4 // 16 ~ 32 구간이 효과가 줄어드는 지점
const BEST = 5 // 32대가 이 모델에서 가장 빠름

// 표가 공식과 어긋나면 개발 중 콘솔 에러로 바로 드러난다(스크린샷 점검에서 잡힘)
if (import.meta.env.DEV) {
  ROWS.forEach((r, i) => {
    const ok =
      r.div === 960 / r.n && r.coord === r.n - 1 && r.serial === 20 && r.total === r.div + r.coord + r.serial && r.delta === (i ? r.total - ROWS[i - 1].total : null)
    if (!ok) console.error('ch5 워커 수 표가 공식과 달라요', r)
  })
}

/** 눈금 k의 가로 위치(엄지 24px 기준) */
const pos = (k: number) => `calc(12px + (100% - 24px) * ${k / LAST})`

const PATTERN: Record<'div' | 'coord' | 'serial', CSSProperties> = {
  div: { background: 'var(--accent)' },
  coord: { backgroundColor: 'var(--surface)', backgroundImage: 'repeating-linear-gradient(135deg, var(--ink) 0 2px, transparent 2px 7px)' },
  serial: { backgroundColor: 'var(--surface)', backgroundImage: 'radial-gradient(var(--ink) 1.3px, transparent 1.7px)', backgroundSize: '7px 7px' },
}
const KEYS = ['div', 'coord', 'serial'] as const

const SLIDER = [
  'block h-8 w-full cursor-pointer appearance-none bg-transparent',
  '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
  '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[color-mix(in_srgb,var(--ink)_38%,transparent)]',
  '[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:shadow-[0_0_0_3px_var(--surface),0_0_0_4.5px_var(--ink)]',
].join(' ')

export function WorkerSlider() {
  const [i, setI] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const { reduced } = useEnv()
  const id = useId()
  const r = ROWS[i]
  const cols = r.n <= 16 ? r.n : 8
  const cell = r.n <= 16 ? 14 : 9
  const gap = r.n <= 16 ? 3 : 2
  const C = I.table.cols

  return (
    <InteractionFrame title={I.title} hint={I.hint}>
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center rounded-full border-[1.5px] border-ink px-3 py-0.5 font-mono text-sm font-bold">{I.badge}</span>
          <p className="mt-3 max-w-[48rem] font-semibold leading-relaxed">{I.formula}</p>
          <p className="mt-1 max-w-[48rem] text-sm leading-relaxed text-muted">{I.legend}</p>
        </div>

        {/* 슬라이더 + 눈금 위 표시 */}
        <div>
          <div className="relative mb-2 h-[4rem] text-sm font-semibold" aria-hidden="true">
            <span className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: pos(KNEE + 0.5) }}>
              {I.markers.knee}
            </span>
            <span className="absolute top-6 h-2 rounded-t-sm border-x-2 border-t-2 border-ink" style={{ left: pos(KNEE), width: `calc((100% - 24px) / ${LAST})` }} />
            <span className="absolute bottom-0 whitespace-nowrap leading-5" style={{ right: `calc(100% - ${pos(BEST)} - 6px)` }}>
              {I.markers.best} ↓
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={LAST}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            aria-label={I.sliderLabel}
            aria-valuetext={I.valueText(r.n, r.total)}
            className={SLIDER}
          />
          <div className="relative mt-1 h-6 font-mono text-sm" aria-hidden="true">
            {ROWS.map((row, k) => (
              <span key={row.n} className={`absolute -translate-x-1/2 ${k === i ? 'font-extrabold text-ink' : 'text-muted'}`} style={{ left: pos(k) }}>
                {row.n}
              </span>
            ))}
          </div>
        </div>

        {/* 워커 아이콘: 16대까지 한 줄, 32대 4 × 8, 64대 8 × 8 */}
        <div className="flex h-[7.25rem] flex-col justify-end gap-2" aria-hidden="true">
          <p className="font-mono text-sm font-bold">{I.workers(r.n)}</p>
          <div className="grid" style={{ gap, gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}>
            {Array.from({ length: r.n }, (_, k) => (
              <span
                key={k}
                className={`block rounded-[2px] border-[1.5px] border-ink bg-surface ${reduced ? '' : 'row-in'}`}
                style={{ width: cell, height: cell, animationDelay: reduced ? undefined : `${Math.min(k, 48) * 5}ms` }}
              />
            ))}
          </div>
        </div>

        {/* 쌓은 막대: 나눠지는 일 · 조율·셔플 · 나눌 수 없는 일 */}
        <div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {KEYS.map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3.5 w-5 rounded-sm border border-ink" style={PATTERN[k]} />
                <span>{I.parts[k]}</span>
                <b className="font-mono">{I.min(r[k])}</b>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex h-10 min-w-0 flex-1 basis-64 overflow-hidden rounded-md border-[1.5px] border-ink bg-bg [contain:layout_paint]" aria-hidden="true">
              {KEYS.map((k) => (
                <div key={k} className="h-full shrink-0 transition-[width] duration-300 ease-out" style={{ width: `${(r[k] / FULL) * 100}%`, ...PATTERN[k] }} />
              ))}
            </div>
            <p className="shrink-0" aria-live="polite" aria-atomic="true">
              <span className="sr-only">{I.totalLabel} </span>
              <span className="font-mono text-[1.75rem] font-extrabold leading-none">{I.min(r.total)}</span>
              <span className="ml-2 font-mono text-sm">
                <span className="sr-only">{I.deltaLabel} </span>
                {I.delta(r.delta)}
              </span>
            </p>
          </div>
          <p className="mt-2 max-w-[48rem] text-sm text-muted">{I.notice}</p>
        </div>

        <p className="rounded-lg border-l-4 border-accent bg-bg px-4 py-3 font-semibold" aria-live="polite">
          {r.note}
        </p>

        {/* 전체 값 표: 늘 보인다. 지금 상태 행은 굵게 + 표시 */}
        <table className="w-full border-collapse text-left text-sm md:text-[0.9375rem]">
          <caption className="mb-2 text-left font-bold">{I.table.caption}</caption>
          <thead>
            <tr className="border-b-[1.5px] border-ink">
              <th scope="col" className="py-2 pr-3 font-bold">
                {C.n}
              </th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-bold md:table-cell">
                {C.div}
              </th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-bold md:table-cell">
                {C.coord}
              </th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-bold md:table-cell">
                {C.serial}
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-bold">
                {C.total}
              </th>
              <th scope="col" className="py-2 text-right font-bold">
                {C.delta}
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, k) => {
              const now = k === i
              const detail = `${id}-d${k}`
              return (
                <Fragment key={row.n}>
                  <tr className={`border-b border-edge ${now ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] font-extrabold' : ''}`}>
                    <th scope="row" className="py-1.5 pr-3 text-left font-mono font-[inherit]">
                      <span aria-hidden="true" className={`mr-1 inline-block w-3 ${now ? '' : 'invisible'}`}>
                        ▶
                      </span>
                      <button
                        type="button"
                        className="-my-1.5 inline-flex min-h-10 min-w-10 items-center gap-1 underline decoration-dotted underline-offset-4 md:hidden"
                        aria-expanded={open === k}
                        aria-controls={detail}
                        onClick={() => setOpen(open === k ? null : k)}
                      >
                        {I.table.count(row.n)}
                        <span className="sr-only"> {I.table.more}</span>
                        <span aria-hidden="true">{open === k ? '▴' : '▾'}</span>
                      </button>
                      <span className="hidden md:inline">{I.table.count(row.n)}</span>
                      {now && <span className="sr-only"> ({I.table.now})</span>}
                    </th>
                    <td className="hidden py-1.5 pr-3 text-right font-mono md:table-cell">{row.div}</td>
                    <td className="hidden py-1.5 pr-3 text-right font-mono md:table-cell">{row.coord}</td>
                    <td className="hidden py-1.5 pr-3 text-right font-mono md:table-cell">{row.serial}</td>
                    <td className="py-1.5 pr-3 text-right font-mono">{row.total}</td>
                    <td className="py-1.5 text-right font-mono">{I.table.signed(row.delta)}</td>
                  </tr>
                  <tr id={detail} hidden={open !== k} className="border-b border-edge md:hidden">
                    <td colSpan={3} className="pb-2 pl-4 text-muted">
                      {KEYS.map((key) => `${I.parts[key]} ${row[key]}`).join(' · ')}
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </InteractionFrame>
  )
}
