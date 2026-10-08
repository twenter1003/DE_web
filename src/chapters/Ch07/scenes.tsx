import { ch7, CHECK_ROWS, eok, EVENT_ROWS, man, ORDERS, RAW_EVENTS, REVENUE, REVENUE_FIXED } from '../../content/chapters/ch7'
import { T } from '../../content/map'
import { PEOPLE } from '../../content/people'
import { Badge, CodeType, Node, SvgTable, type Col } from '../../components/diagram'
import { Fig, Txt, countTo } from '../../components/fig'
import { JuniFace } from '../../components/people'
import { PipelineMap, mapTransition } from '../../components/PipelineMap'
import { RArrow, REllipse, RLine, RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { gsap } from '../../lib/gsap'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import { Chip, ClockIcon, codeChars, DocIcon, drawArrows, flowAlong, Gate, init, paths, Phone, pick, PolyArrow, rel, Shield, Speech, tw, typeChars, type Els, type P } from './parts'

const F = ch7.figures

// 맵 노드 라벨은 map.ts에서(Ch6 끝 → Ch7 끝)
const N6 = Object.fromEntries(mapStateAt(T.ch6).nodes.map((n) => [n.id, n]))
const N7 = Object.fromEntries(mapStateAt(T.ch7).nodes.map((n) => [n.id, n]))
const initial = (who: keyof typeof PEOPLE) => PEOPLE[who].name.slice(0, 1)

/** 이름 첫 글자 동그라미 */
function Initial({ x, y, r = 16, who, seed }: { x: number; y: number; r?: number; who: keyof typeof PEOPLE; seed: string }) {
  return (
    <g>
      <REllipse cx={x} cy={y} w={r * 2} h={r * 2} seed={seed} rough={0.35} fill="var(--surface)" />
      <Txt x={x} y={y + r * 0.36} size={r * 0.95} weight={800} anchor="middle">
        {initial(who)}
      </Txt>
    </g>
  )
}

/** 겹쳐 그린 단계 그림을 오가는 레이어 전환 */
const swapLayer = (tl: gsap.core.Timeline, out: Els, inn: Els, t: number) => {
  tl.to(out, { opacity: 0, duration: 0.1 }, t)
  tl.to(inn, { opacity: 1, duration: 0.1 }, t + 0.06)
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 아무것도 실패하지 않았다
// ─────────────────────────────────────────────────────────────
const DX = [70, 180, 290, 400]
type Chart = { base: number; top: number; max: number }
const C_REV: Chart = { base: 178, top: 60, max: 4.5 }
const C_ORD: Chart = { base: 426, top: 306, max: 3 }
const yOf = (c: Chart, v: number) => c.base - (v / c.max) * (c.base - c.top)

function LineChart({ c, values, fmt, el, title, ty, zeroFail }: { c: Chart; values: number[]; fmt: (n: number) => string; el: string; title: string; ty: number; zeroFail?: boolean }) {
  const pts = values.map((v, i) => [DX[i], yOf(c, v)] as P)
  return (
    <g>
      <Txt x={20} y={ty} size={15} weight={750}>
        {title}
      </Txt>
      <RLine x1={36} y1={c.base} x2={432} y2={c.base} seed={`${el}-ax`} rough={0.3} stroke="var(--muted)" strokeWidth={1.2} />
      {DX.map((x, i) => (
        <Txt key={i} x={x} y={c.base + 29} size={13.5} weight={650} anchor="middle" muted>
          {F.days[i]}
        </Txt>
      ))}
      {pts.slice(1).map((p, i) => (
        <RLine key={i} x1={pts[i][0]} y1={pts[i][1]} x2={p[0]} y2={p[1]} seed={`${el}-s${i}`} rough={0.3} stroke="var(--accent)" strokeWidth={2.8} data-el={`${el}-seg`} />
      ))}
      {pts.map(([x, y], i) => (
        <g key={i} data-el={`${el}-pt`}>
          {zeroFail && values[i] === 0 ? <Badge x={x} y={y} status="fail" r={10} /> : <circle cx={x} cy={y} r={5} style={{ fill: 'var(--accent)' }} />}
          <Txt x={x} y={y - (values[i] === 0 ? 18 : 13)} size={13.5} weight={700} anchor="middle">
            {fmt(values[i])}
          </Txt>
        </g>
      ))}
    </g>
  )
}

// 실행 이력 표
const HX = 20
const HNAME = 164
const HCOL = 62
const HY = 98
const HHEAD = 34
const HROW = 48

export function ProblemFig() {
  return (
    <Fig>
      {/* step 1: 매출만 0원 */}
      <g data-el="charts">
        <LineChart c={C_REV} values={REVENUE} fmt={eok} el="rev" title={F.revenueTitle} ty={28} zeroFail />
        <LineChart c={C_ORD} values={ORDERS} fmt={man} el="ord" title={F.ordersTitle} ty={262} />
      </g>

      {/* step 2: 실행 이력은 모두 ✓, 알림 0건 */}
      <g data-el="hist">
        <Txt x={HX} y={HY - 18} size={15} weight={750}>
          {F.historyTitle}
        </Txt>
        <rect x={HX} y={HY} width={HNAME + HCOL * 4} height={HHEAD + HROW * 3} style={{ fill: 'var(--surface)' }} />
        <RRect x={HX} y={HY} w={HNAME + HCOL * 4} h={HHEAD + HROW * 3} seed="h-frame" rough={0.35} />
        <RLine x1={HX} y1={HY + HHEAD} x2={HX + HNAME + HCOL * 4} y2={HY + HHEAD} seed="h-head" rough={0.3} />
        {[0, 1, 2, 3].map((j) => (
          <g key={j}>
            <RLine x1={HX + HNAME + HCOL * j} y1={HY} x2={HX + HNAME + HCOL * j} y2={HY + HHEAD + HROW * 3} seed={`h-v${j}`} rough={0.25} strokeWidth={0.9} />
            <Txt x={HX + HNAME + HCOL * j + HCOL / 2} y={HY + 22} size={13.5} weight={700} anchor="middle">
              {F.historyDays[j]}
            </Txt>
          </g>
        ))}
        {F.jobs.map((name, i) => (
          <g key={name}>
            {i > 0 && <RLine x1={HX} y1={HY + HHEAD + HROW * i} x2={HX + HNAME + HCOL * 4} y2={HY + HHEAD + HROW * i} seed={`h-r${i}`} rough={0.25} strokeWidth={0.9} />}
            <Txt x={HX + 12} y={HY + HHEAD + HROW * i + 30} size={14} weight={650}>
              {name}
            </Txt>
          </g>
        ))}
        {F.jobs.flatMap((_, i) => [0, 1, 2, 3].map((j) => <Badge key={`${i}${j}`} x={HX + HNAME + HCOL * j + HCOL / 2} y={HY + HHEAD + HROW * i + HROW / 2} status="ok" r={11} el="cell" />))}
      </g>
      <g data-el="alert7">
        <Node x={115} y={352} w={176} h={58} label={N6.alert.label} sub={N6.alert.sub} kind="control" seed="p-alert" />
        <Txt x={228} y={340} size={13} weight={600} muted>
          {F.alertCountLabel}
        </Txt>
        <Txt x={228} y={378} size={30} weight={800}>
          {F.alertCount}
        </Txt>
      </g>

      {/* step 3: 시끄러운 실패 vs 조용히 틀린 데이터 */}
      <g data-el="cmp">
        <Txt x={110} y={36} size={16} weight={800} anchor="middle">
          {F.loudTitle}
        </Txt>
        <Txt x={330} y={36} size={16} weight={800} anchor="middle">
          {F.quietTitle}
        </Txt>
        <RLine x1={220} y1={18} x2={220} y2={466} seed="cmp-div" rough={0.2} dash="4 6" stroke="var(--muted)" strokeWidth={1.2} />
      </g>
      <g data-el="loud-node">
        <rect x={110 - 89} y={100 - 30} width={178} height={60} rx={6} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={2.4} />
        <Node x={110} y={100} w={166} h={50} label={F.jobs[1]} kind="process" seed="cmp-l" status="fail" />
      </g>
      <g data-el="loud-a">
        <RArrow x1={110} y1={130} x2={110} y2={178} seed="cmp-la1" rough={0.4} stroke="var(--fail)" />
      </g>
      <g data-el="loud-bub">
        <Speech x={52} y={190} w={116} h={44} seed="cmp-lb" tail="top" />
        <Txt x={110} y={218} size={17} weight={800} anchor="middle">
          {F.loudAlert}
        </Txt>
      </g>
      <g data-el="loud-a">
        <RArrow x1={110} y1={238} x2={110} y2={280} seed="cmp-la2" rough={0.4} stroke="var(--fail)" />
      </g>
      <g data-el="loud-juni" transform="translate(72 284) scale(0.76)">
        <JuniFace mood="focus" seed="cmp-juni" />
      </g>
      <Chip x={110} y={404} text={F.loudTag} seed="cmp-lt" el="loud-tag" size={13.5} />

      <g data-el="quiet-node">
        <Node x={330} y={100} w={166} h={50} label={F.jobs[1]} kind="process" seed="cmp-r" status="ok" />
      </g>
      <g data-el="quiet-a">
        <RArrow x1={330} y1={128} x2={330} y2={180} seed="cmp-ra1" rough={0.4} />
        <RArrow x1={330} y1={240} x2={330} y2={282} seed="cmp-ra2" rough={0.4} />
      </g>
      <g data-el="quiet-dash">
        <RRect x={262} y={186} w={136} h={50} seed="cmp-dash" rough={0.35} fill="var(--surface)" />
        <Txt x={274} y={216} size={13} weight={650} muted>
          {F.dashboard}
        </Txt>
      </g>
      <Txt x={386} y={219} size={20} weight={800} anchor="end" el="quiet-zero">
        {F.zero}
      </Txt>
      <g data-el="quiet-meet">
        <REllipse cx={312} cy={306} w={58} h={20} seed="cmp-table" rough={0.35} fill="var(--surface)" />
        {[-24, 0, 24].map((dx) => (
          <circle key={dx} cx={312 + dx} cy={292} r={4} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.4} />
        ))}
        <Txt x={352} y={311} size={12.5} weight={650} muted>
          {F.meeting}
        </Txt>
      </g>
      <g data-el="quiet-ceo">
        <Initial x={250} y={356} who="ceo" seed="cmp-ceo" />
        <Speech x={274} y={330} w={150} h={52} seed="cmp-cb" />
        <Txt x={290} y={352} size={14} weight={750}>
          {F.ceoBubble[0]}
        </Txt>
        <Txt x={290} y={371} size={14} weight={750}>
          {F.ceoBubble[1]}
        </Txt>
      </g>
      <Chip x={330} y={420} text={F.quietTag} seed="cmp-rt" el="quiet-tag" size={13} />
      <circle data-el="quiet-p" data-pts={rel([[330, 132], [330, 212], [330, 300], [292, 346]])} cx={330} cy={132} r={7} style={{ fill: 'var(--accent)' }} />
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)

  // step 1: 두 선이 함께 그려지다 매출만 0으로 떨어진다
  const s1 = at(0)
  const seg1 = o('rev-seg')
  const seg2 = o('ord-seg')
  const pt1 = o('rev-pt')
  const pt2 = o('ord-pt')
  init(tl, paths([...seg1, ...seg2]), { drawSVG: '0%' })
  init(tl, [...pt1.slice(1), ...pt2.slice(1)], { opacity: 0 })
  const sd = 0.2
  for (let i = 0; i < 3; i++) {
    const t = s1 + 0.1 + i * sd
    tl.to(paths([seg1[i], seg2[i]]), { drawSVG: '100%', duration: sd, ease: 'none' }, t)
    tl.to([pt1[i + 1], pt2[i + 1]], { opacity: 1, duration: 0.04 }, t + sd - 0.03)
  }

  // step 2: 칸이 하나씩 ✓로 채워지는 동안 알림은 0건 그대로
  const s2 = at(1)
  const cells = o('cell')
  init(tl, o('hist', 'alert7'), { opacity: 0 })
  init(tl, cells, { opacity: 0, scale: 0.5, transformOrigin: '50% 50%' })
  tl.to(o('charts'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('hist'), { opacity: 1, duration: 0.1 }, s2 + 0.08)
  tl.to(o('alert7'), { opacity: 1, duration: 0.1 }, s2 + 0.14)
  tl.to(cells, { opacity: 1, scale: 1, duration: 0.04, stagger: 0.04 }, s2 + 0.22)

  // step 3: 왼쪽은 알림이 곧장 주니에게, 오른쪽은 0원이 회의까지 막힘없이
  const s3 = at(2)
  const loud = ['loud-node', 'loud-bub', 'loud-juni', 'loud-tag']
  const quiet = ['quiet-node', 'quiet-dash', 'quiet-zero', 'quiet-meet', 'quiet-ceo', 'quiet-tag']
  init(tl, o('cmp', ...loud, ...quiet, 'quiet-a'), { opacity: 0 })
  tl.to(o('hist', 'alert7'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('cmp', 'loud-node', 'quiet-node'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  const la = o('loud-a')
  drawArrows(tl, [la[0]], s3 + 0.2, 0.08)
  tl.to(o('loud-bub'), { opacity: 1, duration: 0.05 }, s3 + 0.28)
  drawArrows(tl, [la[1]], s3 + 0.32, 0.08)
  tl.to(o('loud-juni'), { opacity: 1, duration: 0.05 }, s3 + 0.4)
  tl.to(o('loud-tag'), { opacity: 1, duration: 0.06 }, s3 + 0.46)

  tl.to(o('quiet-a', 'quiet-dash', 'quiet-meet'), { opacity: 1, duration: 0.08 }, s3 + 0.2)
  const end = flowAlong(tl, o('quiet-p')[0], s3 + 0.3, 0.4)
  tl.to(o('quiet-zero'), { opacity: 1, duration: 0.03 }, s3 + 0.42)
  tl.to(o('quiet-ceo'), { opacity: 1, duration: 0.06 }, end - 0.02)
  tl.to(o('quiet-tag'), { opacity: 1, duration: 0.06 }, end + 0.06)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 거꾸로 거슬러 오르기
// ─────────────────────────────────────────────────────────────
const WIN = { w: 252, h: 100 }
const winAt = (i: number) => ({ x: 18 + i * 38, y: 74 + i * 60 })
const LIN = ['app', 'topic', 'table', 'metric', 'bi'] as const
const LKIND = { app: 'source', topic: 'process', table: 'store', metric: 'process', bi: 'serve' } as const
const LX = 86
const LW = 150
const LH = 50
const LY = [44, 140, 236, 332, 428]
const RAW_X = 180
const RAW_Y = [104, 180]
const RAW_LH = 17
const ECOLS: Col[] = [
  { key: 'id', label: F.eventCols.id, w: 82 },
  { key: 'price', label: F.eventCols.price, w: 70, align: 'end' },
  { key: 'at', label: F.eventCols.at, w: 98 },
]
const ET = { x: 180, y: 258, rowH: 25 }

// step 4: 고친 뒤의 매출 그래프
const C_FIX: Chart = { base: 176, top: 52, max: 4.5 }

function FixChart() {
  const old = REVENUE.map((v, i) => [DX[i], yOf(C_FIX, v)] as P)
  const now = REVENUE_FIXED.map((v, i) => [DX[i], yOf(C_FIX, v)] as P)
  const pts = (ps: P[]) => ps.map((p) => p.join(',')).join(' ')
  return (
    <svg viewBox="0 0 440 282" className="diagram h-auto min-h-0 w-full shrink" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <Txt x={16} y={20} size={14.5} weight={750}>
        {F.revenueTitle}
      </Txt>
      <RLine x1={36} y1={C_FIX.base} x2={432} y2={C_FIX.base} seed="fix-ax" rough={0.3} stroke="var(--muted)" strokeWidth={1.2} />
      {DX.map((x, i) => (
        <Txt key={i} x={x} y={C_FIX.base + 27} size={13.5} weight={650} anchor="middle" muted>
          {F.days[i]}
        </Txt>
      ))}
      <polyline data-el="fix-line" data-to={pts(now)} points={pts(old)} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.8} strokeLinejoin="round" />
      {now.map(([x, y], i) => (
        <g key={i} data-el="fix-pt" data-dy={old[i][1] - y}>
          {i === 0 ? (
            <circle cx={x} cy={y} r={5} style={{ fill: 'var(--accent)' }} />
          ) : (
            <>
              {REVENUE[i] === 0 ? <Badge x={x} y={y} status="fail" r={10} el="fix-x" /> : <circle data-el="fix-dot" cx={x} cy={y} r={5} style={{ fill: 'var(--accent)' }} />}
              <Badge x={x} y={y} status="ok" r={10} el="fix-ok" />
            </>
          )}
          {i > 0 && (
            <Txt x={x} y={y - (REVENUE[i] === 0 ? 18 : 15)} size={13.5} weight={700} anchor="middle" el="fix-old">
              {eok(REVENUE[i])}
            </Txt>
          )}
          <Txt x={x} y={y - 16} size={13.5} weight={700} anchor="middle" el={i > 0 ? 'fix-new' : undefined}>
            {eok(REVENUE_FIXED[i])}
          </Txt>
        </g>
      ))}
      <g data-el="fri-tag">
        <line x1={DX[1]} y1={now[1][1] + 12} x2={DX[1]} y2={98} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
        <RRect x={160} y={98} w={250} h={56} seed="fri-tag" rough={0.3} fill="var(--surface)" />
        <Txt x={174} y={121} size={14} weight={800}>
          {F.friTag[0]}
        </Txt>
        <Txt x={174} y={142} size={13} weight={600} muted>
          {F.friTag[1]}
        </Txt>
      </g>
      <g data-el="cal">
        <RRect x={56} y={214} w={328} h={58} seed="cal" rough={0.35} fill="var(--surface)" />
        <RRect x={74} y={226} w={32} h={34} seed="cal-i" rough={0.25} />
        <rect x={74} y={226} width={32} height={9} style={{ fill: 'var(--line)', opacity: 0.8 }} />
        <Txt x={120} y={240} size={14.5} weight={800}>
          {F.calendar[0]}
        </Txt>
        <Txt x={120} y={260} size={13} weight={600} muted>
          {F.calendar[1]}
        </Txt>
        <REllipse cx={348} cy={243} w={34} h={34} seed="cal-q" rough={0.3} />
        <Txt x={348} y={252} size={22} weight={800} anchor="middle">
          ?
        </Txt>
      </g>
    </svg>
  )
}

export function AttemptFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="att-a" className="absolute inset-0">
        <Fig>
          {/* step 1: 쿼리 창 4개 */}
          {F.windows.map((title, i) => {
            const { x, y } = winAt(i)
            return (
              <g key={title} data-el="win">
                <rect x={x} y={y} width={WIN.w} height={WIN.h} rx={4} style={{ fill: 'var(--surface)' }} />
                <RRect x={x} y={y} w={WIN.w} h={WIN.h} seed={`win${i}`} rough={0.35} />
                <RLine x1={x} y1={y + 28} x2={x + WIN.w} y2={y + 28} seed={`win${i}-t`} rough={0.25} />
                <Txt x={x + 12} y={y + 19} size={13.5} weight={750}>
                  {title}
                </Txt>
                <Txt x={x + 12} y={y + 50} size={12.5} weight={600} muted>
                  {F.result}
                </Txt>
                <g data-el="win-res">
                  <Badge x={x + 60} y={y + 45.5} status="ok" r={8} />
                  <Txt x={x + 74} y={y + 50} size={13.5} weight={750}>
                    {F.noIssue}
                  </Txt>
                </g>
                <rect x={x + 12} y={y + 66} width={150} height={6} rx={3} style={{ fill: 'var(--muted)', opacity: 0.35 }} />
                <rect x={x + 12} y={y + 80} width={104} height={6} rx={3} style={{ fill: 'var(--muted)', opacity: 0.35 }} />
              </g>
            )
          })}
          <g data-el="clock">
            <ClockIcon x={344} y={33} r={10} />
            <Txt x={360} y={40} size={21} weight={800} mono el="clock-t">
              {F.clock(53)}
            </Txt>
          </g>

          {/* step 2~3: 위(앱) → 아래(BI 대시보드) 리니지 */}
          <g data-el="lin">
            {LIN.slice(0, -1).map((k, i) => (
              <g key={k} data-el="la">
                <RArrow x1={LX} y1={LY[i] + LH / 2 + 4} x2={LX} y2={LY[i + 1] - LH / 2 - 6} seed={`la${i}`} rough={0.4} strokeWidth={2} />
              </g>
            ))}
            {LIN.map((k, i) => (
              <Node
                key={k}
                x={LX}
                y={LY[i]}
                w={LW}
                h={LH}
                label={F.lineage[k][0]}
                sub={F.lineage[k][1] || undefined}
                kind={LKIND[k]}
                seed={`ln-${k}`}
                el={`ln-${k}`}
                statuses={k === 'bi' || k === 'app' ? ['fail'] : undefined}
                status={k === 'bi' ? 'fail' : undefined}
              />
            ))}
            <Txt x={LX + LW / 2 + 12} y={LY[4] + 7} size={20} weight={800}>
              {F.zero}
            </Txt>
          </g>
          <rect data-el="ring" x={LX - LW / 2 - 7} y={LY[4] - LH / 2 - 7} width={LW + 14} height={LH + 14} rx={8} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
          <rect data-el="ring-x" x={LX - LW / 2 - 7} y={LY[0] - LH / 2 - 7} width={LW + 14} height={LH + 14} rx={8} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={3} />
          <g data-el="mnote">
            <line x1={LX + LW / 2 + 7} y1={LY[3]} x2={176} y2={LY[3]} style={{ stroke: 'var(--accent)' }} strokeWidth={2} />
            <RRect x={176} y={LY[3] - 37} w={256} h={74} seed="mnote" rough={0.3} fill="var(--surface)" />
            <Txt x={190} y={LY[3] - 13} size={14} weight={800} mono>
              {F.metricNote[0]}
            </Txt>
            <Txt x={190} y={LY[3] + 7} size={13.5} weight={600}>
              {F.metricNote[1]}
            </Txt>
            <Txt x={190} y={LY[3] + 27} size={13.5} weight={800}>
              {F.metricNote[2]}
            </Txt>
          </g>

          {/* step 3: 앱 꼬리표, 원본 이벤트, 주문 이벤트 테이블 */}
          <g data-el="app-tag">
            <line x1={LX + LW / 2 + 7} y1={LY[0]} x2={178} y2={LY[0]} style={{ stroke: 'var(--fail)' }} strokeWidth={2} />
            <Chip x={178 + (tw(F.appTag, 13.5) + 18) / 2} y={LY[0]} text={F.appTag} seed="app-tag" size={13.5} />
          </g>
          <g data-el="raw">
            <line x1={LX + LW / 2 + 4} y1={LY[1]} x2={172} y2={LY[1]} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
            <line x1={172} y1={RAW_Y[0] - 30} x2={172} y2={RAW_Y[1] + RAW_LH * 3 + 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
            <Txt x={RAW_X} y={RAW_Y[0] - 22} size={12.5} weight={700} muted>
              {F.rawTitle}
            </Txt>
            {RAW_EVENTS.map((ev, k) => (
              <g key={ev.time}>
                <Txt x={RAW_X} y={RAW_Y[k]} size={12.5} weight={800}>
                  {ev.time}
                </Txt>
                <rect data-el={`raw-hl-${k}`} data-line={`raw-${k}-1`} data-key={`"${ev.key}"`} x={RAW_X} y={RAW_Y[k] + RAW_LH * 2 - 13} width={0} height={17} rx={3} style={{ fill: 'var(--accent)', opacity: 0.32 }} />
                {ev.lines.map((l, j) => (
                  <text key={j} data-el={`raw-${k}-${j}`} x={RAW_X + (j > 0 ? 8 : 0)} y={RAW_Y[k] + RAW_LH * (j + 1)} style={{ fontSize: 12.5 }}>
                    {l.trim()}
                  </text>
                ))}
              </g>
            ))}
          </g>
          <g data-el="etab">
            <line x1={LX + LW / 2 + 4} y1={LY[2]} x2={ET.x} y2={ET.y + ET.rowH / 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
            <SvgTable x={ET.x} y={ET.y} cols={ECOLS} rows={EVENT_ROWS.map(([id, price, a]) => ({ id, price, at: a }))} el="et" rowH={ET.rowH} seed="et" fontSize={12.5} />
            {EVENT_ROWS.map(([, price], i) =>
              price ? null : <rect key={i} x={ET.x + 82 + 8} y={ET.y + ET.rowH * (i + 1) + 5} width={70 - 16} height={ET.rowH - 10} rx={2} style={{ fill: 'none', stroke: 'var(--fail)' }} strokeWidth={1.6} strokeDasharray="4 3" />,
            )}
          </g>
        </Fig>
      </div>

      {/* step 4: 적재 쿼리 고치기 */}
      <div data-el="att-b" className="absolute inset-0 flex flex-col justify-center gap-2" style={{ opacity: 0 }}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[0.8125rem] font-bold text-muted md:text-sm">{F.codeTitle}</p>
          <p className="flex items-center gap-1.5 font-mono text-lg font-extrabold md:text-xl">
            <svg viewBox="0 0 24 24" className="diagram size-5" aria-hidden="true">
              <ClockIcon x={12} y={12} r={9} />
            </svg>
            <span data-el="clock2">{F.clock(58)}</span>
          </p>
        </div>
        <CodeType code={F.fixCode} el="fix-code" className="max-md:p-3! max-md:text-[0.75rem]! max-md:leading-5!" />
        <FixChart />
      </div>
    </div>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)

  // 원본 이벤트에서 강조할 항목 이름의 자리(글자 위치는 그려진 글꼴로 잰다)
  o('raw-hl-0', 'raw-hl-1').forEach((r) => {
    const t = o((r as SVGElement).dataset.line ?? '')[0] as SVGTextElement | undefined
    const key = (r as SVGElement).dataset.key ?? ''
    const s = t?.textContent?.indexOf(key) ?? -1
    if (!t || s < 0 || !t.getNumberOfChars()) return
    const a = t.getExtentOfChar(s)
    const b = t.getExtentOfChar(s + key.length - 1)
    gsap.set(r, { attr: { x: a.x - 2, width: b.x + b.width - a.x + 4 } })
  })

  // step 1: 쿼리 창이 하나씩 열리고 '이상 없음', 시계 08:51 → 08:53
  const s1 = at(0)
  const wins = o('win')
  const res = o('win-res')
  init(tl, wins.slice(1), { opacity: 0, y: 10 })
  init(tl, res, { opacity: 0 })
  wins.forEach((w, i) => {
    const t = s1 + 0.06 + i * 0.17
    if (i > 0) tl.to(w, { opacity: 1, y: 0, duration: 0.07 }, t)
    tl.to(res[i], { opacity: 1, duration: 0.04 }, t + 0.1)
  })
  countTo(tl, o('clock-t')[0], 51, 53, (m) => F.clock(m), s1 + 0.1, 0.6)

  // step 2: 리니지를 따라 BI 대시보드 → 매출 지표로 한 칸
  const s2 = at(1)
  const arrows = o('la')
  init(tl, o('lin', 'ring', 'ring-x', 'mnote', 'app-tag', 'raw', 'etab', 'ln-app:fail', 'raw-hl-0', 'raw-hl-1', 'et-hl-r2', 'et-hl-r3'), { opacity: 0 })
  init(tl, arrows, { opacity: 0.32 })
  tl.to([...wins, ...o('clock')], { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('lin'), { opacity: 1, duration: 0.12 }, s2 + 0.1)
  tl.to(o('ring'), { opacity: 1, duration: 0.06 }, s2 + 0.3)
  const ringTo = (k: number, t: number, d = 0.12) => tl.to(o('ring'), { y: LY[k] - LY[4], duration: d, ease: 'power2.inOut' }, t)
  ringTo(3, s2 + 0.4, 0.16)
  tl.to(arrows[3], { opacity: 1, duration: 0.08 }, s2 + 0.46)
  tl.to(o('mnote'), { opacity: 1, duration: 0.1 }, s2 + 0.6)

  // step 3: 매출 지표 → 주문 이벤트 테이블 → 결제 토픽 → 앱
  const s3 = at(2)
  tl.to(o('mnote'), { opacity: 0, duration: 0.08 }, s3)
  ringTo(2, s3 + 0.08)
  tl.to(arrows[2], { opacity: 1, duration: 0.08 }, s3 + 0.12)
  tl.to(o('etab'), { opacity: 1, duration: 0.08 }, s3 + 0.16)
  tl.to(o('et-hl-r2', 'et-hl-r3'), { opacity: 0.3, duration: 0.06 }, s3 + 0.24)
  ringTo(1, s3 + 0.32)
  tl.to(arrows[1], { opacity: 1, duration: 0.08 }, s3 + 0.36)
  tl.to(o('raw'), { opacity: 1, duration: 0.08 }, s3 + 0.4)
  tl.to(o('raw-hl-0'), { opacity: 0.32, duration: 0.05 }, s3 + 0.48)
  tl.to(o('raw-hl-1'), { opacity: 0.32, duration: 0.05 }, s3 + 0.54)
  ringTo(0, s3 + 0.58)
  tl.to(arrows[0], { opacity: 1, duration: 0.08 }, s3 + 0.62)
  tl.to(o('ring'), { opacity: 0, duration: 0.05 }, s3 + 0.7)
  tl.to(o('ring-x', 'ln-app:fail'), { opacity: 1, duration: 0.05 }, s3 + 0.7)
  tl.to(o('app-tag'), { opacity: 1, duration: 0.06 }, s3 + 0.75)

  // step 4: 적재 쿼리 한 줄을 고치면 금·토·일이 제 높이로
  const s4 = at(3)
  swapLayer(tl, o('att-a'), o('att-b'), s4)
  const [l1 = [], l2 = []] = codeChars(q, 'fix-code')
  tl.set(l1, { textDecoration: 'line-through', opacity: 0.75 }, s4 + 0.16)
  const typed = typeChars(tl, l2, s4 + 0.2, 0.26)
  countTo(tl, o('clock2')[0], 53, 58, (m) => F.clock(m), s4 + 0.08, 0.5)
  const line = o('fix-line')[0] as SVGPolylineElement | undefined
  const ptsEl = o('fix-pt')
  ptsEl.forEach((p) => init(tl, p, { y: Number((p as SVGElement).dataset.dy ?? 0) }))
  init(tl, o('fix-ok', 'fix-new', 'fri-tag', 'cal'), { opacity: 0 })
  if (line) tl.to(line, { attr: { points: line.dataset.to ?? '' }, duration: 0.18, ease: 'power2.out' }, typed + 0.02)
  tl.to(ptsEl, { y: 0, duration: 0.18, ease: 'power2.out' }, typed + 0.02)
  tl.to(o('fix-old', 'fix-x', 'fix-dot'), { opacity: 0, duration: 0.04 }, typed + 0.06)
  tl.to(o('fix-new', 'fix-ok'), { opacity: 1, duration: 0.05 }, typed + 0.12)
  tl.to(o('fri-tag'), { opacity: 1, duration: 0.06 }, typed + 0.2)
  tl.to(o('cal'), { opacity: 1, duration: 0.06 }, typed + 0.28)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 길목의 검문소, 품질 테스트
// ─────────────────────────────────────────────────────────────
const QP_QUEUE = [178, 157, 136, 115, 94]
const QP_PASS = [292, 320, 348]
const CHIP_X = [64, 168, 272, 376]
const QCOLS: Col[] = [
  { key: 'id', label: F.eventCols.id, w: 88 },
  { key: 'price', label: F.eventCols.price, w: 78, align: 'end' },
  { key: 'at', label: F.eventCols.at, w: 96 },
  { key: 'res', label: F.resultCol, w: 152 },
]
const QT = { x: 13, y: 112, rowH: 40 }
const RES_X = QT.x + 88 + 78 + 96
const qRowY = (i: number) => QT.y + QT.rowH * (i + 1) + QT.rowH / 2
const COL_OF = ['price', 'id', 'price', 'at'] as const
/** 축소한 표의 열 가운데(order_id · price · 들어온 시각) */
const MT_KEYS = ['id', 'price', 'at'] as const
const MT_X = [6 + 44, 6 + 88 + 39, 6 + 88 + 78 + 48]

export function TestFig() {
  const freshW = tw(F.freshness[0], 13.5)
  return (
    <div className="relative h-full w-full">
      <div data-el="test-a" className="absolute inset-0">
        <Fig
          caption={
            <span className="grid">
              <span data-el="cap-2" className="col-start-1 row-start-1">
                {F.checksNote}
              </span>
              <span data-el="cap-3" className="col-start-1 row-start-1">
                {F.stopNote}
              </span>
            </span>
          }
        >
          {/* step 1: 화살표 위 검문소 */}
          <g data-el="t1">
            <Node x={220} y={58} w={196} h={54} label={F.checkTable} kind="store" seed="t1-table" />
            <RArrow x1={220} y1={90} x2={220} y2={380} seed="t1-arrow" rough={0.3} strokeWidth={2} />
            <Node x={220} y={414} w={196} h={54} label={F.lineage.metric[0]} kind="process" seed="t1-metric" />
            <Gate x={220} y={238} w={72} h={50} seed="t1-gate" el="t1-gate" />
            <Txt x={272} y={246} size={14.5} weight={750}>
              {F.gate}
            </Txt>
            {QP_QUEUE.map((y, k) => (
              <g key={k} data-el="qp">
                <circle cx={220} cy={y} r={7} style={{ fill: 'var(--accent)' }} />
                {k < 3 && (
                  <Txt x={232} y={y + 5} size={14} weight={800} color="var(--ok)" el="qp-ok">
                    ✓
                  </Txt>
                )}
              </g>
            ))}
          </g>

          {/* step 2: 네 가지 검사와 걸린 행 */}
          <g data-el="t2" transform="translate(0 44)">
            {F.checks.map((c, k) => (
              <g key={c}>
                <RRect x={CHIP_X[k] - 48} y={18} w={96} h={30} seed={`chk${k}`} rough={0.3} fill="var(--surface)" />
                <rect data-el={`chk-on-${k}`} x={CHIP_X[k] - 50} y={16} width={100} height={34} rx={6} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={3} />
                <Txt x={CHIP_X[k]} y={38} size={13.5} weight={750} anchor="middle" mono={k === 0}>
                  {c}
                </Txt>
              </g>
            ))}
            <g data-el="fresh">
              <Txt x={16} y={86} size={13.5} weight={700}>
                {F.freshness[0]}
              </Txt>
              <Txt x={16 + freshW + 30} y={86} size={13} weight={600} muted>
                {F.freshness[1]}
              </Txt>
            </g>
            <Badge x={16 + freshW + 15} y={81} status="ok" r={9} el="fresh-ok" />
            <SvgTable x={QT.x} y={QT.y} cols={QCOLS} rows={CHECK_ROWS.map((r) => ({ id: r.id, price: r.price, at: r.at, res: '' }))} el="qt" rowH={QT.rowH} seed="qt" fontSize={13.5} />
            <rect x={QT.x + 88 + 10} y={QT.y + QT.rowH * 2 + 9} width={78 - 20} height={QT.rowH - 18} rx={2} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.4} strokeDasharray="4 3" />
            {CHECK_ROWS.map((r, i) =>
              r.fail === undefined ? (
                <Badge key={i} x={RES_X + 22} y={qRowY(i)} status="ok" r={10} el="res-ok" />
              ) : (
                <g key={i} data-el={`res-x-${r.fail}`}>
                  <Badge x={RES_X + 22} y={qRowY(i)} status="fail" r={10} />
                  <Txt x={RES_X + 40} y={qRowY(i) + 5} size={13.5} weight={750} mono={r.fail === 0}>
                    {F.checks[r.fail]}
                  </Txt>
                </g>
              ),
            )}
          </g>

          {/* step 3: 금 18:05로 되감으면 — 검문소 ✕, 하류 ⏸, 알림 */}
          <g data-el="t3">
            <g>
              <RRect x={262} y={20} w={150} h={34} seed="rw" rough={0.3} fill="var(--surface)" />
              <path d="M 282 37 m -8 0 a 8 8 0 1 0 2.4 -5.7 M 274 30 l 0 6 l 6 0" style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <Txt x={298} y={43} size={16} weight={800} mono>
                {F.rewind}
              </Txt>
            </g>
            <Node x={130} y={84} w={196} h={52} label={F.checkTable} kind="store" seed="t3-table" />
            <RArrow x1={130} y1={115} x2={130} y2={206} seed="t3-a1" rough={0.3} strokeWidth={2} />
            <Gate x={130} y={174} w={64} h={40} seed="t3-gate" el="t3-gate" />
            <g data-el="t3-metric">
              <Node x={130} y={236} w={196} h={52} label={F.lineage.metric[0]} kind="process" seed="t3-metric" el="t3m" statuses={['wait']} />
            </g>
            <Txt x={238} y={241} size={13.5} weight={800} el="t3-paused">
              {F.paused}
            </Txt>
            <RArrow x1={130} y1={266} x2={130} y2={312} seed="t3-a2" rough={0.3} strokeWidth={2} />
            <g data-el="t3-bi">
              <Node x={130} y={342} w={196} h={52} label={F.lineage.bi[0]} kind="serve" seed="t3-bi" el="t3b" statuses={['wait']} />
            </g>
            <g data-el="t3-hold">
              <Txt x={130} y={392} size={14} weight={800} anchor="middle">
                {F.biHold[0]}
              </Txt>
              <Txt x={130} y={412} size={13} weight={600} anchor="middle" muted>
                {F.biHold[1]}
              </Txt>
            </g>
            <Node x={350} y={174} w={160} h={52} label={N6.alert.label} sub={N6.alert.sub} kind="control" seed="t3-alert" />
            <g data-el="t3-al">
              <PolyArrow pts={[[166, 174], [264, 174]]} seed="t3-al" dash="3 6" />
            </g>
            <g data-el="t3-ap">
              <PolyArrow pts={[[350, 202], [350, 238]]} seed="t3-ap" dash="3 6" />
            </g>
            <Phone x={294} y={244} w={112} h={158} seed="t3-phone" />
            <g data-el="t3-notif">
              <RRect x={302} y={268} w={96} h={70} seed="t3-n" rough={0.25} fill="var(--bg)" />
              <Txt x={310} y={288} size={12.5} weight={800}>
                {F.phone[0]}
              </Txt>
              <Txt x={310} y={307} size={12.5} weight={700} mono>
                {F.phone[1]}
              </Txt>
              <Txt x={310} y={326} size={12} weight={600} muted>
                {F.phone[2]}
              </Txt>
            </g>
            <Txt x={350} y={424} size={12.5} weight={650} anchor="middle" muted>
              {F.phoneLabel}
            </Txt>
            <circle data-el="t3-p" data-pts={rel([[130, 98], [130, 122]])} cx={130} cy={98} r={7} style={{ fill: 'var(--surface)', stroke: 'var(--accent)' }} strokeWidth={2.4} strokeDasharray="3 2.5" />
          </g>
        </Fig>
      </div>

      {/* step 4: 규칙을 YAML로 */}
      <div data-el="test-b" className="absolute inset-0 flex flex-col justify-center gap-2 md:gap-3" style={{ opacity: 0 }}>
        <CodeType code={F.yaml} el="yaml" className="max-md:p-2.5! max-md:text-[0.65rem]! max-md:leading-[1.05rem]!" />
        <svg viewBox="0 0 284 196" className="diagram mx-auto h-auto max-h-[42%] min-h-0 w-full max-w-[24rem]" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <SvgTable x={6} y={4} cols={QCOLS.slice(0, 3)} rows={CHECK_ROWS.map((r) => ({ id: r.id, price: r.price, at: r.at }))} el="mt" rowH={25} seed="mt" fontSize={12.5} />
          {MT_X.map((x, k) => (
            <g key={k} data-el={`mt-tag-${MT_KEYS[k]}`}>
              <line x1={x} y1={158} x2={x} y2={166} style={{ stroke: 'var(--accent)' }} strokeWidth={2} />
              {F.yamlTags[k].map((t, j) => (
                <Txt key={t} x={x} y={180 + j * 14} size={12} weight={750} anchor="middle" mono>
                  {t}
                </Txt>
              ))}
            </g>
          ))}
        </svg>
        <p className="text-center text-[0.8125rem] leading-snug text-muted md:text-sm">{F.yamlNote}</p>
      </div>
    </div>
  )
}

export const buildTest: SceneBuild = (q, tl) => {
  const o = pick(q)

  // step 1: 검문소가 서고, 입자가 하나씩 지나며 ✓를 받는다
  const s1 = at(0)
  init(tl, o('t1-gate', 'qp-ok', 't1-gate-x'), { opacity: 0 })
  tl.to(o('t1-gate'), { opacity: 1, duration: 0.1 }, s1 + 0.08)
  const qp = o('qp')
  const okMarks = o('qp-ok')
  // 줄의 맨 앞(검문소 바로 앞)부터 한 명씩 지나가고, 뒤에 선 입자들이 한 칸씩 앞으로
  for (let k = 0; k < 3; k++) {
    const t = s1 + 0.26 + k * 0.17
    tl.to(qp[k], { y: QP_PASS[k] - QP_QUEUE[k], duration: 0.12, ease: 'power1.inOut' }, t)
    tl.to(okMarks[k], { opacity: 1, duration: 0.03 }, t + 0.06)
    for (let m = k + 1; m < qp.length; m++) tl.to(qp[m], { y: QP_QUEUE[m - k - 1] - QP_QUEUE[m], duration: 0.1, ease: 'power1.inOut' }, t + 0.05)
  }

  // step 2: 검사 이름이 차례로 켜지고, 그 검사가 보는 열과 걸린 행
  const s2 = at(1)
  init(tl, o('t2', 'cap-2', 'cap-3', 'fresh-ok', 'res-ok', 'res-x-0', 'res-x-1', 'res-x-2', 'chk-on-0', 'chk-on-1', 'chk-on-2', 'chk-on-3'), { opacity: 0 })
  init(tl, o('fresh'), { opacity: 0.5 })
  tl.to(o('t1'), { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('t2'), { opacity: 1, duration: 0.1 }, s2 + 0.06)
  tl.to(o('cap-2'), { opacity: 1, duration: 0.08 }, s2 + 0.12)
  let prev: Els = []
  COL_OF.forEach((col, k) => {
    const t = s2 + 0.2 + k * 0.14
    const hl = o(`qt-hl-c${col}`)
    tl.to(o(`chk-on-${k}`), { opacity: 1, duration: 0.04 }, t)
    if (prev.length && prev[0] !== hl[0]) tl.to(prev, { opacity: 0, duration: 0.04 }, t)
    tl.to(hl, { opacity: 0.2, duration: 0.04 }, t + 0.02)
    if (k < 3) tl.to(o(`res-x-${k}`), { opacity: 1, duration: 0.04 }, t + 0.08)
    else {
      tl.to(o('fresh'), { opacity: 1, duration: 0.04 }, t + 0.06)
      tl.to(o('fresh-ok'), { opacity: 1, duration: 0.04 }, t + 0.08)
    }
    prev = hl
  })
  tl.to(prev, { opacity: 0, duration: 0.05 }, s2 + 0.76)
  tl.to(o('res-ok'), { opacity: 1, duration: 0.05 }, s2 + 0.76)

  // step 3: 빈 값이 검문소에 닿으면 ✕ → 하류 ⏸, 알림이 주니에게
  const s3 = at(2)
  init(tl, o('t3', 't3-gate-x', 't3m:wait', 't3b:wait', 't3-paused', 't3-hold', 't3-notif'), { opacity: 0 })
  tl.to(o('t2', 'cap-2'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('t3'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  tl.to(o('cap-3'), { opacity: 1, duration: 0.08 }, s3 + 0.7)
  const pEnd = flowAlong(tl, o('t3-p')[0], s3 + 0.2, 0.12, { fadeOut: false })
  tl.to(o('t3-gate-ok'), { opacity: 0, duration: 0.03 }, pEnd)
  tl.to(o('t3-gate-x'), { opacity: 1, duration: 0.03 }, pEnd)
  tl.to(o('t3m:wait', 't3-paused'), { opacity: 1, duration: 0.04 }, pEnd + 0.08)
  tl.to(o('t3-metric'), { opacity: 0.78, duration: 0.06 }, pEnd + 0.08)
  tl.to(o('t3b:wait'), { opacity: 1, duration: 0.04 }, pEnd + 0.18)
  tl.to(o('t3-bi'), { opacity: 0.78, duration: 0.06 }, pEnd + 0.18)
  tl.to(o('t3-hold'), { opacity: 1, duration: 0.06 }, pEnd + 0.24)
  drawArrows(tl, o('t3-al'), pEnd + 0.1, 0.1)
  drawArrows(tl, o('t3-ap'), pEnd + 0.22, 0.08)
  tl.to(o('t3-notif'), { opacity: 1, duration: 0.06 }, pEnd + 0.32)

  // step 4: YAML 한 줄씩 — 선언한 줄이 검사하는 열에 불이 들어온다
  const s4 = at(3)
  swapLayer(tl, o('test-a'), o('test-b'), s4)
  const lines = codeChars(q, 'yaml')
  const hl = (col: string) => o(`mt-hl-c${col}`)
  init(tl, MT_KEYS.flatMap((k) => [...hl(k), ...o(`mt-tag-${k}`)]), { opacity: 0 })
  // [줄, 타이핑 길이, 그 줄부터 불이 들어오는 열, 그 열의 검사 선언이 끝나는 줄인가]
  const plan: [number, number, string?, boolean?][] = [
    [0, 0.06],
    [1, 0.09, 'at', true],
    [2, 0.03],
    [3, 0.04, 'id'],
    [4, 0.08, undefined, true],
    [5, 0.03, 'price'],
    [6, 0.06],
    [7, 0.1, undefined, true],
  ]
  let t = s4 + 0.12
  let lit = ''
  for (const [li, d, col, done] of plan) {
    if (col) {
      lit = col
      tl.to(hl(col), { opacity: 0.24, duration: 0.03 }, t)
    }
    t = typeChars(tl, lines[li] ?? [], t, d)
    if (done && lit) {
      tl.to(o(`mt-tag-${lit}`), { opacity: 1, duration: 0.03 }, t)
      tl.to(hl(lit), { opacity: 0, duration: 0.03 }, t + 0.03)
    }
  }
  // 끝 그림(정지 모드 포함): 완성된 코드 + 검사가 걸린 세 열이 함께 하이라이트
  tl.to(MT_KEYS.flatMap(hl), { opacity: 0.24, duration: 0.04 }, t + 0.08)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 데이터 계약
// ─────────────────────────────────────────────────────────────
export function ContractFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="ct-a" className="absolute inset-0">
        <Fig
          caption={
            <span data-el="cap-ci" className="block">
              {F.ciNote}
            </span>
          }
        >
          {/* step 1: 가운데 벽 */}
          <g data-el="c1">
            <Txt x={108} y={92} size={16} weight={800} anchor="middle">
              {F.appTeam}
            </Txt>
            <Txt x={332} y={92} size={16} weight={800} anchor="middle">
              {F.dataTeam}
            </Txt>
            <RRect x={211} y={110} w={18} h={330} seed="wall" rough={0.3} fill="var(--muted)" fillStyle="hachure" />
            <Initial x={108} y={152} r={26} who="taeo" seed="c1-taeo" />
            <Txt x={108} y={200} size={14} weight={700} anchor="middle">
              {PEOPLE.taeo.name}
            </Txt>
            <Chip x={100} y={256} text={F.renameTag} seed="c1-rename" mono size={13.5} />
            <Badge x={40} y={316} status="ok" r={10} />
            <Txt x={56} y={321} size={14} weight={750}>
              {F.appDone}
            </Txt>
            <g transform="translate(298 118) scale(0.68)">
              <JuniFace mood="focus" seed="c1-juni" />
            </g>
            <Txt x={332} y={200} size={14} weight={700} anchor="middle">
              {PEOPLE.juni.name}
            </Txt>
            <Node x={332} y={262} w={168} h={56} label={F.lineage.metric[0]} sub={F.metricSum} kind="process" seed="c1-metric" />
          </g>
          <Txt x={220} y={84} size={30} weight={800} anchor="middle" el="wall-q">
            ?
          </Txt>
          <rect data-el="c1-p" data-pts={rel([[170, 249], [198, 249]])} x={163} y={242} width={14} height={14} rx={3} style={{ fill: 'var(--accent)' }} />

          {/* step 3: 코드 변경 → CI(계약 검사) → 배포 */}
          <g data-el="c3">
            <Node x={150} y={62} w={210} h={52} label={F.flowChange} kind="process" seed="c3-change" />
            <Txt x={272} y={58} size={13} weight={600} muted>
              {F.flowReview[0]}
            </Txt>
            <Txt x={272} y={77} size={13.5} weight={750}>
              {F.flowReview[1]}
            </Txt>
            <RArrow x1={150} y1={92} x2={150} y2={150} seed="c3-a1" rough={0.3} strokeWidth={2} />
            <rect x={45} y={156} width={210} height={140} rx={4} style={{ fill: 'var(--surface)' }} />
            <RRect x={45} y={156} w={210} h={140} seed="c3-ci" rough={0.35} />
            <Txt x={150} y={182} size={15} weight={750} anchor="middle">
              {F.flowCi[0]}
            </Txt>
            <Txt x={150} y={202} size={12.5} weight={600} anchor="middle" muted>
              {F.flowCi[1]}
            </Txt>
            <rect data-el="c3-doc-hl" x={104} y={218} width={30} height={36} rx={4} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.6} />
            <DocIcon x={108} y={222} seed="c3-doc" label={F.contractV1} size={13.5} />
            <Badge x={253} y={158} status="ok" r={11} el="c3-ok" />
            <Txt x={272} y={222} size={13.5} weight={750}>
              {F.flowMismatch[0]}
            </Txt>
            <Txt x={272} y={241} size={13.5} weight={600}>
              {F.flowMismatch[1]}
            </Txt>
            <RArrow x1={150} y1={300} x2={150} y2={360} seed="c3-a2" rough={0.3} strokeWidth={2} />
            <Node x={150} y={392} w={210} h={52} label={F.flowDeploy} kind="serve" seed="c3-deploy" el="c3d" statuses={['ok']} />
          </g>
          <circle data-el="c3-p" data-pts={rel([[150, 96], [150, 168], [120, 236]])} cx={150} cy={96} r={7} style={{ fill: 'var(--accent)' }} />
          <circle data-el="c3-p2" data-pts={rel([[120, 236], [150, 300], [150, 364]])} cx={120} cy={236} r={7} style={{ fill: 'var(--accent)' }} />
        </Fig>
      </div>

      {/* step 2: 벽 자리에 계약 문서 */}
      <div data-el="ct-b" className="absolute inset-0 flex flex-col justify-center" style={{ opacity: 0 }}>
        <div className="rounded-xl border-[1.5px] border-edge bg-surface p-3 md:p-4">
          <p className="text-[0.9375rem] font-bold md:text-lg">{F.contractTitle}</p>
          <CodeType code={F.contract} el="contract" className="mt-2 border-0! bg-transparent! p-0! text-[0.75rem]! leading-5! md:text-[0.9375rem]! md:leading-7!" />
          <p className="mt-3 flex flex-wrap gap-x-3 border-t border-edge pt-2 text-[0.875rem] font-semibold md:text-base">
            {F.sign.map((s, i) => (
              <span key={s}>
                {s}{' '}
                <span data-el="sig" className="font-extrabold text-ok" aria-hidden="true">
                  ✓
                </span>
                {i === 0 && <span className="ml-3 text-muted">·</span>}
              </span>
            ))}
          </p>
        </div>
        <p className="mt-2 text-center text-[0.8125rem] leading-snug text-muted md:text-sm">{F.contractNote}</p>
      </div>
    </div>
  )
}

export const buildContract: SceneBuild = (q, tl) => {
  const o = pick(q)

  // step 1: 'price → amount' 소식이 벽 앞에서 멈춰 흐려진다
  const s1 = at(0)
  init(tl, o('wall-q'), { opacity: 0 })
  const pe = flowAlong(tl, o('c1-p')[0], s1 + 0.2, 0.28, { fadeOut: false })
  tl.to(o('c1-p'), { opacity: 0.25, duration: 0.12 }, pe + 0.04)
  tl.to(o('wall-q'), { opacity: 1, duration: 0.06 }, pe + 0.1)

  // step 2: 벽이 계약 문서가 되고, 항목이 한 줄씩 써진 뒤 서명 ✓
  const s2 = at(1)
  swapLayer(tl, [...o('c1', 'wall-q', 'c1-p')], o('ct-b'), s2)
  const lines = codeChars(q, 'contract')
  const total = lines.reduce((a, l) => a + l.length, 0) || 1
  let t = s2 + 0.16
  for (const l of lines) t = typeChars(tl, l, t, (0.5 * l.length) / total)
  const sig = o('sig')
  init(tl, sig, { opacity: 0 })
  tl.to(sig, { opacity: 1, duration: 0.03, stagger: 0.06 }, t + 0.04)

  // step 3: 변경이 CI에서 계약과 비교된 뒤 ✓ → 배포
  const s3 = at(2)
  init(tl, o('c3', 'cap-ci', 'c3-ok', 'c3d:ok', 'c3-doc-hl', 'c3-p2'), { opacity: 0 })
  tl.to(o('ct-b'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('c3'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  tl.to(o('cap-ci'), { opacity: 1, duration: 0.08 }, s3 + 0.12)
  const e1 = flowAlong(tl, o('c3-p')[0], s3 + 0.2, 0.18, { fadeOut: false })
  tl.to(o('c3-doc-hl'), { opacity: 1, duration: 0.04 }, e1)
  tl.to(o('c3-ok'), { opacity: 1, duration: 0.04 }, e1 + 0.12)
  tl.to(o('c3-p'), { opacity: 0, duration: 0.01 }, e1 + 0.14)
  tl.to(o('c3-doc-hl'), { opacity: 0, duration: 0.04 }, e1 + 0.16)
  const e2 = flowAlong(tl, o('c3-p2')[0], e1 + 0.14, 0.16, { fadeIn: false })
  tl.set(o('c3-p2'), { opacity: 1 }, e1 + 0.14)
  tl.to(o('c3d:ok'), { opacity: 1, duration: 0.04 }, e2)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 시끄럽게 실패하는 파이프라인
// ─────────────────────────────────────────────────────────────
// 세로 배치 맵(데스크톱·모바일 공용) 위에 덧그린다. 세로 배치에서 다른 노드 뒤로 지나가 버리는 연결선은
// 맵의 선을 숨기고 바깥 통로·노드 사이 틈으로 꺾어 다시 그린다. 오케스트레이터 → 야간 ETL·분산 처리 제어선은
// 이 배치에서 다른 노드를 피해 갈 길이 없고 리니지(데이터 흐름)와도 무관해 이 장면에서만 숨긴다.
type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined
interface Bx {
  x: number
  y: number
  w: number
  h: number
  x0: number
  x1: number
  y0: number
  y1: number
}
const bx = (n: { x: number; y: number; w: number; h: number }): Bx => ({ ...n, x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 })
/** 노드 상자 테두리와 중심선이 만나는 점(PipelineMap과 같은 방식) */
function edgePt(n: Bx, tx: number, ty: number, gap: number): P {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}
const CHECKS = ['kafka>lake', 'etl>warehouse', 'spark>warehouse', 'model>bi']
/** BI 대시보드에서 앱까지 거꾸로(장면 6 step 4) */
const TRACE = ['model>bi', 'warehouse>model', 'spark>warehouse', 'lake>spark', 'kafka>lake', 'app>kafka']
const TRACE_NODES = ['bi', 'model', 'warehouse', 'spark', 'lake', 'kafka', 'app']
const PATH_CHECKS = CHECKS.filter((id) => TRACE.includes(id))
const ROUTED = ['contract>app', 'app>kafka', 'lake>spark', 'spark>warehouse', 'etl>warehouse', 'kafka>fraud', 'kafka>stock', 'orch>alert']
const HIDDEN = ['orch>etl', 'orch>spark']
const MAP_IDS = mapStateAt(T.ch7).nodes.map((n) => n.id)
const KIND_OF = Object.fromEntries(mapStateAt(T.ch7).edges.map((e) => [e.id, e.kind]))

function layout7(pos: At) {
  const N: Record<string, Bx> = {}
  for (const id of MAP_IDS) {
    const r = pos(id)
    if (!r) return null
    N[id] = bx(r)
  }
  const all = Object.values(N)
  const L = Math.min(...all.map((n) => n.x0))
  const R = Math.max(...all.map((n) => n.x1))
  const { contract: c, app, etl, lake, kafka, spark, orch, fraud, stock, warehouse: wh, alert, model, bi } = N
  const straight = (a: Bx, b: Bx): P[] => [edgePt(a, b.x, b.y, 5), edgePt(b, a.x, a.y, 7)]
  const yf = (spark.y1 + fraud.y0) / 2
  const yl = (lake.y1 + kafka.y0) / 2
  const route: Record<string, P[]> = {
    'contract>app': [
      [c.x1 - 28, c.y0 - 3],
      [c.x1 - 28, c.y0 - 14],
      [app.x0 + 28, app.y0 - 14],
      [app.x0 + 28, app.y0 - 3],
    ],
    'app>kafka': [
      [app.x1 + 3, app.y],
      [R + 14, app.y],
      [R + 14, kafka.y],
      [kafka.x1 + 7, kafka.y],
    ],
    'lake>spark': [
      [lake.x0 + 8, lake.y1 + 1],
      [lake.x0 + 8, yl],
      [spark.x0 + 40, yl],
      [spark.x0 + 40, spark.y0 - 7],
    ],
    'spark>warehouse': [
      [spark.x0 - 3, spark.y],
      [L - 14, spark.y],
      [L - 14, wh.y - 8],
      [wh.x0 - 7, wh.y - 8],
    ],
    'etl>warehouse': [
      [etl.x0 - 3, etl.y],
      [L - 28, etl.y],
      [L - 28, wh.y + 8],
      [wh.x0 - 7, wh.y + 8],
    ],
    'kafka>fraud': [
      [kafka.x, kafka.y1 + 5],
      [kafka.x, yf],
      [fraud.x, yf],
      [fraud.x, fraud.y0 - 7],
    ],
    'kafka>stock': [
      [kafka.x, kafka.y1 + 5],
      [kafka.x, yf],
      [stock.x, yf],
      [stock.x, stock.y0 - 7],
    ],
    'orch>alert': [
      [orch.x1 + 3, orch.y],
      [R + 14, orch.y],
      [R + 14, alert.y],
      [alert.x1 + 7, alert.y],
    ],
    'kafka>lake': straight(kafka, lake),
    'warehouse>model': straight(wh, model),
    'model>bi': straight(model, bi),
  }
  const mid = (p: P[]): P => [(p[0][0] + p[1][0]) / 2, (p[0][1] + p[1][1]) / 2]
  const badge: Record<string, P> = {
    'kafka>lake': mid(route['kafka>lake']),
    'etl>warehouse': [L - 28, (etl.y1 + spark.y0) / 2],
    'spark>warehouse': [L - 14, (spark.y + wh.y - 8) / 2],
    'model>bi': mid(route['model>bi']),
  }
  const sla = { x: model.x1 + 14, y: alert.y1 + 18, w: 148, h: 96 }
  const minX = L - 28 - 14
  const maxX = Math.max(sla.x + sla.w, R + 20) + 10
  const minY = c.y0 - 24
  const maxY = bi.y1 + 14
  const box = (y0: number, y1: number) => `${minX} ${y0} ${maxX - minX} ${y1 - y0}`
  const cams = { full: box(minY, maxY), badges: box(lake.y0 - 12, maxY), top: box(minY, orch.y1 + 18), bottom: box(spark.y0 - 18, maxY) }
  return { N, route, badge, sla, cams }
}

/** 꺾은선 위의 점 b를 꼭짓점으로 끼워 넣고, 처음부터 b까지의 길이 비율을 돌려준다 */
function splitAt(pts: P[], b: P): { pts: P[]; f: number } {
  const len = (a: P, c: P) => Math.hypot(c[0] - a[0], c[1] - a[1])
  let acc = 0
  const total = pts.slice(1).reduce((s, p, i) => s + len(pts[i], p), 0) || 1
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const c = pts[i]
    if (Math.abs(len(a, b) + len(b, c) - len(a, c)) < 0.5) return { pts: [...pts.slice(0, i), b, ...pts.slice(i)], f: (acc + len(a, b)) / total }
    acc += len(a, c)
  }
  return { pts, f: 0.5 }
}

function MapOverlay({ at: pos }: { at: At }) {
  const lay = layout7(pos)
  if (!lay) return null
  const { N, route, badge, sla, cams } = lay
  const alert = N.alert
  const oldW = tw(N6.alert.label, 15) / 2 + 5
  return (
    <g>
      <rect data-el="cams" data-full={cams.full} data-badges={cams.badges} data-top={cams.top} data-bottom={cams.bottom} width={0} height={0} style={{ fill: 'none' }} />
      {/* 다시 그린 연결선 */}
      {ROUTED.map((id) => (
        <g key={id} data-el="rr" data-id={id} style={KIND_OF[id] === 'control' ? { opacity: 0.75 } : undefined}>
          <PolyArrow pts={route[id]} seed={`rr-${id}`} dash={KIND_OF[id] === 'control' ? '3 6' : KIND_OF[id] === 'note' ? '2 5' : undefined} head={KIND_OF[id] === 'note' ? 0 : 9} />
        </g>
      ))}
      {/* 옮겨 단 배지 자리 */}
      {CHECKS.map((id) => (
        <g key={id} data-el="badge-at" data-id={id} data-x={badge[id][0]} data-y={badge[id][1]} />
      ))}
      {/* step 2: 배지·알림에 같은 강조 테두리 */}
      {CHECKS.map((id) => (
        <circle key={id} data-el="bring" cx={badge[id][0]} cy={badge[id][1] + 1} r={17} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.6} />
      ))}
      {/* step 1: 배지를 지나며 ✓를 받는 입자 */}
      {CHECKS.map((id) => {
        const { pts, f } = splitAt(route[id], badge[id])
        const [x, y] = pts[0]
        return (
          <g key={id} data-el="bp" data-pts={rel(pts)} data-f={f.toFixed(3)}>
            <circle cx={x} cy={y} r={6.5} style={{ fill: 'var(--accent)' }} />
            <Txt x={x + 9} y={y - 5} size={13} weight={800} color="var(--ok)" el="bp-ok">
              ✓
            </Txt>
          </g>
        )
      })}
      {/* step 2: '실패 알림' 취소선 → '모니터링·알림' 다시 쓰기 */}
      <line data-el="strike" x1={alert.x - oldW} y1={alert.y - 8} x2={alert.x + oldW} y2={alert.y - 8} style={{ stroke: 'var(--fail)' }} strokeWidth={2.4} strokeLinecap="round" />
      <rect data-el="cover" x={alert.x0 + 3} y={alert.y0 + 3} width={alert.w - 6} height={alert.h - 6} style={{ fill: 'var(--surface)' }} />
      <g data-el="sla">
        <line x1={sla.x + 30} y1={alert.y1 + 3} x2={sla.x + 30} y2={sla.y} style={{ stroke: 'var(--accent)' }} strokeWidth={2} />
        <RRect x={sla.x} y={sla.y} w={sla.w} h={sla.h} seed="sla" rough={0.3} fill="var(--surface)" />
        <Txt x={sla.x + 12} y={sla.y + 22} size={14.5} weight={800} mono>
          {F.sla[0]}
        </Txt>
        <Txt x={sla.x + 12} y={sla.y + 43} size={13} weight={650}>
          {F.sla[1]}
        </Txt>
        <Txt x={sla.x + 12} y={sla.y + 61} size={13} weight={650}>
          {F.sla[2]}
        </Txt>
        <Txt x={sla.x + 12} y={sla.y + 83} size={13} weight={800}>
          {F.sla[3]}
        </Txt>
      </g>
      <Badge x={sla.x + 22 + tw(F.sla[3], 13)} y={sla.y + 78} status="ok" r={9} el="sla-ok" />
      {/* step 4: BI 대시보드에서 앱까지 거꾸로 따라가는 길 */}
      {TRACE.map((id) => (
        <path
          key={id}
          data-el="trace"
          d={
            'M ' +
            [...route[id]]
              .reverse()
              .map((p) => p.map((v) => v.toFixed(1)).join(' '))
              .join(' L ')
          }
          style={{ fill: 'none', stroke: 'var(--accent)' }}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* 길 위의 배지는 강조선 위로 다시 올려 진하게 */}
      {PATH_CHECKS.map((id) => (
        <Shield key={id} x={badge[id][0]} y={badge[id][1]} s={1.35} el={`tbadge-${id}`} />
      ))}
    </g>
  )
}

/** 장면 6 step 3: 같은 종류의 변경이 이번엔 배포 전에 잡힌다(두 줄 = 두 열) */
function CiFig() {
  const C = [112, 328]
  const W = 196
  return (
    <Fig>
      {/* 첫 줄: 태오의 변경 */}
      <g>
        <RRect x={C[0] - W / 2} y={22} w={W} h={78} seed="s3-c1" rough={0.35} fill="var(--surface)" />
        <Initial x={C[0] - W / 2 + 22} y={46} r={13} who="taeo" seed="s3-taeo" />
        <Txt x={C[0] - W / 2 + 42} y={51} size={14} weight={750}>
          {F.rename2[0]}
        </Txt>
        <Txt x={C[0] - W / 2 + 14} y={76} size={12.5} weight={700} mono>
          {F.rename2[1]}
        </Txt>
        <Txt x={C[0] - W / 2 + 14} y={93} size={12.5} weight={700} mono>
          {F.rename2[2]}
        </Txt>
      </g>
      <g data-el="s3-card2">
        <RRect x={C[1] - W / 2} y={22} w={W} h={78} seed="s3-c2" rough={0.35} fill="var(--surface)" />
        <Txt x={C[1] - W / 2 + 14} y={52} size={15} weight={800}>
          {F.agree[0]}
        </Txt>
        <Txt x={C[1] - W / 2 + 14} y={80} size={13.5} weight={700}>
          {F.agree[1].split('✓').map((part, i, arr) => (
            <tspan key={i}>
              {part}
              {i < arr.length - 1 && <tspan style={{ fill: 'var(--ok)', fontWeight: 800 }}>✓</tspan>}
            </tspan>
          ))}
        </Txt>
      </g>
      {C.map((cx, k) => (
        <g key={cx} data-el={k ? 's3-row2' : undefined}>
          <RArrow x1={cx} y1={104} x2={cx} y2={142} seed={`s3-a${k}`} rough={0.3} strokeWidth={2} />
          <rect x={cx - W / 2} y={146} width={W} height={118} rx={4} style={{ fill: 'var(--surface)' }} />
          <RRect x={cx - W / 2} y={146} w={W} h={118} seed={`s3-ci${k}`} rough={0.35} />
          <Txt x={cx} y={170} size={14.5} weight={750} anchor="middle">
            {F.ciShort}
          </Txt>
          <DocIcon x={cx - W / 2 + 18} y={182} seed={`s3-doc${k}`} />
        </g>
      ))}
      <Txt x={C[0] - W / 2 + 48} y={201} size={13.5} weight={700}>
        {F.contractV1}
      </Txt>
      <Txt x={C[1] - W / 2 + 48} y={201} size={13.5} weight={700} el="s3-v1">
        {F.contractV1}
      </Txt>
      <Txt x={C[1] - W / 2 + 48} y={201} size={13.5} weight={700} el="s3-v2">
        {F.contractV2}
      </Txt>
      <g data-el="s3-viol">
        <Txt x={C[0] - W / 2 + 14} y={232} size={13.5} weight={800}>
          {F.violation[0]}
        </Txt>
        <Txt x={C[0] - W / 2 + 14} y={252} size={12.5} weight={700} mono>
          {F.violation[1]}
        </Txt>
      </g>
      <Badge x={C[0] + W / 2 - 2} y={148} status="fail" r={11} el="s3-ci1-x" />
      <Badge x={C[1] + W / 2 - 2} y={148} status="ok" r={11} el="s3-ci2-ok" />
      {/* 배포로 가는 길 */}
      <g data-el="s3-down1">
        <RArrow x1={C[0]} y1={268} x2={C[0]} y2={316} seed="s3-d1" rough={0.3} strokeWidth={2} />
      </g>
      <g data-el="s3-cut">
        <line x1={C[0] - 12} y1={286} x2={C[0] + 12} y2={280} style={{ stroke: 'var(--fail)' }} strokeWidth={2.6} strokeLinecap="round" />
        <line x1={C[0] - 12} y1={296} x2={C[0] + 12} y2={290} style={{ stroke: 'var(--fail)' }} strokeWidth={2.6} strokeLinecap="round" />
      </g>
      <g data-el="s3-row2">
        <RArrow x1={C[1]} y1={268} x2={C[1]} y2={316} seed="s3-d2" rough={0.3} strokeWidth={2} />
      </g>
      <g data-el="s3-dep1">
        <Node x={C[0]} y={344} w={W} h={50} label={F.flowDeploy} kind="serve" seed="s3-dep1" el="s3d1" statuses={['wait']} />
      </g>
      <Txt x={C[0]} y={390} size={13.5} weight={700} anchor="middle" el="s3-stop">
        {F.deployStop}
      </Txt>
      <g data-el="s3-row2">
        <Node x={C[1]} y={344} w={W} h={50} label={F.flowDeploy} kind="serve" seed="s3-dep2" el="s3d2" statuses={['ok']} />
      </g>
      <g data-el="s3-dash">
        <RRect x={132} y={414} w={176} h={50} seed="s3-dash" rough={0.35} fill="var(--surface)" />
        {[0.5, 0.8, 0.65].map((v, i) => (
          <rect key={i} x={148 + i * 9} y={452 - v * 24} width={6} height={v * 24} style={{ fill: 'var(--accent)' }} />
        ))}
        <Txt x={184} y={445} size={15} weight={800}>
          {F.dashOk}
        </Txt>
        <Badge x={286} y={440} status="ok" r={10} />
      </g>
      <circle data-el="s3-p1" data-pts={rel([[C[0], 106], [C[0], 160], [C[0] - W / 2 + 29, 197]])} cx={C[0]} cy={106} r={7} style={{ fill: 'var(--accent)' }} />
      <circle data-el="s3-p2" data-pts={rel([[C[1], 106], [C[1], 160], [C[1] - W / 2 + 29, 197]])} cx={C[1]} cy={106} r={7} style={{ fill: 'var(--accent)' }} />
      <circle data-el="s3-p3" data-pts={rel([[C[1] - W / 2 + 29, 197], [C[1], 262], [C[1], 322]])} cx={C[1] - W / 2 + 29} cy={197} r={7} style={{ fill: 'var(--accent)' }} />
    </Fig>
  )
}

/** 모바일 step 4: 경로 위 노드만 세로 목록으로(위: 앱, 아래: BI 대시보드) */
const LIST = [...TRACE_NODES].reverse()
const LIST_Y = (k: number) => 34 + k * 64
const LX7 = 190
const LIST_CHECK = new Set(CHECKS)
function ListFig() {
  return (
    <Fig>
      {LIST.slice(0, -1).map((id, k) => {
        const eid = `${id}>${LIST[k + 1]}`
        return (
          <g key={eid}>
            <g data-el="ls-a" data-i={LIST.length - 2 - k}>
              <RArrow x1={LX7} y1={LIST_Y(k) + 21} x2={LX7} y2={LIST_Y(k + 1) - 23} seed={`ls-${eid}`} rough={0.3} strokeWidth={2} />
            </g>
            <line data-el="ls-tr" data-i={LIST.length - 2 - k} x1={LX7} y1={LIST_Y(k + 1) - 21} x2={LX7} y2={LIST_Y(k) + 21} style={{ stroke: 'var(--accent)' }} strokeWidth={4.5} strokeLinecap="round" />
            {LIST_CHECK.has(eid) && <Shield x={LX7} y={(LIST_Y(k) + LIST_Y(k + 1)) / 2} s={1} el="ls-check" />}
          </g>
        )
      })}
      {LIST.map((id, k) => (
        <g key={id}>
          <rect data-el="ls-ring" data-i={LIST.length - 1 - k} x={LX7 - 116} y={LIST_Y(k) - 21} width={232} height={42} rx={7} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.6} />
          <Node x={LX7} y={LIST_Y(k)} w={224} h={34} label={N7[id].label} kind={N7[id].kind} seed={`ls-n-${id}`} />
        </g>
      ))}
      <Txt x={LX7 + 126} y={LIST_Y(6) + 5} size={14} weight={800} mono el="ls-count">
        {F.nodesFrom}16
      </Txt>
      <Txt x={220} y={470} size={12.5} weight={600} anchor="middle" muted el="ls-cap">
        {F.lineageNote}
      </Txt>
    </Fig>
  )
}

export function SolutionFig() {
  const { mobile, reduced } = useEnv()
  return (
    <div data-el="sol-root" data-still={reduced ? '1' : undefined} className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        <div data-el="map-layer" className="absolute inset-0 overflow-hidden">
          <PipelineMap t={T.ch7} from={T.ch6} vertical overlay={(a) => <MapOverlay at={a} />} />
        </div>
        <div data-el="ci-layer" className="absolute inset-0" style={{ opacity: 0 }}>
          <CiFig />
        </div>
        {mobile && (
          <div data-el="list-layer" className="absolute inset-0" style={{ opacity: 0 }}>
            <ListFig />
          </div>
        )}
      </div>
      {!mobile && (
        <div data-el="sol-cap" className="shrink-0 pt-2 text-center" style={{ opacity: 0 }}>
          <p className="font-mono text-sm font-bold">
            {F.nodesFrom}
            <span data-el="cnt">16</span>
          </p>
          <p className="text-sm leading-snug text-muted">{F.lineageNote}</p>
        </div>
      )}
    </div>
  )
}

const parseBox = (s: string | undefined) => {
  const [x, y, w, h] = (s ?? '0 0 100 100').split(' ').map(Number)
  return { x, y, w, h }
}
/** 영역 r을 화면 비율(aspect) 안에 맞춘 viewBox. 남는 높이는 가운데 나눠 두거나(topAlign이면) 아래로만 보낸다 */
const fitBox = (s: string | undefined, aspect: number, topAlign = false) => {
  const r = parseBox(s)
  const h = Math.max(r.h, r.w / aspect)
  const w = h * aspect
  const y = topAlign ? r.y : r.y + r.h / 2 - h / 2
  return `${(r.x + r.w / 2 - w / 2).toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const svg = o('map')[0] as SVGSVGElement | undefined
  const cams = o('cams')[0] as SVGElement | undefined
  if (!svg || !cams) return
  const rect = svg.getBoundingClientRect()
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.8
  const d = cams.dataset
  // 'bottom'은 이벤트 브로커 바로 아래에서 시작한다. 위로 늘리면 그 노드가 반쯤 잘린 채 맨 위에 걸린다
  const cam = (k: 'full' | 'badges' | 'top' | 'bottom') => fitBox(d[k], aspect, k === 'bottom')
  const edge = (id: string) => q(`[data-edge="${id}"]`)
  const node = (id: string) => q(`[data-node="${id}"]`)
  const ring = (id: string) => q(`[data-node="${id}"] > .node-focus`)
  const rr = (id: string) => q(`[data-el="rr"][data-id="${id}"]`)
  const check = (id: string) => q(`[data-edge="${id}"] [data-check]`)

  // 남아 있는 노드는 처음부터 지금 자리에(앱이 옆으로 미끄러지면 연결선과 어긋난다)
  q('[data-node][data-dx], [data-node][data-dy]').forEach((el) => {
    delete (el as SVGElement).dataset.dx
    delete (el as SVGElement).dataset.dy
  })
  // 알림 라벨 교체는 이 장면이 직접(취소선 → 다시 쓰기). mapTransition이 건드리지 않게 이름을 바꿔 둔다
  const relabel = (from: string, to: string) => q(`[data-node="alert"] [data-el="${from}"], [data-node="alert"] [data-el="${to}"]`).forEach((e) => e.setAttribute('data-el', to))
  relabel('lbl-old', 'al-old')
  relabel('lbl-new', 'al-new')

  // 다른 노드 뒤로 지나가는 맵의 선은 숨기고(배지는 남긴다) 다시 그린 선을 쓴다
  init(
    tl,
    ROUTED.flatMap((id) => q(`[data-edge="${id}"] > :not([data-check])`)),
    { opacity: 0 },
  )
  init(tl, HIDDEN.flatMap(edge), { opacity: 0 })
  // 다시 그린 길 위로 배지를 옮긴다
  o('badge-at').forEach((b) => {
    const el = b as SVGElement
    const id = el.dataset.id ?? ''
    if (!ROUTED.includes(id)) return
    init(tl, check(id), { x: Number(el.dataset.x), y: Number(el.dataset.y) })
  })

  svg.dataset.vbFrom = mobile ? cam('badges') : cam('full')
  svg.dataset.vbTo = mobile ? cam('top') : cam('full')
  const s2 = at(1)
  mapTransition(q, tl, s2, { dur: 0.36 })

  // step 1: 화살표 네 곳에 검문소 — 입자가 배지에서 ✓를 받고 지나간다
  const s1 = at(0)
  const checks = CHECKS.flatMap(check)
  init(tl, checks, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' })
  init(tl, o('bp-ok'), { opacity: 0 })
  const bps = o('bp')
  const okMarks = o('bp-ok')
  CHECKS.forEach((_, k) => {
    const t0 = s1 + 0.1 + k * 0.18
    const dur = 0.16
    const f = Number((bps[k] as SVGElement).dataset.f ?? 0.5)
    flowAlong(tl, bps[k], t0, dur)
    tl.to(checks[k], { opacity: 1, scale: 1, duration: 0.04 }, t0 + dur * f - 0.02)
    tl.to(okMarks[k], { opacity: 1, duration: 0.02 }, t0 + dur * f)
  })

  // step 2: 계약 노드 + 약속 표시 선 → (모바일은 아래로) 알림 라벨 다시 쓰기 → 배지·알림 테두리 → SLA 카드
  const note = rr('contract>app')
  drawArrows(tl, note, s2 + 0.26, 0.1)
  // 모바일은 위(계약) → 아래(알림·SLA)로 카메라를 옮기는 만큼 뒤쪽 순서를 촘촘하게
  const b = mobile ? s2 + 0.46 : s2 + 0.3
  const k = mobile ? 0.55 : 1
  // 정지 그림(모션 줄이기)은 이 step의 끝 한 장뿐이라, 모바일도 계약(위)과 알림·SLA(아래)가 함께 보이게 전체로 맞춘다
  const still = (o('sol-root')[0] as HTMLElement | undefined)?.dataset.still === '1'
  if (mobile) tl.to(svg, { attr: { viewBox: cam(still ? 'full' : 'bottom') }, duration: 0.12, ease: 'power2.inOut' }, s2 + 0.44)
  const oldL = o('al-old')
  const newL = o('al-new')
  const strike = o('strike')
  const cover = o('cover')
  init(tl, [...newL, ...cover, ...o('bring', 'sla', 'sla-ok')], { opacity: 0 })
  init(tl, strike, { drawSVG: '0%' })
  init(tl, cover, { scaleX: 1, transformOrigin: '100% 50%' })
  tl.to(strike, { drawSVG: '100%', duration: 0.06 * k, ease: 'none' }, b + 0.02 * k)
  tl.to([...oldL, ...strike], { opacity: 0, duration: 0.04 * k }, b + 0.12 * k)
  tl.set([...newL, ...cover], { opacity: 1 }, b + 0.16 * k)
  tl.to(cover, { scaleX: 0, duration: 0.12 * k, ease: 'steps(9)' }, b + 0.16 * k)
  const brings = o('bring')
  tl.to(brings, { opacity: 1, duration: 0.03, stagger: 0.04 * k }, b + 0.28 * k)
  tl.to(ring('alert'), { opacity: 1, duration: 0.04 }, b + 0.42 * k)
  tl.to(o('sla'), { opacity: 1, duration: 0.05 }, b + 0.44 * k)
  tl.to(o('sla-ok'), { opacity: 1, duration: 0.03 }, b + 0.48 * k)

  // step 3: CI가 배포 전에 계약 위반을 잡는다 → 계약 v2로 고친 뒤 배포
  const s3 = at(2)
  init(tl, o('s3-card2', 's3-row2', 's3-v1', 's3-v2', 's3-viol', 's3-ci1-x', 's3-ci2-ok', 's3-cut', 's3-stop', 's3-dash', 's3d1:wait', 's3d2:ok'), { opacity: 0 })
  swapLayer(tl, o('map-layer'), o('ci-layer'), s3)
  // 지도는 가려진 동안 step 2의 주석을 걷는다
  tl.to([...brings, ...ring('alert'), ...o('sla', 'sla-ok')], { opacity: 0, duration: 0.01 }, s3 + 0.1)
  const e1 = flowAlong(tl, o('s3-p1')[0], s3 + 0.1, 0.12, { fadeOut: false })
  tl.to(o('s3-ci1-x'), { opacity: 1, duration: 0.03 }, e1)
  tl.to(o('s3-viol'), { opacity: 1, duration: 0.04 }, e1 + 0.03)
  tl.to(o('s3-down1'), { opacity: 0.3, duration: 0.04 }, e1 + 0.07)
  tl.to(o('s3-cut', 's3d1:wait', 's3-stop'), { opacity: 1, duration: 0.04 }, e1 + 0.08)
  tl.to(o('s3-dep1'), { opacity: 0.78, duration: 0.04 }, e1 + 0.08)
  tl.to(o('s3-card2', 's3-row2', 's3-v1'), { opacity: 1, duration: 0.06 }, e1 + 0.14)
  tl.to(o('s3-v1'), { opacity: 0, duration: 0.03 }, e1 + 0.22)
  tl.to(o('s3-v2'), { opacity: 1, duration: 0.03 }, e1 + 0.22)
  const e2 = flowAlong(tl, o('s3-p2')[0], e1 + 0.25, 0.1, { fadeOut: false })
  tl.to(o('s3-ci2-ok'), { opacity: 1, duration: 0.03 }, e2 + 0.03)
  tl.to(o('s3-p2'), { opacity: 0, duration: 0.01 }, e2 + 0.06)
  const e3 = flowAlong(tl, o('s3-p3')[0], e2 + 0.06, 0.08, { fadeIn: false })
  init(tl, o('s3-p3'), { opacity: 0 })
  tl.set(o('s3-p3'), { opacity: 1 }, e2 + 0.06)
  tl.to(o('s3d2:ok'), { opacity: 1, duration: 0.03 }, e3)
  tl.to(o('s3-dash'), { opacity: 1, duration: 0.05 }, e3 + 0.03)

  // step 4: 맵 = 리니지. BI 대시보드에서 앱까지 화살표를 거꾸로 따라간다
  const s4 = at(3)
  const traces = o('trace')
  init(tl, traces, { drawSVG: '0%' })
  init(tl, PATH_CHECKS.flatMap((id) => o(`tbadge-${id}`)), { opacity: 0 })
  if (mobile) {
    init(tl, o('ls-tr', 'ls-ring', 'ls-count', 'ls-cap'), { opacity: 0 })
    swapLayer(tl, o('ci-layer'), o('list-layer'), s4)
    const ringsL = o('ls-ring').sort((a, c) => Number((a as SVGElement).dataset.i) - Number((c as SVGElement).dataset.i))
    const trL = o('ls-tr').sort((a, c) => Number((a as SVGElement).dataset.i) - Number((c as SVGElement).dataset.i))
    init(tl, trL, { drawSVG: '0%' })
    ringsL.forEach((r, k) => {
      tl.to(r, { opacity: 1, duration: 0.03 }, s4 + 0.16 + k * 0.08)
      if (trL[k]) {
        tl.set(trL[k], { opacity: 1 }, s4 + 0.18 + k * 0.08)
        tl.to(trL[k], { drawSVG: '100%', duration: 0.06, ease: 'none' }, s4 + 0.18 + k * 0.08)
      }
    })
    tl.to(o('ls-count', 'ls-cap'), { opacity: 1, duration: 0.06 }, s4 + 0.72)
    return
  }
  init(tl, o('sol-cap'), { opacity: 0 })
  swapLayer(tl, o('ci-layer'), o('map-layer'), s4)
  const onPath = new Set([...TRACE_NODES, 'contract'])
  const dimNodes = MAP_IDS.filter((id) => !onPath.has(id)).flatMap(node)
  const pathEdges = new Set(TRACE)
  // 숨겨 둔 제어선(HIDDEN)은 흐리게라도 다시 나오면 안 된다
  const dimEdges = q('[data-edge]').filter((e) => {
    const id = (e as SVGElement).dataset.edge ?? ''
    return !pathEdges.has(id) && !HIDDEN.includes(id)
  })
  const dimRR = ROUTED.filter((id) => !pathEdges.has(id)).flatMap(rr)
  tl.to([...dimNodes, ...dimEdges, ...dimRR], { opacity: 0.4, duration: 0.06 }, s4 + 0.1)
  TRACE.forEach((id, k) => {
    const t = s4 + 0.18 + k * 0.08
    tl.to(ring(TRACE_NODES[k]), { opacity: 1, duration: 0.03 }, t - 0.02)
    tl.to(traces[k], { drawSVG: '100%', duration: 0.07, ease: 'none' }, t)
    if (PATH_CHECKS.includes(id)) {
      tl.to(o(`tbadge-${id}`), { opacity: 1, duration: 0.03 }, t + 0.04)
      tl.to(check(id), { opacity: 0, duration: 0.01 }, t + 0.06)
    }
  })
  tl.to(ring('app'), { opacity: 1, duration: 0.03 }, s4 + 0.18 + TRACE.length * 0.08 - 0.02)
  tl.to(o('sol-cap'), { opacity: 1, duration: 0.06 }, s4 + 0.7)
  countTo(tl, o('cnt')[0], 15, 16, String, s4 + 0.72, 0.06)
}

