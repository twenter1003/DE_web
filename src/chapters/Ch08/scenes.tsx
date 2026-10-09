import { ch8 } from '../../content/chapters/ch8'
import { T } from '../../content/map'
import { PEOPLE } from '../../content/people'
import { Badge, Node, type Status } from '../../components/diagram'
import { countTo, Fig, Txt } from '../../components/fig'
import { Avatar } from '../../components/people'
import { mapTransition, PipelineMap } from '../../components/PipelineMap'
import { RArrow, REllipse, RLine, RPath, RRect } from '../../components/sketch'
import { at, type SceneBuild } from '../../components/StepScene'
import { mapStateAt } from '../../state/derive'
import {
  Arrow,
  Card,
  Cyl,
  cylPath,
  DashTrace,
  drawArrow,
  FileIcon,
  hideArrow,
  init,
  LAYER,
  Meter,
  MiniTable,
  num,
  pick,
  StatusText,
  TableIcon,
  tableLayout,
  Tag,
  tw,
  WATER,
  type MCol,
} from './parts'

const F = ch8.figures

// 맵 노드 라벨은 map.ts에서 가져온다(Ch7 끝 상태)
const M7 = mapStateAt(T.ch7)
const N7 = Object.fromEntries(M7.nodes.map((n) => [n.id, n]))
const NODES_BEFORE = M7.nodes.length
const NODES_AFTER = mapStateAt(T.ch8).nodes.length

const LAKE_COUNT = 1204310
const WH_COUNT = 1198775
const GOLD_COUNT = 1201442

/** 숫자 카드: 머리글 '지난주 주문' + 건수. 건수 글자 data-el=`${el}-n`, 바꿔 보일 다른 건수(alt)는 `${el}-alt` */
function CountCard({ x, y, w = 128, n, alt, el, seed }: { x: number; y: number; w?: number; n: number; alt?: number; el: string; seed: string }) {
  return (
    <Card x={x} y={y} w={w} h={48} seed={seed} el={el}>
      <Txt x={x + w / 2} y={y + 18} size={12.5} anchor="middle" muted>
        {F.lastWeek}
      </Txt>
      <Txt x={x + w / 2} y={y + 39} size={16} weight={800} anchor="middle" el={`${el}-n`}>
        {F.count(n)}
      </Txt>
      {alt !== undefined && (
        <Txt x={x + w / 2} y={y + 39} size={16} weight={800} anchor="middle" el={`${el}-alt`}>
          {F.count(alt)}
        </Txt>
      )}
    </Card>
  )
}

/** 시계 아이콘 */
function Clock({ x, y, r = 9, seed }: { x: number; y: number; r?: number; seed: string }) {
  return (
    <g>
      <REllipse cx={x} cy={y} w={r * 2} h={r * 2} seed={seed} rough={0.3} fill="var(--bg)" />
      <RPath d={`M ${x} ${y - r * 0.6} L ${x} ${y} L ${x + r * 0.5} ${y + r * 0.2}`} seed={`${seed}-h`} rough={0.1} strokeWidth={1.4} />
    </g>
  )
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 같은 주문, 두 벌의 저장소
// ─────────────────────────────────────────────────────────────
const P = {
  app: { x: 220, y: 56, w: 168, h: 54 },
  fork: [220, 128] as const,
  lake: { x: 115, y: 270, w: 186, h: 156 },
  wh: { x: 325, y: 270, w: 186, h: 156 },
  iconY: 266,
  rows: 4,
}
const iconRowY = (i: number) => P.iconY + 18 + i * 9 + 4.5
// 확대한 레이크 안의 파일 자리(아이콘 가운데 x, 위쪽 y)
const FILES: [number, number][] = [
  [112, 172],
  [322, 166],
  [128, 282],
  [318, 290],
  [214, 384],
]
const FILE_W = 38
const FILE_H = 48
// '최신' 커서가 들르는 자리(파일 아이콘 가운데) → 마지막엔 어느 파일도 아닌 사이
const CURSOR = [
  [FILES[0][0] + 6, FILES[0][1] + 26],
  [FILES[1][0] + 6, FILES[1][1] + 26],
  [FILES[2][0] + 6, FILES[2][1] + 26],
  [212, 246],
] as const
// 두 구간은 같은 길이: 저장 단가가 아니라 '같은 데이터를 한 벌 더' 저장한다는 것만 보여 준다
const PM = { x: 404, y: 34, h: 120, lake: 44, wh: 44 }

function Cursor({ x, y }: { x: number; y: number }) {
  return (
    <g data-el="cursor">
      <g transform={`translate(${x} ${y})`}>
        <path d="M 0 0 L 0 22 L 6 16.5 L 10.5 26 L 14.5 24 L 10 14.5 L 18 14 Z" style={{ fill: 'var(--ink)', stroke: 'var(--bg)' }} strokeWidth={1.5} strokeLinejoin="round" />
        <Tag x={20} y={38} text={F.latest} size={12.5} anchor="start" fill="var(--surface)" />
      </g>
    </g>
  )
}

export function ProblemFig() {
  const { app, lake, wh } = P
  const fx = P.fork[0]
  const fy = P.fork[1]
  return (
    <Fig>
      {/* step 1·3: 앱 → 갈림길 → 레이크·웨어하우스 */}
      <g data-el="s1">
        <Node x={app.x} y={app.y} w={app.w} h={app.h} label={N7.app.label} sub={N7.app.sub} kind="source" seed="p-app" />
        <RLine x1={fx} y1={app.y + app.h / 2 + 4} x2={fx} y2={fy} seed="p-trunk" rough={0.5} />
        <RArrow x1={fx} y1={fy} x2={140} y2={190} seed="p-bl" rough={0.5} />
        <RArrow x1={fx} y1={fy} x2={300} y2={190} seed="p-br" rough={0.5} />
        <circle cx={fx} cy={fy} r={3.5} style={{ fill: 'var(--ink)' }} />
        <Cyl x={lake.x} y={lake.y} w={lake.w} h={lake.h} label={N7.lake.label} sub={N7.lake.sub} seed="p-lake">
          <TableIcon x={lake.x} y={P.iconY} rows={P.rows} label={F.orders} seed="p-ti-l" el="ti-l" />
        </Cyl>
        <Cyl x={wh.x} y={wh.y} w={wh.w} h={wh.h} label={N7.warehouse.label} sub={N7.warehouse.sub} seed="p-wh">
          <TableIcon x={wh.x} y={P.iconY} rows={P.rows} label={F.orders} seed="p-ti-r" el="ti-r" />
        </Cyl>
        <g data-el="tags">
          <Txt x={lake.x} y={378} size={13.5} weight={650} anchor="middle">
            {F.lakeTag}
          </Txt>
          <Txt x={wh.x} y={378} size={13.5} weight={650} anchor="middle">
            {F.whTag}
          </Txt>
        </g>
      </g>
      {Array.from({ length: P.rows }, (_, i) => (
        <g key={i}>
          <circle data-el="pt" data-i={i} cx={fx} cy={app.y + app.h / 2 + 6} r={5} style={{ fill: 'var(--accent)' }} />
          <circle data-el="pl" data-i={i} cx={fx} cy={fy} r={5} style={{ fill: 'var(--accent)' }} />
          <circle data-el="pr" data-i={i} cx={fx} cy={fy} r={5} style={{ fill: 'var(--accent)' }} />
        </g>
      ))}

      {/* step 2: 확대한 레이크 안 */}
      <g data-el="big">
        <Cyl x={220} y={272} w={412} h={404} ry={18} label={N7.lake.label} sub={N7.lake.sub} size={18} seed="p-big" />
        {F.files.map((f, k) => {
          const [x, y] = FILES[k]
          const w = tw(f.name, 12)
          return (
            <g key={f.name} data-el="file">
              <FileIcon x={x} y={y} w={FILE_W} h={FILE_H} seed={`p-f${k}`} dash={f.mark === 'broken' ? '5 4' : undefined} />
              <Txt x={x} y={y + FILE_H + 18} size={12} anchor="middle" mono>
                {f.name}
              </Txt>
              {f.mark === '?' && (
                <Txt x={x + FILE_W / 2 + 6} y={y + 6} size={20} weight={800}>
                  ?
                </Txt>
              )}
              {f.mark === 'broken' && (
                <g>
                  <Badge x={x + FILE_W / 2 + 2} y={y + 2} status="fail" r={10} />
                  <Txt x={x} y={y + FILE_H + 38} size={13} weight={700} anchor="middle">
                    {F.broken}
                  </Txt>
                </g>
              )}
              {f.mark === 'copy' && <Tag x={x + w / 2 + 10} y={y + FILE_H + 18} text={F.copy} anchor="start" />}
            </g>
          )
        })}
        <g data-el="ask">
          <rect x={232} y={12} width={198} height={38} rx={10} style={{ fill: 'var(--surface)' }} />
          <RRect x={232} y={12} w={198} h={38} seed="p-ask" rough={0.35} />
          <RPath d="M 286 50 L 278 64 L 300 50" seed="p-ask-t" rough={0.2} fill="var(--surface)" />
          <Txt x={331} y={36} size={13.5} weight={700} anchor="middle">
            {F.whichQ}
          </Txt>
        </g>
        <Cursor x={CURSOR[0][0]} y={CURSOR[0][1]} />
      </g>

      {/* step 3: 숫자 카드 둘과 저장 비용 */}
      <CountCard x={lake.x - 85} y={360} w={170} n={LAKE_COUNT} el="card-l" seed="p-cl" />
      <CountCard x={wh.x - 85} y={360} w={170} n={WH_COUNT} el="card-r" seed="p-cr" />
      <Txt x={220} y={394} size={30} weight={800} anchor="middle" el="neq">
        {F.neq}
      </Txt>
      <Meter
        x={PM.x}
        y={PM.y}
        h={PM.h}
        title={F.meter.title}
        el="meter"
        seed="p-meter"
        segs={[
          { len: PM.lake, label: F.meter.lake, el: 'seg-lake', fill: 'var(--wait)' },
          { len: PM.wh, label: F.meter.warehouse, el: 'seg-wh', fill: 'var(--ink)' },
        ]}
      />
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const fillL = o('ti-l-fill')
  const fillR = o('ti-r-fill')
  init(tl, [...fillL, ...fillR, ...o('pt'), ...o('pl'), ...o('pr'), ...o('big'), ...o('card-l'), ...o('card-r'), ...o('neq'), ...o('meter')], { opacity: 0 })
  init(tl, o('big'), { scale: 0.45, svgOrigin: `${P.lake.x} ${P.lake.y}` })

  // step 1: 입자가 갈림길에서 둘로 복제되어 양쪽 표에 똑같이 쌓인다
  const [fx, fy] = P.fork
  const waves = mobile ? 3 : P.rows
  for (let i = 0; i < P.rows; i++) {
    const pt = o('pt')[i]
    const pl = o('pl')[i]
    const pr = o('pr')[i]
    if (i >= waves) {
      // 모바일은 입자를 줄이고, 남은 칸은 그냥 채워 둔다
      tl.to([fillL[i], fillR[i]], { opacity: 1, duration: 0.04 }, at(0) + 0.66)
      continue
    }
    const t = at(0) + 0.06 + i * 0.17
    tl.to(pt, { opacity: 1, duration: 0.02 }, t)
    tl.to(pt, { y: fy - (P.app.y + P.app.h / 2 + 6), duration: 0.06, ease: 'none' }, t)
    tl.to(pt, { opacity: 0, duration: 0.01 }, t + 0.06)
    tl.to([pl, pr], { opacity: 1, duration: 0.01 }, t + 0.06)
    tl.to(pl, { x: 140 - fx, y: 190 - fy, duration: 0.05, ease: 'none' }, t + 0.06)
    tl.to(pr, { x: 300 - fx, y: 190 - fy, duration: 0.05, ease: 'none' }, t + 0.06)
    tl.to(pl, { x: P.lake.x - fx, y: iconRowY(i) - fy, duration: 0.05, ease: 'power1.out' }, t + 0.11)
    tl.to(pr, { x: P.wh.x - fx, y: iconRowY(i) - fy, duration: 0.05, ease: 'power1.out' }, t + 0.11)
    tl.to([pl, pr], { opacity: 0, duration: 0.02 }, t + 0.16)
    tl.to([fillL[i], fillR[i]], { opacity: 1, duration: 0.02 }, t + 0.155)
  }

  // step 2: 레이크 안을 들여다보면 파일이 어수선하다
  tl.to(o('s1'), { opacity: 0, duration: 0.14 }, at(1))
  tl.to(o('big'), { opacity: 1, scale: 1, duration: 0.24, ease: 'power2.out' }, at(1) + 0.04)
  const files = o('file')
  init(tl, files, { opacity: 0 })
  init(tl, [...o('ask'), ...o('cursor')], { opacity: 0 })
  files.forEach((f, k) => tl.to(f, { opacity: 1, duration: 0.06 }, at(1) + 0.24 + k * 0.05))
  tl.to(o('ask'), { opacity: 1, duration: 0.08 }, at(1) + 0.44)
  const cur = o('cursor')
  const [c0x, c0y] = CURSOR[0]
  tl.to(cur, { opacity: 1, duration: 0.04 }, at(1) + 0.48)
  CURSOR.slice(1).forEach(([x, y], k) => tl.to(cur, { x: x - c0x, y: y - c0y, duration: 0.07, ease: 'power1.inOut' }, at(1) + 0.53 + k * 0.08))

  // step 3: 처음 구도로 돌아와 답이 둘, 미터기는 두 구간을 지나 꼭대기까지
  tl.to(o('big'), { opacity: 0, duration: 0.12 }, at(2))
  tl.to(o('tags'), { opacity: 0, duration: 0.01 }, at(2))
  tl.to(o('s1'), { opacity: 1, duration: 0.14 }, at(2) + 0.08)
  tl.to([...o('card-l'), ...o('card-r')], { opacity: 1, duration: 0.1 }, at(2) + 0.2)
  tl.to(o('neq'), { opacity: 1, duration: 0.08 }, at(2) + 0.3)
  const segL = o('seg-lake')
  const segW = o('seg-wh')
  const needle = o('meter-needle')
  init(tl, [...segL, ...segW], { scaleY: 0, transformOrigin: '50% 100%' })
  init(tl, [...o('seg-lake-l'), ...o('seg-wh-l'), ...o('seg-lake-tick'), ...o('seg-wh-tick')], { opacity: 0 })
  init(tl, needle, { y: PM.lake + PM.wh })
  tl.to(o('meter'), { opacity: 1, duration: 0.08 }, at(2) + 0.36)
  tl.to(segL, { scaleY: 1, duration: 0.12, ease: 'none' }, at(2) + 0.44)
  tl.to(needle, { y: PM.wh, duration: 0.12, ease: 'none' }, at(2) + 0.44)
  tl.to([...o('seg-lake-l'), ...o('seg-lake-tick')], { opacity: 1, duration: 0.05 }, at(2) + 0.52)
  tl.to(segW, { scaleY: 1, duration: 0.12, ease: 'none' }, at(2) + 0.57)
  tl.to(needle, { y: 0, duration: 0.12, ease: 'none' }, at(2) + 0.57)
  tl.to([...o('seg-wh-l'), ...o('seg-wh-tick')], { opacity: 1, duration: 0.05 }, at(2) + 0.65)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — 동기화 작업 하나 더
// ─────────────────────────────────────────────────────────────
const A = {
  orch: { x: 220, y: 44 },
  lake: { x: 78, y: 190 },
  wh: { x: 362, y: 190 },
  sync: { x: 220, y: 190, w: 100, h: 76 },
  node: { w: 128, h: 110 },
  cardY: 262,
  step: 18,
}
const CELL = { w: 100, h: 50, gap: 8, y1: 320, y2: 400 }
const cellXY = (k: number) => (k < 4 ? [10 + k * (CELL.w + CELL.gap), CELL.y1] : [10 + (k - 4) * (CELL.w + CELL.gap), CELL.y2])

export function AttemptFig() {
  const { lake, wh, sync, node } = A
  const sx0 = sync.x - sync.w / 2
  const sx1 = sync.x + sync.w / 2
  return (
    <Fig>
      <Node x={A.orch.x} y={A.orch.y} w={176} h={50} label={N7.orch.label} sub={N7.orch.sub} kind="control" seed="a-orch" />
      <g data-el="lake">
        <Cyl x={lake.x} y={lake.y} w={node.w} h={node.h} ry={9} label={N7.lake.label} sub={N7.lake.sub} size={14} seed="a-lake" />
      </g>
      <g data-el="wh">
        <Cyl x={wh.x} y={wh.y} w={node.w} h={node.h} ry={9} label={N7.warehouse.label} sub={N7.warehouse.sub} size={14} seed="a-wh" />
      </g>

      {/* step 1: 동기화 노드와 화살표 */}
      <g data-el="sync">
        <rect x={sx0} y={sync.y - sync.h / 2} width={sync.w} height={sync.h} rx={4} style={{ fill: 'var(--surface)' }} />
        <RRect x={sx0} y={sync.y - sync.h / 2} w={sync.w} h={sync.h} seed="a-sync" rough={0.5} />
        <Clock x={sync.x} y={sync.y - 18} seed="a-clock" />
        <Txt x={sync.x} y={sync.y + 13} size={15} weight={700} anchor="middle">
          {F.sync}
        </Txt>
        <Txt x={sync.x} y={sync.y + 30} size={12} anchor="middle" muted el="sync-sub">
          {F.syncSub}
        </Txt>
      </g>
      <Arrow x1={A.orch.x} y1={A.orch.y + 27} x2={sync.x} y2={sync.y - sync.h / 2 - 5} seed="a-ctl" dash="3 6" el="a-ctl" />
      <Arrow x1={lake.x + node.w / 2 + 2} y1={lake.y} x2={sx0 - 4} y2={sync.y} seed="a-ls" el="a-ls" />
      <Arrow x1={sx1 + 2} y1={sync.y} x2={wh.x - node.w / 2 - 4} y2={wh.y} seed="a-sw" el="a-sw" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} data-el="sp" cx={lake.x} cy={lake.y + 18} r={5} style={{ fill: 'var(--accent)' }} />
      ))}

      {/* 숫자 카드 */}
      <CountCard x={lake.x - node.w / 2} y={A.cardY} n={LAKE_COUNT} el="card-l" seed="a-cl" />
      <CountCard x={wh.x - node.w / 2} y={A.cardY} n={WH_COUNT} alt={WH_COUNT} el="card-r" seed="a-cr" />
      <Txt x={220} y={296} size={30} weight={800} anchor="middle" el="neq">
        {F.neq}
      </Txt>
      <Txt x={220} y={296} size={30} weight={800} anchor="middle" el="eq">
        {F.eq}
      </Txt>

      {/* step 2: 시간표 */}
      <g data-el="timeline">
        {F.hours.map((c, k) => {
          const [x, y] = cellXY(k)
          return (
            <g key={c.h} data-el="cell">
              <rect x={x} y={y} width={CELL.w} height={CELL.h} rx={4} style={{ fill: 'var(--surface)' }} />
              <RRect x={x} y={y} w={CELL.w} h={CELL.h} seed={`a-cell${k}`} rough={0.35} />
              <Txt x={x + 10} y={y + 19} size={13.5} weight={750}>
                {c.h}
              </Txt>
              <StatusText x={x + 8} y={y + 40} status={c.s as Status} text={c.l} size={12.5} r={8} />
              {/* 칸 바로 아래에 붙여, 아래 줄 칸이 아니라 이 칸의 표시로 읽히게 한다 */}
              {(c.s === 'fail' || c.s === 'wait') && (
                <Txt x={x + CELL.w / 2} y={y + CELL.h + 15} size={17} weight={800} anchor="middle" el="cell-neq">
                  {F.neq}
                </Txt>
              )}
            </g>
          )
        })}
      </g>

      {/* step 3: 지켜볼 작업, 알림, 두 벌 → 한 벌? */}
      <Tag x={sync.x} y={132} text={F.watch} size={12.5} el="watch" fill="var(--surface)" />
      <Txt x={220} y={266} size={17} weight={800} anchor="middle" el="two-one">
        {F.twoToOne}
      </Txt>
      <g data-el="alert">
        <Node x={104} y={400} w={168} h={54} label={N7.alert.label} sub={N7.alert.sub} kind="control" seed="a-alert" />
        {F.alerts.map((a, k) => (
          <Card key={a.l} x={172 + k * 14} y={358 + k * 32} w={226} h={36} seed={`a-al${k}`}>
            <StatusText x={184 + k * 14} y={381 + k * 32} status={a.s as Status} text={a.l} size={13.5} r={9} weight={700} />
          </Card>
        ))}
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const arrows = ['a-ctl', 'a-ls', 'a-sw'].map((n) => o(n))
  init(tl, [...o('sync'), ...o('sp'), ...o('eq'), ...o('watch'), ...o('two-one'), ...o('alert'), ...o('timeline')], { opacity: 0 })
  // 제어 화살표(점선)는 drawSVG가 점선 무늬를 덮어쓰므로 나타나기만 한다
  init(tl, arrows[0], { opacity: 0 })
  arrows.slice(1).forEach((a) => hideArrow(tl, a))
  init(tl, o('sync'), { scale: 0.85, svgOrigin: `${A.sync.x} ${A.sync.y}` })

  // step 1: 동기화가 생기고 입자 한 무리가 레이크 → 동기화 → 웨어하우스로 한 번 흐른다
  const s1 = at(0)
  tl.to(o('sync'), { opacity: 1, scale: 1, duration: 0.12 }, s1 + 0.04)
  tl.to(arrows[0], { opacity: 1, duration: 0.1 }, s1 + 0.14)
  drawArrow(tl, arrows[1], s1 + 0.2, 0.06)
  drawArrow(tl, arrows[2], s1 + 0.24, 0.06)
  const n = mobile ? 4 : 6
  o('sp').forEach((p, i) => {
    if (i >= n) return
    const t = s1 + 0.34 + i * 0.03
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: A.sync.x - A.lake.x, y: -18, duration: 0.1, ease: 'power1.inOut' }, t)
    tl.to(p, { x: A.wh.x - A.lake.x, y: 0, duration: 0.1, ease: 'power1.inOut' }, t + 0.11)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.2)
  })
  const arrive = s1 + 0.34 + (n - 1) * 0.03 + 0.21
  countTo(tl, o('card-r-n')[0], WH_COUNT, LAKE_COUNT, F.count, arrive - 0.06, 0.08)
  tl.to(o('neq'), { opacity: 0, duration: 0.05 }, arrive)
  tl.to(o('eq'), { opacity: 1, duration: 0.05 }, arrive)

  // step 2: 시간표가 한 칸씩 채워지고, ✕·⏸ 칸에서만 숫자가 다시 갈라진다
  const s2 = at(1)
  const cells = o('cell')
  tl.to(o('timeline'), { opacity: 1, duration: 0.02 }, s2)
  init(tl, cells, { opacity: 0 })
  const cards = [...o('card-l'), ...o('card-r')]
  // 동기화가 실패·지연된 칸에선 웨어하우스 숫자가 옛 값에 머문다(같은 숫자 사이에 ≠가 뜨지 않게)
  const curR = o('card-r-n')
  const oldR = o('card-r-alt')
  init(tl, oldR, { opacity: 0 })
  F.hours.forEach((c, k) => {
    const t = s2 + 0.06 + k * 0.1
    tl.to(cells[k], { opacity: 1, duration: 0.05 }, t)
    if (c.s === 'fail' || c.s === 'wait') {
      tl.to(o('eq'), { opacity: 0, duration: 0.03 }, t + 0.03)
      tl.to(o('neq'), { opacity: 1, duration: 0.03 }, t + 0.03)
      tl.to(curR, { opacity: 0, duration: 0.03 }, t + 0.03)
      tl.to(oldR, { opacity: 1, duration: 0.03 }, t + 0.03)
      tl.to(o('card-l'), { x: -7, duration: 0.04 }, t + 0.03)
      tl.to(o('card-r'), { x: 7, duration: 0.04 }, t + 0.03)
    } else if (k > 0 && (F.hours[k - 1].s === 'fail' || F.hours[k - 1].s === 'wait')) {
      tl.to(o('neq'), { opacity: 0, duration: 0.03 }, t + 0.03)
      tl.to(o('eq'), { opacity: 1, duration: 0.03 }, t + 0.03)
      tl.to(oldR, { opacity: 0, duration: 0.03 }, t + 0.03)
      tl.to(curR, { opacity: 1, duration: 0.03 }, t + 0.03)
      tl.to(cards, { x: 0, duration: 0.04 }, t + 0.03)
    }
  })

  // step 3: 동기화는 흐려지고, 두 저장소가 가운데로 한 칸씩 다가간다
  const s3 = at(2)
  tl.to([...o('timeline'), ...cards, ...o('eq'), ...o('neq')], { opacity: 0, duration: 0.12 }, s3)
  // 흐려도 '동기화' 글자와 제어 화살표는 읽혀야 한다(0.7 → 4.5:1 이상). 흐린 보조 글자는 대비가 모자라 지운다
  tl.to([...o('sync'), ...arrows[0]], { opacity: 0.7, duration: 0.16 }, s3 + 0.08)
  tl.to(o('sync-sub'), { opacity: 0, duration: 0.16 }, s3 + 0.08)
  tl.to([...arrows[1], ...arrows[2]], { opacity: 0, duration: 0.16 }, s3 + 0.08)
  tl.to(o('watch'), { opacity: 1, duration: 0.1 }, s3 + 0.16)
  tl.to(o('alert'), { opacity: 1, duration: 0.12 }, s3 + 0.22)
  tl.to(o('lake'), { x: A.step, duration: 0.2, ease: 'power2.inOut' }, s3 + 0.36)
  tl.to(o('wh'), { x: -A.step, duration: 0.2, ease: 'power2.inOut' }, s3 + 0.36)
  tl.to(o('two-one'), { opacity: 1, duration: 0.12 }, s3 + 0.54)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 정수장 하나, 파일 위의 목록 하나
// ─────────────────────────────────────────────────────────────
type Pt = [number, number]
const W_START: Pt = [36, 204]
const PIPE1: Pt = [157, 158]
const TANK: Pt = [220, 180]
const PIPE2: Pt = [284, 158]
// 물 입자의 마지막 자리: 원수 4 · 정수 4 · 생수 4
const DROPS: { to: Pt; zone: 0 | 1 | 2 }[] = [
  { to: [50, 200], zone: 0 },
  { to: [74, 214], zone: 0 },
  { to: [100, 196], zone: 0 },
  { to: [124, 210], zone: 0 },
  { to: [196, 166], zone: 1 },
  { to: [240, 176], zone: 1 },
  { to: [204, 190], zone: 1 },
  { to: [236, 196], zone: 1 },
  { to: [316, 222], zone: 2 },
  { to: [354, 218], zone: 2 },
  { to: [392, 224], zone: 2 },
  { to: [354, 200], zone: 2 },
]
const ZONE_COLOR = [WATER.raw, WATER.pure, WATER.clear]
const BOTTLES = [316, 354, 392]

// step 2 파일 자리
const IN_X = [130, 310]
const OUT_X = [84, 224, 362]
const IN_Y = 226
const OUT_Y = 324
// step 3 좌우 비교
const CMP = [112, 328]

/** 버려진 파일 이름은 두 줄(이름 / .확장자): 모바일 글자 하한에서 140 간격의 이웃 라벨과 겹치지 않게 */
function NameLines({ x, name }: { x: number; name: string }) {
  const dot = name.lastIndexOf('.')
  return (
    <>
      <tspan x={x}>{name.slice(0, dot)}</tspan>
      <tspan x={x} dy="1.2em">
        {name.slice(dot)}
      </tspan>
    </>
  )
}

function Bottle({ x, seed }: { x: number; seed: string }) {
  return <RPath d={`M ${x - 5} 166 L ${x + 5} 166 L ${x + 5} 178 Q ${x + 13} 184 ${x + 13} 194 L ${x + 13} 236 Q ${x + 13} 240 ${x + 9} 240 L ${x - 9} 240 Q ${x - 13} 240 ${x - 13} 236 L ${x - 13} 194 Q ${x - 13} 184 ${x - 5} 178 Z`} seed={seed} rough={0.3} fill="var(--bg)" />
}

/** step 3 한쪽 칸: 쓰다 실패(ok=false) 또는 쓰기 성공(ok=true) */
function WriteSide({ ok }: { ok: boolean }) {
  const cx = CMP[ok ? 1 : 0]
  const s = ok ? 'r' : 'l'
  const fx = cx + 30
  const fy = 266
  const fw = 36
  const fh = 46
  const f = 10
  const outline: Pt[] = [
    [fx - fw / 2, fy + fh],
    [fx - fw / 2, fy],
    [fx + fw / 2 - f, fy],
    [fx + fw / 2, fy + f],
    [fx + fw / 2, fy + fh],
    [fx - fw / 2, fy + fh],
  ]
  // 실패한 쪽: 위에서부터 반쯤만 그려진 점선(아래 절반은 없음)
  const half: Pt[] = [
    [fx - fw / 2, fy + fh * 0.55],
    [fx - fw / 2, fy],
    [fx + fw / 2 - f, fy],
    [fx + fw / 2, fy + f],
    [fx + fw / 2, fy + fh * 0.55],
  ]
  return (
    <g data-el={`side-${s}`}>
      <Txt x={cx} y={40} size={16} weight={800} anchor="middle">
        {ok ? F.writeOk : F.writeFail}
      </Txt>
      <Card x={cx - 90} y={58} w={180} h={76} seed={`c-meta-${s}`}>
        <Txt x={cx} y={82} size={13} anchor="middle" muted>
          {F.table}
        </Txt>
        <Txt x={cx} y={116} size={21} weight={800} anchor="middle" el={`ver-${s}`}>
          {F.v2}
        </Txt>
        {ok && (
          <Txt x={cx} y={116} size={21} weight={800} anchor="middle" el="ver-r3">
            {F.v3}
          </Txt>
        )}
      </Card>
      <g transform={`translate(${cx - 92} ${180})`}>
        <Avatar who="daon" size={32} />
      </g>
      <Arrow x1={cx - 76} y1={176} x2={cx - 76} y2={140} seed={`c-read-${s}`} el={`read-${s}`} />
      <g data-el={`res-${s}`}>
        <StatusText x={cx - 52} y={201} status="ok" text={F.readV2} size={13.5} r={9} weight={700} />
      </g>
      {ok && (
        <g data-el="res-r3">
          <StatusText x={cx - 52} y={201} status="ok" text={F.readV3} size={13.5} r={9} weight={700} />
        </g>
      )}
      {/* 파일 줄 */}
      <FileIcon x={cx - 70} y={fy + 6} w={28} h={40} seed={`c-p1-${s}`} />
      <FileIcon x={cx - 32} y={fy + 6} w={28} h={40} seed={`c-p2-${s}`} />
      {ok ? (
        <g>
          <path d={`M ${outline.map((p) => p.join(' ')).join(' L ')} Z`} data-el="p3-fill" style={{ fill: 'var(--surface)' }} />
          <g data-el="p3-draw">
            <RPath d={`M ${outline.map((p) => p.join(' ')).join(' L ')} M ${fx + fw / 2 - f} ${fy} L ${fx + fw / 2 - f} ${fy + f} L ${fx + fw / 2} ${fy + f}`} seed="c-p3" rough={0.35} strokeWidth={2} />
          </g>
        </g>
      ) : (
        <DashTrace pts={half} el="p3-dash" width={2} dash={5} gap={4} />
      )}
      <Txt x={fx} y={fy + fh + 20} size={12} anchor="middle" mono>
        {F.part3}
      </Txt>
      <RLine x1={cx - 96} y1={fy + fh + 30} x2={cx + 96} y2={fy + fh + 30} seed={`c-floor-${s}`} rough={0.3} strokeWidth={1} />
      {!ok && (
        <g data-el="fail-l">
          <Badge x={fx + fw / 2 + 4} y={fy - 2} status="fail" r={10} />
          <StatusText x={cx - 44} y={fy + fh + 54} status="fail" text={F.failed} size={13.5} r={9} weight={750} />
        </g>
      )}
    </g>
  )
}

export function ConceptFig() {
  const P2 = F.parts
  const cols: MCol[] = [
    { key: 'id', label: F.schemaCols.id, w: 92 },
    { key: 'amount', label: F.schemaCols.amount, w: 100, end: true },
  ]
  const ST = { x: 100, y: 150, headH: 44, rowH: 48 }
  const SL = tableLayout(ST.x, ST.y, cols, 4, ST.headH, ST.rowH)
  const cx0 = ST.x + SL.width
  const cw = 132
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-2" className="col-start-1 row-start-1">
            {F.metaNote}
          </span>
          <span data-el="cap-3" className="col-start-1 row-start-1">
            {F.acidNote}
          </span>
          <span data-el="cap-4" className="col-start-1 row-start-1">
            {F.schemaNote}
          </span>
        </span>
      }
    >
      {/* step 1: 정수 시설 */}
      <g data-el="plant">
        <rect x={14} y={96} width={412} height={178} rx={6} style={{ fill: 'var(--surface)' }} />
        <RRect x={14} y={96} w={412} h={178} seed="c-plant" rough={0.5} />
        <RPath d="M 26 168 L 26 240 L 142 240 L 142 168" seed="c-basin" rough={0.4} />
        {[186, 204, 222].map((y, k) => (
          <path key={y} d={`M 32 ${y} q 9 -6 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 12 0`} style={{ fill: 'none', stroke: WATER.raw }} strokeWidth={2.4} strokeLinecap="round" data-k={k} />
        ))}
        <rect x={172} y={124} width={96} height={116} style={{ fill: 'var(--bg)' }} />
        <RRect x={172} y={124} w={96} h={116} seed="c-tank" rough={0.4} />
        <RLine x1={176} y1={208} x2={264} y2={208} seed="c-f1" rough={0.2} dash="4 4" strokeWidth={1.2} />
        <RLine x1={176} y1={222} x2={264} y2={222} seed="c-f2" rough={0.2} dash="2 4" strokeWidth={1.2} />
        {BOTTLES.map((x, k) => (
          <Bottle key={x} x={x} seed={`c-b${k}`} />
        ))}
        <RArrow x1={144} y1={PIPE1[1]} x2={170} y2={PIPE1[1]} seed="c-pipe1" rough={0.4} />
        <RArrow x1={270} y1={PIPE2[1]} x2={298} y2={PIPE2[1]} seed="c-pipe2" rough={0.4} />
        <Txt x={84} y={262} size={14} weight={750} anchor="middle">
          {F.raw}
        </Txt>
        <Txt x={220} y={262} size={14} weight={750} anchor="middle">
          {F.purify}
        </Txt>
        <Txt x={354} y={262} size={14} weight={750} anchor="middle">
          {F.bottled}
        </Txt>
        {/* 시설 바깥: 따로 쌓아 트럭으로 나르는 길(장면 3의 동기화와 같은 모양) */}
        <g data-el="oldway" style={{ color: 'var(--muted)', opacity: 0.8 }}>
          <REllipse cx={74} cy={352} w={96} h={34} seed="c-res" rough={0.4} />
          <RPath d="M 44 352 q 8 -5 16 0 t 16 0 t 16 0 t 14 0" seed="c-res-w" rough={0.2} strokeWidth={1.2} />
          <RArrow x1={128} y1={352} x2={160} y2={352} seed="c-ow1" rough={0.4} />
          <RRect x={166} y={332} w={58} h={32} seed="c-truck" rough={0.4} />
          <RRect x={224} y={342} w={26} h={22} seed="c-cab" rough={0.4} />
          <REllipse cx={184} cy={368} w={12} h={12} seed="c-w1" rough={0.3} />
          <REllipse cx={236} cy={368} w={12} h={12} seed="c-w2" rough={0.3} />
          <RArrow x1={258} y1={352} x2={292} y2={352} seed="c-ow2" rough={0.4} />
          <RPath d="M 300 372 L 300 340 L 336 322 L 372 340 L 372 372 Z M 326 372 L 326 354 L 346 354 L 346 372" seed="c-depot" rough={0.4} />
          {F.oldWay.map((l, k) => (
            <Txt key={l} x={[74, 208, 336][k]} y={402} size={13} anchor="middle" muted>
              {l}
            </Txt>
          ))}
        </g>
        <g data-el="strike">
          <RLine x1={22} y1={370} x2={418} y2={334} seed="c-strike" rough={0.3} strokeWidth={3.2} stroke="var(--fail)" />
        </g>
      </g>
      {DROPS.map((_, i) => (
        <circle key={i} data-el="drop" data-i={i} cx={W_START[0]} cy={W_START[1]} r={5.5} style={{ fill: WATER.raw }} />
      ))}

      {/* step 2: 오브젝트 스토리지 위의 파일과 목록 */}
      <g data-el="meta-scene">
        <path d="M 46 214 L 394 214 L 436 438 L 4 438 Z" style={{ fill: 'var(--surface)' }} />
        <RPath d="M 46 214 L 394 214 L 436 438 L 4 438 Z" seed="c-plate" rough={0.45} />
        <Txt x={220} y={460} size={13.5} weight={750} anchor="middle">
          {F.storage}
        </Txt>
        {P2.in.map((name, k) => (
          <g key={name} data-el="in-file">
            <FileIcon x={IN_X[k]} y={IN_Y} w={30} h={38} seed={`c-in${k}`} />
            <g data-el="in-bold">
              <FileIcon x={IN_X[k]} y={IN_Y} w={30} h={38} seed={`c-in${k}`} strokeWidth={2.8} />
            </g>
            <Txt x={IN_X[k]} y={IN_Y + 56} size={11.5} anchor="middle" mono>
              {name}
            </Txt>
          </g>
        ))}
        {P2.out.map((f, k) => (
          <g key={f.name} data-el="out-file">
            <g data-el="out-icon">
              <FileIcon x={OUT_X[k]} y={OUT_Y} w={30} h={38} seed={`c-out${k}`} dash={k === 2 ? '4 3' : undefined} />
            </g>
            <Txt x={OUT_X[k]} y={OUT_Y + 52} size={11} anchor="middle" mono el="out-ink">
              <NameLines x={OUT_X[k]} name={f.name} />
            </Txt>
            <Txt x={OUT_X[k]} y={OUT_Y + 52} size={11} anchor="middle" mono muted el="out-muted">
              <NameLines x={OUT_X[k]} name={f.name} />
            </Txt>
            <Tag x={OUT_X[k]} y={OUT_Y - 8} text={f.tag} size={11.5} el="out-tag" color="var(--muted)" />
          </g>
        ))}
        <g data-el="not-in">
          <RPath d="M 16 402 L 16 408 L 424 408 L 424 402" seed="c-brk" rough={0.2} strokeWidth={1.2} stroke="var(--muted)" />
          <RLine x1={220} y1={408} x2={220} y2={414} seed="c-brk2" rough={0.1} strokeWidth={1.2} stroke="var(--muted)" />
          <Txt x={220} y={429} size={12.5} weight={650} anchor="middle" muted>
            {F.notInTable}
          </Txt>
        </g>
        <g data-el="links">
          <RLine x1={170} y1={192} x2={IN_X[0] + 2} y2={IN_Y - 2} seed="c-ln1" rough={0.3} strokeWidth={1.8} />
          <RLine x1={270} y1={192} x2={IN_X[1] - 2} y2={IN_Y - 2} seed="c-ln2" rough={0.3} strokeWidth={1.8} />
        </g>
        <g data-el="sql">
          <rect x={60} y={10} width={84} height={34} rx={10} style={{ fill: 'var(--surface)' }} />
          <RRect x={60} y={10} w={84} h={34} seed="c-sql" rough={0.35} />
          <RPath d="M 92 44 L 98 54 L 108 44" seed="c-sql-t" rough={0.2} fill="var(--surface)" />
          <Txt x={102} y={33} size={15} weight={800} anchor="middle" mono>
            {F.sql}
          </Txt>
        </g>
        <g data-el="bi">
          <RRect x={292} y={8} w={56} h={38} seed="c-bi" rough={0.35} fill="var(--surface)" />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={302 + k * 13} y={36 - (k + 1) * 7} width={8} height={(k + 1) * 7} style={{ fill: 'var(--muted)' }} />
          ))}
          <RLine x1={320} y1={46} x2={320} y2={52} seed="c-bi-s" rough={0.1} />
          <Txt x={358} y={34} size={15} weight={800}>
            {F.bi}
          </Txt>
        </g>
        <Arrow x1={104} y1={58} x2={160} y2={92} seed="c-a-sql" el="a-sql" />
        <Arrow x1={318} y1={58} x2={282} y2={92} seed="c-a-bi" el="a-bi" />
        <Card x={110} y={94} w={220} h={98} seed="c-meta" el="meta">
          <Txt x={124} y={120} size={14.5} weight={800}>
            {F.metaTitle}
          </Txt>
          <RLine x1={124} y1={130} x2={316} y2={130} seed="c-meta-l" rough={0.2} strokeWidth={1} />
          {P2.in.map((name, k) => (
            <Txt key={name} x={130} y={152 + k * 24} size={13} mono>
              {`· ${name}`}
            </Txt>
          ))}
        </Card>
      </g>

      {/* step 3: 쓰다 실패 vs 쓰기 성공 */}
      <g data-el="cmp">
        <RLine x1={220} y1={20} x2={220} y2={392} seed="c-div" rough={0.2} dash="4 6" strokeWidth={1.2} />
        <WriteSide ok={false} />
        <WriteSide ok />
      </g>

      {/* step 4: 열 하나를 더해도 과거 파일은 그대로 */}
      <g data-el="schema">
        <Card x={70} y={22} w={300} h={78} seed="c-meta4">
          <Txt x={220} y={48} size={13} anchor="middle" muted>
            {F.table}
          </Txt>
          <Txt x={220} y={80} size={15} weight={800} anchor="middle" el="schema-line">
            {F.schemaChange}
          </Txt>
        </Card>
        <MiniTable
          x={ST.x}
          y={ST.y}
          cols={cols}
          rows={F.schemaRows.map((r) => ({ id: r.id, amount: r.amount }))}
          headH={ST.headH}
          rowH={ST.rowH}
          size={14}
          el="st"
          seed="c-st"
        />
        {[0, 2].map((i) => (
          <g key={i}>
            <RPath d={`M 92 ${SL.tops[i] + 6} L 86 ${SL.tops[i] + 6} L 86 ${SL.tops[i + 2] - 6} L 92 ${SL.tops[i + 2] - 6}`} seed={`c-src${i}`} rough={0.15} strokeWidth={1.2} stroke="var(--muted)" />
            <Txt x={78} y={SL.tops[i + 1] + 4.5} size={12.5} anchor="end" mono muted>
              {F.schemaRows[i].src}
            </Txt>
          </g>
        ))}
        {/* 새 열: 머리글 + 네 칸이 위에서 아래로 */}
        <g data-el="ncol">
          <rect data-el="ncell" x={cx0} y={ST.y} width={cw} height={ST.headH} style={{ fill: 'var(--surface)' }} />
          {F.schemaRows.map((_, i) => (
            <rect key={i} data-el="ncell" x={cx0} y={SL.tops[i]} width={cw} height={ST.rowH} style={{ fill: 'var(--surface)' }} />
          ))}
          <Txt x={cx0 + 10} y={ST.y + ST.headH / 2 + 4.6} size={13.3} weight={700} el="ntext">
            {F.schemaCols.coupon}
          </Txt>
          {F.schemaRows.map((r, i) => (
            <Txt key={i} x={cx0 + 10} y={SL.tops[i] + ST.rowH / 2 + 5} size={r.coupon ? 14 : 13} muted={!r.coupon} mono={Boolean(r.coupon)} el="ntext">
              {r.coupon || F.empty}
            </Txt>
          ))}
          {F.schemaRows.slice(1).map((_, i) => (
            <RLine key={i} x1={cx0} y1={SL.tops[i + 1]} x2={cx0 + cw} y2={SL.tops[i + 1]} seed={`c-nr${i}`} rough={0.2} strokeWidth={0.8} data-el="nline" />
          ))}
          <RLine x1={cx0} y1={ST.y + ST.headH} x2={cx0 + cw} y2={ST.y + ST.headH} seed="c-nh" rough={0.2} data-el="nline" />
          <g data-el="nbox">
            <RRect x={cx0} y={ST.y} w={cw} h={SL.tops[4] - ST.y} seed="c-nbox" rough={0.3} strokeWidth={2.8} />
          </g>
          <Tag x={cx0 + cw / 2} y={ST.y - 10} text={F.newCol} size={12.5} el="ntag" />
        </g>
      </g>
    </Fig>
  )
}

export const buildConcept: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  init(tl, [...o('meta-scene'), ...o('cmp'), ...o('schema'), ...o('cap-2'), ...o('cap-3'), ...o('cap-4')], { opacity: 0 })

  // step 1: 물이 한 시설 안에서 차례로 맑아진다. 바깥의 트럭 길에는 취소선만
  const s1 = at(0)
  const drops = o('drop')
  const use = mobile ? DROPS.map((_, i) => i % 2 === 0) : DROPS.map(() => true)
  init(tl, q('[data-el="strike"] path'), { drawSVG: '0%' })
  drops.forEach((p, i) => {
    const d = DROPS[i]
    init(tl, p, { opacity: 0, x: 0, y: 0, fill: WATER.raw })
    const t = s1 + 0.04 + i * 0.035
    const rel = ([x, y]: Pt) => ({ x: x - W_START[0], y: y - W_START[1] })
    tl.to(p, { opacity: 1, duration: 0.02 }, use[i] ? t : s1 + 0.5)
    if (!use[i]) {
      // 모바일에선 입자 절반만 흐르고 나머지는 제자리에 놓인다
      tl.set(p, { ...rel(d.to), fill: ZONE_COLOR[d.zone] }, s1 + 0.5)
      return
    }
    if (d.zone === 0) {
      tl.to(p, { ...rel(d.to), duration: 0.1, ease: 'power1.inOut' }, t)
      return
    }
    tl.to(p, { ...rel(PIPE1), duration: 0.08, ease: 'none' }, t)
    if (d.zone === 1) {
      tl.to(p, { ...rel(d.to), fill: WATER.pure, duration: 0.08, ease: 'power1.out' }, t + 0.08)
      return
    }
    tl.to(p, { ...rel(TANK), fill: WATER.pure, duration: 0.06, ease: 'none' }, t + 0.08)
    tl.to(p, { ...rel(PIPE2), duration: 0.06, ease: 'none' }, t + 0.14)
    tl.to(p, { ...rel(d.to), fill: WATER.clear, duration: 0.07, ease: 'power1.out' }, t + 0.2)
  })
  tl.to(q('[data-el="strike"] path'), { drawSVG: '100%', duration: 0.14, ease: 'none' }, s1 + 0.62)

  // step 2: 시설이 사라지고, 목록에 적힌 두 파일만 테이블이 된다
  const s2 = at(1)
  tl.to([...o('plant'), ...drops], { opacity: 0, duration: 0.12 }, s2)
  tl.to(o('meta-scene'), { opacity: 1, duration: 0.02 }, s2 + 0.1)
  const sceneParts = ['in-file', 'out-file', 'not-in', 'sql', 'bi', 'a-sql', 'a-bi', 'meta', 'links'].flatMap(o)
  init(tl, sceneParts, { opacity: 0 })
  init(tl, [...o('in-bold'), ...o('out-muted'), ...o('out-tag')], { opacity: 0 })
  init(tl, o('meta'), { y: -34 })
  init(tl, q('[data-el="links"] path'), { drawSVG: '0%' })
  tl.to([...o('in-file'), ...o('out-file')], { opacity: 1, duration: 0.08, stagger: 0.03 }, s2 + 0.12)
  tl.to(o('meta'), { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' }, s2 + 0.3)
  tl.to(o('links'), { opacity: 1, duration: 0.01 }, s2 + 0.46)
  tl.to(q('[data-el="links"] path'), { drawSVG: '100%', duration: 0.08, ease: 'none' }, s2 + 0.46)
  tl.to(o('in-bold'), { opacity: 1, duration: 0.08 }, s2 + 0.54)
  tl.to(o('out-icon'), { opacity: 0.45, duration: 0.08 }, s2 + 0.54)
  tl.to(o('out-ink'), { opacity: 0, duration: 0.08 }, s2 + 0.54)
  tl.to([...o('out-muted'), ...o('out-tag')], { opacity: 1, duration: 0.08 }, s2 + 0.54)
  tl.to(o('not-in'), { opacity: 1, duration: 0.08 }, s2 + 0.6)
  tl.to([...o('sql'), ...o('bi')], { opacity: 1, duration: 0.08 }, s2 + 0.64)
  tl.to([...o('a-sql'), ...o('a-bi')], { opacity: 1, duration: 0.08 }, s2 + 0.7)
  tl.to(o('cap-2'), { opacity: 1, duration: 0.1 }, s2 + 0.3)

  // step 3: 실패하면 목록은 v2 그대로, 성공해야 v3으로 한 번에 넘어간다
  const s3 = at(2)
  tl.to([...o('meta-scene'), ...o('cap-2')], { opacity: 0, duration: 0.12 }, s3)
  tl.to([...o('cmp'), ...o('cap-3')], { opacity: 1, duration: 0.12 }, s3 + 0.08)
  const dash = o('p3-dash')
  init(tl, dash, { opacity: 0 })
  init(tl, [...o('fail-l'), ...o('ver-r3'), ...o('res-r3'), ...o('p3-fill')], { opacity: 0 })
  init(tl, q('[data-el="p3-draw"] path'), { drawSVG: '0%' })
  tl.to(dash, { opacity: 1, duration: 0.01, stagger: 0.018 }, s3 + 0.2)
  tl.to(o('fail-l'), { opacity: 1, duration: 0.06 }, s3 + 0.2 + dash.length * 0.018 + 0.02)
  tl.to(q('[data-el="p3-draw"] path'), { drawSVG: '100%', duration: 0.18, ease: 'none' }, s3 + 0.42)
  tl.to(o('p3-fill'), { opacity: 1, duration: 0.04 }, s3 + 0.58)
  tl.to(o('ver-r'), { opacity: 0, duration: 0.03 }, s3 + 0.64)
  tl.to(o('ver-r3'), { opacity: 1, duration: 0.03 }, s3 + 0.64)
  tl.to(o('res-r'), { opacity: 0, duration: 0.04 }, s3 + 0.7)
  tl.to(o('res-r3'), { opacity: 1, duration: 0.04 }, s3 + 0.7)

  // step 4: 새 열이 위에서 아래로 한 칸씩 열린다. 과거 두 행의 값은 그대로
  const s4 = at(3)
  tl.to([...o('cmp'), ...o('cap-3')], { opacity: 0, duration: 0.12 }, s4)
  tl.to([...o('schema'), ...o('cap-4')], { opacity: 1, duration: 0.12 }, s4 + 0.08)
  const cells = o('ncell')
  const texts = o('ntext')
  init(tl, [...cells, ...texts, ...o('nline'), ...o('ntag'), ...o('schema-line')], { opacity: 0 })
  init(tl, q('[data-el="nbox"] path'), { drawSVG: '0%' })
  tl.to(o('ntag'), { opacity: 1, duration: 0.06 }, s4 + 0.24)
  tl.to(q('[data-el="nbox"] path'), { drawSVG: '100%', duration: 0.4, ease: 'none' }, s4 + 0.26)
  cells.forEach((c, i) => {
    const t = s4 + 0.28 + i * 0.08
    tl.to([c, texts[i]], { opacity: 1, duration: 0.06 }, t)
  })
  tl.to(o('nline'), { opacity: 1, duration: 0.06 }, s4 + 0.3)
  tl.to(o('schema-line'), { opacity: 1, duration: 0.08 }, s4 + 0.7)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 개념 — 쇼핑몰 예시: 메달리온 세 층
// ─────────────────────────────────────────────────────────────
const LY = {
  gold: { x: 10, y: 48, w: 296, h: 78 },
  silver: { x: 10, y: 152, w: 420, h: 144 },
  bronze: { x: 10, y: 300, w: 420, h: 178 },
}
const BT = { x: 84, y: 326, headH: 21, rowH: 21 }
/** Bronze 표 왼쪽 '처리됨' ✓ 열의 가운데 x */
const DONE_X = BT.x - 22
const BCOLS: MCol[] = [
  { key: 'id', label: F.medCols.id, w: 70 },
  { key: 'status', label: F.medCols.status, w: 76 },
  { key: 'amount', label: F.medCols.amount, w: 96, end: true },
]
const BL = tableLayout(BT.x, BT.y, BCOLS, 6, BT.headH, BT.rowH)
const brow = (i: number) => (BL.tops[i] + BL.tops[i + 1]) / 2
const ST5 = { x: 138, y: 176, headH: 22, rowH: [38, 26, 26] }
const SCOLS: MCol[] = [
  { key: 'id', label: F.medCols.id, w: 60 },
  { key: 'status', label: F.medCols.status, w: 130 },
  { key: 'amount', label: F.medCols.amount, w: 58, end: true },
]
const SL5 = tableLayout(ST5.x, ST5.y, SCOLS, 3, ST5.headH, ST5.rowH)
const SW = SL5.width
const scell = (i: number) => SL5.tops[i] + Math.min(SL5.tops[i + 1] - SL5.tops[i], 26) * 0.5
const CARD5 = { x: 14, w: 118, h: 33, y: (k: number) => 180 + k * 37 }
// 위쪽 작은 노드 줄: 앱 → 이벤트 브로커 ← CDC ← 운영 DB
const SRC = [
  { id: 'app', x: 8, w: 96 },
  { id: 'kafka', x: 132, w: 104 },
  { id: 'cdc', x: 266, w: 60 },
  { id: 'oltp', x: 356, w: 76 },
]
const SRC_Y = 6
const SRC_H = 30
const KAFKA_OUT: Pt = [184, SRC_Y + SRC_H + 2]

function Layer({ k, label, like, dashed, el }: { k: keyof typeof LY; label: string; like: string; dashed?: boolean; el: string }) {
  const r = LY[k]
  const c = LAYER[k]
  return (
    <g data-el={el}>
      {!dashed && <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} style={{ fill: c.fill }} />}
      <RRect x={r.x} y={r.y} w={r.w} h={r.h} seed={`m-${k}${dashed ? '-d' : ''}`} rough={0.35} stroke={dashed ? 'var(--muted)' : c.edge} strokeWidth={dashed ? 1.3 : k === 'gold' ? 3.2 : 2} dash={dashed ? '6 6' : undefined} />
      {!dashed && (
        <g>
          <Txt x={r.x + 12} y={r.y + 19} size={13.5} weight={800} color={c.text}>
            {label}
          </Txt>
          <Txt x={r.x + r.w - 12} y={r.y + 19} size={13.5} weight={750} anchor="end" color={c.text}>
            {like}
          </Txt>
        </g>
      )}
    </g>
  )
}

export function MedallionFig() {
  const tagsX = BT.x + BL.width + 18
  const sRows = F.silverAfter.map((r, i) => (i === 0 ? { ...r, status: '' } : r))
  const s0 = SL5.tops[0]
  const statusX = SL5.textX(1)
  return (
    <Fig
      caption={
        <span className="grid">
          <span data-el="cap-1" className="col-start-1 row-start-1">
            {F.layersNote}
          </span>
          <span data-el="cap-3" className="col-start-1 row-start-1">
            {F.mergeNote}
          </span>
          <span data-el="cap-4" className="col-start-1 row-start-1">
            {F.goldNote}
          </span>
        </span>
      }
    >
      {/* 위쪽 작은 노드 줄 */}
      <g data-el="src">
        {SRC.map((s) => (
          <g key={s.id}>
            <rect x={s.x} y={SRC_Y} width={s.w} height={SRC_H} rx={s.id === 'app' ? 10 : 3} style={{ fill: 'var(--surface)' }} />
            <RRect x={s.x} y={SRC_Y} w={s.w} h={SRC_H} seed={`m-src-${s.id}`} rough={0.4} />
            <Txt x={s.x + s.w / 2} y={SRC_Y + 20} size={13} weight={700} anchor="middle">
              {N7[s.id].label}
            </Txt>
          </g>
        ))}
        <RArrow x1={106} y1={21} x2={128} y2={21} seed="m-s1" rough={0.3} head={7} />
        <RArrow x1={262} y1={21} x2={240} y2={21} seed="m-s2" rough={0.3} head={7} />
        <RArrow x1={352} y1={21} x2={330} y2={21} seed="m-s3" rough={0.3} head={7} />
        <RArrow x1={KAFKA_OUT[0]} y1={KAFKA_OUT[1] + 2} x2={KAFKA_OUT[0]} y2={LY.bronze.y - 4} seed="m-s-b" rough={0.3} head={7} />
      </g>

      {/* 빈 자리(점선) → 채워진 층 */}
      <Layer k="gold" label="" like="" dashed el="slot-gold" />
      <Layer k="silver" label="" like="" dashed el="slot-silver" />
      <Layer k="bronze" label={F.layers.bronze} like={F.likeRaw} el="bronze" />
      <Layer k="silver" label={F.layers.silver} like={F.likePure} el="silver" />
      <Layer k="gold" label={F.layers.gold} like={F.likeBottled} el="gold" />

      {/* Bronze: 원본 주문 이벤트 6행 */}
      <MiniTable x={BT.x} y={BT.y} cols={BCOLS} rows={F.bronzeRows} headH={BT.headH} rowH={BT.rowH} size={12.5} el="bt" seed="m-bt" />
      {F.bronzeRows.map((r, i) =>
        r.tag ? (
          <Txt key={i} x={tagsX} y={brow(i) + 4.5} size={12.5} weight={750} color={LAYER.bronze.text} el="btag">
            {r.tag}
          </Txt>
        ) : null,
      )}
      <Txt x={DONE_X} y={BT.y + BT.headH / 2 + 4.2} size={12} weight={700} anchor="middle" color={LAYER.bronze.text} el="bcheck-l">
        {F.processed}
      </Txt>
      {[0, 1, 2].map((i) => (
        <Badge key={i} x={DONE_X} y={brow(i)} status="ok" r={8} el="bcheck" />
      ))}
      <line data-el="bstrike" x1={BT.x + 4} y1={brow(1)} x2={BT.x + BL.width - 4} y2={brow(1)} style={{ stroke: 'var(--fail)' }} strokeWidth={2.2} />
      <g data-el="bto-s">
        {/* 표 오른쪽 바깥으로 올라가 위 행들의 글자를 가로지르지 않는다. 층 바탕마다 보이는 선 색으로 나눠 그린다 */}
        <RLine x1={BT.x + BL.width + 9} y1={brow(2) - 2} x2={BT.x + BL.width + 9} y2={LY.bronze.y} seed="m-fmt-b" rough={0.2} strokeWidth={1.4} stroke={LAYER.bronze.text} />
        <RArrow x1={BT.x + BL.width + 9} y1={LY.bronze.y} x2={BT.x + BL.width + 9} y2={SL5.tops[2] + 4} seed="m-fmt" rough={0.2} strokeWidth={1.4} head={6} stroke={LAYER.silver.text} />
      </g>

      {/* Silver: 정제된 표(1001 행은 이력 자리까지 높게) */}
      <MiniTable x={ST5.x} y={ST5.y} cols={SCOLS} rows={sRows} headH={ST5.headH} rowH={ST5.rowH} size={12.5} el="stb" seed="m-st" split={2} valign="top" />
      {[F.silverRows[0].status, F.shipping, F.silverAfter[0].status].map((s, k) => (
        <text key={k} data-el={`s0-st${k}`} x={statusX} y={s0 + 18} className="t-sans" style={{ fontSize: 12.5 }}>
          {s}
        </text>
      ))}
      <Txt x={statusX} y={s0 + 32} size={11} muted el="hist">
        {F.history}
      </Txt>
      <Tag x={ST5.x + SW + 5} y={scell(0) + 4.5} text={F.fixed} size={11.5} anchor="start" el="t-fixed" fill="var(--surface)" />
      <Tag x={ST5.x + SW + 5} y={scell(2) + 4.5} text={F.inserted} size={11.5} anchor="start" el="t-ins" fill="var(--surface)" />

      {/* Silver 왼쪽: Bronze 4~6행에서 온 변경 카드 */}
      {F.changes.map((c, k) => (
        <g key={c.card} data-el="chg" data-dy={brow(3 + k) - (CARD5.y(k) + CARD5.h / 2)} data-dx={BT.x + 60 - (CARD5.x + CARD5.w / 2)}>
          <Card x={CARD5.x} y={CARD5.y(k)} w={CARD5.w} h={CARD5.h} seed={`m-chg${k}`}>
            <Txt x={CARD5.x + 9} y={CARD5.y(k) + 14.5} size={13} weight={750}>
              {c.card}
            </Txt>
            <Txt x={CARD5.x + 9} y={CARD5.y(k) + 28.5} size={11.5} weight={650} el="verdict">
              {c.verdict}
            </Txt>
          </Card>
        </g>
      ))}
      {[0, 1, 2, 2].map((k, i) => {
        const target = k === 1 ? 2 : 0
        return (
          <g key={i} data-el="mover" data-dx={ST5.x + 26 - (CARD5.x + CARD5.w - 10)} data-dy={scell(target) - (CARD5.y(k) + CARD5.h / 2)}>
            <rect x={CARD5.x + CARD5.w - 22} y={CARD5.y(k) + CARD5.h / 2 - 7} width={24} height={14} rx={3} style={{ fill: 'var(--accent)' }} />
          </g>
        )
      })}

      {/* Gold: 집계와 대시보드 */}
      <g data-el="gold-in">
        <Txt x={LY.gold.x + 12} y={LY.gold.y + 46} size={16.5} weight={850} color={LAYER.gold.text} el="gold-net">
          {F.goldNet}
        </Txt>
        <Txt x={LY.gold.x + 12} y={LY.gold.y + 67} size={13} weight={650} color={LAYER.gold.text}>
          {F.goldCalc}
        </Txt>
      </g>
      <g data-el="xf">
        <RArrow x1={110} y1={LY.silver.y - 2} x2={110} y2={LY.gold.y + LY.gold.h + 3} seed="m-xf" rough={0.3} head={7} />
        <Tag x={122} y={LY.silver.y - 7} text={F.transform} size={11.5} anchor="start" fill="var(--surface)" />
      </g>
      <g data-el="dash">
        <RArrow x1={LY.gold.x + LY.gold.w + 4} y1={87} x2={338} y2={87} seed="m-gd" rough={0.3} head={7} />
        <RRect x={344} y={62} w={78} h={50} seed="m-dash" rough={0.35} fill="var(--surface)" />
        {[0.5, 0.8, 0.35, 0.65].map((v, k) => (
          <rect key={k} x={354 + k * 16} y={104 - v * 32} width={10} height={v * 32} style={{ fill: 'var(--muted)' }} />
        ))}
        <RLine x1={383} y1={112} x2={383} y2={120} seed="m-dash-s" rough={0.1} />
        <Txt x={383} y={138} size={13} weight={700} anchor="middle">
          {F.dashboard}
        </Txt>
      </g>

      {/* 입자 */}
      {F.bronzeRows.map((_, i) => (
        <circle key={i} data-el="bp" cx={KAFKA_OUT[0]} cy={KAFKA_OUT[1]} r={5} style={{ fill: 'var(--accent)' }} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} data-el="up" cx={BT.x + 40} cy={brow(i)} r={5} style={{ fill: 'var(--accent)' }} />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} data-el="gp" cx={ST5.x + SW - 24} cy={scell(i)} r={5} style={{ fill: 'var(--accent)' }} />
      ))}
    </Fig>
  )
}

export const buildMedallion: SceneBuild = (q, tl) => {
  const o = pick(q)
  const later = ['silver', 'gold', 'stb', 'hist', 't-fixed', 't-ins', 'chg', 'mover', 'gold-in', 'xf', 'dash', 'up', 'gp', 'bcheck', 'bcheck-l', 'bstrike', 'bto-s', 'cap-3', 'cap-4', 's0-st1', 's0-st2', 'stb-extra']
  init(tl, later.flatMap(o), { opacity: 0 })
  const brows = F.bronzeRows.map((_, i) => q(`[data-el^="bt-c${i}-"]`))
  const btags = o('btag')
  init(tl, [...brows.flat(), ...btags], { opacity: 0 })

  // step 1: 브로커를 거친 입자가 내려와 Bronze에 한 줄씩 그대로 쌓인다
  const s1 = at(0)
  o('bp').forEach((p, i) => {
    init(tl, p, { opacity: 0, x: 0, y: 0 })
    const t = s1 + 0.08 + i * 0.1
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { y: LY.bronze.y - 6 - KAFKA_OUT[1], duration: 0.08, ease: 'none' }, t)
    tl.to(p, { x: BT.x + 40 - KAFKA_OUT[0], y: brow(i) - KAFKA_OUT[1], duration: 0.05, ease: 'power1.out' }, t + 0.08)
    tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.13)
    tl.to(brows[i], { opacity: 1, duration: 0.03 }, t + 0.12)
  })
  const tagAt = (i: number) => s1 + 0.08 + i * 0.1 + 0.14
  btags.forEach((t, k) => tl.to(t, { opacity: 1, duration: 0.04 }, tagAt(k + 1)))

  // step 2: Bronze 1~3행이 위로 올라가며 중복은 사라지고 금액 형식이 맞춰진다
  const s2 = at(1)
  tl.to([...o('src'), ...o('cap-1')], { opacity: 0, duration: 0.1 }, s2)
  tl.to(o('slot-silver'), { opacity: 0, duration: 0.1 }, s2 + 0.04)
  tl.to(o('silver'), { opacity: 1, duration: 0.12 }, s2 + 0.04)
  tl.to(o('stb'), { opacity: 1, duration: 0.02 }, s2 + 0.14)
  const srows = [0, 1].map((i) => q(`[data-el^="stb-c${i}-"]`))
  init(tl, srows.flat(), { opacity: 0 })
  init(tl, o('s0-st0'), { opacity: 0 })
  const up = o('up')
  const dest = [scell(0), null, scell(1)]
  up.forEach((p, i) => {
    const t = s2 + 0.2 + i * 0.1
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    if (dest[i] === null) {
      tl.to(p, { y: -40, duration: 0.08, ease: 'power1.out' }, t)
      tl.to(p, { opacity: 0, scale: 0.2, svgOrigin: `${BT.x + 40} ${brow(i)}`, duration: 0.06 }, t + 0.06)
    } else {
      tl.to(p, { x: ST5.x + 26 - (BT.x + 40), y: (dest[i] as number) - brow(i), duration: 0.14, ease: 'power1.inOut' }, t)
      tl.to(p, { opacity: 0, duration: 0.02 }, t + 0.14)
      const row = i === 0 ? [...srows[0], ...o('s0-st0')] : srows[1]
      tl.to(row, { opacity: 1, duration: 0.04 }, t + 0.13)
    }
    tl.to(o('bcheck')[i], { opacity: 1, duration: 0.04 }, t + 0.06)
  })
  tl.to(o('bcheck-l'), { opacity: 1, duration: 0.04 }, s2 + 0.26)
  tl.to(o('bstrike'), { opacity: 1, duration: 0.05 }, s2 + 0.38)
  tl.to(o('bto-s'), { opacity: 1, duration: 0.06 }, s2 + 0.56)

  // step 3: 변경 카드를 주문번호로 맞춰 고치거나(있음) 넣는다(없음). 같은 변경을 다시 보내도 그대로
  const s3 = at(2)
  const cards = o('chg')
  const verdicts = o('verdict')
  init(tl, verdicts, { opacity: 0 })
  cards.forEach((c, k) => {
    init(tl, c, { x: num(c, 'dx'), y: num(c, 'dy'), scale: 0.8, transformOrigin: '50% 50%' })
    tl.to(c, { opacity: 1, duration: 0.04 }, s3 + 0.02 + k * 0.04)
    tl.to(c, { x: 0, y: 0, scale: 1, duration: 0.14, ease: 'power2.out' }, s3 + 0.02 + k * 0.04)
  })
  tl.to(o('cap-3'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  const movers = o('mover')
  const hl0 = o('stb-hl0')
  const send = (m: Element, t: number) => {
    tl.to(m, { opacity: 1, duration: 0.02 }, t)
    tl.to(m, { x: num(m, 'dx'), y: num(m, 'dy'), duration: 0.08, ease: 'power1.inOut' }, t)
    tl.to(m, { opacity: 0, duration: 0.02 }, t + 0.08)
  }
  const flash = (els: Element[], t: number) => {
    tl.to(els, { opacity: 0.3, duration: 0.02 }, t)
    tl.to(els, { opacity: 0, duration: 0.05 }, t + 0.06)
  }
  // 1001 → 배송중: 같은 행의 상태 칸만 바뀐다
  tl.to(o('bto-s'), { opacity: 0, duration: 0.06 }, s3)
  send(movers[0], s3 + 0.22)
  flash(hl0, s3 + 0.3)
  tl.to(o('s0-st0'), { opacity: 0, duration: 0.03 }, s3 + 0.3)
  tl.to(o('s0-st1'), { opacity: 1, duration: 0.03 }, s3 + 0.3)
  tl.to(verdicts[0], { opacity: 1, duration: 0.04 }, s3 + 0.31)
  // 1003 새 주문: 표 아래에 새 행
  send(movers[1], s3 + 0.34)
  tl.to(o('stb-extra'), { opacity: 1, duration: 0.05 }, s3 + 0.42)
  tl.to(o('t-ins'), { opacity: 1, duration: 0.04 }, s3 + 0.44)
  tl.to(verdicts[1], { opacity: 1, duration: 0.04 }, s3 + 0.43)
  // 1001 → 취소
  send(movers[2], s3 + 0.46)
  flash(hl0, s3 + 0.54)
  tl.to(o('s0-st1'), { opacity: 0, duration: 0.03 }, s3 + 0.54)
  tl.to(o('s0-st2'), { opacity: 1, duration: 0.03 }, s3 + 0.54)
  tl.to([...o('t-fixed'), ...o('hist')], { opacity: 1, duration: 0.05 }, s3 + 0.56)
  tl.to(verdicts[2], { opacity: 1, duration: 0.04 }, s3 + 0.55)
  // 같은 '1001 → 취소'를 한 번 더: 표는 그대로(멱등)
  send(movers[3], s3 + 0.6)
  flash(hl0, s3 + 0.68)

  // step 4: Gold가 쌓이고, Silver 금액 세 칸이 하나로 모여 순매출이 된다
  const s4 = at(3)
  tl.to(o('cap-3'), { opacity: 0, duration: 0.08 }, s4)
  tl.to(o('slot-gold'), { opacity: 0, duration: 0.1 }, s4 + 0.04)
  tl.to(o('gold'), { opacity: 1, duration: 0.12 }, s4 + 0.04)
  tl.to(o('xf'), { opacity: 1, duration: 0.08 }, s4 + 0.14)
  const target: Pt = [LY.gold.x + 150, LY.gold.y + 40]
  o('gp').forEach((p, i) => {
    const t = s4 + 0.22 + i * 0.04
    tl.to(p, { opacity: 1, duration: 0.02 }, t)
    tl.to(p, { x: target[0] - (ST5.x + SW - 24), y: target[1] - scell(i), duration: 0.18, ease: 'power1.inOut' }, t)
    tl.to(p, { opacity: 0, duration: 0.03 }, t + 0.18)
  })
  tl.to(o('gold-in'), { opacity: 1, duration: 0.08 }, s4 + 0.46)
  tl.to(o('dash'), { opacity: 1, duration: 0.1 }, s4 + 0.56)
  tl.to(o('cap-4'), { opacity: 1, duration: 0.1 }, s4 + 0.1)
}

// ─────────────────────────────────────────────────────────────
// 장면 6. 해결 — 두 벌에서 한 벌로
// ─────────────────────────────────────────────────────────────
type Box = { x: number; y: number; w: number; h: number }
type At = (id: string) => Box | undefined

/** 맵의 연결선과 같은 계산: 노드 상자 테두리와 중심선이 만나는 점 */
function edgePt(n: Box, tx: number, ty: number, gap = 5): Pt {
  const dx = tx - n.x
  const dy = ty - n.y
  if (!dx && !dy) return [n.x, n.y]
  const s = Math.min(Math.abs((n.w / 2 + gap) / (dx || 1e-9)), Math.abs((n.h / 2 + gap) / (dy || 1e-9)))
  return [n.x + dx * s, n.y + dy * s]
}
const edgeMid = (a: Box, b: Box): Pt => {
  const [x1, y1] = edgePt(a, b.x, b.y)
  const [x2, y2] = edgePt(b, a.x, a.y, 7)
  return [(x1 + x2) / 2, (y1 + y2) / 2]
}
const box = (b: Box) => `${b.x} ${b.y} ${b.w} ${b.h}`
const unbox = (s: string | undefined): Box => {
  const [x, y, w, h] = (s ?? '0 0 100 100').split(' ').map(Number)
  return { x, y, w, h }
}
/** 영역 r을 화면 비율(aspect)에 맞춘 뷰박스로(가운데 정렬, top이면 남는 높이를 아래로만) */
const fitBox = (r: Box, aspect: number, top = false) => {
  let { x, y, w, h } = r
  if (w / h > aspect) {
    const nh = w / aspect
    if (!top) y -= (nh - h) / 2
    h = nh
  } else {
    const nw = h * aspect
    x -= (nw - w) / 2
    w = nw
  }
  return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
}

/** 옛 검문소 배지가 새 연결선으로 옮겨 가는 짝 */
const CHECK_MOVES: [string, string, string, string][] = [
  ['etl', 'warehouse', 'etl', 'lakehouse'],
  ['kafka', 'lake', 'kafka', 'lakehouse'],
  ['spark', 'warehouse', 'lakehouse', 'model'],
]

function Shield() {
  return (
    <g>
      <path d="M0 -10 L9 -6 L8 4 Q5 10 0 12 Q-5 10 -8 4 L-9 -6 Z" style={{ fill: 'var(--surface)', stroke: 'var(--ok)' }} strokeWidth={2} />
      <path d="M-4 1 L-1 4 L4 -3" style={{ stroke: 'var(--ok)', fill: 'none' }} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** 맵 위 덧그림: 지워질 동기화, 옛 자리 윤곽, 옮겨 가는 배지, Bronze로 다시 그린 이미지 연결선 */
function SolOverlay({ at: pos }: { at: At }) {
  const [lake, wh, lh, media, spark, kafka, orch] = ['lake', 'warehouse', 'lakehouse', 'media', 'spark', 'kafka', 'orch'].map(pos)
  if (!lake || !wh || !lh || !media || !spark || !kafka || !orch) return null
  // 장면 카메라: step 1 = 저장소 둘레, step 2 진입 = 레이크하우스
  // 아래 끝은 오케스트레이터·알림 위쪽에서 끊는다(넓은 화면 비율에서 두 노드 윗변만 걸려 보이지 않게)
  const r1: Box = { x: lake.x - lake.w / 2 + 26, y: 118, w: wh.x + wh.w / 2 + 10 - (lake.x - lake.w / 2 + 26), h: 568 }
  // 모바일은 노드 글자가 커져(글자 하한) 가장자리 노드가 잘려 보인다. 야간 ETL·옛 레이크 열부터 옛 웨어하우스 열까지 통째로,
  // 위로는 이벤트 브로커 줄부터 아래로는 오케스트레이터 줄까지 담는다(맨 위 이상 결제 탐지 줄은 화면 밖)
  const lx = lake.x - lake.w / 2 - 10
  const ty = kafka.y - kafka.h / 2 - 40
  const r1m: Box = { x: lx, y: ty, w: wh.x + wh.w / 2 + 10 - lx, h: orch.y + orch.h / 2 + 30 - ty }
  const rLh: Box = { x: lh.x - lh.w / 2 - 30, y: lh.y - lh.h / 2 - 30, w: lh.w + 60, h: lh.h + 60 }
  const sync = { x: (lake.x + wh.x) / 2, y: (lake.y + wh.y) / 2, w: 120, h: 48 }
  const ry = Math.min(9, lake.h * 0.16)
  // 이미지 → Bronze 칸(맨 위 칸) 왼쪽
  const bronzeY = lh.y - lh.h / 2 + ry * 2 + 22 + 17
  const [mx, my] = edgePt(media, lh.x - lh.w / 2, bronzeY)
  return (
    <g>
      <rect data-el="cams" data-r1={box(r1)} data-r1m={box(r1m)} data-rlh={box(rLh)} width={0} height={0} style={{ fill: 'none' }} />
      {[lake, wh].map((n, k) => (
        <g key={k} data-el="ghost">
          <path d={cylPath(n.x, n.y, n.w, n.h, ry).outline} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.4} strokeDasharray="5 5" />
        </g>
      ))}
      <g data-el="sync">
        <Node x={sync.x} y={sync.y} w={sync.w} h={sync.h} label={F.sync} sub={F.syncSub} kind="process" seed="s-sync" />
        <RArrow x1={lake.x + lake.w / 2 - 10} y1={lake.y - lake.h / 2 - 4} x2={sync.x - sync.w / 2 - 4} y2={sync.y + sync.h / 2 - 4} seed="s-sync-a" rough={0.4} />
        <RArrow x1={sync.x + sync.w / 2 + 2} y1={sync.y - sync.h / 2 + 4} x2={wh.x - wh.w / 2 + 12} y2={wh.y + wh.h / 2 + 5} seed="s-sync-b" rough={0.4} />
      </g>
      <g data-el="sync-x">
        <RLine x1={sync.x - sync.w / 2 - 6} y1={sync.y + 2} x2={sync.x + sync.w / 2 + 6} y2={sync.y - 2} seed="s-sync-x" rough={0.2} strokeWidth={3} stroke="var(--fail)" />
      </g>
      <g data-el="rr-media">
        <RArrow x1={mx} y1={my} x2={lh.x - lh.w / 2 - 7} y2={bronzeY} seed="s-rr-media" rough={0.5} />
      </g>
      {CHECK_MOVES.map(([a, b, c, d]) => {
        const [A0, B0, C0, D0] = [a, b, c, d].map(pos) as Box[]
        if (!A0 || !B0 || !C0 || !D0) return null
        const [ox, oy] = edgeMid(A0, B0)
        const [nx, ny] = edgeMid(C0, D0)
        return (
          <g key={`${a}${b}`} data-el="mover" data-dx={nx - ox} data-dy={ny - oy}>
            <g transform={`translate(${ox} ${oy})`}>
              <Shield />
            </g>
          </g>
        )
      })}
    </g>
  )
}

/** step 2: 레이크하우스를 가까이에서. 한 방향으로 쌓이는 세 층, 같은 Gold를 읽는 두 리포트, 줄어든 저장 비용 */
const CM = { x: 392, y: 36, h: 120, lake: PM.lake, wh: PM.wh, lh: 54 }
const BANDS = [
  { k: 'gold', y: 128 },
  { k: 'silver', y: 222 },
  { k: 'bronze', y: 316 },
] as const
const BAND_H = 68
function CloseUp() {
  const base = CM.y + CM.h
  const cards = [
    { who: 'daon' as const, y: 186, from: LAKE_COUNT, el: 'rep-d' },
    { who: 'minjae' as const, y: 296, from: WH_COUNT, el: 'rep-m' },
  ]
  return (
    <Fig>
      <Cyl x={130} y={262} w={220} h={400} ry={14} label={F.meter.lakehouse} size={17} seed="s-cl" />
      {BANDS.map((b) => {
        const c = LAYER[b.k]
        return (
          <g key={b.k}>
            <rect x={40} y={b.y} width={160} height={BAND_H} rx={6} style={{ fill: c.fill }} />
            <RRect x={40} y={b.y} w={160} h={BAND_H} seed={`s-band-${b.k}`} rough={0.3} stroke={c.edge} strokeWidth={b.k === 'gold' ? 3.2 : 2} />
            <Txt x={120} y={b.y + BAND_H / 2 + 5.5} size={16} weight={800} anchor="middle" color={c.text}>
              {F.layers[b.k].split(' · ')[0]}
            </Txt>
          </g>
        )
      })}
      <g data-el="up-arrows">
        <RArrow x1={120} y1={BANDS[2].y - 3} x2={120} y2={BANDS[1].y + BAND_H + 4} seed="s-up1" rough={0.2} head={7} strokeWidth={2} />
        <RArrow x1={120} y1={BANDS[1].y - 3} x2={120} y2={BANDS[0].y + BAND_H + 4} seed="s-up2" rough={0.2} head={7} strokeWidth={2} />
        <Txt x={130} y={476} size={12.5} weight={750} anchor="middle">
          {F.oneWay}
        </Txt>
      </g>
      {cards.map((c, k) => (
        <g key={c.who}>
          <Arrow x1={204} y1={BANDS[0].y + 26 + k * 18} x2={258} y2={c.y + 30} seed={`s-to-${c.who}`} el="to-rep" />
          <Card x={262} y={c.y} w={170} h={70} seed={`s-rep-${c.who}`} el="rep">
            <Txt x={274} y={c.y + 19} size={12.5} weight={650} muted>
              {F.report(PEOPLE[c.who].name)}
            </Txt>
            <Txt x={274} y={c.y + 38} size={12.5}>
              {F.lastWeek}
            </Txt>
            <Txt x={274} y={c.y + 60} size={17} weight={850} el={c.el}>
              {F.count(c.from)}
            </Txt>
          </Card>
        </g>
      ))}
      <g data-el="rep-eq">
        <Txt x={334} y={290} size={26} weight={850} anchor="middle">
          {F.eq}
        </Txt>
        <Badge x={362} y={282} status="ok" r={10} />
      </g>
      <Meter
        x={CM.x}
        y={CM.y}
        h={CM.h}
        title={F.meter.title}
        el="cmeter"
        seed="s-meter"
        segs={[
          { len: CM.lake, label: F.meter.lake, el: 'c-seg-lake', fill: 'var(--wait)' },
          { len: CM.wh, label: F.meter.warehouse, el: 'c-seg-wh', fill: 'var(--ink)' },
        ]}
      />
      <g data-el="c-seg-lh">
        <rect x={CM.x + 2} y={base - CM.lh} width={16} height={CM.lh} style={{ fill: LAYER.silver.edge }} />
        <RLine x1={CM.x - 4} y1={base - CM.lh} x2={CM.x + 20} y2={base - CM.lh} seed="s-lh-tick" rough={0.2} strokeWidth={1.1} />
        <Txt x={CM.x - 8} y={base - CM.lh / 2 + 4.5} size={13} weight={650} anchor="end">
          {F.meter.lakehouse}
        </Txt>
      </g>
    </Fig>
  )
}

function NodeCounter() {
  return (
    <div data-el="counter" className="absolute right-0 top-0 rounded-lg md:top-[9%] border-[1.5px] border-edge bg-surface px-3 py-2 text-right">
      <p className="text-xs font-semibold text-muted">{F.nodeCount}</p>
      <p className="font-mono text-xl font-extrabold leading-tight md:text-2xl">
        {NODES_BEFORE}
        <span data-el="cnt-to"> → {NODES_AFTER}</span>
      </p>
      <div className="relative mt-1.5 inline-flex gap-[2px] p-[3px] align-top">
        {Array.from({ length: NODES_BEFORE }, (_, i) => (
          <span key={i} data-el="chip" className="block h-2.5 w-[5px] rounded-[1px] bg-ink md:w-[6px]" />
        ))}
        <span data-el="chip-box" className="pointer-events-none absolute inset-0 rounded-[3px] border-[1.5px] border-ink" />
      </div>
    </div>
  )
}

/** step 3 한눈에 보는 맵(세로 배치)의 카메라: 전체와 레이크하우스 둘레 */
const OVERVIEW_IDS = mapStateAt(T.ch8).nodes.map((n) => n.id)
function OverviewCams({ at: pos }: { at: At }) {
  const all = OVERVIEW_IDS.map(pos).filter(Boolean) as Box[]
  const lh = pos('lakehouse')
  if (!all.length || !lh) return null
  const pad = 14
  const x0 = Math.min(...all.map((n) => n.x - n.w / 2)) - pad
  const y0 = Math.min(...all.map((n) => n.y - n.h / 2)) - pad
  const x1 = Math.max(...all.map((n) => n.x + n.w / 2)) + pad
  const y1 = Math.max(...all.map((n) => n.y + n.h / 2)) + pad
  const near: Box = { x: lh.x - lh.w / 2 - 40, y: lh.y - lh.h / 2 - 40, w: lh.w + 80, h: lh.h + 80 }
  return <rect data-el="ocams" data-full={box({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })} data-near={box(near)} width={0} height={0} style={{ fill: 'none' }} />
}
/** 세로로 긴 영역을 왼쪽에 붙여 화면 비율에 맞춘다(오른쪽은 카운터·메모 자리) */
const fitLeft = (r: Box, aspect: number) => (r.w / r.h < aspect ? `${r.x.toFixed(1)} ${r.y.toFixed(1)} ${(r.h * aspect).toFixed(1)} ${r.h.toFixed(1)}` : fitBox(r, aspect))

export function SolutionFig() {
  return (
    <div className="relative h-full w-full">
      <div data-el="map-layer" className="absolute inset-0 overflow-hidden">
        <PipelineMap t={T.ch8} from={T.ch7} vertical={false} overlay={(a) => <SolOverlay at={a} />} />
      </div>
      <div data-el="close-layer" className="absolute inset-0">
        <CloseUp />
      </div>
      <div data-el="over-layer" className="absolute inset-0 overflow-hidden">
        <PipelineMap t={T.ch8} vertical overlay={(a) => <OverviewCams at={a} />} />
      </div>
      <NodeCounter />
      <div
        data-el="memo"
        className="absolute right-0 top-1/2 w-[54%] -translate-y-1/2 space-y-2 rounded-xl border-[1.5px] border-edge bg-surface px-4 py-3 text-[0.875rem] leading-snug md:w-[50%] md:text-[0.9375rem]"
      >
        {F.memo.map(([k, v]) => (
          <p key={k}>
            <b className="font-bold">{k}:</b> {v}
          </p>
        ))}
      </div>
    </div>
  )
}

export const buildSolution: SceneBuild = (q, tl, { mobile }) => {
  const o = pick(q)
  const [svg, vsvg] = o('map') as SVGSVGElement[]
  const cams = o('cams')[0] as SVGElement | undefined
  const ocams = o('ocams')[0] as SVGElement | undefined
  if (!svg || !vsvg || !cams || !ocams) return
  const rect = svg.getBoundingClientRect()
  const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 0.75
  // 모바일: 남는 높이는 아래(맵 끝 너머 빈 곳)로 보내, 위 줄 노드의 아랫변이 걸려 보이지 않게 한다
  const cam1 = mobile ? fitBox(unbox(cams.dataset.r1m), aspect, true) : fitBox(unbox(cams.dataset.r1), aspect)
  const camLh = fitBox(unbox(cams.dataset.rlh), aspect)
  const camNear = fitBox(unbox(ocams.dataset.near), aspect)
  const camAll = fitLeft(unbox(ocams.dataset.full), aspect)
  // 이 장면의 맵 두 장: svg = 합치는 장면(가로 배치), vsvg = 한눈에 보는 맵(세로 배치)
  const hq = (sel: string) => Array.from(svg.querySelectorAll(sel))
  const node = (id: string) => hq(`[data-node="${id}"]`)
  const edge = (id: string) => hq(`[data-edge="${id}"]`)

  // 합쳐지는 두 저장소와 새 레이크하우스, Bronze로 다시 그리는 이미지 연결선은 이 장면이 직접 움직인다
  for (const id of ['lake', 'warehouse', 'lakehouse']) node(id).forEach((el) => ((el as SVGElement).dataset.change = 'merge'))
  edge('media>lakehouse').forEach((el) => ((el as SVGElement).dataset.change = 'reroute'))
  svg.dataset.vbFrom = cam1
  svg.dataset.vbTo = cam1

  const lh = node('lakehouse')
  const lhStrokes = hq('[data-node="lakehouse"] > g > g path')
  const bands = hq('[data-node="lakehouse"] [data-el^="band-"]')
  const ring = Array.from(vsvg.querySelectorAll('[data-node="lakehouse"] > .node-focus'))
  const newChecks = hq('[data-edge][data-change="enter"] [data-check]')
  const movers = o('mover')
  const rr = o('rr-media')
  init(tl, [...lh, ...edge('media>lakehouse'), ...o('ghost'), ...movers, ...newChecks, ...bands, ...o('close-layer'), ...o('over-layer'), ...o('counter'), ...o('memo'), ...o('cnt-to')], { opacity: 0 })
  // step 1 카메라(데스크톱·모바일 모두)는 저장소 둘레를 담느라 CDC가 왼쪽 끝에 조각으로만 걸린다.
  // 빈 상자 조각이 보이지 않게 이 맵(svg)에서는 CDC와 그 연결선을 감춘다(step 2부터는 맵 자체가 사라지고, step 3은 다른 맵 vsvg)
  init(tl, [...node('cdc'), ...edge('oltp>cdc'), ...edge('cdc>kafka')], { opacity: 0 })
  init(tl, vsvg, { attr: { viewBox: camNear } })
  init(tl, lhStrokes, { drawSVG: '0%' })
  init(tl, q('[data-el="sync-x"] path'), { drawSVG: '0%' })
  hideArrow(tl, rr)

  // step 1: 동기화를 지우고, 두 저장소가 가운데로 모여 레이크하우스 한 벌이 된다
  const s1 = at(0)
  tl.to(q('[data-el="sync-x"] path'), { drawSVG: '100%', duration: 0.08, ease: 'none' }, s1 + 0.02)
  tl.to([...o('sync'), ...o('sync-x')], { opacity: 0, duration: 0.1 }, s1 + 0.1)
  mapTransition(q, tl, s1 + 0.14, { dur: 0.5 })
  const center = (el: Element | undefined) => {
    const r = el?.querySelector('.node-focus')
    return r ? [Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2, Number(r.getAttribute('y')) + Number(r.getAttribute('height')) / 2] : null
  }
  const to = center(lh[0])
  for (const id of ['lake', 'warehouse']) {
    const el = node(id)[0]
    const from = center(el)
    if (!el || !from || !to) continue
    tl.to(el, { x: to[0] - from[0], y: to[1] - from[1], duration: 0.24, ease: 'power2.inOut' }, s1 + 0.16)
    tl.to(el, { opacity: 0, duration: 0.1 }, s1 + 0.32)
  }
  tl.to(lh, { opacity: 1, duration: 0.04 }, s1 + 0.34)
  tl.to(lhStrokes, { drawSVG: '100%', duration: 0.16, ease: 'none' }, s1 + 0.34)
  tl.to(bands, { opacity: 1, duration: 0.06, stagger: 0.04 }, s1 + 0.46)
  tl.to(o('ghost'), { opacity: 1, duration: 0.1 }, s1 + 0.44)
  movers.forEach((m) => {
    tl.to(m, { opacity: 1, duration: 0.01 }, s1 + 0.14)
    tl.to(m, { x: num(m, 'dx'), y: num(m, 'dy'), duration: 0.3, ease: 'power2.inOut' }, s1 + 0.16)
    tl.to(m, { opacity: 0, duration: 0.02 }, s1 + 0.52)
  })
  tl.to(newChecks, { opacity: 1, duration: 0.02 }, s1 + 0.5)
  drawArrow(tl, rr, s1 + 0.5, 0.1)

  // step 2: 레이크하우스 안으로 — 두 리포트는 같은 Gold를 읽고, 웨어하우스 저장분은 빠진다
  const s2 = at(1)
  tl.to(svg, { attr: { viewBox: camLh }, duration: 0.18, ease: 'power2.in' }, s2)
  tl.to(o('map-layer'), { opacity: 0, duration: 0.1 }, s2 + 0.1)
  tl.to(o('close-layer'), { opacity: 1, duration: 0.1 }, s2 + 0.12)
  const toRep = o('to-rep')
  const reps = o('rep')
  hideArrow(tl, toRep)
  init(tl, [...reps, ...o('rep-eq'), ...o('up-arrows'), ...o('c-seg-lh')], { opacity: 0 })
  tl.to(o('up-arrows'), { opacity: 1, duration: 0.08 }, s2 + 0.24)
  toRep.forEach((a) => drawArrow(tl, [a], s2 + 0.3, 0.08))
  tl.to(reps, { opacity: 1, duration: 0.06 }, s2 + 0.36)
  countTo(tl, o('rep-d')[0], LAKE_COUNT, GOLD_COUNT, F.count, s2 + 0.4, 0.12)
  countTo(tl, o('rep-m')[0], WH_COUNT, GOLD_COUNT, F.count, s2 + 0.4, 0.12)
  tl.to(o('rep-eq'), { opacity: 1, duration: 0.05 }, s2 + 0.53)
  const needle = o('cmeter-needle')
  tl.to([...o('c-seg-wh'), ...o('c-seg-wh-l'), ...o('c-seg-wh-tick')], { opacity: 0, duration: 0.1 }, s2 + 0.58)
  tl.to([...o('c-seg-lake'), ...o('c-seg-lake-l'), ...o('c-seg-lake-tick')], { opacity: 0, duration: 0.06 }, s2 + 0.64)
  tl.to(o('c-seg-lh'), { opacity: 1, duration: 0.06 }, s2 + 0.64)
  tl.to(needle, { y: CM.lake + CM.wh - CM.lh, duration: 0.14, ease: 'power2.inOut' }, s2 + 0.62)

  // step 3: 레이크하우스에서 맵 전체로 물러나 보면 노드가 하나 줄었다
  const s3 = at(2)
  tl.to(o('close-layer'), { opacity: 0, duration: 0.1 }, s3)
  tl.to(o('over-layer'), { opacity: 1, duration: 0.1 }, s3 + 0.06)
  tl.to(vsvg, { attr: { viewBox: camAll }, duration: 0.3, ease: 'power2.inOut' }, s3 + 0.08)
  tl.to(ring, { opacity: 1, duration: 0.06 }, s3 + 0.38)
  tl.to(o('counter'), { opacity: 1, duration: 0.08 }, s3 + 0.4)
  const chips = o('chip')
  const chipBox = o('chip-box')[0] as HTMLElement | undefined
  const last = chips[chips.length - 1] as HTMLElement | undefined
  if (chipBox && last) {
    const w = chipBox.getBoundingClientRect().width
    const step = last.getBoundingClientRect().width + 2
    init(tl, chipBox, { scaleX: 1, transformOrigin: '0% 50%' })
    tl.to(last, { opacity: 0, duration: 0.06 }, s3 + 0.52)
    if (w > 0) tl.to(chipBox, { scaleX: (w - step) / w, duration: 0.1, ease: 'power2.inOut' }, s3 + 0.54)
  }
  tl.to(o('cnt-to'), { opacity: 1, duration: 0.06 }, s3 + 0.5)
  tl.to(o('memo'), { opacity: 1, duration: 0.1 }, s3 + 0.62)
}
