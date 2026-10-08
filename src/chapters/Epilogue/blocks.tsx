import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { epilogue } from '../../content/chapters/epilogue'
import { CARDS } from '../../content/cards'
import { T } from '../../content/map'
import { LEVELS } from '../../content/people'
import { tocOf } from '../../content/toc'
import { UI } from '../../content/ui'
import { TermCard } from '../../components/Collection'
import { Node } from '../../components/diagram'
import { Bubble } from '../../components/people'
import { PipelineMap } from '../../components/PipelineMap'
import { RArrow, RRect, StageCtx } from '../../components/sketch'
import { goTo } from '../../lib/nav'
import { STAGES, stageVars } from '../../lib/stages'
import { useEnv } from '../../state/env'
import { useProgress } from '../../state/progress'

const c = epilogue
const I = c.interaction
const F = c.figures

// ─────────────────────────────────────────────────────────────
// 맵이 곧 목차: 누를 수 있는 전체 맵(전역 기능 — 노드 → 그 챕터)
// ─────────────────────────────────────────────────────────────
export function MapNav() {
  const { mobile } = useEnv()
  const box = useRef<HTMLDivElement>(null)
  // PipelineMap의 기본 뷰박스는 HUD 비율이라 세로 배치에서 좌우 여백이 크다. 노드에 꼭 맞춰 글자를 키운다
  useLayoutEffect(() => {
    const svg = box.current?.querySelector('svg')
    if (!svg) return
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    svg.querySelectorAll('.node-focus, [data-edge] g > rect').forEach((r) => {
      const n = (a: string) => Number(r.getAttribute(a))
      x0 = Math.min(x0, n('x'))
      y0 = Math.min(y0, n('y'))
      x1 = Math.max(x1, n('x') + n('width'))
      y1 = Math.max(y1, n('y') + n('height'))
    })
    if (x1 > x0) svg.setAttribute('viewBox', `${x0 - 8} ${y0 - 8} ${x1 - x0 + 16} ${y1 - y0 + 16}`)
    // 세로 배치에서는 선 라벨(Zero-ETL)이 가운데 노드 밑에 깔린다. 라벨을 자기 선을 따라 노드와 겹치지 않는 자리로 옮긴다
    const boxOf = (id: string) => svg.querySelector<SVGGraphicsElement>(`[data-node="${id}"] .node-focus`)?.getBBox()
    const hit = (a: DOMRect, b: DOMRect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
    const nodes = [...svg.querySelectorAll<SVGGraphicsElement>('.node-focus')].map((r) => r.getBBox())
    svg.querySelectorAll<SVGGElement>('[data-edge] > g:has(> text)').forEach((g) => {
      g.removeAttribute('transform')
      const [from, to] = (g.parentElement?.dataset.edge ?? '').split('>')
      const a = boxOf(from)
      const b = boxOf(to)
      const lb = g.getBBox()
      if (!a || !b || !nodes.some((n) => hit(lb, n))) return
      const [ax, ay, bx, by] = [a.x + a.width / 2, a.y + a.height / 2, b.x + b.width / 2, b.y + b.height / 2]
      const cx = lb.x + lb.width / 2
      const cy = lb.y + lb.height / 2
      // 선 위 다른 지점 → 안 되면 가리는 노드 옆(선 바로 옆)으로
      const moves: [number, number][] = [0.4, 0.6, 0.3, 0.7, 0.2, 0.8].map((t) => [ax + (bx - ax) * t - cx, ay + (by - ay) * t - cy])
      nodes.filter((n) => hit(lb, n)).forEach((n) => moves.push([n.x - 2 - (lb.x + lb.width), 0], [n.x + n.width + 2 - lb.x, 0]))
      const ok = moves.find(([dx, dy]) => !nodes.some((n) => hit(new DOMRect(lb.x + dx, lb.y + dy, lb.width, lb.height), n)))
      if (ok) g.setAttribute('transform', `translate(${ok[0]} ${ok[1]})`)
    })
  }, [mobile])
  return (
    <section aria-labelledby="epilogue-map-title" className="py-[8svh]">
      <p className="font-mono text-sm text-muted">{UI.sceneKinds.story}</p>
      <h3 id="epilogue-map-title" className="mt-1 text-[1.375rem] font-bold leading-snug md:text-[1.625rem]">
        {I.mapNav.title}
      </h3>
      <p className="mt-2 max-w-[44rem] text-muted">{I.mapNav.hint}</p>
      <div
        ref={box}
        className="mx-auto mt-6 max-w-[64rem] [&_a:focus-visible_.node-focus]:opacity-100! [&_a:hover_.node-focus]:opacity-60! [&_a]:cursor-pointer [&_a]:outline-none"
      >
        <PipelineMap t={T.epilogue} interactive onNavigate={goTo} label={I.mapNav.label} />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// 도감: A–Z 칸(버튼) + 상세 줄 + 남은 카드 목록(그 챕터의 퀴즈로)
// ─────────────────────────────────────────────────────────────
export function DexBoard() {
  const { cards } = useProgress()
  const [sel, setSel] = useState('A')
  const n = cards.size
  const missing = CARDS.filter((x) => !cards.has(x.letter))
  const card = CARDS.find((x) => x.letter === sel) ?? CARDS[0]
  const owned = cards.has(card.letter)
  const go = (chapter: (typeof CARDS)[number]['chapter']) => (e: React.MouseEvent) => {
    e.preventDefault()
    goTo(`${chapter}-quiz`)
  }
  // 격자는 Tab 한 번(선택된 칸만 tabIndex 0), 칸 사이는 방향키·Home·End로 옮긴다. 열 수는 화면 폭마다 달라서 그때 읽는다
  const grid = useRef<HTMLOListElement>(null)
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const cols = grid.current ? getComputedStyle(grid.current).gridTemplateColumns.split(' ').length : 1
    const moves: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + cols, ArrowUp: i - cols, Home: 0, End: CARDS.length - 1 }
    const to = moves[e.key]
    if (!(e.key in moves) || to < 0 || to >= CARDS.length) return
    e.preventDefault()
    grid.current?.querySelectorAll('button')[to]?.focus()
  }
  return (
    <section aria-labelledby="epilogue-dexboard-title" className="py-[8svh]">
      <h3 id="epilogue-dexboard-title" className="text-[1.375rem] font-bold leading-snug md:text-[1.625rem]">
        {n === 26 ? F.dexDone(26) : F.dexCount(n)}
      </h3>
      <p className="mt-2 text-muted">{I.dex.hint}</p>
      <ol ref={grid} className="mt-6 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
        {CARDS.map((x, i) => {
          const has = cards.has(x.letter)
          const from = tocOf(x.chapter).label
          const on = sel === x.letter
          return (
            <li key={x.letter}>
              {/* 선택 표시는 포커스 링(바깥 외곽선)과 다르게: 강조색 테두리를 안쪽으로 두껍게 + 옅은 바탕 */}
              <button
                type="button"
                tabIndex={on ? 0 : -1}
                aria-current={on ? 'true' : undefined}
                onClick={() => setSel(x.letter)}
                onFocus={() => setSel(x.letter)}
                onKeyDown={(e) => onKey(e, i)}
                aria-label={has ? I.dex.cell(x.letter, x.term, x.def) : I.dex.cellMissing(x.letter, from)}
                className={`flex h-full min-h-[3.5rem] w-full flex-col items-start rounded-lg border-[1.5px] px-2 py-1.5 text-left ${
                  on ? 'border-accent bg-accent/15 shadow-[inset_0_0_0_1.5px_var(--accent)]' : has ? 'border-line bg-surface' : 'border-edge'
                } ${has ? '' : 'border-dashed'}`}
              >
                <span className={`font-mono text-lg font-bold leading-6 ${has ? '' : 'text-muted'}`} aria-hidden="true">
                  {x.letter}
                </span>
                <span className={`w-full text-[0.8125rem] leading-tight [overflow-wrap:anywhere] ${has ? 'font-semibold' : 'text-muted'}`} aria-hidden="true">
                  {has ? x.term : F.getAt(from)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-4 max-w-[40rem]">
        <ul>
          <TermCard card={card} owned={owned} variant="row" />
        </ul>
        {!owned && (
          <a href={`#${card.chapter}-quiz`} onClick={go(card.chapter)} className="mt-2 inline-block font-semibold underline underline-offset-4">
            {I.dex.go(tocOf(card.chapter).label)}
          </a>
        )}
      </div>
      {missing.length > 0 && (
        <div className="mt-8">
          <h4 className="font-bold">{I.dex.missingTitle}</h4>
          <ul className="mt-2 space-y-1">
            {missing.map((x) => {
              const t = tocOf(x.chapter)
              return (
                <li key={x.letter}>
                  <a href={`#${x.chapter}-quiz`} onClick={go(x.chapter)} className="inline-flex min-h-[2.75rem] items-center underline-offset-4 hover:underline">
                    {I.dex.row(x.letter, x.term, t.label, t.title)}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 처음부터 다시 보기 (스크롤 연동 아님)
// ─────────────────────────────────────────────────────────────
/** 작은 종이 카드 '첫 스케치'(프롤로그 스테이지의 종이·잉크·거친 선) */
function SketchCard() {
  const st = STAGES[0]
  return (
    <StageCtx.Provider value={st}>
      <svg viewBox="0 0 300 120" className="diagram mx-auto w-full max-w-[22rem]" role="img" aria-label={I.restart.cardAlt} style={{ ...(stageVars(st) as React.CSSProperties), color: st.line }}>
        <rect x={2} y={2} width={296} height={116} style={{ fill: 'var(--bg)' }} />
        <RRect x={3} y={3} w={294} h={114} seed="ep-rs-paper" rough={0.5} />
        {F.sketch.map((s, i) => (
          <Node key={s.label} x={54 + i * 96} y={62} w={84} h={50} label={s.label} sub={s.sub} kind={i === 1 ? 'doc' : i === 0 ? 'source' : 'serve'} seed={`ep-rs${i}`} scale={0.72} />
        ))}
        {[0, 1].map((i) => (
          <RArrow key={i} x1={98 + i * 96} y1={62} x2={108 + i * 96} y2={62} seed={`ep-rsa${i}`} head={6} />
        ))}
      </svg>
    </StageCtx.Provider>
  )
}

/** 첫 화면으로. 진행도를 지운 뒤에는 부드럽게 굴리지 않는다(지나가는 챕터가 다시 '도달'로 기록되지 않게) */
function toTop(smooth: boolean) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  history.replaceState(null, '', location.pathname + location.search)
  const h = document.querySelector<HTMLElement>('#top h1')
  if (h) {
    h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  }
}

export function Restart() {
  const p = useProgress()
  const { reduced } = useEnv()
  const [open, setOpen] = useState(false)
  const first = useRef<HTMLButtonElement>(null)
  const dlg = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const R = I.restart
  useEffect(() => {
    if (open) first.current?.focus()
  }, [open])
  return (
    <section aria-labelledby="epilogue-restart" className="pb-[18svh] pt-[10svh]">
      <div className="mx-auto max-w-[34rem]">
        <p className="font-mono text-sm text-muted">{UI.sceneKinds.story}</p>
        <h3 id="epilogue-restart" className="mt-1 text-[1.375rem] font-bold leading-snug md:text-[1.625rem]">
          {c.scenes.restart.title}
        </h3>
        <div className="mt-8">
          <SketchCard />
        </div>
        <div className="mt-8">
          <Bubble line={c.line} />
        </div>
        <p className="mt-6 text-[1.0625rem] leading-[1.85] md:text-[1.1875rem]">{R.text}</p>
        <p className="mt-3 font-mono text-sm text-muted">
          {UI.hud.level(p.level, LEVELS[p.level])} · {UI.hud.cards(p.cards.size)} · {UI.hud.progress(Math.round(p.ratio * 100))}
        </p>
        <div className="mt-6">
          <button type="button" className="btn btn-solid" aria-expanded={open} aria-controls="epilogue-restart-choices" onClick={() => setOpen((v) => !v)}>
            {R.button}
          </button>
          <div id="epilogue-restart-choices" hidden={!open} className="mt-3 flex flex-wrap gap-3">
            <button
              ref={first}
              type="button"
              className="btn"
              onClick={() => {
                setOpen(false)
                toTop(!reduced)
              }}
            >
              {R.keep}
            </button>
            <button type="button" className="btn" aria-haspopup="dialog" onClick={() => {
                dlg.current?.showModal()
                cancel.current?.focus()
              }}
            >
              {R.reset}
            </button>
          </div>
        </div>
      </div>
      <dialog ref={dlg} aria-labelledby="epilogue-reset-title" aria-describedby="epilogue-reset-body" className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border-[1.5px] border-edge bg-bg p-6 text-ink shadow-2xl">
        <h4 id="epilogue-reset-title" className="text-xl font-extrabold">
          {R.dialogTitle}
        </h4>
        <p id="epilogue-reset-body" className="mt-2">
          {R.dialogBody}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-solid"
            onClick={() => {
              p.reset()
              dlg.current?.close()
              setOpen(false)
              toTop(false)
            }}
          >
            {R.yes}
          </button>
          <button ref={cancel} type="button" className="btn" onClick={() => dlg.current?.close()}>
            {R.no}
          </button>
        </div>
      </dialog>
    </section>
  )
}
