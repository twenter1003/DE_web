import type { ReactNode } from 'react'
import { ch10 } from '../../content/chapters/ch10'
import { T } from '../../content/map'
import { LEVELS, PEOPLE } from '../../content/people'
import type { Who } from '../../content/types'
import { UI } from '../../content/ui'
import { Badge, Node } from '../../components/diagram'
import { Desk } from '../../components/Desk'
import { Fig, Txt, countTo } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { mapTransition, PipelineMap } from '../../components/PipelineMap'
import { RArrow, RLine, RPath, RRect, StageCtx } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { STAGES } from '../../lib/stages'
import { boundsOf, mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import { BubbleBox, Counter, Initial, MapThumb, Pill, PropArrow, PropNode, TypeText, initThumb, num, pick, scoped, stepCount, thumbFit, thumbTf, tw } from './parts'

const F = ch10.figures
const S = ch10.scenes

// 노드 라벨·모양은 map.ts에서(제안 상태 + 최종 상태를 합쳐 둔다)
const LBL = new Map<string, ReturnType<typeof mapStateAt>['nodes'][number]>()
for (const t of [T.ch10Proposal, T.ch10Final]) for (const n of mapStateAt(t).nodes) LBL.set(n.id, n)
const lb = (id: string) => LBL.get(id)!
const count = (t: number) => mapStateAt(t).nodes.length
const N9 = count(T.ch9)
const N10 = count(T.ch10Proposal)
const NC = count(T.ch10Climax)
const NB = count(T.ch10Buy)
const NF = count(T.ch10Final)
// 전체 맵(가로 배치)의 가로세로 비율
const MAP_AR = (() => {
  const b = boundsOf(mapStateAt(T.ch10Proposal).nodes, 30, 2.4)
  return `${b.w} / ${b.h}`
})()
const ZERO_ETL = mapStateAt(T.ch10Buy).edges.find((e) => e.id === 'oltp>lakehouse')?.label ?? ''

/** 맵 노드 하나를 장면 좌표에 다시 그린다 */
function MNode({ id, x, y, w = 150, h = 52, el, bands, plain, noSub }: { id: string; x: number; y: number; w?: number; h?: number; el?: string; bands?: boolean; plain?: boolean; noSub?: boolean }) {
  const n = lb(id)
  return (
    <Node
      x={x}
      y={y}
      w={w}
      h={h}
      label={plain ? '' : n.label}
      sub={plain || noSub ? undefined : n.sub}
      kind={n.kind}
      seed={`c10-${id}-${x}-${y}`}
      el={el}
      bands={bands ? ['Bronze', 'Silver', 'Gold'] : undefined}
    />
  )
}

/** 꺾인 화살표(점선 가능) */
function Elbow({ pts, el, dash, stroke }: { pts: [number, number][]; el?: string; dash?: string; stroke?: string }) {
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]]
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const h = 9
  const head = `M ${b[0] - h * Math.cos(ang - 0.45)} ${b[1] - h * Math.sin(ang - 0.45)} L ${b[0]} ${b[1]} L ${b[0] - h * Math.cos(ang + 0.45)} ${b[1] - h * Math.sin(ang + 0.45)}`
  return (
    <g data-el={el}>
      <path d={'M ' + pts.map((p) => p.join(' ')).join(' L ')} style={{ fill: 'none', stroke: stroke ?? 'currentColor' }} strokeWidth={1.6} strokeDasharray={dash} strokeLinejoin="round" />
      <path d={head} style={{ fill: 'none', stroke: stroke ?? 'currentColor' }} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 두 캡션을 같은 자리에 겹쳐 두고 step마다 하나씩 켠다 */
function Caps({ items }: { items: [string, string][] }) {
  return (
    <span className="grid">
      {items.map(([el, text]) => (
        <span key={el} data-el={el} className="[grid-area:1/1]">
          {text}
        </span>
      ))}
    </span>
  )
}

const shafts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
const heads = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))
/** 물러난(걷어낸) 요소의 흐림. 이름이 무엇이 물러났는지 알려 주므로 보조색(muted) 글자도 4.5:1이 남는 만큼만(0.8 ≈ 4.8:1).
 *  제안 노드는 Node가 이미 0.78로 그리므로 더 흐리지 않는다 */
const DIM = 0.8

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 하루 만에 21개가 된 맵
// ─────────────────────────────────────────────────────────────
const FULL = { x: 0, y: 8, w: 440 }
const P2 = { kafka: [95, 190], agg: [335, 190], cache: [335, 295], dash: [335, 400], tool: [95, 295] } as const

export function ProblemFig() {
  const nw = 150
  const half = nw / 2
  return (
    <Fig caption={<span data-el="cap-care">{F.careNote}</span>}>
      <Counter n={N9} ch9={N9} />
      <MapThumb t={T.ch10Proposal} from={T.ch9} />

      <g data-el="close">
        <MNode id="kafka" x={P2.kafka[0]} y={P2.kafka[1]} />
        <PropArrow x1={P2.kafka[0] + half + 6} y1={P2.agg[1]} x2={P2.agg[0] - half - 8} y2={P2.agg[1]} el="ar-agg" />
        <PropNode x={P2.agg[0]} y={P2.agg[1]} label={lb('rtAgg').label} sub={lb('rtAgg').sub} el="pn-agg" />
        <PropArrow x1={P2.agg[0]} y1={P2.agg[1] + 31} x2={P2.cache[0]} y2={P2.cache[1] - 34} el="ar-cache" />
        <PropNode x={P2.cache[0]} y={P2.cache[1]} label={lb('cache').label} sub={lb('cache').sub} el="pn-cache" />
        <PropArrow x1={P2.cache[0]} y1={P2.cache[1] + 31} x2={P2.dash[0]} y2={P2.dash[1] - 34} el="ar-dash" />
        <PropNode x={P2.dash[0]} y={P2.dash[1]} label={lb('rtDash').label} sub={lb('rtDash').sub} el="pn-dash" />
        <PropNode x={P2.tool[0]} y={P2.tool[1]} label={lb('newTool').label} sub={lb('newTool').sub} el="pn-tool" />
        <PropArrow x1={P2.tool[0] + half + 6} y1={P2.cache[1]} x2={P2.cache[0] - half - 8} y2={P2.cache[1]} el="ar-tool" />
        <Pill x={P2.agg[0]} y={P2.agg[1] - 44} text={F.soraReq} el="tag-sora" strong />
        <Pill x={P2.tool[0]} y={P2.tool[1] - 44} text={F.taeoReq} el="tag-taeo" strong />
      </g>

      {/* step 3: 노드 하나 = … × 21 */}
      <g data-el="care">
        <RRect x={14} y={298} w={412} h={114} seed="care" rough={0.4} fill="var(--surface)" />
        <Txt x={30} y={326} size={15} weight={800}>
          {F.care.head}
        </Txt>
        {F.care.items.map((t, i) => (
          <Txt key={t} x={30} y={352 + i * 23} size={14}>
            {`· ${t}`}
          </Txt>
        ))}
        <Txt x={410} y={392} size={36} weight={800} anchor="end" el="care-n">
          {F.times(N10)}
        </Txt>
      </g>
      <g data-el="ria">
        <Initial x={34} y={447} r={17} who="ria" />
        <BubbleBox x={62} y={427} w={162} h={42} seed="ria-b">
          <Txt x={76} y={453} size={14.5} weight={700}>
            {F.riaAsk}
          </Txt>
          <Badge x={176} y={448} status="wait" r={9} />
          <Txt x={190} y={453} size={13.5} weight={600}>
            {F.waiting}
          </Txt>
        </BubbleBox>
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const thumb = o('thumb')[0]
  initThumb(tl, thumb)
  const tq = scoped(o('thumb-map')[0])
  // 썸네일: 소라의 세 노드는 mapTransition이, 태오의 새 분석 툴은 step 2에서 따로 켠다
  const later = [...tq('[data-node="newTool"]'), ...tq('[data-edge="newTool>cache"]')]
  later.forEach((el) => ((el as SVGElement).dataset.change = 'later'))
  tl.set(later, { opacity: 0 }, 0)
  mapTransition(tq, tl, at(0) + 0.12, { dur: 0.6 })

  const part = (n: string) => ({ seg: o(`${n}-seg`), head: o(`${n}-head`), bg: o(`${n}-bg`), txt: o(`${n}-txt`) })
  const names = ['ar-agg', 'pn-agg', 'ar-cache', 'pn-cache', 'ar-dash', 'pn-dash', 'pn-tool', 'ar-tool']
  const P = Object.fromEntries(names.map((n) => [n, part(n)]))
  tl.set(
    names.flatMap((n) => [...P[n].seg, ...P[n].head, ...P[n].bg, ...P[n].txt]),
    { opacity: 0 },
    0,
  )
  tl.set([...o('tag-sora'), ...o('tag-taeo'), ...o('cnt-ch9'), ...o('care'), ...o('ria'), ...o('cap-care')], { opacity: 0 }, 0)
  const arrow = (n: string, t: number) => {
    tl.to(P[n].seg, { opacity: 1, duration: 0.001, stagger: 0.05 / Math.max(1, P[n].seg.length) }, t)
    tl.to(P[n].head, { opacity: 1, duration: 0.02 }, t + 0.05)
  }
  const node = (n: string, t: number) => {
    tl.to(P[n].bg, { opacity: 1, duration: 0.04 }, t)
    tl.to(P[n].seg, { opacity: 1, duration: 0.001, stagger: 0.1 / Math.max(1, P[n].seg.length) }, t)
    tl.to(P[n].txt, { opacity: 1, duration: 0.05 }, t + 0.08)
  }

  // step 1: 브로커에서부터 제안 노드 세 개가 차례로 — 카운터 17 → 20
  const marks: [number, number][] = []
  ;['agg', 'cache', 'dash'].forEach((k, i) => {
    const t = at(0) + 0.04 + i * 0.22
    arrow(`ar-${k}`, t)
    node(`pn-${k}`, t + 0.06)
    marks.push([N9 + i + 1, t + 0.16])
  })
  tl.to(o('tag-sora'), { opacity: 1, duration: 0.08 }, at(0) + 0.72)

  // step 2: 새 분석 툴 → 21, 이어 'Ch9: 17'
  const t2 = at(1) + 0.04
  node('pn-tool', t2)
  arrow('ar-tool', t2 + 0.12)
  tl.to(later, { opacity: 1, duration: 0.1 }, t2 + 0.08)
  marks.push([N10, t2 + 0.16])
  stepCount(tl, o('cnt')[0], N9, marks)
  tl.to(o('tag-taeo'), { opacity: 1, duration: 0.08 }, t2 + 0.26)
  tl.to(o('cnt-ch9'), { opacity: 1, duration: 0.12 }, at(1) + 0.52)

  // step 3: 썸네일이 전체 맵으로 커지고, 노드 21개가 차례로 한 번씩 — × 0 → 21
  const s3 = at(2)
  tl.to([...o('close'), ...o('counter'), ...o('thumb-frame')], { opacity: 0, duration: 0.12 }, s3)
  const full = thumbFit(T.ch10Proposal, FULL)
  if (thumb) tl.to(thumb, { attr: { transform: thumbTf(full) }, duration: 0.24, ease: 'power2.inOut' }, s3 + 0.04)
  const pos = (el: Element, k: string) => Number(el.getAttribute(k))
  const rings = tq('[data-node] .node-focus').sort((a, b) => pos(a, 'x') - pos(b, 'x') || pos(a, 'y') - pos(b, 'y'))
  tl.set(rings, { attr: { 'stroke-width': 9 } }, 0)
  const each = 0.02
  rings.forEach((r, i) => {
    const t = s3 + 0.3 + i * each
    tl.to(r, { opacity: 1, duration: 0.01 }, t)
    tl.to(r, { opacity: 0, duration: 0.025 }, t + 0.025)
  })
  tl.to(o('care'), { opacity: 1, duration: 0.1 }, s3 + 0.2)
  countTo(tl, o('care-n')[0], 0, N10, F.times, s3 + 0.3, rings.length * each)
  tl.to(o('ria'), { opacity: 1, duration: 0.1 }, s3 + 0.6)
  tl.to(o('cap-care'), { opacity: 1, duration: 0.1 }, s3 + 0.64)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — '어떻게'부터 그리다 멈춘 펜
// ─────────────────────────────────────────────────────────────
const LX = 28
const LY = (k: number) => 80 + k * 26
const LSIZE = 14.5
const FLOW = { x1: 162, x2: 276, y: 252 }
const ROW = (k: number) => 346 + k * 30

export function AttemptFig() {
  const { mobile } = useEnv()
  const nFlow = mobile ? 3 : 4
  const n = S.attempt.steps[2].lines!
  const ans = F.answer
  const ulx = 46
  return (
    <Fig>
      {/* step 1: 화이트보드 */}
      <g data-el="board">
        <RRect x={10} y={10} w={420} h={204} seed="wb10" rough={0.4} fill="var(--surface)" />
        <Txt x={LX} y={44} size={15} weight={800}>
          {F.boardTitle}
        </Txt>
        <Txt x={LX + tw(F.boardTitle, 15) + 12} y={46} size={24} weight={800} el="plan-n">
          0
        </Txt>
        {F.plan.map((line, k) => (
          <text key={line} x={LX} y={LY(k)} className="t-sans" style={{ fontSize: LSIZE, fontWeight: 600 }}>
            {Array.from(line).map((ch, i) => (
              <tspan key={i} data-el={`pl-${k}`}>
                {ch}
              </tspan>
            ))}
          </text>
        ))}
        <Txt x={292} y={82} size={12.5} muted weight={600}>
          {F.reference}
        </Txt>
        <MNode id="stock" x={358} y={124} w={132} h={48} />
        <g data-el="pen">
          <path d="M 0 0 L 3 -9 L 19 -25 L 25 -19 L 9 -3 Z" style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M 0 0 L 3 -9 L 9 -3 Z" style={{ fill: 'var(--line)' }} />
        </g>
      </g>

      {/* step 2: 맵 조각 + 조회 수 표 */}
      <g data-el="frag">
        <MNode id="kafka" x={85} y={FLOW.y} w={140} h={46} />
        <RArrow x1={FLOW.x1} y1={FLOW.y} x2={FLOW.x2} y2={FLOW.y} seed="c10-flow" rough={0.4} />
        {Array.from({ length: nFlow }, (_, k) => (
          <circle key={k} data-el="flow" cx={FLOW.x1} cy={FLOW.y} r={4.5} style={{ fill: 'var(--accent)' }} />
        ))}
        <Txt x={(FLOW.x1 + FLOW.x2) / 2} y={FLOW.y - 12} size={13} anchor="middle" muted weight={600}>
          {F.stillFlowing}
        </Txt>
        <MNode id="stock" x={355} y={FLOW.y} w={140} h={46} />
        <Pill x={355} y={FLOW.y + 40} text={F.zeroViews} status="fail" el="zero-tag" strong />
      </g>
      <g data-el="tbl">
        <Txt x={24} y={334} size={13.5} weight={800}>
          {F.viewsTitle}
        </Txt>
        <rect data-el="tr-hl" x={18} y={ROW(0)} width={404} height={30} style={{ fill: 'var(--accent)', opacity: 0.22 }} />
        {F.views.map(([k, v], i) => {
          const bad = i >= 2
          return (
            <g key={k} data-el="tr">
              {bad && <rect data-el="tr-bad" x={18} y={ROW(i)} width={404} height={30} style={{ fill: 'var(--fail)', opacity: 0.2 }} />}
              <line x1={18} y1={ROW(i)} x2={422} y2={ROW(i)} style={{ stroke: 'var(--edge)' }} />
              <Txt x={30} y={ROW(i) + 20} size={13.5} weight={bad ? 800 : 500}>
                {k}
              </Txt>
              <Txt x={372} y={ROW(i) + 20} size={13.5} weight={bad ? 800 : 500} anchor="end">
                {v}
              </Txt>
              {bad && <Badge x={400} y={ROW(i) + 15} status="fail" r={9} />}
            </g>
          )
        })}
        <line x1={18} y1={ROW(4)} x2={422} y2={ROW(4)} style={{ stroke: 'var(--edge)' }} />
      </g>

      {/* step 3: 소라의 자리 */}
      <g data-el="recall">
        <StageCtx.Provider value={STAGES[6]}>
          <BubbleBox x={80} y={238} w={340} h={54} seed="recall6" dash="5 5" rough={1.6}>
            <Txt x={96} y={257} size={11.5} muted weight={600}>
              {F.recallFrom}
            </Txt>
            <Txt x={96} y={280} size={14.5} weight={600}>
              {F.recall}
            </Txt>
          </BubbleBox>
        </StageCtx.Provider>
      </g>
      <g data-el="juni-now">
        <g transform="translate(12 300) scale(0.54)">
          <JuniFace mood="relaxed" seed="c10-juni3" />
        </g>
        <BubbleBox x={80} y={306} w={340} h={46} seed="juni3">
          <Txt x={96} y={334} size={14.5} weight={600} el="ghost-txt" style={{ opacity: 0.55 }}>
            {F.recall}
          </Txt>
          <Txt x={96} y={334} size={14.5} weight={750} el="now-txt">
            {n[0].text}
          </Txt>
        </BubbleBox>
      </g>
      <g data-el="sora">
        <Initial x={410} y={404} r={18} who="sora" />
        <BubbleBox x={24} y={372} w={354} h={72} side="right" seed="sora3">
          <Txt x={ulx - 4} y={400} size={14.5} weight={600}>
            {ans[0]}
          </Txt>
          <text x={ulx - 4} y={428} className="t-sans" style={{ fontSize: 14.5, fontWeight: 800 }}>
            <tspan>{ans[1]}</tspan>
            <tspan style={{ fontWeight: 600 }}>{ans[2]}</tspan>
          </text>
          <line data-el="ul" x1={ulx - 4} y1={433} x2={ulx - 4 + tw(ans[1], 14.5)} y2={433} style={{ stroke: 'var(--line)' }} strokeWidth={2.4} strokeLinecap="round" />
        </BubbleBox>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)
  tl.set([...o('frag'), ...o('tbl'), ...o('recall'), ...o('juni-now'), ...o('sora')], { opacity: 0 }, 0)

  // step 1: 다섯 줄이 한 줄씩 써지고 '새로 만들 것' 0 → 5, 펜이 줄 끝을 따라간다
  const pen = o('pen')[0]
  tl.set(pen, { x: LX, y: LY(0) }, 0)
  const marks: [number, number][] = []
  F.plan.forEach((line, k) => {
    const chars = o(`pl-${k}`)
    const t = at(0) + 0.03 + k * 0.155
    tl.set(chars, { opacity: 0 }, 0)
    tl.to(chars, { opacity: 1, duration: 0.001, stagger: 0.12 / chars.length }, t)
    if (pen) {
      tl.set(pen, { x: LX, y: LY(k) }, t)
      tl.to(pen, { x: LX + tw(line, LSIZE) + 4, duration: 0.12, ease: 'none' }, t)
    }
    marks.push([k + 1, t + 0.12])
  })
  stepCount(tl, o('plan-n')[0], 0, marks)

  // step 2: 조회 수가 행마다 줄어들어 0회 ✕ — 그래도 입자는 계속 흐른다
  const s2 = at(1)
  tl.to(o('frag'), { opacity: 1, duration: 0.1 }, s2)
  tl.to(o('tbl'), { opacity: 1, duration: 0.1 }, s2 + 0.04)
  const rows = o('tr')
  const hl = o('tr-hl')
  tl.set([...rows, ...o('zero-tag')], { opacity: 0 }, 0)
  tl.set(hl, { opacity: 0 }, 0)
  rows.forEach((r, i) => {
    const t = s2 + 0.12 + i * 0.1
    tl.to(r, { opacity: 1, duration: 0.05 }, t)
    if (i === 0) tl.to(hl, { opacity: 0.22, duration: 0.04 }, t)
    else tl.to(hl, { y: ROW(i) - ROW(0), duration: 0.06, ease: 'power1.inOut' }, t)
  })
  tl.to(hl, { opacity: 0, duration: 0.06 }, s2 + 0.56)
  tl.to(o('zero-tag'), { opacity: 1, duration: 0.08 }, s2 + 0.5)
  const dots = o('flow')
  const len = FLOW.x2 - 10 - FLOW.x1
  const p = { v: 0 }
  const place = () => dots.forEach((d, k) => ((d as SVGCircleElement).setAttribute('cx', String(FLOW.x1 + (((p.v + k / dots.length) % 1) * len)))))
  place()
  tl.to(p, { v: 4, duration: 0.84, ease: 'none', onUpdate: place }, s2 + 0.02)

  // step 3: 펜을 내려놓고 소라에게 — 혼잣말이 질문이 된다
  const s3 = at(2)
  tl.to([...o('frag'), ...o('tbl')], { opacity: 0, duration: 0.1 }, s3)
  // 뒤로 물린 화이트보드·회상 말풍선도 글자는 읽혀야 해서 흐림은 대비 4.5:1이 남는 만큼만
  tl.to(o('board'), { opacity: DIM, duration: 0.15 }, s3)
  tl.set(o('recall'), { y: -26 }, 0)
  tl.to(o('recall'), { opacity: 0.85, y: 0, duration: 0.18 }, s3 + 0.06)
  tl.set(o('now-txt'), { opacity: 0 }, 0)
  tl.to(o('juni-now'), { opacity: 1, duration: 0.1 }, s3 + 0.18)
  tl.to(o('ghost-txt'), { opacity: 0, duration: 0.1 }, s3 + 0.3)
  tl.to(o('now-txt'), { opacity: 1, duration: 0.1 }, s3 + 0.3)
  tl.to(o('sora'), { opacity: 1, duration: 0.1 }, s3 + 0.46)
  tl.set(o('ul'), { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.to(o('ul'), { scaleX: 1, duration: 0.12 }, s3 + 0.62)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 트레이드오프
// ─────────────────────────────────────────────────────────────
const PCX = [78, 220, 362]
const MC = { x: 220, y: 396, r: 80 }
const polar = (deg: number, r: number) => [MC.x + r * Math.cos((deg * Math.PI) / 180), MC.y - r * Math.sin((deg * Math.PI) / 180)]
const GP: [number, number][] = [
  [110, 100],
  [330, 100],
  [110, 322],
  [330, 322],
]
const GR = 56
const G_LOW = -78
const G_HIGH = 78
// 게이지 사이 연결선: [시작, 끝, 처짐 방향]
const TLINES: [[number, number], [number, number], [number, number]][] = [
  [[174, 76], [266, 76], [0, 1]],
  [[174, 298], [266, 298], [0, 1]],
  [[110, 180], [110, 258], [1, 0]],
  [[330, 180], [330, 258], [-1, 0]],
]
const qd = ([a, b, n]: (typeof TLINES)[number], sag: number) => {
  const mx = (a[0] + b[0]) / 2 + n[0] * sag
  const my = (a[1] + b[1]) / 2 + n[1] * sag
  return `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`
}

export function TradeoffFig() {
  const fast = F.compare.fast
  const slow = F.compare.slow
  return (
    <Fig
      caption={
        <Caps
          items={[
            ['cap-g', F.gaugeNote],
            ['cap-c', F.compareNote],
          ]}
        />
      }
    >
      {/* step 1: 택배 상자 세 개 + 배송비 미터기 */}
      <g data-el="parcels">
        {F.parcels.map((p, i) => {
          const x = PCX[i]
          return (
            <g key={p.speed} data-el="pc">
              <RPath d={`M ${x - 40} 46 L ${x - 26} 30 L ${x + 48} 30 L ${x + 34} 46 Z`} seed={`box-t${i}`} rough={0.4} fill="var(--bg)" />
              <RPath d={`M ${x + 34} 46 L ${x + 48} 30 L ${x + 48} 82 L ${x + 34} 98 Z`} seed={`box-s${i}`} rough={0.4} fill="var(--bg)" />
              <RRect x={x - 40} y={46} w={74} h={52} seed={`box${i}`} rough={0.4} fill="var(--surface)" />
              <RLine x1={x - 14} y1={46} x2={x + 2} y2={30} seed={`tape${i}`} rough={0.3} strokeWidth={2.4} />
              <RLine x1={x - 14} y1={46} x2={x - 14} y2={66} seed={`tape-v${i}`} rough={0.3} strokeWidth={2.4} />
              <Txt x={x} y={124} size={15} weight={800} anchor="middle">
                {p.speed}
              </Txt>
              <Txt x={x} y={147} size={14} weight={700} anchor="middle">
                {p.fee}
              </Txt>
              {p.prep.map((l, j) => (
                <Txt key={l} x={x} y={214 + j * 20} size={13.5} anchor="middle">
                  {l}
                </Txt>
              ))}
            </g>
          )
        })}
        <line x1={14} y1={170} x2={426} y2={170} style={{ stroke: 'var(--edge)' }} />
        <Txt x={14} y={190} size={13} muted weight={600}>
          {F.prepTitle}
        </Txt>
        <g data-el="meter">
          <RPath d={`M ${MC.x - MC.r} ${MC.y} A ${MC.r} ${MC.r} 0 0 1 ${MC.x + MC.r} ${MC.y}`} seed="meter-a" rough={0.3} />
          {[120, 60].map((d) => {
            const [x1, y1] = polar(d, MC.r - 10)
            const [x2, y2] = polar(d, MC.r + 4)
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
          })}
          {F.meterMarks.map((m, i) => {
            const [x, y] = polar(150 - i * 60, MC.r + 20)
            return (
              <Txt key={m} x={x} y={y + 5} size={14} weight={800} anchor="middle">
                {m}
              </Txt>
            )
          })}
          <g data-el="needle">
            <line x1={MC.x} y1={MC.y} x2={MC.x} y2={MC.y - MC.r + 16} style={{ stroke: 'var(--ink)' }} strokeWidth={3} strokeLinecap="round" />
          </g>
          <circle cx={MC.x} cy={MC.y} r={5} style={{ fill: 'var(--ink)' }} />
          <Txt x={MC.x} y={MC.y + 26} size={13} muted weight={600} anchor="middle">
            {F.meter}
          </Txt>
        </g>
      </g>

      {/* step 2: 서로 당기는 게이지 네 개 */}
      <g data-el="gauges">
        {TLINES.map((l, i) => (
          <path key={i} data-el="tline" data-taut={qd(l, 0)} d={qd(l, 18)} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.8} strokeLinecap="round" />
        ))}
        {F.gauges.map((g, i) => {
          const [x, y] = GP[i]
          return (
            <g key={g.name}>
              <RPath d={`M ${x - GR} ${y} A ${GR} ${GR} 0 0 1 ${x + GR} ${y}`} seed={`g10-${i}`} rough={0.3} />
              <Txt x={x - GR} y={y + 17} size={12} muted anchor="middle">
                {g.low}
              </Txt>
              <Txt x={x + GR} y={y + 17} size={12} muted anchor="middle">
                {g.high}
              </Txt>
              <g data-el={`gn-${i}`}>
                <line x1={x} y1={y} x2={x} y2={y - GR + 10} style={{ stroke: 'var(--ink)' }} strokeWidth={3} strokeLinecap="round" />
              </g>
              <circle cx={x} cy={y} r={4.5} style={{ fill: 'var(--ink)' }} />
              <Txt x={x} y={y + 42} size={14.5} weight={800} anchor="middle">
                {g.name}
              </Txt>
              <Txt x={x} y={y + 62} size={13.5} weight={700} anchor="middle" el={`gv-lo-${i}`}>
                {g.low}
              </Txt>
              <Txt x={x} y={y + 62} size={13.5} weight={800} anchor="middle" el={`gv-hi-${i}`}>
                {g.high}
              </Txt>
            </g>
          )
        })}
      </g>

      {/* step 3: 1초 vs 15분 */}
      <g data-el="compare">
        {[
          { c: fast, y: 10, h: 216, el: 'cf' },
          { c: slow, y: 238, h: 146, el: 'cs' },
        ].map(({ c, y, h, el }) => (
          <g key={el} data-el={`${el}-panel`}>
            <RRect x={10} y={y} w={420} h={h} seed={`${el}-p`} rough={0.4} fill="var(--surface)" />
            <Txt x={28} y={y + 34} size={22} weight={800}>
              {c.title}
            </Txt>
            {c.chips.map((chip, k) => {
              const cy = y + 48 + k * 36
              return (
                <g key={chip} data-el={`${el}-chip`}>
                  <rect x={28} y={cy} width={384} height={30} rx={6} style={{ fill: 'var(--bg)', stroke: 'var(--edge)' }} strokeWidth={1.4} />
                  <Txt x={42} y={cy + 20} size={14} weight={700}>
                    {chip}
                  </Txt>
                  <Pill x={404} y={cy + 15} text={c.tag} anchor="end" size={13} />
                </g>
              )
            })}
            <Txt x={28} y={y + h - 12} size={13.5} weight={700} el={`${el}-foot`}>
              {c.foot}
            </Txt>
          </g>
        ))}
        <g data-el="rule">
          <rect x={10} y={394} width={420} height={36} rx={6} style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1.4} />
          <Txt x={26} y={417} size={14} weight={800}>
            {F.compare.rule}
          </Txt>
          {[fast.title, slow.title].map((t, i) => (
            <g key={t} data-el="rule-ok" transform={`translate(${302 + i * 64} 0)`}>
              <Badge x={0} y={412} status="ok" r={9} />
              <Txt x={14} y={417} size={13.5} weight={700}>
                {t}
              </Txt>
            </g>
          ))}
        </g>
        <Txt x={220} y={462} size={14.5} weight={800} anchor="middle" el="next">
          {F.compare.next}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildTradeoff: SceneBuild = (q, tl) => {
  const o = pick(q)
  tl.set([...o('gauges'), ...o('compare'), ...o('cap-g'), ...o('cap-c')], { opacity: 0 }, 0)

  // step 1: 상자가 하나씩 — 미터기 바늘이 한 칸씩 오른다
  const boxes = o('pc')
  const needle = o('needle')
  tl.set(boxes, { opacity: 0 }, 0)
  tl.set(needle, { rotation: -86, svgOrigin: `${MC.x} ${MC.y}` }, 0)
  boxes.forEach((b, i) => {
    const t = at(0) + 0.05 + i * 0.24
    tl.to(b, { opacity: 1, duration: 0.1 }, t)
    tl.to(needle, { rotation: -60 + i * 60, duration: 0.14, ease: 'power1.inOut' }, t + 0.06)
  })

  // step 2: 지연시간을 당기면 연결선이 팽팽해지며 나머지가 따라온다
  const s2 = at(1)
  tl.to(o('parcels'), { opacity: 0, duration: 0.12 }, s2)
  tl.to(o('gauges'), { opacity: 1, duration: 0.12 }, s2 + 0.08)
  GP.forEach(([x, y], i) => {
    const n = o(`gn-${i}`)
    tl.set(n, { rotation: G_LOW, svgOrigin: `${x} ${y}` }, 0)
    tl.set(o(`gv-hi-${i}`), { opacity: 0 }, 0)
    const t = s2 + 0.22 + (i === 0 ? 0 : 0.12 + i * 0.05)
    tl.to(n, { rotation: G_HIGH, duration: 0.26, ease: 'power1.inOut' }, t)
    tl.to(o(`gv-lo-${i}`), { opacity: 0, duration: 0.06 }, t + 0.12)
    tl.to(o(`gv-hi-${i}`), { opacity: 1, duration: 0.06 }, t + 0.12)
  })
  o('tline').forEach((l) => tl.to(l, { attr: { d: (l as SVGElement).dataset.taut ?? '' }, duration: 0.24, ease: 'power1.inOut' }, s2 + 0.24))
  tl.to(o('cap-g'), { opacity: 1, duration: 0.1 }, s2 + 0.6)

  // step 3: 같은 기준을 채우는 데 드는 몫 — 왼쪽은 칩 4개, 오른쪽은 2개
  const s3 = at(2)
  tl.to([...o('gauges'), ...o('cap-g')], { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('compare'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  const fastChips = o('cf-chip')
  const slowChips = o('cs-chip')
  tl.set([...fastChips, ...slowChips, ...o('cf-foot'), ...o('cs-foot'), ...o('rule'), ...o('rule-ok'), ...o('next')], { opacity: 0 }, 0)
  fastChips.forEach((c, k) => tl.to(c, { opacity: 1, duration: 0.06 }, s3 + 0.16 + k * 0.09))
  slowChips.forEach((c, k) => tl.to(c, { opacity: 1, duration: 0.06 }, s3 + 0.16 + k * 0.09))
  tl.to([...o('cf-foot'), ...o('cs-foot')], { opacity: 1, duration: 0.08 }, s3 + 0.52)
  tl.to(o('rule'), { opacity: 1, duration: 0.08 }, s3 + 0.58)
  tl.to(o('rule-ok'), { opacity: 1, duration: 0.06 }, s3 + 0.66)
  tl.to([...o('next'), ...o('cap-c')], { opacity: 1, duration: 0.1 }, s3 + 0.72)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 해결 — 안 만드는 결정(클라이맥스)
// ─────────────────────────────────────────────────────────────
const RX = [105, 330]
const RY = (r: number) => 48 + r * 84
const enough = F.reasons.enough.join(' ')
/** 걷어낸 다섯 노드: [id, 열, 줄] */
const GONE: [string, 0 | 1, number][] = [
  ['stock', 0, 1],
  ['rtAgg', 1, 1],
  ['newTool', 0, 2],
  ['cache', 1, 2],
  ['rtDash', 1, 3],
]

/** 회의실 화면에 띄운 이벤트 브로커 둘레. after면 다섯 노드를 걷어낸 뒤(모션 줄이기의 클라이맥스 정지 그림) */
function ReasonFig({ after }: { after?: boolean }) {
  const [L, R] = RX
  const tagY = (r: number) => RY(r) + 38
  return (
    // after(모션 줄이기, 카운터 줄과 그림 칸을 나눠 씀)는 모니터 받침을 빼고 잘라 글자를 조금이라도 크게
    <Fig viewBox={after ? '0 0 440 440' : undefined}>
      {/* 회의실 화면 */}
      <rect x={4} y={4} width={432} height={432} rx={10} style={{ fill: 'var(--bg)', stroke: 'var(--edge)' }} strokeWidth={1.5} />
      {!after && <path d="M 202 436 L 196 464 M 238 436 L 244 464 M 176 466 L 264 466" style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={2} strokeLinecap="round" />}

      <RArrow x1={L + 76} y1={RY(0)} x2={R - 83} y2={RY(0)} seed="r-kf" rough={0.4} />
      <RArrow x1={L + 76} y1={RY(4)} x2={R - 83} y2={RY(4)} seed="r-mb" rough={0.4} />
      <g style={after ? { opacity: 0.25 } : undefined}>
        <RArrow x1={L} y1={RY(0) + 27} x2={L} y2={RY(1) - 29} seed="r-ks" rough={0.4} />
        <Elbow pts={[[214, RY(0) + 4], [214, RY(1)], [R - 82, RY(1)]]} dash="7 6" stroke="var(--muted)" />
        <Elbow pts={[[R + 75, RY(1)], [422, RY(1)], [422, RY(2)], [R + 84, RY(2)]]} dash="7 6" stroke="var(--muted)" />
        <Elbow pts={[[R + 75, RY(2)], [422, RY(2)], [422, RY(3)], [R + 84, RY(3)]]} dash="7 6" stroke="var(--muted)" />
        <Elbow pts={[[L + 76, RY(2)], [R - 84, RY(2)]]} dash="7 6" stroke="var(--muted)" />
      </g>

      <MNode id="kafka" x={L} y={RY(0)} w={140} h={44} />
      <MNode id="fraud" x={R} y={RY(0)} h={44} />
      <MNode id="orch" x={L} y={RY(3)} w={140} h={44} />
      <MNode id="model" x={L} y={RY(4)} w={140} h={44} />
      <MNode id="bi" x={R} y={RY(4)} h={44} />
      {/* after: 보조 줄은 '걷어냄' 꼬리표에 가려지므로 빼고, 이름을 가운데 둬 취소선이 이름을 지나게 */}
      {GONE.map(([id, c, r]) => (
        <g key={id} style={after && lb(id).kind !== 'proposal' ? { opacity: DIM } : undefined}>
          <MNode id={id} x={RX[c]} y={RY(r)} w={c ? 150 : 140} h={44} noSub={after} />
        </g>
      ))}

      {after ? (
        <>
          {GONE.map(([id, c, r]) => (
            <Gone key={id} x={RX[c]} y={RY(r)} w={c ? 150 : 140} h={44} />
          ))}
          <Pill x={L} y={tagY(3)} text={F.reasons.run15} />
          <Pill x={(L + R) / 2 - 3} y={RY(4) - 22} text={F.reasons.every15} />
          <Pill x={R - 10} y={tagY(0)} text={F.reasons.keep} status="ok" strong />
        </>
      ) : (
        <>
          <Pill x={R} y={tagY(1)} text={enough} el="rs" />
          <Pill x={R} y={tagY(2)} text={enough} el="rs" />
          <Pill x={R} y={tagY(3)} text={enough} el="rs" />
          <Pill x={L} y={tagY(2)} text={F.reasons.noProblem} el="rs" />
          <Pill x={L} y={tagY(1)} text={F.reasons.zeroViews} status="fail" el="rs" />
          <Pill x={L} y={tagY(3)} text={F.reasons.run15} el="rs" />
          <Pill x={(L + R) / 2 - 3} y={RY(4) - 22} text={F.reasons.every15} el="rs" />
          <Pill x={R - 10} y={tagY(0)} text={F.reasons.keep} status="ok" el="rs" strong />
        </>
      )}
    </Fig>
  )
}

function ClimaxLayer() {
  const { reduced } = useEnv()
  const lv = (n: 4 | 5) => UI.hud.level(n, LEVELS[n])
  return (
    <div data-el="climax" className={`absolute inset-0 flex flex-col gap-2 ${reduced ? '' : 'justify-center'}`}>
      {reduced ? (
        // 모션 줄이기: 전체 맵 두 장을 나란히 두면 노드 글자가 몇 px로 줄어 무엇을 걷어냈는지 읽을 수 없다.
        // step 1과 같은 이벤트 브로커 둘레에서 다섯 노드를 걷어낸 뒤 모습을 보여 주고, 21 → 16은 아래 카운터에 적는다
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <ReasonFig after />
          </div>
        </div>
      ) : (
        <div data-el="after" className="relative w-full" style={{ aspectRatio: MAP_AR }}>
          <PipelineMap t={T.ch10Climax} from={T.ch10Proposal} ghosts vertical={false} />
        </div>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="font-mono text-sm text-muted">
            {F.nodes}{' '}
            {/* 모션 줄이기에선 세지 않고 21 → 16을 그대로 적는다(c-num이 없으면 카운트 트윈도 없다) */}
            <b data-el={reduced ? undefined : 'c-num'} className="text-[1.375rem] font-extrabold text-ink md:text-[1.625rem]">
              {reduced ? F.flow(N10, NC) : NC}
            </b>{' '}
            <span className="text-xs">{F.ch9(N9)}</span>
          </p>
          <div className="inline-flex flex-col rounded-xl border-[3px] border-ink bg-surface px-3 py-1.5">
            <span className="font-mono text-xs text-muted">{F.levelLabel}</span>
            <span className="grid text-[1.125rem] font-extrabold leading-tight md:text-[1.375rem]">
              <span data-el="lv-old" className="[grid-area:1/1]">
                {lv(4)}
              </span>
              <span data-el="lv-new" className="[grid-area:1/1]">
                {lv(5)}
              </span>
            </span>
          </div>
        </div>
        <div className="relative w-[38%] max-w-[13rem] shrink-0 rounded-lg border-[1.5px] border-edge bg-bg p-1">
          <div data-el="desk-old">
            <Desk level={4} board="crowded" mood="focus" />
          </div>
          <div data-el="desk-new" className="absolute inset-x-1 bottom-1">
            <Desk level={5} board="simple" mood="relaxed" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdrLayer() {
  const rows = F.adr.rows
  return (
    // 모바일은 그림 띠가 낮아(키 작은 폰은 약 330px) 줄 간격을 좁혀야 카드가 HUD 밑·띠 아래로 넘치지 않는다
    <div data-el="adr" className="absolute inset-0 flex flex-col justify-center">
      <div className="rounded-xl border-[1.5px] border-edge bg-surface p-3 text-[0.875rem] leading-snug md:p-5 md:text-[0.9375rem] md:leading-relaxed">
        <p className="font-mono text-[0.9375rem] font-bold md:text-base">
          <TypeText text={F.adr.title} />
        </p>
        <dl className="mt-2 space-y-1.5 md:mt-3 md:space-y-2.5">
          {rows.map(([k, v], i) => (
            <div key={k} className="relative grid grid-cols-[6.75rem_minmax(0,1fr)] gap-x-2 pb-1">
              <dt className="font-bold">
                <TypeText text={k} />
              </dt>
              <dd>
                {v.map((line) => (
                  <span key={line} className="block">
                    <TypeText text={line} />
                  </span>
                ))}
              </dd>
              {i === rows.length - 1 && <span data-el="adr-ul" className="absolute inset-x-0 bottom-0 h-[2.5px] rounded bg-ink" />}
            </div>
          ))}
        </dl>
      </div>
      <p data-el="adr-cap" className="mt-2 text-center md:mt-3 text-[0.8125rem] leading-snug text-muted md:text-sm">
        {F.adrNote}
      </p>
    </div>
  )
}

export function DecisionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="reason" className="absolute inset-0">
        <ReasonFig />
      </div>
      <ClimaxLayer />
      <AdrLayer />
    </div>
  )
}

export const buildDecision: SceneBuild = (q, tl) => {
  const o = pick(q)
  tl.set([...o('climax'), ...o('adr')], { opacity: 0 }, 0)

  // step 1: 이유 꼬리표가 노드마다 하나씩, 마지막으로 이상 결제 탐지에 ✓ 유지
  const tags = o('rs')
  tl.set(tags, { opacity: 0, y: -6 }, 0)
  tags.forEach((t, i) => tl.to(t, { opacity: 1, y: 0, duration: 0.06 }, at(0) + 0.06 + i * 0.085 + (i === tags.length - 1 ? 0.06 : 0)))

  // step 2: 앞 60% — 다섯 노드가 걷히고 21 → 16. 뒤 40% — Lv4 시니어 직전 → Lv5 시니어, 책상 정리
  const s = at(1)
  tl.to(o('reason'), { opacity: 0, duration: 0.1 }, s)
  tl.to(o('climax'), { opacity: 1, duration: 0.1 }, s + 0.04)
  // 전체 맵은 움직이는 모드에만 있다(모션 줄이기는 ReasonFig after 정지 그림)
  const after = o('after')[0]
  if (after) {
    const aq = scoped(after)
    // 전체 맵이 작게 보이므로 '걷어냄' 표시만 크게
    tl.set(aq('[data-el="tag-gone"] text'), { fontSize: 30, attr: { dy: -4 } }, 0)
    tl.set(aq('[data-el="tag-gone"] line'), { attr: { 'stroke-width': 5 } }, 0)
    // 걷어내기만 하는 전환이라 '새로 생기는 것'이 없다. 빈 목록 경고가 나지 않게 빈 자리표 하나를 넘긴다
    const noop = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    // '걷어냄' 표시는 걷어낸 노드 g 안에 있어 노드째 흐리면 표시까지 흐려진다 → 노드의 상자·글자만 흐린다
    const EXIT = '[data-node][data-change="exit"]'
    const ghostBody = aq(EXIT).flatMap((n) => Array.from(n.children).filter((c) => c.getAttribute('data-el') !== 'tag-gone'))
    mapTransition((sel) => (sel === '[data-el="tag-new"]' ? [noop] : sel === EXIT ? ghostBody : aq(sel)), tl, s + 0.14, { dur: 0.36, ghosts: true })
  }
  countTo(tl, o('c-num')[0], N10, NC, String, s + 0.14, 0.34)
  tl.set([...o('lv-new'), ...o('desk-new')], { opacity: 0 }, 0)
  tl.to([...o('lv-old'), ...o('desk-old')], { opacity: 0, duration: 0.14 }, s + 0.56)
  tl.to([...o('lv-new'), ...o('desk-new')], { opacity: 1, duration: 0.14 }, s + 0.56)

  // step 3: ADR이 한 줄씩 써지고 '다시 검토할 때'에 밑줄
  const s3 = at(2)
  tl.to(o('climax'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('adr'), { opacity: 1, duration: 0.1 }, s3 + 0.04)
  const chars = q('[data-el="adr"] [data-ch]')
  tl.set(chars, { opacity: 0 }, 0)
  tl.to(chars, { opacity: 1, duration: 0.001, stagger: 0.58 / chars.length }, s3 + 0.1)
  tl.set(o('adr-ul'), { scaleX: 0, transformOrigin: '0% 50%' }, 0)
  tl.to(o('adr-ul'), { scaleX: 1, duration: 0.1 }, s3 + 0.72)
  tl.set(o('adr-cap'), { opacity: 0 }, 0)
  tl.to(o('adr-cap'), { opacity: 1, duration: 0.1 }, s3 + 0.74)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 개념 — Build vs Buy
// ─────────────────────────────────────────────────────────────
function Stamp({ x, y, text, el }: { x: number; y: number; text: string; el: string }) {
  return (
    <g data-el={el} transform={`rotate(-7 ${x} ${y})`}>
      <rect x={x - 40} y={y - 22} width={80} height={44} rx={6} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={2.6} />
      <rect x={x - 35} y={y - 17} width={70} height={34} rx={4} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth={1.2} />
      <Txt x={x} y={y + 8} size={22} weight={850} anchor="middle">
        {text}
      </Txt>
    </g>
  )
}

const OL = { oltp: [70, 300], cdc: [215, 175], kafka: [378, 175], etl: [215, 410], lh: [378, 335], orch: [62, 440] } as const
const ZL = { oltp: [72, 220], lh: [362, 300] } as const

function Gone({ x, y, w, h, el }: { x: number; y: number; w: number; h: number; el?: string }) {
  return (
    <g data-el={el}>
      <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} style={{ stroke: 'var(--fail)' }} strokeWidth={2.5} />
      <Pill x={x} y={y + h / 2} text={UI.growth.goneTag} status="fail" size={12} strong />
    </g>
  )
}

export function BuyFig() {
  const ck = F.check.rows
  return (
    <Fig
      caption={
        <Caps
          items={[
            ['cap-ck', F.checkNote],
            ['cap-z', F.zeroNote],
          ]}
        />
      }
    >
      {/* step 1: 비법 소스 vs 정수기 */}
      <g data-el="shop">
        <g data-el="shop-0">
          <RRect x={10} y={20} w={420} h={196} seed="shop0" rough={0.4} fill="var(--surface)" />
          <RPath d="M 52 104 L 140 104 L 132 168 Q 96 180 60 168 Z" seed="pot" rough={0.4} fill="var(--bg)" />
          <RLine x1={44} y1={104} x2={148} y2={104} seed="pot-rim" rough={0.3} strokeWidth={2.4} />
          <RPath d="M 52 116 Q 36 118 40 132 M 140 116 Q 156 118 152 132" seed="pot-h" rough={0.3} />
          <RPath d="M 74 104 Q 96 86 118 104" seed="pot-lid" rough={0.3} />
          <Txt x={176} y={96} size={21} weight={850}>
            {F.sauce.name}
          </Txt>
          <Txt x={176} y={128} size={14.5} muted weight={600}>
            {F.sauce.note}
          </Txt>
          <Stamp x={360} y={170} text={F.sauce.stamp} el="stamp-0" />
        </g>
        <g data-el="shop-1">
          <RRect x={10} y={236} w={420} h={196} seed="shop1" rough={0.4} fill="var(--surface)" />
          <RRect x={66} y={252} w={52} h={30} seed="jug" rough={0.3} fill="var(--bg)" />
          <RRect x={56} y={284} w={72} h={124} seed="purifier" rough={0.4} fill="var(--bg)" />
          <RRect x={78} y={318} w={28} h={14} seed="tap" rough={0.3} />
          <RLine x1={92} y1={332} x2={92} y2={346} seed="tap-l" rough={0.2} strokeWidth={2} />
          <Txt x={176} y={312} size={21} weight={850}>
            {F.water.name}
          </Txt>
          <Txt x={176} y={344} size={14.5} muted weight={600}>
            {F.water.note}
          </Txt>
          <Stamp x={360} y={386} text={F.water.stamp} el="stamp-1" />
        </g>
      </g>

      {/* step 2: 새 분석 툴 점검 카드 */}
      <g data-el="check">
        <RRect x={14} y={34} w={412} h={346} seed="ck" rough={0.4} fill="var(--surface)" />
        <Txt x={34} y={74} size={19} weight={850}>
          {F.check.title}
        </Txt>
        {ck.map((r, k) => {
          const y = 116 + k * 84
          return (
            <g key={r.q} data-el="ck-row">
              <line x1={30} y1={y - 22} x2={410} y2={y - 22} style={{ stroke: 'var(--edge)' }} />
              <Txt x={34} y={y} size={14.5} weight={800}>
                {r.q}
              </Txt>
              {k === 0 ? (
                <Txt x={34} y={y + 28} size={14.5} weight={600}>
                  {`→ ${r.a[0]}`}
                </Txt>
              ) : (
                <>
                  <Txt x={34} y={y + 28} size={14.5} weight={600}>
                    →
                  </Txt>
                  <Badge x={63} y={y + 23} status={k === 1 ? 'fail' : 'wait'} r={10} el={k === 2 ? 'ck-wait' : undefined} />
                  <Txt x={80} y={y + 28} size={14.5} weight={k === 2 ? 850 : 600}>
                    {r.a[0]}
                  </Txt>
                  {r.a[1] && (
                    <Txt x={80} y={y + 50} size={13} muted weight={600}>
                      {`· ${r.a[1]}`}
                    </Txt>
                  )}
                </>
              )}
            </g>
          )
        })}
      </g>

      {/* step 3~4: 운영 DB 둘레 + 썸네일 */}
      <g data-el="zero">
        <Counter n={NC} ch9={N9} />
        <MapThumb t={T.ch10Buy} from={T.ch10Climax} />
        <g data-el="zc">
          <g data-el="z-old">
            <RArrow x1={100} y1={262} x2={164} y2={202} seed="z1" rough={0.4} />
            <RArrow x1={275} y1={OL.cdc[1]} x2={317} y2={OL.cdc[1]} seed="z2" rough={0.4} />
            <RArrow x1={100} y1={340} x2={160} y2={394} seed="z3" rough={0.4} />
            <RArrow x1={275} y1={408} x2={316} y2={392} seed="z4" rough={0.4} />
            <g style={{ opacity: 0.75 }}>
              <RArrow x1={114} y1={OL.orch[1] - 2} x2={153} y2={OL.etl[1] + 14} seed="z5" rough={0.4} dash="3 6" />
            </g>
          </g>
          <RArrow x1={OL.kafka[0]} y1={OL.kafka[1] + 28} x2={OL.lh[0]} y2={OL.lh[1] - 87} seed="z6" rough={0.4} />
          <MNode id="oltp" x={OL.oltp[0]} y={OL.oltp[1]} w={112} h={72} />
          <MNode id="kafka" x={OL.kafka[0]} y={OL.kafka[1]} w={112} h={46} plain />
          <Txt x={OL.kafka[0]} y={OL.kafka[1] + 5} size={14} weight={650} anchor="middle">
            {lb('kafka').label}
          </Txt>
          <MNode id="lakehouse" x={OL.lh[0]} y={OL.lh[1]} w={112} h={160} bands />
          <MNode id="orch" x={OL.orch[0]} y={OL.orch[1]} w={100} h={40} plain />
          <Txt x={OL.orch[0]} y={OL.orch[1] + 5} size={13} weight={650} anchor="middle">
            {lb('orch').label}
          </Txt>
          <g data-el="z-cdc">
            <MNode id="cdc" x={OL.cdc[0]} y={OL.cdc[1]} w={116} h={46} />
          </g>
          <g data-el="z-etl">
            <MNode id="etl" x={OL.etl[0]} y={OL.etl[1]} w={116} h={46} />
          </g>
          <g data-el="z-retry">
            {[0, 1, 2].map((i) => (
              <Badge key={i} x={186 + i * 24} y={133} status="retry" r={10} />
            ))}
            <Txt x={190} y={228} size={13} weight={700}>
              {F.restarts[0]}
            </Txt>
            <Txt x={190} y={246} size={13} weight={600}>
              {F.restarts[1]}
            </Txt>
          </g>
          <Pill x={OL.etl[0]} y={466} text={F.twice} el="z-twice" />
          {/* 취소선은 이름(기준선 y-3)을 지나게 8 위로. 꼬리표가 덮는 보조 줄은 걷어낼 때 지운다 */}
          <Gone x={OL.cdc[0]} y={OL.cdc[1] - 8} w={116} h={46} el="z-gone" />
          <Gone x={OL.etl[0]} y={OL.etl[1] - 8} w={116} h={46} el="z-gone" />
          <g data-el="z-new">
            <RArrow x1={132} y1={300} x2={312} y2={313} seed="z-zero" rough={0.3} strokeWidth={2.4} />
            <Txt x={222} y={294} size={14} weight={850} anchor="middle" el="z-label">
              {ZERO_ETL}
            </Txt>
          </g>
        </g>

        {/* step 4: Zero-ETL 선 확대 */}
        <g data-el="zl">
          <MNode id="oltp" x={ZL.oltp[0]} y={ZL.oltp[1]} w={116} h={72} />
          <MNode id="lakehouse" x={ZL.lh[0]} y={ZL.lh[1]} w={140} h={340} bands />
          <RArrow x1={136} y1={ZL.oltp[1]} x2={284} y2={ZL.oltp[1]} seed="zl-line" rough={0.3} strokeWidth={2.4} />
          <Txt x={210} y={ZL.oltp[1] - 12} size={14} weight={850} anchor="middle">
            {ZERO_ETL}
          </Txt>
          <line x1={200} y1={ZL.oltp[1] + 4} x2={200} y2={332} style={{ stroke: 'var(--muted)' }} strokeWidth={1.4} />
          {F.limits.map((t, i) => (
            <g key={t} data-el="zl-tag">
              <line x1={192} y1={268 + i * 32} x2={200} y2={268 + i * 32} style={{ stroke: 'var(--muted)' }} strokeWidth={1.4} />
              <Pill x={192} y={268 + i * 32} text={t} anchor="end" />
            </g>
          ))}
          <RArrow x1={ZL.lh[0]} y1={240} x2={ZL.lh[0]} y2={302} seed="zl-bs" rough={0.3} />
          <RArrow x1={ZL.lh[0]} y1={337} x2={ZL.lh[0]} y2={399} seed="zl-sg" rough={0.3} />
          <g data-el="zl-check">
            <Badge x={ZL.lh[0] + 26} y={272} status="ok" r={11} />
          </g>
          <circle data-el="zl-ring" cx={ZL.lh[0] + 26} cy={272} r={17} style={{ fill: 'none', stroke: 'var(--ok)' }} strokeWidth={2.2} />
          <g data-el="zl-ours">
            <Txt x={276} y={392} size={13.5} weight={800} anchor="end">
              {F.ours[0]}
            </Txt>
            <Txt x={276} y={412} size={13.5} weight={800} anchor="end">
              {F.ours[1]}
            </Txt>
          </g>
        </g>
      </g>
    </Fig>
  )
}

export const buildBuy: SceneBuild = (q, tl) => {
  const o = pick(q)
  tl.set([...o('check'), ...o('zero'), ...o('cap-ck'), ...o('cap-z'), ...o('zl')], { opacity: 0 }, 0)

  // step 1: 두 칸이 차례로, 칸마다 도장
  tl.set([...o('shop-0'), ...o('shop-1'), ...o('stamp-0'), ...o('stamp-1')], { opacity: 0 }, 0)
  tl.to(o('shop-0'), { opacity: 1, duration: 0.1 }, at(0) + 0.04)
  tl.to(o('stamp-0'), { opacity: 1, duration: 0.06 }, at(0) + 0.28)
  tl.to(o('shop-1'), { opacity: 1, duration: 0.1 }, at(0) + 0.4)
  tl.to(o('stamp-1'), { opacity: 1, duration: 0.06 }, at(0) + 0.64)

  // step 2: 질문 줄이 위에서부터, 마지막 줄에 ⏸
  const s2 = at(1)
  tl.to(o('shop'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('check'), { opacity: 1, duration: 0.1 }, s2 + 0.06)
  const rows = o('ck-row')
  tl.set(rows, { opacity: 0 }, 0)
  tl.set(o('ck-wait'), { opacity: 0 }, 0)
  rows.forEach((r, k) => tl.to(r, { opacity: 1, duration: 0.08 }, s2 + 0.14 + k * 0.16))
  tl.to(o('ck-wait'), { opacity: 1, duration: 0.06 }, s2 + 0.62)
  tl.to(o('cap-ck'), { opacity: 1, duration: 0.1 }, s2 + 0.64)

  // step 3: 직접 돌리던 두 노드를 걷어내고, 그 자리에 Zero-ETL 선 하나 — 16 → 14
  const s3 = at(2)
  tl.to([...o('check'), ...o('cap-ck')], { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('zero'), { opacity: 1, duration: 0.1 }, s3 + 0.04)
  const thumb = o('thumb')[0]
  initThumb(tl, thumb)
  const tq = scoped(o('thumb-map')[0])
  mapTransition(tq, tl, s3 + 0.3, { dur: 0.4 })
  const retry = o('z-retry')
  tl.set([...retry, ...o('z-twice'), ...o('z-gone'), ...o('z-label')], { opacity: 0 }, 0)
  tl.to(retry, { opacity: 1, duration: 0.08 }, s3 + 0.12)
  tl.to(o('z-twice'), { opacity: 1, duration: 0.08 }, s3 + 0.2)
  // 걷어낸 노드·화살표만 흐리게. ↻×3과 '두 번 옮김'은 바꾼 이유라 끝까지 읽혀야 한다.
  // 노드 이름은 무엇을 걷어냈는지 알려 주므로 대비 4.5:1이 남게(DIM), 화살표만 더 흐리게
  const gone = [...o('z-cdc'), ...o('z-etl')]
  tl.to(gone, { opacity: DIM, duration: 0.14 }, s3 + 0.34)
  tl.to(gone.flatMap((g) => Array.from(g.querySelectorAll('.t-muted'))), { opacity: 0, duration: 0.1 }, s3 + 0.34)
  tl.to(o('z-old'), { opacity: 0.25, duration: 0.14 }, s3 + 0.34)
  tl.to(o('z-gone'), { opacity: 1, duration: 0.1 }, s3 + 0.38)
  stepCount(tl, o('cnt')[0], NC, [
    [NC - 1, s3 + 0.4],
    [NB, s3 + 0.46],
  ])
  const zNew = o('z-new')
  tl.set(shafts(zNew), { drawSVG: '0%' }, 0)
  tl.set(heads(zNew), { opacity: 0 }, 0)
  tl.to(shafts(zNew), { drawSVG: '100%', duration: 0.16, ease: 'none' }, s3 + 0.5)
  tl.to(heads(zNew), { opacity: 1, duration: 0.03 }, s3 + 0.65)
  tl.to(o('z-label'), { opacity: 1, duration: 0.08 }, s3 + 0.64)

  // step 4: 꼬리표 세 개가 선에 붙고, 마지막에 ✓ 배지에 테두리
  const s4 = at(3)
  tl.to(o('zc'), { opacity: 0, duration: 0.1 }, s4)
  tl.to(o('zl'), { opacity: 1, duration: 0.1 }, s4 + 0.06)
  const tags = o('zl-tag')
  tl.set([...tags, ...o('zl-check'), ...o('zl-ours')], { opacity: 0 }, 0)
  tags.forEach((t, i) => tl.to(t, { opacity: 1, duration: 0.07 }, s4 + 0.2 + i * 0.12))
  tl.to(o('zl-check'), { opacity: 1, duration: 0.06 }, s4 + 0.54)
  tl.to(o('zl-ours'), { opacity: 1, duration: 0.08 }, s4 + 0.56)
  tl.set(o('zl-ring'), { drawSVG: '0%' }, 0)
  tl.to(o('zl-ring'), { drawSVG: '100%', duration: 0.12, ease: 'none' }, s4 + 0.6)
  tl.to(o('cap-z'), { opacity: 1, duration: 0.1 }, s4 + 0.66)
}

// ─────────────────────────────────────────────────────────────
// 장면 7. 해결 — 필요한 사람에게, 그리고 다음 사람에게
// ─────────────────────────────────────────────────────────────
const MC7 = { media: [85, 165], lh: [85, 330], ml: [330, 330] } as const
const CC = { model: [220, 160], rev: [220, 255] } as const
const SLOT = (i: number) => [262 + (i % 8) * 18, 346 + Math.floor(i / 8) * 17]

/** 작은 DOM 말풍선(회상·지금 두 칸) */
function MiniBubble({ who, text }: { who: Who; text: string }) {
  return (
    <div className="rounded-xl border-[1.5px] border-edge bg-surface px-3 py-1.5">
      <p className="font-mono text-[0.6875rem] leading-4 text-muted">{PEOPLE[who].name}</p>
      <p className="text-[0.875rem] leading-snug md:text-[0.9375rem]">{text}</p>
    </div>
  )
}
/** 회상·지금 두 칸의 인물 그림(같은 구도: 왼쪽 묻는 사람, 오른쪽 책상 뒤 답하는 사람) */
function DeskPair({ then }: { then: boolean }) {
  return (
    <svg viewBox="0 0 140 112" className="diagram w-[30%] max-w-[9rem] shrink-0" aria-hidden="true">
      {/* 오른쪽: 책상 뒤에 앉은 사람 */}
      {then ? <Initial x={92} y={40} r={15} who="seok" /> : <g transform="translate(70 12) scale(0.42)"><JuniFace mood="relaxed" seed={`c10-mentor-${then}`} /></g>}
      <RRect x={62} y={66} w={76} h={6} seed={`dk-${then}`} rough={0.4} fill="var(--surface)" />
      <RLine x1={68} y1={72} x2={68} y2={108} seed={`dk-l1-${then}`} rough={0.3} />
      <RLine x1={132} y1={72} x2={132} y2={108} seed={`dk-l2-${then}`} rough={0.3} />
      <RRect x={112} y={40} w={24} h={22} seed={`mon-${then}`} rough={0.3} fill="var(--surface)" />
      {/* 왼쪽: 묻는 사람 */}
      {then ? (
        <>
          <g transform="translate(0 6) scale(0.42)">
            <JuniFace mood="panic" seed="c10-then-juni" />
          </g>
          <RPath d="M 8 108 C 8 76, 14 62, 21 60 C 28 62, 34 76, 34 108" seed="then-body" rough={0.4} />
        </>
      ) : (
        <>
          <Initial x={24} y={44} r={14} who="daon" />
          <RPath d="M 12 86 C 12 70, 16 60, 24 59 C 32 60, 36 70, 36 86 L 50 86" seed="daon-body" rough={0.4} />
          <RPath d="M 6 88 L 52 88 M 8 88 L 8 108 M 50 88 L 50 108 M 6 88 L 6 62" seed="mentee-chair" rough={0.3} />
        </>
      )}
    </svg>
  )
}

function MentorLayer() {
  const now = S.serve.steps[2].lines!
  return (
    <div data-el="mentor" className="absolute inset-0 flex flex-col justify-center gap-3">
      <section data-el="then" className="rounded-xl border-[1.5px] border-dashed border-edge p-3">
        <p className="font-mono text-xs text-muted">{F.then}</p>
        <StageCtx.Provider value={STAGES[1]}>
          <div className="mt-1.5 flex items-center gap-3">
            <DeskPair then />
            <div className="min-w-0 flex-1 space-y-1.5">
              {F.flashback.map((l) => (
                <MiniBubble key={l.text} who={l.who} text={l.text} />
              ))}
            </div>
          </div>
        </StageCtx.Provider>
      </section>
      <section data-el="now" className="rounded-xl border-[1.5px] border-edge bg-bg p-3">
        <p className="font-mono text-xs text-muted">{F.now}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <DeskPair then={false} />
          <div className="min-w-0 flex-1 space-y-1.5">
            {now.map((l) => (
              <MiniBubble key={l.text} who={l.who} text={l.text} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function MemoLayer() {
  const m = F.memo
  return (
    <div data-el="memo" className="absolute inset-0">
      <div className="absolute inset-0 opacity-20">
        <PipelineMap t={T.ch10Final} vertical={false} />
      </div>
      <div className="relative flex h-full items-center justify-center">
        <div className="w-full max-w-[25rem] rounded-xl border-[1.5px] border-edge bg-surface p-4 md:p-5">
          <p className="font-mono text-sm font-bold">{m.title}</p>
          <ul className="mt-3 space-y-2 text-[0.9375rem] leading-snug md:text-base">
            {m.rows.map((r, i) => (
              <li key={r} className={i === m.rows.length - 1 ? 'font-bold' : ''}>
                <TypeText text={r} />
                {i === m.rows.length - 1 && (
                  <>
                    {' '}
                    <span data-el="memo-ok" className="font-bold text-ok">
                      ✓
                    </span>{' '}
                    <span data-el="memo-tail" className="font-semibold">
                      {m.tail}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ServeMap({ children }: { children: ReactNode }) {
  return (
    <div data-el="mapl" className="absolute inset-0">
      <Fig
        caption={
          <Caps
            items={[
              ['cap-ml', F.mlNote],
              ['cap-crm', F.crmNote],
            ]}
          />
        }
      >
        {children}
      </Fig>
    </div>
  )
}

export function ServeFig() {
  const { mobile } = useEnv()
  const nP = mobile ? 12 : 16
  const crm = F.crm
  return (
    <div className="relative h-full w-full">
      <ServeMap>
        <Counter n={NB} ch9={N9} />
        <MapThumb t={T.ch10Final} from={T.ch10Buy} />

        {/* step 1: 레이크하우스 → ML 학습 데이터 */}
        <g data-el="mc">
          <MNode id="media" x={MC7.media[0]} y={MC7.media[1]} w={150} h={48} />
          <RArrow x1={MC7.media[0]} y1={194} x2={MC7.media[0]} y2={238} seed="m-media" rough={0.3} strokeWidth={3.2} />
          <g data-el="ucard">
            <rect x={100} y={202} width={84} height={28} rx={5} style={{ fill: 'var(--surface)', stroke: 'var(--ink)' }} strokeWidth={1.6} />
            <Txt x={110} y={222} size={16} weight={850}>
              {F.uCard[0]}
            </Txt>
            <Txt x={126} y={221} size={11.5} weight={600}>
              {`· ${F.uCard[1]}`}
            </Txt>
          </g>
          <MNode id="lakehouse" x={MC7.lh[0]} y={MC7.lh[1]} w={150} h={170} bands />
          <g data-el="ml">
            <MNode id="ml" x={MC7.ml[0]} y={MC7.ml[1]} w={160} h={96} plain />
            <Txt x={MC7.ml[0]} y={306} size={15} weight={650} anchor="middle">
              {lb('ml').label}
            </Txt>
            <Txt x={MC7.ml[0]} y={324} size={11.5} muted anchor="middle">
              {lb('ml').sub}
            </Txt>
          </g>
          <g data-el="m-line">
            <RArrow x1={166} y1={MC7.lh[1]} x2={243} y2={MC7.lh[1]} seed="m-ml" rough={0.3} />
          </g>
          <Pill x={MC7.ml[0]} y={262} text={F.masked} el="m-mask" />
          <g data-el="m-tags">
            <rect x={238} y={393} width={8} height={8} rx={1} style={{ fill: 'var(--accent)' }} />
            <Txt x={252} y={402} size={13} weight={650}>
              {F.gold}
            </Txt>
            <circle cx={242} cy={420} r={4} style={{ fill: 'var(--accent)' }} />
            <Txt x={252} y={424} size={13} weight={650}>
              {F.silver}
            </Txt>
          </g>
          {Array.from({ length: nP }, (_, i) => {
            const sq = i % 2 === 0
            const [sx, sy] = sq ? [128 + (i % 4) * 6, 382 + (i % 3) * 6] : [128 + (i % 4) * 6, 338 + (i % 3) * 6]
            const [tx, ty] = SLOT(i)
            return sq ? (
              <rect key={i} data-el="mp" data-sx={sx} data-sy={sy} data-tx={tx} data-ty={ty} x={-3.5} y={-3.5} width={7} height={7} rx={1} style={{ fill: 'var(--accent)' }} />
            ) : (
              <circle key={i} data-el="mp" data-sx={sx} data-sy={sy} data-tx={tx} data-ty={ty} cx={0} cy={0} r={4} style={{ fill: 'var(--accent)' }} />
            )
          })}
        </g>

        {/* step 2: 모델링 → Reverse ETL → CRM 카드 */}
        <g data-el="cc">
          <MNode id="model" x={CC.model[0]} y={CC.model[1]} w={170} h={48} />
          <g data-el="c-line">
            <RArrow x1={CC.model[0]} y1={189} x2={CC.model[0]} y2={222} seed="c-mr" rough={0.3} />
          </g>
          <g data-el="c-rev">
            <MNode id="reverse" x={CC.rev[0]} y={CC.rev[1]} w={170} h={52} />
          </g>
          <g data-el="c-line2">
            <RArrow x1={CC.rev[0]} y1={286} x2={CC.rev[0]} y2={313} seed="c-rc" rough={0.3} />
          </g>
          <Txt x={CC.rev[0] + 12} y={304} size={13} weight={800} el="c-sent">
            {F.sentBack}
          </Txt>
          <g data-el="crm">
            <RRect x={30} y={320} w={380} h={142} seed="crm" rough={0.4} fill="var(--surface)" />
            <Txt x={46} y={346} size={14.5} weight={850}>
              {crm.title}
            </Txt>
            <Txt x={46} y={368} size={12.5} muted weight={600}>
              {crm.table}
            </Txt>
            <Txt x={46} y={392} size={12} muted weight={700}>
              {crm.cols[0]}
            </Txt>
            <Txt x={394} y={392} size={12} muted weight={700} anchor="end">
              {crm.cols[1]}
            </Txt>
            <line x1={40} y1={399} x2={400} y2={399} style={{ stroke: 'var(--edge)' }} />
            {crm.rows.map(([a, b], i) => (
              <g key={a} data-el="crm-row">
                {i === 0 && <rect x={38} y={403} width={364} height={26} rx={4} style={{ fill: 'var(--accent)', opacity: 0.2 }} />}
                <Txt x={46} y={421 + i * 28} size={13.5} weight={i === 0 ? 850 : 600}>
                  {a}
                </Txt>
                <Txt x={394} y={421 + i * 28} size={13.5} weight={i === 0 ? 850 : 600} anchor="end">
                  {b}
                </Txt>
              </g>
            ))}
          </g>
          {Array.from({ length: mobile ? 4 : 6 }, (_, i) => (
            <circle key={i} data-el="cp" cx={CC.model[0]} cy={189} r={4.5} style={{ fill: 'var(--accent)' }} />
          ))}
        </g>
      </ServeMap>
      <MentorLayer />
      <MemoLayer />
    </div>
  )
}

export const buildServe: SceneBuild = (q, tl) => {
  const o = pick(q)
  tl.set([...o('cc'), ...o('mentor'), ...o('memo'), ...o('cap-ml'), ...o('cap-crm')], { opacity: 0 }, 0)
  const thumb = o('thumb')[0]
  initThumb(tl, thumb)
  const tq = scoped(o('thumb-map')[0])
  // 썸네일: ML 학습 데이터는 mapTransition이, Reverse ETL은 step 2에서 따로 켠다
  const later = [...tq('[data-node="reverse"]'), ...tq('[data-edge="model>reverse"]')]
  later.forEach((el) => ((el as SVGElement).dataset.change = 'later'))
  tl.set(later, { opacity: 0 }, 0)
  mapTransition(tq, tl, at(0) + 0.06, { dur: 0.45 })

  // step 1: 정형(사각형)과 비정형(점)이 섞여 ML 학습 데이터로 — 14 → 15
  const s1 = at(0)
  const mLine = o('m-line')
  tl.set([...o('ml'), ...o('ucard'), ...o('m-mask'), ...o('m-tags')], { opacity: 0 }, 0)
  tl.set(shafts(mLine), { drawSVG: '0%' }, 0)
  tl.set(heads(mLine), { opacity: 0 }, 0)
  tl.to(o('ucard'), { opacity: 1, duration: 0.08 }, s1 + 0.04)
  tl.to(shafts(mLine), { drawSVG: '100%', duration: 0.1, ease: 'none' }, s1 + 0.1)
  tl.to(heads(mLine), { opacity: 1, duration: 0.02 }, s1 + 0.19)
  tl.to(o('ml'), { opacity: 1, duration: 0.08 }, s1 + 0.2)
  tl.to(o('m-mask'), { opacity: 1, duration: 0.08 }, s1 + 0.26)
  tl.to(o('m-tags'), { opacity: 1, duration: 0.08 }, s1 + 0.3)
  o('mp').forEach((p, i) => {
    tl.set(p, { x: num(p, 'sx'), y: num(p, 'sy'), opacity: 0 }, 0)
    const t = s1 + 0.32 + i * 0.02
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: 168, y: MC7.lh[1], duration: 0.08, ease: 'power1.in' }, t + 0.01)
    tl.to(p, { x: num(p, 'tx'), y: num(p, 'ty'), duration: 0.12, ease: 'power2.out' }, t + 0.09)
  })
  tl.to(o('cap-ml'), { opacity: 1, duration: 0.1 }, s1 + 0.64)

  // step 2: 모델링 → Reverse ETL → CRM 카드로 되돌아간다 — 15 → 16
  const s2 = at(1)
  tl.to([...o('mc'), ...o('cap-ml')], { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('cc'), { opacity: 1, duration: 0.1 }, s2 + 0.06)
  const cl = [...o('c-line'), ...o('c-line2')]
  tl.set([...o('c-rev'), ...o('crm'), ...o('c-sent')], { opacity: 0 }, 0)
  tl.set(o('crm-row'), { opacity: 0 }, 0)
  tl.set(shafts(cl), { drawSVG: '0%' }, 0)
  tl.set(heads(cl), { opacity: 0 }, 0)
  tl.to(shafts(o('c-line')), { drawSVG: '100%', duration: 0.06, ease: 'none' }, s2 + 0.12)
  tl.to(heads(o('c-line')), { opacity: 1, duration: 0.02 }, s2 + 0.17)
  tl.to(o('c-rev'), { opacity: 1, duration: 0.08 }, s2 + 0.18)
  tl.to(later, { opacity: 1, duration: 0.08 }, s2 + 0.18)
  stepCount(tl, o('cnt')[0], NB, [
    [NB + 1, s1 + 0.22],
    [NF, s2 + 0.22],
  ])
  tl.to(shafts(o('c-line2')), { drawSVG: '100%', duration: 0.05, ease: 'none' }, s2 + 0.26)
  tl.to(heads(o('c-line2')), { opacity: 1, duration: 0.02 }, s2 + 0.3)
  tl.to(o('crm'), { opacity: 1, duration: 0.08 }, s2 + 0.3)
  tl.to(o('c-sent'), { opacity: 1, duration: 0.08 }, s2 + 0.34)
  o('cp').forEach((p, i) => {
    tl.set(p, { opacity: 0 }, 0)
    const t = s2 + 0.34 + i * 0.03
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { attr: { cy: 340 }, duration: 0.14, ease: 'none' }, t)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.13)
  })
  o('crm-row').forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.06 }, s2 + 0.52 + i * 0.08))
  tl.to(o('cap-crm'), { opacity: 1, duration: 0.1 }, s2 + 0.66)

  // step 3: 같은 구도의 두 칸 — 질문하던 사람이 질문받는 사람이 된다
  const s3 = at(2)
  tl.to([...o('mapl')], { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('mentor'), { opacity: 1, duration: 0.06 }, s3 + 0.04)
  tl.set([...o('then'), ...o('now')], { opacity: 0 }, 0)
  tl.to(o('then'), { opacity: 1, duration: 0.12 }, s3 + 0.08)
  tl.to(o('now'), { opacity: 1, duration: 0.14 }, s3 + 0.34)

  // step 4: 메모가 한 줄씩, 마지막 줄에 ✓
  const s4 = at(3)
  tl.to(o('mentor'), { opacity: 0, duration: 0.1 }, s4)
  tl.to(o('memo'), { opacity: 1, duration: 0.1 }, s4 + 0.06)
  const chars = q('[data-el="memo"] [data-ch]')
  tl.set([...chars, ...o('memo-ok'), ...o('memo-tail')], { opacity: 0 }, 0)
  tl.to(chars, { opacity: 1, duration: 0.001, stagger: 0.46 / chars.length }, s4 + 0.12)
  tl.to(o('memo-ok'), { opacity: 1, duration: 0.05 }, s4 + 0.62)
  tl.to(o('memo-tail'), { opacity: 1, duration: 0.06 }, s4 + 0.66)
}
