import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ch3, JOBS, type JobId, type JobStatus } from '../../content/chapters/ch3'
import { InteractionFrame } from '../../components/Chapter'
import { STATUS_GLYPH } from '../../components/diagram'
import { useEnv } from '../../state/env'
import { boxEdge, DAG_EDGES, DEPS, JOB_IDS } from './parts'

// DAG 실패 시뮬레이터: 노드(버튼)를 눌러 실패시키면 뒤의 작업이 ⏸ 대기, [재시도]로 ↻ → ✓ 연쇄.
// 재시도는 항상 한 번에 성공한다(단순화, 화면에 고지).

const I = ch3.interaction
const S = ch3.figures.status

const COLOR: Record<JobStatus, string> = { ok: 'var(--ok)', fail: 'var(--fail)', wait: 'var(--wait)', retry: 'var(--accent)' }

/** id 뒤에서 기다려야 하는 작업 전부 */
function downstream(id: JobId): JobId[] {
  const out = new Set<JobId>()
  const walk = (from: JobId) =>
    JOB_IDS.forEach((j) => {
      if (DEPS[j].includes(from) && !out.has(j)) {
        out.add(j)
        walk(j)
      }
    })
  walk(id)
  return JOB_IDS.filter((j) => out.has(j))
}
const depth = (id: JobId): number => (DEPS[id].length ? 1 + Math.max(...DEPS[id].map(depth)) : 0)
/** 기다리던 작업을 실행 순서(깊이)대로 묶는다: 같은 깊이는 함께 */
function stagesOf(waiting: JobId[]): JobId[][] {
  const by = new Map<number, JobId[]>()
  waiting.forEach((j) => by.set(depth(j), [...(by.get(depth(j)) ?? []), j]))
  return [...by.keys()].sort((a, b) => a - b).map((d) => by.get(d)!)
}

const allOk = () => Object.fromEntries(JOB_IDS.map((j) => [j, 'ok'])) as Record<JobId, JobStatus>

interface State {
  st: Record<JobId, JobStatus>
  failed: JobId | null
  phase: 'idle' | 'failed' | 'retrying' | 'done'
  log: string[]
  msg: string
  /** 재시도가 끝날 때마다 1씩(멱등 안내 줄을 다시 붙인다) */
  idem: number
}
const INITIAL: State = { st: allOk(), failed: null, phase: 'idle', log: [], msg: I.initial, idem: 0 }

// 노드 배치: 데스크톱은 4열(추출 | 주문·상품 | 매출 집계 | 리포트), 모바일은 위 → 아래
const CELL: Record<JobId, string> = {
  extract: 'col-span-2 md:col-span-1 md:col-start-1 md:row-span-2 md:row-start-1 md:self-center',
  orders: 'md:col-start-2 md:row-start-1',
  products: 'md:col-start-2 md:row-start-2',
  sales: 'col-span-2 md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1 md:self-center',
  report: 'col-span-2 md:col-span-1 md:col-start-4 md:row-span-2 md:row-start-1 md:self-center',
}

type Line = { k: string; x1: number; y1: number; x2: number; y2: number; head: string }

export function DagSimulator() {
  const { reduced } = useEnv()
  const [s, setS] = useState<State>(INITIAL)
  const timers = useRef<number[]>([])
  const graph = useRef<HTMLDivElement>(null)
  const btn = useRef<Partial<Record<JobId, HTMLButtonElement | null>>>({})
  const [lines, setLines] = useState<Line[]>([])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clear, [])

  // 화살표: 버튼 위치를 재서 SVG 선으로 잇는다(데스크톱·모바일 배치가 달라도 같은 코드)
  const measure = useCallback(() => {
    const g = graph.current
    if (!g) return
    const base = g.getBoundingClientRect()
    const box = (id: JobId) => {
      const r = btn.current[id]?.getBoundingClientRect()
      return r ? { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2, w: r.width, h: r.height } : null
    }
    const out: Line[] = []
    for (const [a, b] of DAG_EDGES) {
      const p = box(a)
      const q = box(b)
      if (!p || !q) continue
      const [x1, y1] = boxEdge(p.x, p.y, p.w, p.h, q.x, q.y, 3)
      const [x2, y2] = boxEdge(q.x, q.y, q.w, q.h, p.x, p.y, 5)
      const ang = Math.atan2(y2 - y1, x2 - x1)
      const hd = 9
      const head = `M ${x2 - hd * Math.cos(ang - 0.45)} ${y2 - hd * Math.sin(ang - 0.45)} L ${x2} ${y2} L ${x2 - hd * Math.cos(ang + 0.45)} ${y2 - hd * Math.sin(ang + 0.45)}`
      out.push({ k: `${a}>${b}`, x1, y1, x2, y2, head })
    }
    setLines(out)
  }, [])
  useLayoutEffect(() => {
    measure()
    const g = graph.current
    if (!g) return
    const ro = new ResizeObserver(measure)
    ro.observe(g)
    return () => ro.disconnect()
  }, [measure])

  const fail = (id: JobId) => {
    if (s.phase === 'failed' && s.failed === id) {
      setS((p) => ({ ...p, msg: I.again }))
      return
    }
    clear()
    const st = allOk()
    st[id] = 'fail'
    downstream(id).forEach((j) => (st[j] = 'wait'))
    setS({ st, failed: id, phase: 'failed', log: [I.log.fail(JOBS[id])], msg: I.failed[id], idem: 0 })
  }

  const retry = () => {
    const id = s.failed
    if (s.phase !== 'failed' || !id) return
    const stages = stagesOf(downstream(id))
    const rest = stages.map((g) => I.log.ok(g.map((j) => JOBS[j])))
    if (reduced) {
      setS((p) => ({ ...p, st: allOk(), failed: null, phase: 'done', log: [...p.log, I.log.retryOk(JOBS[id]), ...rest], msg: I.done, idem: p.idem + 1 }))
      return
    }
    setS((p) => ({ ...p, st: { ...p.st, [id]: 'retry' }, phase: 'retrying', msg: I.retrying(JOBS[id]) }))
    const later = (ms: number, fn: (p: State) => State) => timers.current.push(window.setTimeout(() => setS(fn), ms))
    later(600, (p) => ({ ...p, st: { ...p.st, [id]: 'ok' }, log: [...p.log, I.log.retryOk(JOBS[id])] }))
    stages.forEach((g, k) =>
      later(600 + 400 * (k + 1), (p) => ({ ...p, st: { ...p.st, ...Object.fromEntries(g.map((j) => [j, 'ok'])) }, log: [...p.log, rest[k]] })),
    )
    later(600 + 400 * stages.length + 1, (p) => ({ ...p, failed: null, phase: 'done', msg: I.done, idem: p.idem + 1 }))
  }

  const reset = () => {
    clear()
    setS({ ...INITIAL, idem: 0 })
  }

  const newest = s.log.length - 1

  return (
    <InteractionFrame title={I.title} hint={I.hint} note={I.note}>
      <div ref={graph} className="relative mx-auto max-w-[52rem]">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {lines.map((l) => (
            <g key={l.k} style={{ color: 'var(--line)' }}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ stroke: 'currentColor' }} strokeWidth={1.8} />
              <path d={l.head} style={{ fill: 'none', stroke: 'currentColor' }} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        </svg>
        <div role="group" aria-label={I.groupLabel} className="relative grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-4 md:grid-rows-2 md:gap-x-10 md:gap-y-6">
          {JOB_IDS.map((id) => {
            const st = s.st[id]
            const name = JOBS[id]
            return (
              <button
                key={id}
                ref={(el) => {
                  btn.current[id] = el
                }}
                type="button"
                onClick={() => fail(id)}
                aria-label={st === 'fail' ? I.nodeAriaFailed(name) : I.nodeAria(name, S[st])}
                className={`flex min-h-[4.25rem] w-full max-w-[11rem] items-center gap-3 rounded-lg border-2 px-3 py-2 justify-self-center text-left transition-colors ${CELL[id]} ${
                  st === 'wait' ? 'border-dashed bg-bg' : 'bg-surface hover:bg-bg'
                }`}
                style={{ borderColor: COLOR[st] }}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-surface text-base font-bold leading-none"
                  style={{ borderColor: COLOR[st], color: COLOR[st] }}
                >
                  {STATUS_GLYPH[st]}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold leading-tight">{name}</span>
                  <span className="block text-sm font-semibold leading-tight" style={{ color: st === 'fail' ? COLOR.fail : 'var(--muted)' }}>
                    {S[st]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {/* disabled 대신 aria-disabled: 키보드로 누른 뒤 비활성이 돼도 포커스가 버튼에 남는다 */}
        <button type="button" className={`btn btn-solid ${s.phase === 'failed' ? '' : 'pointer-events-none opacity-55'}`} onClick={retry} aria-disabled={s.phase !== 'failed'}>
          {I.retry} <span aria-hidden="true">↻</span>
        </button>
        <button type="button" className="btn" onClick={reset}>
          {I.reset}
        </button>
      </div>
      <p aria-live="polite" className="mt-4 min-h-[3.5rem] max-w-[44rem] font-semibold md:min-h-0">
        {s.msg}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
          <p className="font-bold">{I.logTitle}</p>
          {s.log.length ? (
            <ol className="mt-2 space-y-1">
              {s.log.map((l, i) => (
                <li key={`${i}${l}`} className={`flex gap-2 ${i === newest && !reduced ? 'row-in' : ''}`}>
                  <span className="min-w-[1.75rem] shrink-0 whitespace-nowrap text-right font-mono text-muted">{i + 1}.</span>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-muted">{I.logEmpty}</p>
          )}
        </div>
        <div className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
          <p className="font-bold">{I.counter}</p>
          {s.idem > 0 && (
            <p key={s.idem} className={`mt-2 ${reduced ? '' : 'row-in'}`}>
              {I.idem}
            </p>
          )}
        </div>
      </div>
    </InteractionFrame>
  )
}
