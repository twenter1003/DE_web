import { ch5 } from '../../content/chapters/ch5'
import { T } from '../../content/map'
import { Badge, Node } from '../../components/diagram'
import { countTo, Fig, scatter, Txt } from '../../components/fig'
import { PipelineMap, mapTransition } from '../../components/PipelineMap'
import { RArrow, RLine, RPath, RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { mapStateAt } from '../../state/derive'
import { useEnv } from '../../state/env'
import {
  DiskIcon,
  drawGauge,
  FileIcon,
  Folder,
  gaugeTo,
  init,
  MemIcon,
  num,
  PhotoIcon,
  pick,
  Pile,
  Person,
  PolyArrow,
  ReviewIcon,
  Shape,
  StatusTag,
  TableIcon,
  tw,
  VGauge,
} from './parts'

const F = ch5.figures
type P = [number, number]

// 맵 노드 라벨은 map.ts에서 가져온다(Ch4 끝 상태)
const M4 = Object.fromEntries(mapStateAt(T.ch4).nodes.map((n) => [n.id, n]))

const paths = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
const shafts = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="shaft"] path')))
const heads = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('[data-el="head"]')))

/** 입자 하나가 점들을 차례로 지나간다(data-pts: 시작점 기준 상대 좌표 "x,y x,y …") */
function flowAlong(tl: gsap.core.Timeline, dots: Element[], start: number, seg: number, gap: number) {
  dots.forEach((d, k) => {
    const pts = ((d as SVGElement).dataset.pts ?? '').split(' ').filter(Boolean).map((s) => s.split(',').map(Number))
    const t0 = start + k * gap
    init(tl, d, { opacity: 0, x: 0, y: 0 })
    tl.to(d, { opacity: 1, duration: 0.02 }, t0)
    pts.forEach(([x, y], j) => tl.to(d, { x, y, duration: seg, ease: 'none' }, t0 + j * seg))
    tl.to(d, { opacity: 0, duration: 0.02 }, t0 + pts.length * seg)
  })
}
const rel = (pts: P[]) =>
  pts
    .slice(1)
    .map(([x, y]) => `${x - pts[0][0]},${y - pts[0][1]}`)
    .join(' ')

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 노트북이 버티지 못해요
// ─────────────────────────────────────────────────────────────
const PF = { x: 20, y: 28, w: 400, h: 118 }
const LAP = { x: 24, y: 214, w: 250, h: 150 }
const SLOT = { x: 99, y: 258, w: 100, h: 60 }
const PG = { x: 362, y: 214, h: 170 }
const TERM = { x: 24, y: 400, w: 250, h: 38 }
/** 입자 중 step 1에 흐르는 비율(나머지는 step 2에서 흐르다 끊긴다) */
const P_SPLIT = 0.7

function Tag3({ x, y, w, title, sub, seed }: { x: number; y: number; w: number; title: string; sub: string; seed: string }) {
  return (
    <g data-el="vt">
      <RRect x={x} y={y} w={w} h={58} seed={seed} rough={0.45} fill="var(--surface)" />
      <Txt x={x + 14} y={y + 24} size={15} weight={800}>
        {title}
      </Txt>
      <Txt x={x + 14} y={y + 46} size={13}>
        {sub}
      </Txt>
    </g>
  )
}

export function ProblemFig() {
  const { mobile } = useEnv()
  const n = mobile ? 14 : 24
  const from = scatter(n, 'p-from', PF.x + 12, PF.y + PF.h - 16, 180, 12)
  const to = scatter(n, 'p-to', SLOT.x + 12, SLOT.y + 10, SLOT.w - 24, SLOT.h - 20)
  const half = PF.x + PF.w / 2
  return (
    <Fig>
      {/* 하루치 로그 파일(거대한 블록) */}
      <g data-el="file">
        <RRect x={PF.x} y={PF.y} w={PF.w} h={PF.h} seed="p-file" rough={0.5} fill="var(--surface)" />
        <rect data-el="read-shade" x={PF.x + 1} y={PF.y + 1} width={PF.w - 2} height={PF.h - 2} style={{ fill: 'var(--accent)', opacity: 0.16 }} />
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1={PF.x + 14} y1={92 + k * 11} x2={PF.x + PF.w - 14} y2={92 + k * 11} style={{ stroke: 'var(--muted)', opacity: 0.45 }} strokeWidth={1.2} />
        ))}
        <Txt x={PF.x + 14} y={56} size={15.5} weight={750} mono>
          {F.file}
        </Txt>
        <Txt x={PF.x + 14} y={78} size={13} muted>
          {F.fileSub}
        </Txt>
        <rect x={PF.x + PF.w - 86} y={40} width={74} height={22} rx={11} style={{ fill: 'var(--bg)', stroke: 'var(--muted)' }} strokeWidth={1.2} />
        <Txt x={PF.x + PF.w - 49} y={55.5} size={12} weight={650} anchor="middle">
          {F.virtual}
        </Txt>
      </g>
      <g data-el="read-l">
        <path d={`M ${PF.x + 2} ${PF.y + PF.h + 6} L ${PF.x + 2} ${PF.y + PF.h + 12} L ${half - 2} ${PF.y + PF.h + 12} L ${half - 2} ${PF.y + PF.h + 6}`} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} />
        <Txt x={(PF.x + half) / 2} y={PF.y + PF.h + 30} size={13} weight={750} anchor="middle">
          {F.read}
        </Txt>
      </g>

      {/* 노트북과 메모리 칸 */}
      <g data-el="lap">
        <RRect x={LAP.x} y={LAP.y} w={LAP.w} h={LAP.h} seed="p-lap" rough={0.5} fill="var(--surface)" />
        <RPath d={`M ${LAP.x - 12} ${LAP.y + LAP.h} L ${LAP.x + LAP.w + 12} ${LAP.y + LAP.h} L ${LAP.x + LAP.w + 24} ${LAP.y + LAP.h + 16} L ${LAP.x - 24} ${LAP.y + LAP.h + 16} Z`} seed="p-lapb" rough={0.4} fill="var(--surface)" />
        <Txt x={LAP.x + LAP.w / 2} y={LAP.y + 28} size={15} weight={750} anchor="middle">
          {F.laptop}
        </Txt>
        <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} style={{ fill: 'var(--bg)' }} />
        <rect data-el="p-mem" x={SLOT.x + 2} y={SLOT.y + 2} width={SLOT.w - 4} height={SLOT.h - 4} style={{ fill: 'var(--accent)', opacity: 0.8 }} />
        <RRect x={SLOT.x} y={SLOT.y} w={SLOT.w} h={SLOT.h} seed="p-slot" rough={0.35} />
        <Txt x={LAP.x + LAP.w / 2} y={SLOT.y + SLOT.h + 22} size={13.5} weight={650} anchor="middle">
          {F.memory}
        </Txt>
      </g>
      <Badge x={LAP.x + LAP.w - 2} y={LAP.y + 2} status="fail" el="lap-x" />

      {/* 메모리 사용량 게이지 */}
      <VGauge x={PG.x} y={PG.y} h={PG.h} label={F.gauge} el="pg" seed="p-g" />
      <Txt x={PG.x + 14} y={PG.y + PG.h + 24} size={16} weight={800} anchor="middle" el="pg-pct">
        {F.pct(0)}
      </Txt>
      <StatusTag x={PG.x - 30} y={PG.y + PG.h + 50} status="fail" text={F.oom} color="var(--fail)" el="oom" />

      {/* 터미널 한 줄 */}
      <g data-el="term">
        <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={6} style={{ fill: 'var(--ink)' }} />
        <Txt x={TERM.x + 12} y={TERM.y + 24} size={13} weight={650} mono color="var(--bg)">
          {F.terminal}
        </Txt>
        <rect data-el="term-cover" x={TERM.x + 8} y={TERM.y + 4} width={TERM.w - 16} height={TERM.h - 8} style={{ fill: 'var(--ink)' }} />
      </g>

      {from.map(([x, y], i) => (
        <circle key={i} data-el="pp" data-dx={to[i][0] - x} data-dy={to[i][1] - y} cx={x} cy={y} r={4.5} style={{ fill: 'var(--accent)' }} />
      ))}

      {/* step 3: 3V 태그 */}
      {[113, 327, 220].map((x, k) => (
        <g key={x} data-el="vl">
          <RLine x1={x} y1={PF.y + PF.h + 2} x2={x} y2={k === 2 ? 298 : 194} seed={`vl${k}`} rough={0.4} />
        </g>
      ))}
      <Tag3 x={20} y={196} w={186} title={F.tags[0][0]} sub={F.tags[0][1]} seed="vt0" />
      <Tag3 x={234} y={196} w={186} title={F.tags[1][0]} sub={F.tags[1][1]} seed="vt1" />
      <Tag3 x={80} y={300} w={280} title={F.tags[2][0]} sub={F.tags[2][1]} seed="vt2" />
      <g data-el="v-icons">
        <ReviewIcon x={146} y={384} seed="v-rev" />
        <PhotoIcon x={238} y={380} seed="v-photo" />
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl) => {
  const o = pick(q)
  const pp = o('pp')
  const n = pp.length
  const split = Math.round(n * P_SPLIT)
  const pct = o('pg-pct')[0]
  const g = { v: 0 }
  drawGauge(q, 'pg', 0, pct, F.pct)
  init(tl, [...pp, ...o('lap-x'), ...o('oom'), ...o('term'), ...o('read-l'), ...o('vt'), ...o('v-icons')], { opacity: 0 })
  init(tl, o('read-shade'), { scaleX: 0, transformOrigin: '0% 50%' })
  init(tl, o('p-mem'), { scaleY: 0, transformOrigin: '50% 100%' })
  init(tl, o('term-cover'), { scaleX: 1, transformOrigin: '100% 50%' })
  init(tl, paths(o('vl')), { drawSVG: '0%' })

  const drip = (p: Element, t: number) => {
    tl.to(p, { opacity: 1, duration: 0.03 }, t)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.16, ease: 'power1.in' }, t)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.15)
  }

  // step 1: 파일에서 입자가 메모리 칸으로 흘러든다. 칸이 차는 만큼 게이지 0 → 60%
  const s1 = at(0)
  pp.slice(0, split).forEach((p, i) => drip(p, s1 + 0.04 + (i / split) * 0.48))
  tl.to(o('p-mem'), { scaleY: 0.6, duration: 0.62, ease: 'none' }, s1 + 0.08)
  gaugeTo(q, tl, 'pg', g, 60, s1 + 0.08, 0.62, pct, F.pct)
  tl.to(o('read-shade'), { scaleX: 0.3, duration: 0.62, ease: 'none' }, s1 + 0.08)

  // step 2: 절반쯤 읽자 게이지가 끝까지 차고, 입자 흐름이 끊긴다
  const s2 = at(1)
  pp.slice(split).forEach((p, i) => drip(p, s2 + (i / Math.max(1, n - split)) * 0.16))
  tl.to(o('p-mem'), { scaleY: 1, duration: 0.3, ease: 'none' }, s2)
  gaugeTo(q, tl, 'pg', g, 100, s2, 0.3, pct, F.pct)
  tl.to(o('read-shade'), { scaleX: 0.5, duration: 0.3, ease: 'none' }, s2)
  tl.to([...o('lap-x'), ...o('oom')], { opacity: 1, duration: 0.06 }, s2 + 0.32)
  tl.to(o('read-l'), { opacity: 1, duration: 0.08 }, s2 + 0.34)
  tl.to(o('term'), { opacity: 1, duration: 0.05 }, s2 + 0.38)
  tl.to(o('term-cover'), { scaleX: 0, duration: 0.36, ease: 'steps(26)' }, s2 + 0.42)

  // step 3: 3V — Volume → Velocity → Variety 순서로 태그가 붙는다
  const s3 = at(2)
  tl.to([...o('lap'), ...o('lap-x'), ...o('pg'), ...o('pg-pct'), ...o('oom'), ...o('term'), ...o('read-l'), ...o('read-shade')], { opacity: 0, duration: 0.14 }, s3)
  const vl = o('vl')
  const vt = o('vt')
  vl.forEach((l, k) => {
    const t = s3 + 0.16 + k * 0.18
    tl.to(l.querySelectorAll('path'), { drawSVG: '100%', duration: 0.1, ease: 'none' }, t)
    tl.to(vt[k], { opacity: 1, duration: 0.08 }, t + 0.09)
  })
  tl.to(o('v-icons'), { opacity: 1, duration: 0.1 }, s3 + 0.66)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 더 큰 서버 한 대
// ─────────────────────────────────────────────────────────────
const SRV = { x: 20, y: 192, w: 200, h: 160 }
const SRV_O = '120 272'
const LAP2 = { x: 45, y: 212, w: 150, h: 100 }
const AG = { x: 398, y: 192, h: 160 }
const LOG = { x: 20, y: 46, w: 110, h: 50 }
const WEEK_X = [262, 330, 398]
const LOG_S = [1.15, 1.4, 1.7]
const WEEK_V = [62, 78, 95]
const JOB_X = [14, 150, 286]
const JOB_TO = [60, 120, 190]

export function AttemptFig() {
  const alert = M4.alert
  return (
    <Fig caption={F.feeNote}>
      {/* step 2: 몇 주가 지나며 로그가 커진다 */}
      <g data-el="weeks">
        {F.weeks.map((w, k) => (
          <Txt key={w} x={WEEK_X[k]} y={34} size={14} weight={750} anchor="middle">
            {w}
          </Txt>
        ))}
        {[0, 1].map((k) => (
          <RArrow key={k} x1={WEEK_X[k] + 18} y1={29} x2={WEEK_X[k + 1] - 18} y2={29} seed={`wk${k}`} rough={0.3} head={6} />
        ))}
        <rect data-el="wk-mark" x={WEEK_X[0] - 16} y={42} width={32} height={3} rx={1.5} style={{ fill: 'var(--ink)' }} />
      </g>
      <g data-el="log">
        <rect x={LOG.x} y={LOG.y} width={LOG.w} height={LOG.h} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={LOG.x + 8} y1={LOG.y + 31 + k * 7} x2={LOG.x + LOG.w - 8} y2={LOG.y + 31 + k * 7} style={{ stroke: 'var(--muted)', opacity: 0.5 }} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
        ))}
        <Txt x={LOG.x + LOG.w / 2} y={LOG.y + 20} size={13.5} weight={750} anchor="middle">
          {F.dayLog}
        </Txt>
      </g>
      <g data-el="log-arr">
        <RArrow x1={60} y1={140} x2={60} y2={186} seed="a-arr" rough={0.4} />
      </g>

      {/* 노트북 → 큰 서버 */}
      <g data-el="lap2">
        <RRect x={LAP2.x} y={LAP2.y} w={LAP2.w} h={LAP2.h} seed="a-lap" rough={0.5} fill="var(--surface)" />
        <RPath d={`M ${LAP2.x - 10} ${LAP2.y + LAP2.h} L ${LAP2.x + LAP2.w + 10} ${LAP2.y + LAP2.h} L ${LAP2.x + LAP2.w + 18} ${LAP2.y + LAP2.h + 12} L ${LAP2.x - 18} ${LAP2.y + LAP2.h + 12} Z`} seed="a-lapb" rough={0.4} fill="var(--surface)" />
        <Txt x={120} y={LAP2.y + 24} size={13.5} weight={750} anchor="middle">
          {F.laptop}
        </Txt>
        <rect x={90} y={248} width={60} height={40} style={{ fill: 'var(--accent)', opacity: 0.8 }} />
        <RRect x={90} y={248} w={60} h={40} seed="a-lslot" rough={0.3} />
        <Txt x={120} y={304} size={12.5} weight={650} anchor="middle">
          {F.memory}
        </Txt>
        <Badge x={LAP2.x + LAP2.w - 2} y={LAP2.y + 2} status="fail" />
      </g>
      <g data-el="srv">
        <RRect x={SRV.x} y={SRV.y} w={SRV.w} h={SRV.h} seed="a-srv" rough={0.5} fill="var(--surface)" />
        <RLine x1={SRV.x + 8} y1={SRV.y + 36} x2={SRV.x + SRV.w - 8} y2={SRV.y + 36} seed="a-srvl" rough={0.3} strokeWidth={1} />
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={SRV.x + 18 + k * 12} cy={SRV.y + 18} r={3} style={{ fill: 'var(--muted)' }} />
        ))}
        <Txt x={134} y={SRV.y + 24} size={15} weight={800} anchor="middle">
          {F.server}
        </Txt>
        <rect x={40} y={248} width={160} height={70} style={{ fill: 'var(--bg)' }} />
        <rect data-el="a-mem" x={42} y={250} width={156} height={66} style={{ fill: 'var(--accent)', opacity: 0.8 }} />
        <RRect x={40} y={248} w={160} h={70} seed="a-slot" rough={0.35} />
        <Txt x={120} y={340} size={13.5} weight={650} anchor="middle">
          {F.memory}
        </Txt>
      </g>
      <Badge x={SRV.x + SRV.w - 2} y={SRV.y + 2} status="ok" el="srv-ok" />
      <Badge x={SRV.x + SRV.w - 2} y={SRV.y + 2} status="fail" el="srv-x" />

      {/* 게이지 */}
      <VGauge x={AG.x} y={AG.y} w={26} h={AG.h} label={F.gauge} el="ag" seed="a-g" />
      <Txt x={AG.x + 13} y={AG.y + AG.h + 22} size={15} weight={800} anchor="middle" el="ag-pct">
        {F.pct(100)}
      </Txt>
      <Badge x={AG.x + 13} y={AG.y + AG.h + 42} status="fail" r={10} el="ag-x" />
      <Badge x={AG.x + 13} y={AG.y + AG.h + 42} status="ok" r={10} el="ag-ok" />

      {/* 더 큰 서버? */}
      <g data-el="bigger">
        <RRect x={238} y={168} w={146} h={184} seed="a-big" rough={0.5} dash="7 6" stroke="var(--muted)" />
        <Txt x={311} y={266} size={15} weight={750} anchor="middle">
          {F.bigger}
        </Txt>
      </g>

      {/* 월 요금(숫자 없이 상대 길이만) */}
      <g data-el="fee">
        <Txt x={20} y={384} size={13.5} weight={800}>
          {F.fee}
        </Txt>
        <Txt x={20} y={410} size={13} weight={600}>
          {F.feeNow}
        </Txt>
        <rect x={110} y={399} width={56} height={14} rx={2} style={{ fill: 'var(--line)', opacity: 0.8 }} />
      </g>
      <g data-el="fee2">
        <Txt x={20} y={436} size={13} weight={600}>
          {F.bigger}
        </Txt>
        <rect x={110} y={425} width={250} height={14} rx={2} style={{ fill: 'var(--line)', opacity: 0.45, stroke: 'var(--line)' }} strokeWidth={1.2} strokeDasharray="5 4" />
      </g>

      {/* step 3: 작업 카드 3장과 실패 알림 */}
      {F.jobs.map((j, k) => (
        <g key={j} data-el="job">
          <line x1={JOB_X[k] + 64} y1={150} x2={JOB_TO[k]} y2={SRV.y - 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
          <g data-el="job-run">
            <RRect x={JOB_X[k]} y={112} w={128} h={38} seed={`job${k}`} rough={0.4} fill="var(--surface)" />
            <Txt x={JOB_X[k] + 10} y={136} size={13.5} weight={700}>
              {j}
            </Txt>
          </g>
          <g data-el="job-wait">
            <rect x={JOB_X[k]} y={112} width={128} height={38} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--wait)' }} strokeWidth={1.6} strokeDasharray="5 4" />
            <Txt x={JOB_X[k] + 10} y={136} size={13.5} weight={700} muted>
              {j}
            </Txt>
            <Badge x={JOB_X[k] + 114} y={131} status="wait" r={9} />
          </g>
        </g>
      ))}
      <g data-el="alert">
        <line x1={SRV.x + SRV.w + 4} y1={272} x2={252} y2={272} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} strokeDasharray="3 5" />
        <Node x={330} y={272} w={150} h={54} label={alert.label} sub={alert.sub} kind="control" seed="a-alert" />
      </g>
      <g data-el="alert-say">
        <RPath d="M 252 312 L 300 312 L 312 301 L 318 312 L 420 312 L 420 350 L 252 350 Z" seed="a-say" rough={0.4} fill="var(--surface)" />
        <Txt x={336} y={336} size={14} weight={750} anchor="middle">
          {F.noResponse}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl) => {
  const o = pick(q)
  const pct = o('ag-pct')[0]
  const g = { v: 100 }
  drawGauge(q, 'ag', 100, pct, F.pct)
  init(tl, [...o('srv'), ...o('srv-ok'), ...o('srv-x'), ...o('ag-ok'), ...o('weeks'), ...o('bigger'), ...o('fee'), ...o('fee2'), ...o('caption'), ...o('job'), ...o('job-wait'), ...o('alert'), ...o('alert-say')], { opacity: 0 })
  init(tl, o('srv'), { scale: LAP2.w / SRV.w, svgOrigin: SRV_O })
  init(tl, o('lap2'), { scale: 1, svgOrigin: SRV_O })
  init(tl, o('a-mem'), { scaleY: 1, transformOrigin: '50% 100%' })
  init(tl, o('log'), { scale: 1, svgOrigin: `${LOG.x} ${LOG.y}` })

  // step 1: 노트북이 같은 자리에서 큰 서버로 커진다. 게이지 100 → 50%, ✕ → ✓
  const s1 = at(0)
  tl.to(o('lap2'), { scale: SRV.w / LAP2.w, opacity: 0, svgOrigin: SRV_O, duration: 0.3, ease: 'power2.inOut' }, s1 + 0.04)
  tl.to(o('srv'), { scale: 1, opacity: 1, svgOrigin: SRV_O, duration: 0.3, ease: 'power2.inOut' }, s1 + 0.04)
  tl.to(o('a-mem'), { scaleY: 0.5, duration: 0.3 }, s1 + 0.36)
  gaugeTo(q, tl, 'ag', g, 50, s1 + 0.36, 0.3, pct, F.pct)
  tl.to(o('ag-x'), { opacity: 0, duration: 0.05 }, s1 + 0.5)
  tl.to([...o('ag-ok'), ...o('srv-ok')], { opacity: 1, duration: 0.06 }, s1 + 0.52)
  tl.to(o('fee'), { opacity: 1, duration: 0.1 }, s1 + 0.6)

  // step 2: 1주 → 2주 → 3주, 로그가 커지고 게이지가 다시 찬다
  const s2 = at(1)
  tl.to(o('weeks'), { opacity: 1, duration: 0.08 }, s2)
  WEEK_X.forEach((x, k) => {
    const t = s2 + 0.08 + k * 0.2
    if (k) tl.to(o('wk-mark'), { x: x - WEEK_X[0], duration: 0.14, ease: 'power2.inOut' }, t)
    tl.to(o('log'), { scale: LOG_S[k], svgOrigin: `${LOG.x} ${LOG.y}`, duration: 0.16, ease: 'power2.inOut' }, t)
    tl.to(o('a-mem'), { scaleY: WEEK_V[k] / 100, duration: 0.16 }, t)
    gaugeTo(q, tl, 'ag', g, WEEK_V[k], t, 0.16, pct, F.pct)
  })
  tl.to(o('ag-ok'), { opacity: 0, duration: 0.04 }, s2 + 0.38)
  tl.to(o('ag-x'), { opacity: 1, duration: 0.04 }, s2 + 0.39)
  tl.to(o('bigger'), { opacity: 1, duration: 0.1 }, s2 + 0.7)
  tl.to([...o('fee2'), ...o('caption')], { opacity: 1, duration: 0.1 }, s2 + 0.74)

  // step 3: 서버가 멈추면 작업이 위에서부터 하나씩 ⏸
  const s3 = at(2)
  tl.to([...o('weeks'), ...o('log'), ...o('log-arr'), ...o('bigger'), ...o('fee'), ...o('fee2'), ...o('caption'), ...o('ag'), ...o('ag-pct'), ...o('ag-x')], { opacity: 0, duration: 0.12 }, s3)
  tl.to(o('job'), { opacity: 1, duration: 0.1 }, s3 + 0.08)
  tl.to(o('srv-ok'), { opacity: 0, duration: 0.04 }, s3 + 0.24)
  tl.to(o('srv-x'), { opacity: 1, duration: 0.05 }, s3 + 0.25)
  const run = o('job-run')
  o('job-wait').forEach((w, k) => {
    const t = s3 + 0.32 + k * 0.1
    tl.to(run[k], { opacity: 0, duration: 0.05 }, t)
    tl.to(w, { opacity: 1, duration: 0.05 }, t)
  })
  tl.to(o('alert'), { opacity: 1, duration: 0.1 }, s3 + 0.62)
  tl.to(o('alert-say'), { opacity: 1, duration: 0.08 }, s3 + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 나눠 세고 합치기
// ─────────────────────────────────────────────────────────────
const CC = [52, 136, 220, 304, 388]
const ROW_T = [166, 280]
const ABS = 1 // 빠지는 자리
const REDO_X = 94
const BIG = { cx: 165, y: 50 }
const cellOf = (k: number) => ({ cx: CC[k % 5], top: ROW_T[Math.floor(k / 5)] })
const SUM_Y = 433
// step 2: 워커 8개
const WX = [70, 170, 270, 370]
const WT = [112, 200]
const PIECE = { x: 40, y: 22, w: 45, h: 56, s: 0.42 }
// step 3: Hadoop / Spark
const HP: P[] = [
  [62, 80],
  [143, 158],
  [224, 80],
  [305, 158],
  [386, 80],
]
const SP: P[] = [
  [62, 340],
  [143, 346],
  [224, 340],
  [305, 346],
  [386, 340],
]
// step 4: 셔플
const SX = [64, 168, 272, 376]
const slotXY = (cx: number, s: number, y0: number): P => [cx - 14 + (s % 2) * 28, y0 + Math.floor(s / 2) * 22]

function LaneBox({ x0, y0, label }: { x0: number; y0: number; label: string }) {
  return (
    <g>
      <rect x={x0} y={y0} width={64} height={48} rx={4} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.5} />
      <Txt x={x0 + 32} y={y0 + 40} size={13.5} weight={700} anchor="middle">
        {label}
      </Txt>
    </g>
  )
}

export function DistributedFig() {
  const { mobile } = useEnv()
  const moves: { i: number; p: number }[] = []
  for (let i = 0; i < 4; i++) for (let p = 0; p < 4; p++) if (p !== i) moves.push({ i, p })
  return (
    <Fig caption={F.hsNotes.map((t, k) => <span key={k} className="block">{t}</span>)}>
      {/* step 1: 혼자 세기 vs 나눠 세기 */}
      <g data-el="g1">
        <Txt x={56} y={28} size={13} weight={650} anchor="middle">
          {F.counting}
        </Txt>
        <Person cx={56} top={36} seed="d-solo" r={13} />
        <Pile cx={BIG.cx} y={BIG.y} n={7} w={120} seed="d-big" />
        <Txt x={240} y={92} size={17} weight={800}>
          {F.bigPile}
        </Txt>
        <line x1={16} y1={150} x2={424} y2={150} style={{ stroke: 'var(--muted)' }} strokeWidth={1.2} strokeDasharray="5 5" />
        {Array.from({ length: 10 }, (_, k) => {
          const { cx, top } = cellOf(k)
          const dotX = k === ABS ? REDO_X : cx
          return (
            <g key={k}>
              <g data-el={k === ABS ? 'abs-person' : undefined}>
                <Person cx={cx} top={top} seed={`d-p${k}`} />
              </g>
              <Pile cx={cx} y={top + 52} seed={`d-s${k}`} el="small" data={{ dx: BIG.cx - cx, dy: BIG.y + 20 - (top + 52) }} />
              <Txt x={cx} y={top + 90} size={13} weight={650} anchor="middle" el="cnt">
                {F.books(0)}
              </Txt>
              <circle data-el="sdot" data-dx={220 - dotX} data-dy={SUM_Y - (top + 86)} cx={dotX} cy={top + 86} r={4.5} style={{ fill: 'var(--accent)' }} />
            </g>
          )
        })}
        <Badge x={CC[ABS] + 15} y={ROW_T[0] + 4} status="fail" r={9} el="abs-x" />
        <Txt x={CC[ABS]} y={ROW_T[0] + 90} size={13} weight={750} anchor="middle" color="var(--fail)" el="abs-l">
          {F.out}
        </Txt>
        <Badge x={REDO_X + 20} y={ROW_T[0] + 50} status="retry" r={9} el="redo-b" />
        <Txt x={REDO_X} y={ROW_T[0] + 90} size={13} weight={650} anchor="middle" el="redo-c">
          {F.books(0)}
        </Txt>
        <Txt x={REDO_X} y={ROW_T[0] + 107} size={12.5} weight={750} anchor="middle" el="redo-l">
          {F.redo}
        </Txt>
        <Txt x={424} y={398} size={14} weight={750} anchor="end">
          {F.crew}
        </Txt>
        <RRect x={16} y={410} w={408} h={46} seed="d-sum" rough={0.45} fill="var(--surface)" />
        <Txt x={220} y={SUM_Y + 6} size={16} weight={800} anchor="middle" el="sum">
          {F.sum(0)}
        </Txt>
      </g>

      {/* step 2: 로그 블록 → 워커 8개 → 합치기 */}
      <g data-el="g2">
        <RRect x={PIECE.x} y={PIECE.y} w={PIECE.w * 8} h={PIECE.h} seed="d-log" rough={0.45} fill="var(--surface)" />
        {Array.from({ length: 7 }, (_, k) => (
          <line key={k} data-el="crack" x1={PIECE.x + PIECE.w * (k + 1)} y1={PIECE.y + 2} x2={PIECE.x + PIECE.w * (k + 1)} y2={PIECE.y + PIECE.h - 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.8} strokeDasharray="4 3" />
        ))}
        {/* 이름표는 균열선 위에(가운데 균열선이 글자를 가르지 않게) */}
        <rect x={178} y={40} width={84} height={22} rx={3} style={{ fill: 'var(--surface)' }} />
        <Txt x={220} y={56} size={15} weight={800} anchor="middle">
          {F.dayLog}
        </Txt>
        {Array.from({ length: 8 }, (_, i) => {
          const cx = WX[i % 4]
          const top = WT[Math.floor(i / 4)]
          return (
            <g key={i}>
              <RRect x={cx - 44} y={top} w={88} h={70} seed={`d-w${i}`} rough={0.45} fill="var(--surface)" />
              <Txt x={cx} y={top + 22} size={13.5} weight={750} anchor="middle">
                {F.worker(i + 1)}
              </Txt>
              <rect x={cx - 12} y={top + 40} width={50} height={9} rx={2} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1} />
              <rect data-el="w-bar" x={cx - 11} y={top + 41} width={48} height={7} rx={1.5} style={{ fill: 'var(--accent)' }} />
              <Badge x={cx + 44} y={top + 2} status="ok" r={9} el="w-ok" />
              <circle data-el="rdot" data-dx={220 - (cx + 38)} data-dy={335 - (top + 44)} cx={cx + 38} cy={top + 44} r={4.5} style={{ fill: 'var(--accent)' }} />
            </g>
          )
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const cx = WX[i % 4]
          const top = WT[Math.floor(i / 4)]
          const x0 = PIECE.x + PIECE.w * i
          return (
            <rect
              key={i}
              data-el="piece"
              data-dx={cx - 38 - x0}
              data-dy={top + 32 - PIECE.y}
              data-ox={x0}
              x={x0}
              y={PIECE.y}
              width={PIECE.w}
              height={PIECE.h}
              style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
              strokeWidth={1.6}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
        <g data-el="w-out">
          <path d="M 22 280 L 22 288 L 418 288 L 418 280" style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={1.6} />
          <RArrow x1={220} y1={288} x2={220} y2={311} seed="d-bus" rough={0.4} />
          <Node x={220} y={335} w={140} h={42} label={F.merge} seed="d-merge" />
          <RArrow x1={220} y1={358} x2={220} y2={379} seed="d-res" rough={0.4} />
          <RRect x={120} y={382} w={200} h={78} seed="d-table" rough={0.4} fill="var(--surface)" />
          <Txt x={220} y={402} size={14} weight={800} anchor="middle">
            {F.result}
          </Txt>
          {[412, 428, 444].map((y) => (
            <line key={y} x1={122} y1={y} x2={318} y2={y} style={{ stroke: 'var(--line)', opacity: 0.6 }} strokeWidth={1} />
          ))}
          {[0, 1, 2].map((k) => (
            <g key={k} data-el="w-row">
              <rect x={130} y={415 + k * 16} width={[150, 120, 90][k]} height={9} rx={2} style={{ fill: 'var(--accent)', opacity: 0.55 }} />
            </g>
          ))}
        </g>
      </g>

      {/* step 3: Hadoop(디스크) / Spark(메모리) */}
      <g data-el="g3">
        <RRect x={14} y={14} w={412} h={192} seed="d-hbox" rough={0.45} />
        <Txt x={30} y={42} size={17} weight={800}>
          {F.hadoop}
        </Txt>
        <RArrow x1={96} y1={92} x2={124} y2={142} seed="h-a1" rough={0.3} head={7} />
        <RArrow x1={164} y1={142} x2={190} y2={96} seed="h-a2" rough={0.3} head={7} />
        <RArrow x1={258} y1={92} x2={286} y2={142} seed="h-a3" rough={0.3} head={7} />
        <RArrow x1={326} y1={142} x2={354} y2={96} seed="h-a4" rough={0.3} head={7} />
        <LaneBox x0={30} y0={62} label={F.workerShort} />
        <LaneBox x0={192} y0={62} label={F.workerShort} />
        <LaneBox x0={354} y0={62} label={F.resultShort} />
        {[143, 305].map((cx) => (
          <g key={cx}>
            <DiskIcon cx={cx} cy={160} seed={`h-d${cx}`} />
            <Txt x={cx} y={194} size={12.5} weight={700} anchor="middle">
              {F.disk}
            </Txt>
          </g>
        ))}
        <RArrow x1={220} y1={212} x2={220} y2={258} seed="h-flow" rough={0.4} />
        <Txt x={232} y={240} size={13.5} weight={750}>
          {F.flow}
        </Txt>
        <RRect x={14} y={264} w={412} h={150} seed="d-sbox" rough={0.45} />
        <Txt x={30} y={292} size={17} weight={800}>
          {F.spark}
        </Txt>
        {[94, 256, 330, 168].map((x) => (
          <RArrow key={x} x1={x + 2} y1={346} x2={x + 22} y2={346} seed={`s-a${x}`} rough={0.3} head={6} />
        ))}
        <LaneBox x0={30} y0={322} label={F.workerShort} />
        <LaneBox x0={192} y0={322} label={F.workerShort} />
        <LaneBox x0={354} y0={322} label={F.resultShort} />
        {[143, 305].map((cx) => (
          <g key={cx}>
            <MemIcon cx={cx} cy={346} seed={`s-m${cx}`} />
            <Txt x={cx} y={390} size={12.5} weight={700} anchor="middle">
              {F.memory}
            </Txt>
          </g>
        ))}
        {[0, 1, 2].map((k) => (
          <circle key={`h${k}`} data-el="hp" data-pts={rel(HP)} cx={HP[0][0]} cy={HP[0][1]} r={5} style={{ fill: 'var(--accent)' }} />
        ))}
        {[0, 1, 2].map((k) => (
          <circle key={`s${k}`} data-el="sp" data-pts={rel(SP)} cx={SP[0][0]} cy={SP[0][1]} r={5} style={{ fill: 'var(--accent)' }} />
        ))}
      </g>

      {/* step 4: 셔플 */}
      <g data-el="g4">
        <Txt x={16} y={34} size={15} weight={800}>
          {F.before}
        </Txt>
        <Txt x={424} y={34} size={13.5} weight={700} anchor="end" el="moved-c">
          {F.moved(0)}
        </Txt>
        {moves.map(({ i, p }) => (
          <g key={`${i}${p}`} data-el="sh-line">
            <RArrow x1={SX[i] + (p - 1.5) * 12} y1={126} x2={SX[p] + (i - 1.5) * 12} y2={299} seed={`sh${i}${p}`} rough={0.25} head={6} strokeWidth={mobile ? 1 : 1.3} />
          </g>
        ))}
        {SX.map((cx, i) => (
          <g key={cx} data-el="sh-stay">
            <RArrow x1={cx + (i - 1.5) * 12} y1={126} x2={cx + (i - 1.5) * 12} y2={299} seed={`st${i}`} rough={0.2} head={6} stroke="var(--muted)" dash="4 4" strokeWidth={1.3} />
          </g>
        ))}
        {SX.map((cx, i) => (
          <g key={cx}>
            <RRect x={cx - 46} y={48} w={92} h={76} seed={`sh-t${i}`} rough={0.4} fill="var(--surface)" />
            <Txt x={cx} y={66} size={13} weight={750} anchor="middle">
              {F.worker(i + 1)}
            </Txt>
            <RRect x={cx - 46} y={302} w={92} h={76} seed={`sh-b${i}`} rough={0.4} fill="var(--surface)" />
            <Txt x={cx} y={320} size={13} weight={750} anchor="middle">
              {F.worker(i + 1)}
            </Txt>
          </g>
        ))}
        <rect x={136} y={192} width={168} height={24} rx={5} style={{ fill: 'var(--bg)' }} />
        <Txt x={220} y={209} size={14} weight={800} anchor="middle">
          {F.shuffle}
        </Txt>
        <rect x={10} y={278} width={60} height={20} rx={5} style={{ fill: 'var(--bg)' }} />
        <Txt x={16} y={293} size={15} weight={800}>
          {F.after}
        </Txt>
        {SX.flatMap((cx, i) => [0, 1, 2, 3].map((s) => <Shape key={`g${i}${s}`} kind={(s + i) % 4} x={slotXY(cx, s, 88)[0]} y={slotXY(cx, s, 88)[1]} hollow />))}
        {SX.flatMap((cx, i) =>
          [0, 1, 2, 3].map((s) => {
            const p = (s + i) % 4
            const [x, y] = slotXY(cx, s, 88)
            const [tx, ty] = slotXY(SX[p], i, 342)
            return <Shape key={`${i}${s}`} kind={p} x={x} y={y} el="shp" data={{ dx: tx - x, dy: ty - y, mv: p === i ? 0 : 1 }} />
          }),
        )}
        {F.products.map((name, p) => (
          <g key={name}>
            <Shape kind={p} x={28 + p * 104} y={404} s={6} />
            <Txt x={40 + p * 104} y={409} size={13} weight={650}>
              {name}
            </Txt>
          </g>
        ))}
        <RArrow x1={22} y1={432} x2={52} y2={432} seed="sh-leg" rough={0.2} head={6} stroke="var(--muted)" dash="4 4" strokeWidth={1.3} />
        <Txt x={60} y={437} size={13} weight={650}>
          {F.stay}
        </Txt>
      </g>
    </Fig>
  )
}

export const buildDistributed: SceneBuild = (q, tl) => {
  const o = pick(q)
  const groups = ['g1', 'g2', 'g3', 'g4'].map(o)
  init(tl, [...groups[1], ...groups[2], ...groups[3], ...o('caption')], { opacity: 0 })
  const swap = (i: number) => {
    tl.to(groups[i - 1], { opacity: 0, duration: 0.1 }, at(i))
    tl.to(groups[i], { opacity: 1, duration: 0.1 }, at(i) + 0.06)
  }

  // step 1: 큰 더미가 작은 더미로 쪼개져 동시에 센다. 한 사람이 빠지면 그 몫만 옆 사람이 다시
  const s1 = at(0)
  const small = o('small')
  const cnt = o('cnt')
  init(tl, [...o('abs-x'), ...o('abs-l'), ...o('redo-b'), ...o('redo-c'), ...o('redo-l'), ...o('sdot')], { opacity: 0 })
  small.forEach((p, k) => {
    init(tl, p, { x: num(p, 'dx'), y: num(p, 'dy'), opacity: 0 })
    tl.to(p, { opacity: 1, duration: 0.03 }, s1 + 0.02 + k * 0.008)
    tl.to(p, { x: 0, y: 0, duration: 0.12, ease: 'power2.out' }, s1 + 0.02 + k * 0.008)
  })
  cnt.forEach((c, k) => (k === ABS ? countTo(tl, c, 0, 38, F.books, s1 + 0.16, 0.13) : countTo(tl, c, 0, 100, F.books, s1 + 0.16, 0.36)))
  tl.to(o('abs-x'), { opacity: 1, duration: 0.04 }, s1 + 0.29)
  tl.to(o('abs-person'), { opacity: 0.35, duration: 0.06 }, s1 + 0.29)
  tl.to(cnt[ABS], { opacity: 0, duration: 0.04 }, s1 + 0.3)
  tl.to(o('abs-l'), { opacity: 1, duration: 0.05 }, s1 + 0.31)
  tl.to(small[ABS], { x: REDO_X - CC[ABS], duration: 0.08, ease: 'power2.inOut' }, s1 + 0.31)
  tl.to([...o('redo-b'), ...o('redo-l'), ...o('redo-c')], { opacity: 1, duration: 0.04 }, s1 + 0.4)
  countTo(tl, o('redo-c')[0], 0, 100, F.books, s1 + 0.42, 0.24)
  o('sdot').forEach((d) => {
    tl.to(d, { opacity: 1, duration: 0.02 }, s1 + 0.67)
    tl.to(d, { x: num(d, 'dx'), y: num(d, 'dy'), duration: 0.09, ease: 'power2.in' }, s1 + 0.67)
    tl.to(d, { opacity: 0, duration: 0.02 }, s1 + 0.76)
  })
  countTo(tl, o('sum')[0], 0, 10000, F.sum, s1 + 0.7, 0.1)

  // step 2: 균열선 → 8조각 → 워커 8개가 동시에 처리 → 합치기
  swap(1)
  const s2 = at(1)
  const crack = o('crack')
  init(tl, crack, { scaleY: 0, transformOrigin: '50% 0%' })
  init(tl, [...o('piece'), ...o('w-ok'), ...o('w-out'), ...o('rdot'), ...o('w-row')], { opacity: 0 })
  init(tl, o('w-bar'), { scaleX: 0, transformOrigin: '0% 50%' })
  // 금 간 블록은 남겨 둔다: 끝 그림(정지 그림)도 "블록 → 워커 8개 → 합치기" 3칸이 된다
  tl.to(crack, { scaleY: 1, duration: 0.06, stagger: 0.012 }, s2 + 0.12)
  o('piece').forEach((p, i) => {
    tl.to(p, { opacity: 1, duration: 0.01 }, s2 + 0.24)
    tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), scale: PIECE.s, svgOrigin: `${num(p, 'ox')} ${PIECE.y}`, duration: 0.16, ease: 'power2.inOut' }, s2 + 0.25 + i * 0.01)
  })
  tl.to(o('w-bar'), { scaleX: 1, duration: 0.2, ease: 'none' }, s2 + 0.44)
  tl.to(o('w-ok'), { opacity: 1, duration: 0.04 }, s2 + 0.62)
  tl.to(o('w-out'), { opacity: 1, duration: 0.08 }, s2 + 0.6)
  o('rdot').forEach((d) => {
    tl.to(d, { opacity: 1, duration: 0.02 }, s2 + 0.64)
    tl.to(d, { x: num(d, 'dx'), y: num(d, 'dy'), duration: 0.1, ease: 'power2.in' }, s2 + 0.64)
    tl.to(d, { opacity: 0, duration: 0.02 }, s2 + 0.74)
  })
  tl.to(o('w-row'), { opacity: 1, duration: 0.03, stagger: 0.02 }, s2 + 0.74)

  // step 3: 두 칸의 입자는 같은 구간에 동시에 출발해 동시에 끝난다(속도 차이를 암시하지 않는다)
  swap(2)
  const s3 = at(2)
  tl.to(o('caption'), { opacity: 1, duration: 0.1 }, s3 + 0.1)
  flowAlong(tl, o('hp'), s3 + 0.16, 0.12, 0.08)
  flowAlong(tl, o('sp'), s3 + 0.16, 0.12, 0.08)

  // step 4: 모양별로 갈라진다. 같은 번호 워커로 가는 4개는 곧장, 나머지 12개는 네트워크로
  swap(3)
  const s4 = at(3)
  tl.to(o('caption'), { opacity: 0, duration: 0.08 }, s4)
  const lines = o('sh-line')
  init(tl, paths(lines), { drawSVG: '0%' })
  tl.to(paths(lines), { drawSVG: '100%', duration: 0.1, ease: 'none' }, s4 + 0.12)
  const shp = o('shp')
  shp.filter((p) => !num(p, 'mv')).forEach((p) => tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.14, ease: 'power1.inOut' }, s4 + 0.2))
  shp.filter((p) => num(p, 'mv')).forEach((p, k) => tl.to(p, { x: num(p, 'dx'), y: num(p, 'dy'), duration: 0.16, ease: 'power1.inOut' }, s4 + 0.24 + k * 0.03))
  countTo(tl, o('moved-c')[0], 0, 12, F.moved, s4 + 0.4, 0.33)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 어디에, 어떤 모양으로 쌓을까
// ─────────────────────────────────────────────────────────────
const OBJ_X = [90, 221, 352]
const WH_T = [166, 252, 338]
const CW = 13.5 * 0.6
const CSV_X = 34
const csvY = (r: number) => 92 + 18 * r
const colX = (j: number) => 30 + 97 * j
const colC = (j: number) => colX(j) + 44.5
const valY = (r: number) => (r === 0 ? 288 : 312 + 22 * (r - 1))
const DATE_Y = (k: number) => 102 + 34 * k

/** 아주 작은 입자 모양: 0 로그 줄, 1 리뷰 말풍선, 2 이미지 */
function Mini({ kind, x, y, el, data }: { kind: number; x: number; y: number; el: string; data?: Record<string, number> }) {
  const props = { 'data-el': el, ...Object.fromEntries(Object.entries(data ?? {}).map(([k, v]) => [`data-${k}`, v])) }
  if (kind === 0)
    return (
      <g {...props}>
        <rect x={x - 8} y={y - 5} width={16} height={10} rx={1.5} style={{ fill: 'var(--accent)' }} />
        <line x1={x - 5} y1={y} x2={x + 5} y2={y} style={{ stroke: 'var(--surface)' }} strokeWidth={1.4} />
      </g>
    )
  if (kind === 1)
    return (
      <g {...props}>
        <path d={`M ${x - 8} ${y - 6} L ${x + 8} ${y - 6} L ${x + 8} ${y + 4} L ${x - 2} ${y + 4} L ${x - 5} ${y + 8} L ${x - 5} ${y + 4} L ${x - 8} ${y + 4} Z`} style={{ fill: 'var(--accent)' }} />
      </g>
    )
  return (
    <g {...props}>
      <rect x={x - 8} y={y - 6} width={16} height={12} rx={1.5} style={{ fill: 'var(--accent)' }} />
      <path d={`M ${x - 6} ${y + 4} L ${x - 1} ${y - 2} L ${x + 2} ${y + 1} L ${x + 4} ${y - 1} L ${x + 6} ${y + 4} Z`} style={{ fill: 'var(--surface)' }} />
    </g>
  )
}

function KeyTag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = tw(text, 13) + 16
  return (
    <g>
      <rect x={x - w / 2} y={y - 15} width={w} height={21} rx={10} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.2} />
      <Txt x={x} y={y} size={13} weight={650} anchor="middle" mono>
        {text}
      </Txt>
    </g>
  )
}

function MiniTable({ x, y, seed }: { x: number; y: number; seed: string }) {
  return (
    <g>
      <rect x={x} y={y} width={70} height={56} style={{ fill: 'var(--bg)' }} />
      <RRect x={x} y={y} w={70} h={56} seed={seed} rough={0.25} />
      <line x1={x} y1={y + 18} x2={x + 70} y2={y + 18} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
      <line x1={x} y1={y + 37} x2={x + 70} y2={y + 37} style={{ stroke: 'var(--line)', opacity: 0.6 }} strokeWidth={1} />
      <line x1={x + 23} y1={y} x2={x + 23} y2={y + 56} style={{ stroke: 'var(--line)', opacity: 0.6 }} strokeWidth={1} />
      <line x1={x + 46} y1={y} x2={x + 46} y2={y + 56} style={{ stroke: 'var(--line)', opacity: 0.6 }} strokeWidth={1} />
    </g>
  )
}

export function StorageFig() {
  const { mobile } = useEnv()
  const inflow = mobile ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const fields = F.csv.map((line) => {
    let c = 0
    return line.split(',').map((text) => {
      const col = c
      c += text.length + 1
      return { text, col }
    })
  })
  return (
    <Fig>
      {/* step 1: 레이크 vs 웨어하우스 */}
      <g data-el="l1">
        <RPath
          d="M 30 112 C 30 70, 120 56, 220 60 C 330 56, 412 72, 412 112 L 412 196 C 412 226, 330 238, 220 236 C 110 238, 30 226, 30 196 Z"
          seed="s-lake"
          rough={0.5}
          fill="color-mix(in srgb, var(--accent) 6%, var(--surface))"
        />
        <Txt x={52} y={98} size={16} weight={800}>
          {F.lake}
        </Txt>
        <Txt x={52} y={118} size={13} muted>
          {F.lakeSub}
        </Txt>
        <RRect x={30} y={246} w={382} h={30} seed="s-obj" rough={0.4} fill="var(--surface)" />
        <Txt x={221} y={266} size={13.5} weight={750} anchor="middle">
          {F.objectStorage}
        </Txt>
        <TableIcon x={OBJ_X[0] - 22} y={140} seed="s-log" />
        <ReviewIcon x={OBJ_X[1] - 26} y={140} seed="s-rev" />
        <PhotoIcon x={OBJ_X[2] - 24} y={136} seed="s-img" />
        {F.keys.map((k, i) => (
          <KeyTag key={k} x={OBJ_X[i]} y={204} text={k} />
        ))}
        <RRect x={150} y={312} w={270} h={150} seed="s-wh" rough={0.5} fill="var(--surface)" />
        <Txt x={166} y={338} size={15} weight={800}>
          {F.warehouse}
        </Txt>
        <Txt x={166} y={358} size={13} muted>
          {F.warehouseSub}
        </Txt>
        {WH_T.map((x, k) => (
          <MiniTable key={x} x={x} y={376} seed={`s-t${k}`} />
        ))}
        <RArrow x1={22} y1={404} x2={146} y2={404} seed="s-in" rough={0.3} stroke="var(--muted)" />
        {inflow.map((i) => {
          const kind = i % 3
          const x = OBJ_X[kind] + (Math.floor(i / 3) - 1) * 18
          return <Mini key={i} kind={kind} x={x} y={18} el="li" data={{ dy: 108 }} />
        })}
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <g key={k}>
            <Mini kind={k % 3} x={30} y={396} el="wi" data={{ dx: 104 }} />
            <rect data-el="wc" data-dx={WH_T[k % 3] + 6 + 23 * Math.floor(k / 3) - 130} data-dy={398 - 390} x={130} y={390} width={11} height={11} rx={1} style={{ fill: 'var(--accent)' }} />
          </g>
        ))}
      </g>

      {/* step 2: CSV vs Parquet */}
      <g data-el="l2">
        <rect x={128} y={6} width={184} height={30} rx={15} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1.5} />
        <Txt x={220} y={27} size={15} weight={800} anchor="middle">
          {F.question}
        </Txt>
        <RRect x={20} y={46} w={400} h={136} seed="s-csv" rough={0.45} fill="var(--surface)" />
        <Txt x={34} y={68} size={14} weight={800} mono>
          {F.csvName}
        </Txt>
        <Txt x={406} y={68} size={12.5} weight={650} anchor="end" muted>
          {F.csvNote}
        </Txt>
        {F.csv.map((line, r) => (
          <Txt key={r} x={CSV_X} y={csvY(r)} size={13.5} mono weight={r === 0 ? 700 : 500}>
            {line}
          </Txt>
        ))}
        <RRect x={20} y={194} w={400} h={250} seed="s-pq" rough={0.45} fill="var(--surface)" />
        <Txt x={34} y={216} size={14} weight={800} mono>
          {F.pqName}
        </Txt>
        <g data-el="need-l">
          <rect x={406 - tw(F.needed, 13) - 18} y={206} width={11} height={11} rx={2} style={{ fill: 'var(--accent)' }} />
          <Txt x={406} y={216} size={13} weight={750} anchor="end">
            {F.needed}
          </Txt>
        </g>
        <rect x={26} y={224} width={388} height={40} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.2} />
        <Txt x={34} y={239} size={12} weight={650} muted>
          {F.pqHeader}
        </Txt>
        {F.types.map((t, j) => (
          <Txt key={t} x={colC(j)} y={257} size={12.5} weight={700} anchor="middle" el="type">
            {t}
          </Txt>
        ))}
        <g data-el="need-hl">
          <rect x={222} y={268} width={194} height={126} rx={5} style={{ fill: 'var(--accent)', opacity: 0.16 }} />
        </g>
        {[0, 1, 2, 3].map((j) => (
          <RRect key={j} x={colX(j)} y={270} w={89} h={122} seed={`s-col${j}`} rough={0.35} />
        ))}
        {[0, 1, 2, 3].map((j) => (
          <line key={j} x1={colX(j) + 4} y1={296} x2={colX(j) + 85} y2={296} style={{ stroke: 'var(--line)', opacity: 0.5 }} strokeWidth={1} />
        ))}
        {fields.flatMap((row, r) =>
          row.map(({ text, col }, j) => {
            if (!text) return null
            const x0 = CSV_X + col * CW
            const tx = colC(j) - (text.length * CW) / 2
            return (
              <text key={`${r}-${j}`} data-el={r > 0 && j === 2 ? 'mv-ev' : 'mv'} data-dx={tx - x0} data-dy={valY(r) - csvY(r)} data-r={r} x={x0} y={csvY(r)} style={{ fontSize: 13.5, fontWeight: r === 0 ? 800 : 600 }}>
                {text}
              </text>
            )
          }),
        )}
        {F.codes.map((c, r) => (
          <Txt key={r} x={colC(2)} y={valY(r + 1)} size={13.5} mono weight={700} anchor="middle" el="code">
            {c}
          </Txt>
        ))}
        <g data-el="beam">
          <rect x={222} y={268} width={194} height={14} rx={3} style={{ fill: 'var(--accent)', opacity: 0.45 }} />
        </g>
        <g data-el="dict">
          <line x1={colC(2)} y1={393} x2={colC(2)} y2={402} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
          <rect x={224} y={402} width={190} height={28} rx={4} style={{ fill: 'var(--bg)', stroke: 'var(--line)' }} strokeWidth={1.4} />
          <Txt x={232} y={421} size={12} weight={650} mono>
            {F.dict}
          </Txt>
        </g>
      </g>

      {/* step 3: 날짜별 폴더 */}
      <g data-el="l3">
        <Txt x={20} y={38} size={14} weight={800} el="opened">
          {F.opened(0)}
        </Txt>
        <g data-el="ask">
          <RPath d="M 232 12 L 424 12 L 424 48 L 270 48 L 258 60 L 256 48 L 232 48 Z" seed="s-ask" rough={0.4} fill="var(--surface)" />
          <Txt x={328} y={36} size={15} weight={800} anchor="middle">
            {F.ask}
          </Txt>
        </g>
        <Folder x={22} y={66} w={26} h={19} seed="s-root" />
        <Txt x={56} y={82} size={15} weight={800} mono>
          {F.root}
        </Txt>
        <line x1={34} y1={88} x2={34} y2={DATE_Y(6) + 9} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
        <rect data-el="cursor" x={44} y={DATE_Y(0) - 6} width={208} height={30} rx={6} style={{ fill: 'none', stroke: 'var(--accent)' }} strokeWidth={2.4} />
        {F.dates.map((d, k) => (
          <g key={d}>
            <line x1={34} y1={DATE_Y(k) + 9} x2={49} y2={DATE_Y(k) + 9} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
            {k < 6 ? (
              <g>
                {/* 건너뛴 폴더는 아이콘만 흐리게. 라벨은 읽혀야 한다(대비 4.5:1) */}
                <g data-el="fd">
                  <Folder x={52} y={DATE_Y(k)} seed={`s-f${k}`} />
                </g>
                <Txt x={86} y={DATE_Y(k) + 14} size={14} weight={600} mono>
                  {d}
                </Txt>
              </g>
            ) : (
              <g>
                <g data-el="fd6-c">
                  <Folder x={52} y={DATE_Y(k)} seed="s-f6" />
                </g>
                <g data-el="fd6-o">
                  <Folder x={52} y={DATE_Y(k)} seed="s-f6o" open />
                </g>
                <Txt x={86} y={DATE_Y(k) + 14} size={14} weight={800} mono>
                  {d}
                </Txt>
              </g>
            )}
          </g>
        ))}
        <g data-el="files">
          <line x1={64} y1={DATE_Y(6) + 22} x2={64} y2={346 + 28 * 2 + 10} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
          {F.parts.map((f, k) => (
            <g key={f}>
              <line x1={64} y1={356 + 28 * k} x2={96} y2={356 + 28 * k} style={{ stroke: 'var(--line)' }} strokeWidth={1.4} />
              <FileIcon x={100} y={346 + 28 * k} seed={`s-file${k}`} />
              <Txt x={124} y={361 + 28 * k} size={13.5} weight={600} mono>
                {f}
              </Txt>
            </g>
          ))}
        </g>
      </g>
    </Fig>
  )
}

export const buildStorage: SceneBuild = (q, tl) => {
  const o = pick(q)
  const groups = ['l1', 'l2', 'l3'].map(o)
  init(tl, [...groups[1], ...groups[2]], { opacity: 0 })

  // step 1: 레이크엔 모양 그대로, 웨어하우스엔 표 칸 모양으로 바뀐 뒤에야
  const s1 = at(0)
  o('li').forEach((p, i) => {
    const t = s1 + 0.04 + i * 0.04
    init(tl, p, { opacity: 0 })
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { y: num(p, 'dy'), duration: 0.16, ease: 'power1.in' }, t)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.16)
  })
  const cells = o('wc')
  init(tl, [...o('wi'), ...cells], { opacity: 0 })
  o('wi').forEach((p, k) => {
    const t = s1 + 0.26 + k * 0.05
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: num(p, 'dx'), duration: 0.14, ease: 'power1.inOut' }, t)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.14)
    tl.to(cells[k], { opacity: 1, duration: 0.02 }, t + 0.14)
    tl.to(cells[k], { x: num(cells[k], 'dx'), y: num(cells[k], 'dy'), duration: 0.12, ease: 'power2.out' }, t + 0.15)
  })

  // step 2: CSV 줄이 쉼표 자리에서 쪼개져 열별 블록으로. 타입이 찍히고 빛줄기가 필요한 두 열만 훑는다
  tl.to(groups[0], { opacity: 0, duration: 0.1 }, at(1))
  tl.to(groups[1], { opacity: 1, duration: 0.1 }, at(1) + 0.06)
  const s2 = at(1)
  const mv = [...o('mv'), ...o('mv-ev')]
  init(tl, [...mv, ...o('type'), ...o('need-hl'), ...o('need-l'), ...o('code'), ...o('beam'), ...o('dict')], { opacity: 0 })
  mv.forEach((t) => {
    const t0 = s2 + 0.12 + num(t, 'r') * 0.06
    tl.to(t, { opacity: 1, duration: 0.02 }, t0)
    tl.to(t, { x: num(t, 'dx'), y: num(t, 'dy'), duration: 0.16, ease: 'power2.inOut' }, t0)
  })
  tl.to(o('type'), { opacity: 1, duration: 0.04, stagger: 0.03 }, s2 + 0.5)
  tl.to(o('need-hl'), { opacity: 1, duration: 0.06 }, s2 + 0.6)
  tl.to(o('beam'), { opacity: 1, duration: 0.02 }, s2 + 0.6)
  tl.to(o('beam'), { y: 112, duration: 0.14, ease: 'none' }, s2 + 0.6)
  tl.to(o('beam'), { opacity: 0, duration: 0.02 }, s2 + 0.74)
  tl.to(o('need-l'), { opacity: 1, duration: 0.06 }, s2 + 0.64)
  tl.to(o('dict'), { opacity: 1, duration: 0.06 }, s2 + 0.7)
  tl.to(o('mv-ev'), { opacity: 0, duration: 0.04 }, s2 + 0.74)
  tl.to(o('code'), { opacity: 1, duration: 0.04 }, s2 + 0.76)

  // step 3: 커서가 내려가다 3월 14일 폴더에서만 멈추고 연다
  tl.to(groups[1], { opacity: 0, duration: 0.1 }, at(2))
  tl.to(groups[2], { opacity: 1, duration: 0.1 }, at(2) + 0.06)
  const s3 = at(2)
  init(tl, [...o('ask'), ...o('files'), ...o('fd6-o'), ...o('cursor')], { opacity: 0 })
  tl.to(o('ask'), { opacity: 1, duration: 0.06 }, s3 + 0.1)
  tl.to(o('cursor'), { opacity: 1, duration: 0.03 }, s3 + 0.18)
  tl.to(o('cursor'), { y: DATE_Y(6) - DATE_Y(0), duration: 0.36, ease: 'steps(6)' }, s3 + 0.2)
  tl.to(o('fd6-c'), { opacity: 0, duration: 0.04 }, s3 + 0.58)
  tl.to(o('fd6-o'), { opacity: 1, duration: 0.04 }, s3 + 0.58)
  tl.to(o('files'), { opacity: 1, duration: 0.08 }, s3 + 0.62)
  tl.to(o('fd'), { opacity: 0.45, duration: 0.1 }, s3 + 0.66)
  countTo(tl, o('opened')[0], 0, 1, F.opened, s3 + 0.6, 0.02)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 레이크에 쌓고, 나눠 처리하고, 웨어하우스로
// ─────────────────────────────────────────────────────────────
// 세로 배치 맵(데스크톱·모바일 공용) 위에 덧그린다. 세로 배치에서 다른 노드 뒤로 지나가 버리는 연결선은
// (예: 앱 → 레이크가 리뷰·이미지 노드를 가로지름) 숨기고, 맵 바깥 통로로 꺾어 다시 그린다.
type At = (id: string) => { x: number; y: number; w: number; h: number } | undefined
type Bx = { x: number; y: number; w: number; h: number; x0: number; x1: number; y0: number; y1: number }
const bx = (n: { x: number; y: number; w: number; h: number }): Bx => ({ ...n, x0: n.x - n.w / 2, x1: n.x + n.w / 2, y0: n.y - n.h / 2, y1: n.y + n.h / 2 })
const EDGES5 = mapStateAt(T.ch5).edges
const NODES5 = mapStateAt(T.ch5).nodes.map((n) => n.id)
const IW_X = [52, 150, 248, 346]
const IW_T = [30, 118]
const STOP = 2 // 멈추는 워커(워커 3)
const TAKE = 4 // 몫을 넘겨받는 워커(워커 5)

/** 노드 테두리와 중심선이 만나는 점(PipelineMap과 같은 방식) */
function clipTo(n: Bx, tx: number, ty: number, gap: number): P {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}

/** 지금 배치에서 연결선마다 그릴 점 목록. 다른 노드에 가리는 선은 왼쪽·오른쪽 바깥 통로로 꺾는다 */
function routesOf(N: Record<string, Bx>) {
  const all = Object.values(N)
  const minX = Math.min(...all.map((n) => n.x0))
  const maxX = Math.max(...all.map((n) => n.x1))
  const mid = (minX + maxX) / 2
  const hidden = (a: Bx, b: Bx, p: P, q: P) => {
    for (let k = 1; k < 48; k++) {
      const x = p[0] + ((q[0] - p[0]) * k) / 48
      const y = p[1] + ((q[1] - p[1]) * k) / 48
      if (all.some((n) => n !== a && n !== b && x > n.x0 - 2 && x < n.x1 + 2 && y > n.y0 - 2 && y < n.y1 + 2)) return true
    }
    return false
  }
  const routes: Record<string, P[]> = {}
  const rerouted: string[] = []
  let left = 0
  let right = 0
  for (const e of EDGES5) {
    const a = N[e.from]
    const b = N[e.to]
    if (!a || !b) continue
    const p = clipTo(a, b.x, b.y, 5)
    const q = clipTo(b, a.x, a.y, 7)
    // 같은 줄에 붙은 두 노드(오케스트레이터 → 분산 처리): 곧은 선은 2단위뿐이라 안 보인다 → 아래 틈으로 돌린다
    if (Math.abs(a.y - b.y) < 1 && Math.hypot(q[0] - p[0], q[1] - p[1]) < 24) {
      const s = Math.sign(a.x - b.x)
      const y = Math.max(a.y1, b.y1) + 12
      routes[e.id] = [
        [a.x - s * a.w * 0.3, a.y1 + 3],
        [a.x - s * a.w * 0.3, y],
        [b.x + s * b.w * 0.3, y],
        [b.x + s * b.w * 0.3, b.y1 + 6],
      ]
      rerouted.push(e.id)
      continue
    }
    if (!hidden(a, b, p, q)) {
      routes[e.id] = [p, q]
      continue
    }
    const toRight = (a.x + b.x) / 2 >= mid
    const ch = toRight ? maxX + 17 + 12 * right++ : minX - 17 - 12 * left++
    routes[e.id] = toRight
      ? [
          [a.x1 + 3, a.y],
          [ch, a.y],
          [ch, b.y],
          [b.x1 + 6, b.y],
        ]
      : [
          [a.x0 - 3, a.y],
          [ch, a.y],
          [ch, b.y],
          [b.x0 - 6, b.y],
        ]
    rerouted.push(e.id)
  }
  return { routes, rerouted, minX: minX - 30 - 12 * Math.max(0, left - 1), maxX: maxX + 30 + 12 * Math.max(0, right - 1) }
}

function SolOverlay({ at: pos }: { at: At }) {
  const N: Record<string, Bx> = {}
  for (const id of NODES5) {
    const r = pos(id)
    if (r) N[id] = bx(r)
  }
  const { app, etl, lake, spark, warehouse: wh, model, bi } = N
  if (!app || !etl || !lake || !spark || !wh || !model || !bi) return null
  const { routes, rerouted, minX, maxX } = routesOf(N)
  const tile = { x: bi.x - 150, y: bi.y1 + 20, w: 296, h: 76 }
  const out: P[] = [
    [spark.x, spark.y],
    [wh.x, wh.y],
    [model.x, model.y],
    [bi.x, bi.y],
    [bi.x, tile.y + tile.h / 2],
  ]
  const box = (y0: number, y1: number) => `${minX} ${y0} ${maxX - minX} ${y1 - y0}`
  const top = app.y0 - 22
  const end = tile.y + tile.h + 12
  const kindOf = (id: string) => EDGES5.find((e) => e.id === id)?.kind
  const fx = lake.x - 30
  return (
    <g>
      <rect
        data-el="cams"
        data-full={box(top, end)}
        data-top={box(top, lake.y1 + 44)}
        data-mid={box(etl.y0 - 20, spark.y1 + 14)}
        data-bottom={box(spark.y0 - 20, end)}
        data-rerouted={rerouted.join(',')}
        x={minX}
        y={top}
        width={0}
        height={0}
        style={{ fill: 'none' }}
      />
      {rerouted.map((id) => (
        <g key={id} style={kindOf(id) === 'control' ? { opacity: 0.75 } : undefined}>
          <PolyArrow pts={routes[id]} seed={`rr-${id}`} el={`rr-${id}`} dash={kindOf(id) === 'control' ? '3 6' : undefined} />
        </g>
      ))}
      <g data-el="folders">
        {[0, 1, 2].map((k) => (
          <Folder key={k} x={fx + k * 28} y={lake.y1 + 8} w={22} h={16} seed={`sol-f${k}`} />
        ))}
        <Txt x={fx + 3 * 28 + 2} y={lake.y1 + 21} size={12} weight={650} mono>
          {F.folderTag}
        </Txt>
      </g>
      {routes['app>lake'] &&
        [0, 1, 2].map((k) => <circle key={`a${k}`} data-el="p-app" data-pts={rel(routes['app>lake'])} cx={routes['app>lake'][0][0]} cy={routes['app>lake'][0][1]} r={6} style={{ fill: 'var(--accent)' }} />)}
      {routes['media>lake'] &&
        [0, 1].map((k) => <circle key={`m${k}`} data-el="p-media" data-pts={rel(routes['media>lake'])} cx={routes['media>lake'][0][0]} cy={routes['media>lake'][0][1]} r={6} style={{ fill: 'var(--accent)' }} />)}
      <g data-el="tile">
        <line x1={bi.x} y1={bi.y1 + 5} x2={bi.x} y2={tile.y - 2} style={{ stroke: 'var(--line)' }} strokeWidth={1.6} />
        <RRect x={tile.x} y={tile.y} w={tile.w} h={tile.h} seed="sol-tile" rough={0.45} fill="var(--surface)" />
        <Txt x={tile.x + 12} y={tile.y + 25} size={14.5} weight={800}>
          {F.tileTitle}
        </Txt>
        <Txt x={tile.x + tile.w - 12} y={tile.y + 25} size={12} weight={600} anchor="end" muted>
          {F.tileNote}
        </Txt>
        <Txt x={tile.x + 12} y={tile.y + 55} size={14} weight={650} el="tile-seq">
          {F.tileSeq}
        </Txt>
      </g>
      <circle data-el="p-out" data-pts={rel(out)} cx={out[0][0]} cy={out[0][1]} r={6.5} style={{ fill: 'var(--accent)' }} />
    </g>
  )
}

function Inset() {
  const redo: P[] = [
    [IW_X[STOP], IW_T[0] + 56],
    [IW_X[STOP], IW_T[0] + 67],
    [IW_X[TAKE % 4], IW_T[0] + 67],
    [IW_X[TAKE % 4], IW_T[1] - 3],
  ]
  return (
    <div className="flex h-full flex-col rounded-xl border-[1.5px] border-edge bg-surface p-2 md:p-3">
      <svg viewBox="0 0 400 186" className="diagram min-h-0 w-full flex-1" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <Txt x={8} y={18} size={14} weight={800}>
          {F.insetTitle}
        </Txt>
        <g data-el="ib-redo">
          <PolyArrow pts={redo} seed="ib-redo" dash="5 4" head={7} />
          <Txt x={(IW_X[0] + IW_X[2]) / 2} y={IW_T[1] - 6} size={12.5} weight={750} anchor="middle">
            {F.redo}
          </Txt>
        </g>
        {Array.from({ length: 8 }, (_, i) => {
          const cx = IW_X[i % 4]
          const top = IW_T[Math.floor(i / 4)]
          return (
            <g key={i}>
              <RRect x={cx - 43} y={top} w={86} h={54} seed={`ib-w${i}`} rough={0.4} fill="var(--bg)" />
              <Txt x={cx} y={top + 20} size={13} weight={750} anchor="middle">
                {F.worker(i + 1)}
              </Txt>
              <rect x={cx - 34} y={top + 30} width={68} height={9} rx={2} style={{ fill: 'var(--surface)', stroke: 'var(--line)' }} strokeWidth={1} />
              <rect data-el="ib" x={cx - 33} y={top + 31} width={66} height={7} rx={1.5} style={{ fill: 'var(--accent)' }} />
              {i !== STOP && <Badge x={cx + 40} y={top + 2} status="ok" r={9} el="ib-ok" />}
            </g>
          )
        })}
        <Badge x={IW_X[STOP] + 40} y={IW_T[0] + 2} status="fail" r={9} el="ib3-x" />
        <Txt x={IW_X[STOP]} y={IW_T[0] + 51} size={12.5} weight={750} anchor="middle" color="var(--fail)" el="ib3-l">
          {F.stopped}
        </Txt>
        <Badge x={IW_X[TAKE % 4] - 40} y={IW_T[1] + 2} status="retry" r={9} el="ib5-r" />
        <rect data-el="ib-piece" data-pts={rel(redo)} x={redo[0][0] - 6} y={redo[0][1] - 6} width={12} height={12} rx={2} style={{ fill: 'var(--accent)' }} />
      </svg>
      <p className="mt-1 text-center text-[0.75rem] leading-snug text-muted md:text-[0.8125rem]">{F.insetNote}</p>
    </div>
  )
}

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="map-layer" className="absolute inset-0 overflow-hidden">
        <PipelineMap t={T.ch5} from={T.ch4} vertical overlay={(a) => <SolOverlay at={a} />} />
      </div>
      <div data-el="inset" className="absolute inset-x-0 bottom-0 h-[48%]">
        <Inset />
      </div>
    </div>
  )
}

const parseBox = (s: string | undefined) => {
  const [x, y, w, h] = (s ?? '0 0 100 100').split(' ').map(Number)
  return { x, y, w, h }
}
/** 영역 r이 화면 비율(aspect)의 뷰 위쪽 frac 부분에 들어가게(남는 높이는 아래로: 다음 노드가 이어 보인다) */
const fitBox = (r: { x: number; y: number; w: number; h: number }, aspect: number, frac = 1) => {
  const h = Math.max(r.h / frac, r.w / aspect)
  const w = h * aspect
  return `${(r.x + r.w / 2 - w / 2).toFixed(1)} ${r.y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const svg = o('map')[0] as SVGSVGElement | undefined
  const cams = o('cams')[0] as SVGElement | undefined
  if (!svg || !cams) return
  const rect = svg.getBoundingClientRect()
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.8
  const d = cams.dataset
  // step 2에서 인셋 뒤로 반쯤 가려질 아래쪽 노드·선(원래 투명도는 지금 읽어 둔다)
  const mid = parseBox(d.mid)
  const low = new Set(
    q('[data-node]')
      .filter((n) => Number(n.querySelector('.node-focus')?.getAttribute('y') ?? 0) > mid.y + mid.h)
      .map((n) => (n as SVGElement).dataset.node ?? ''),
  )
  const touchesLow = (id: string) => id.split('>').some((n) => low.has(n))
  const lowEls = [
    ...q('[data-node]').filter((n) => low.has((n as SVGElement).dataset.node ?? '')),
    ...q('[data-edge]').filter((e) => touchesLow((e as SVGElement).dataset.edge ?? '')),
    ...q('[data-el^="rr-"]').filter((e) => touchesLow(((e as SVGElement).dataset.el ?? '').slice(3))),
  ]
  const lowOpacity = new Map(lowEls.map((el) => [el, Number(getComputedStyle(el).opacity)]))
  const cam1 = fitBox(parseBox(mobile ? d.top : d.full), aspect)
  const cam2 = fitBox(parseBox(d.mid), aspect, 0.5)
  const cam3 = fitBox(parseBox(mobile ? d.bottom : d.full), aspect)

  // 남아 있는 노드는 처음부터 지금 자리에(Ch4 → Ch5 사이 세로 배치가 달라 미끄러지면 연결선과 어긋난다)
  q('[data-node][data-dx], [data-node][data-dy]').forEach((el) => {
    delete (el as SVGElement).dataset.dx
    delete (el as SVGElement).dataset.dy
  })
  svg.dataset.vbFrom = cam1
  svg.dataset.vbTo = cam1
  mapTransition(q, tl, at(0), { dur: 0.6 })

  const node = (id: string) => q(`[data-node="${id}"] > :not(.node-focus)`)
  const ring = (id: string) => q(`[data-node="${id}"] > .node-focus`)
  const edge = (id: string) => q(`[data-edge="${id}"] > *`)
  const rerouted = new Set((d.rerouted ?? '').split(',').filter(Boolean))
  /** 연결선 그림: 다시 그린 선이 있으면 그것, 없으면 맵의 선 */
  const line = (id: string) => (rerouted.has(id) ? o(`rr-${id}`) : edge(id))
  init(tl, [...rerouted].flatMap(edge), { opacity: 0 })
  const appLake = line('app>lake')
  const mediaLake = line('media>lake')
  const toSpark = [...line('lake>spark'), ...line('orch>spark')]
  const sw = line('spark>warehouse')
  init(tl, [...node('spark'), ...node('media'), ...appLake, ...mediaLake, ...toSpark, ...sw], { opacity: 0 })
  init(tl, [...o('folders'), ...o('p-app'), ...o('p-media'), ...o('p-out'), ...o('tile'), ...o('tile-seq'), ...o('inset')], { opacity: 0 })
  init(tl, shafts([...appLake, ...mediaLake, ...sw]), { drawSVG: '0%' })
  init(tl, heads([...appLake, ...mediaLake, ...sw]), { opacity: 0 })

  // step 1: 레이크가 그려지고 앱 로그가 흘러든다 → 리뷰·상품 이미지가 그려지고 레이크로 이어진다
  const s1 = at(0)
  const draw = (els: Element[], t: number) => {
    tl.to(els, { opacity: 1, duration: 0.02 }, t)
    tl.to(shafts(els), { drawSVG: '100%', duration: 0.1, ease: 'none' }, t)
    tl.to(heads(els), { opacity: 1, duration: 0.03 }, t + 0.09)
  }
  draw(appLake, s1 + 0.34)
  flowAlong(tl, o('p-app'), s1 + 0.42, 0.05, 0.05)
  tl.to(ring('lake'), { opacity: 1, duration: 0.06 }, s1 + 0.46)
  tl.to(node('media'), { opacity: 1, duration: 0.06 }, s1 + 0.52)
  tl.to(ring('media'), { opacity: 1, duration: 0.06 }, s1 + 0.56)
  draw(mediaLake, s1 + 0.58)
  flowAlong(tl, o('p-media'), s1 + 0.64, 0.05, 0.05)
  tl.to(o('folders'), { opacity: 1, duration: 0.06 }, s1 + 0.72)

  // step 2: 분산 처리 노드와 인셋 — 멈춘 워커의 몫만 다른 워커가 다시
  const s2 = at(1)
  tl.to(svg, { attr: { viewBox: cam2 }, duration: 0.3, ease: 'power2.inOut' }, s2)
  tl.to([...ring('lake'), ...ring('media')], { opacity: 0, duration: 0.08 }, s2)
  tl.to(node('spark'), { opacity: 1, duration: 0.08 }, s2 + 0.1)
  tl.to(ring('spark'), { opacity: 1, duration: 0.06 }, s2 + 0.18)
  tl.to(toSpark, { opacity: 1, duration: 0.08 }, s2 + 0.16)
  tl.to(o('inset'), { opacity: 1, duration: 0.1 }, s2 + 0.14)
  tl.to(lowEls, { opacity: 0, duration: 0.08 }, s2 + 0.04)
  const bars = o('ib')
  const oks = o('ib-ok')
  init(tl, bars, { scaleX: 0, transformOrigin: '0% 50%' })
  init(tl, [...oks, ...o('ib3-x'), ...o('ib3-l'), ...o('ib5-r'), ...o('ib-redo'), ...o('ib-piece')], { opacity: 0 })
  bars.forEach((b, i) => {
    if (i === STOP) tl.to(b, { scaleX: 0.3, duration: 0.11, ease: 'none' }, s2 + 0.24)
    else tl.to(b, { scaleX: 1, duration: 0.36, ease: 'none' }, s2 + 0.24)
  })
  tl.to([...o('ib3-x'), ...o('ib3-l')], { opacity: 1, duration: 0.04 }, s2 + 0.35)
  tl.to(o('ib-redo'), { opacity: 1, duration: 0.05 }, s2 + 0.37)
  flowAlong(tl, o('ib-piece'), s2 + 0.38, 0.05, 0)
  tl.to(o('ib5-r'), { opacity: 1, duration: 0.04 }, s2 + 0.54)
  // 워커 5: 제 몫을 끝낸 뒤 넘겨받은 조각으로 막대가 한 번 더 찬다
  const take = bars[TAKE]
  tl.to(take, { scaleX: 0, duration: 0.01 }, s2 + 0.61)
  tl.to(take, { scaleX: 1, duration: 0.14, ease: 'none' }, s2 + 0.62)
  // ✓ 배지는 멈춘 워커(STOP)에는 없다 → 배지 목록에서 워커 i의 자리
  const okOf = (i: number) => oks[i < STOP ? i : i - 1]
  oks.forEach((b) => tl.to(b, { opacity: 1, duration: 0.03 }, b === okOf(TAKE) ? s2 + 0.76 : s2 + 0.6))

  // step 3: 결과가 웨어하우스 → 모델링 → BI로, BI 옆에 새 타일
  const s3 = at(2)
  tl.to(o('inset'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(ring('spark'), { opacity: 0, duration: 0.06 }, s3)
  tl.to(svg, { attr: { viewBox: cam3 }, duration: 0.3, ease: 'power2.inOut' }, s3 + 0.04)
  lowEls.forEach((el) => tl.to(el, { opacity: lowOpacity.get(el) ?? 1, duration: 0.1 }, s3 + 0.06))
  draw(sw, s3 + 0.26)
  flowAlong(tl, o('p-out'), s3 + 0.38, 0.06, 0)
  tl.to(o('tile'), { opacity: 1, duration: 0.08 }, s3 + 0.6)
  tl.to(o('tile-seq'), { opacity: 1, duration: 0.06 }, s3 + 0.68)
}

