import { Badge, Gauge, type Status } from '../../components/diagram'
import { Txt } from '../../components/fig'
import type { Q } from '../../components/StepScene'
import { REllipse, RLine, RPath, RRect } from '../../components/sketch'
import { gsap } from '../../lib/gsap'

// Ch9 다이어그램 전용 작은 부품: 사람·자물쇠·꼬리표·작업 카드·파티션 띠·요금 미터기.

/** q 줄임: data-el 이름으로 찾기(여러 이름이면 모두) */
export const pick = (q: Q) => (...names: string[]) => names.flatMap((n) => q(`[data-el="${n}"]`))
/** 초기 상태. 타임라인 0초의 set은 첫 스크롤 전에는 그려지지 않으므로 DOM에도 바로 적용한다 */
export const init = (tl: gsap.core.Timeline, targets: gsap.TweenTarget, vars: gsap.TweenVars) => {
  gsap.set(targets, vars)
  tl.set(targets, vars, 0)
}
/** 요소 안의 선(path)들 — drawSVG용 */
export const strokes = (els: Element[]) => els.flatMap((e) => Array.from(e.querySelectorAll('path')))
/** 게이지 값(0~1) → 바늘 각도 */
export const angle = (v: number) => -90 + v * 180

/** 바늘을 v로 고정(초기 상태) */
export function needleInit(tl: gsap.core.Timeline, needle: Element | undefined, v: number) {
  if (!needle) return
  init(tl, needle, { rotation: angle(v), svgOrigin: (needle as SVGElement).dataset.origin })
}
export function needleTo(tl: gsap.core.Timeline, needle: Element | undefined, v: number, t: number, duration = 0.08, ease = 'power2.inOut') {
  if (!needle) return
  tl.to(needle, { rotation: angle(v), svgOrigin: (needle as SVGElement).dataset.origin, duration, ease }, t)
}

/** 요금 미터기: 공통 반원 게이지 + 빨강 구간 '높음' 글자 눈금 */
export function Meter({ x, y, r, label, el, value = 0, high, seed, highColor = 'var(--fail)' }: { x: number; y: number; r: number; label: string; el: string; value?: number; high: string; seed: string; highColor?: string }) {
  const a = Math.PI * 1.86
  return (
    <g data-el={`${el}-g`}>
      <Gauge x={x} y={y} r={r} label={label} el={el} value={value} seed={seed} />
      <Txt x={x + (r + 8) * Math.cos(a)} y={y + (r + 8) * Math.sin(a) - 2} size={12.5} weight={750} color={highColor}>
        {high}
      </Txt>
    </g>
  )
}

/** 사람 아이콘: 머리 중심 (x, y), 어깨, 아래 라벨 */
export function Person({ x, y, label, el, seed }: { x: number; y: number; label?: string; el?: string; seed: string }) {
  return (
    <g data-el={el}>
      <RPath d={`M ${x - 13} ${y + 26} C ${x - 13} ${y + 15}, ${x - 7} ${y + 10}, ${x} ${y + 10} C ${x + 7} ${y + 10}, ${x + 13} ${y + 15}, ${x + 13} ${y + 26} Z`} rough={0.3} seed={`${seed}b`} fill="var(--surface)" />
      <REllipse cx={x} cy={y} w={16} h={16} rough={0.3} seed={`${seed}h`} fill="var(--surface)" />
      {label && (
        <Txt x={x} y={y + 43} size={12.5} weight={650} anchor="middle">
          {label}
        </Txt>
      )}
    </g>
  )
}

/** 자물쇠. (x, y) = 몸통 중심. 고리는 data-el=`${el}-sh` — 열림이면 위로 올라가 있다 */
export function Lock({ x, y, s = 1, el, open = false, seed }: { x: number; y: number; s?: number; el?: string; open?: boolean; seed: string }) {
  const w = 30 * s
  const h = 24 * s
  const r = 8 * s
  const top = y - h / 2
  return (
    <g data-el={el}>
      <g data-el={el ? `${el}-sh` : undefined} transform={open ? `translate(0 ${-9 * s})` : undefined}>
        <RPath d={`M ${x - r} ${top + 2} L ${x - r} ${top - 8 * s} A ${r} ${r} 0 0 1 ${x + r} ${top - 8 * s} L ${x + r} ${top + 2}`} rough={0.25} seed={`${seed}s`} strokeWidth={2.4 * Math.min(1, s)} />
      </g>
      <RRect x={x - w / 2} y={top} w={w} h={h} rough={0.3} seed={`${seed}b`} fill="var(--surface)" />
      <circle cx={x} cy={y - 1.5 * s} r={2.6 * s} style={{ fill: 'currentColor' }} />
      <line x1={x} y1={y} x2={x} y2={y + 5 * s} style={{ stroke: 'currentColor' }} strokeWidth={1.8 * s} strokeLinecap="round" />
    </g>
  )
}

/** 이름 첫 글자를 담은 동그라미(작업 카드·출입증) */
export function Initial({ x, y, r = 17, ch, seed }: { x: number; y: number; r?: number; ch: string; seed: string }) {
  return (
    <g>
      <REllipse cx={x} cy={y} w={r * 2} h={r * 2} rough={0.3} seed={seed} fill="var(--bg)" />
      <Txt x={x} y={y + r * 0.32} size={r * 0.88} weight={800} anchor="middle">
        {ch}
      </Txt>
    </g>
  )
}

/** 상태 표시: 배지 + 글자(색만으로 구분하지 않는다). (x, y) = 배지 중심 */
export function StatusMark({ x, y, status, text, el, r = 10, size = 13 }: { x: number; y: number; status: Status; text: string; el?: string; r?: number; size?: number }) {
  return (
    <g data-el={el}>
      <Badge x={x} y={y} status={status} r={r} />
      <Txt x={x + r + 5} y={y + size * 0.36} size={size} weight={750}>
        {text}
      </Txt>
    </g>
  )
}

/**
 * 작업 카드: 진행 중(흰 카드) / 멈춤(⏸ 회색) / 완료·재개(✓). 상태 묶음 data-el = `${el}-run|wait|ok`, 회색 덮개 `${el}-grey`
 */
export function WorkCard({
  x,
  y,
  w,
  h = 64,
  initial,
  name,
  task,
  el,
  labels,
  note,
  seed,
}: {
  x: number
  y: number
  w: number
  h?: number
  initial: string
  name: string
  task: string
  el: string
  labels: { run: string; wait: string; ok: string }
  note?: string
  seed: string
}) {
  const cy = y + h / 2
  const sx = x + w - (note ? 104 : 88)
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={w} h={h} rough={0.35} seed={seed} fill="var(--surface)" />
      <g data-el={`${el}-grey`}>
        <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={3} style={{ fill: 'var(--wait)', opacity: 0.32 }} />
      </g>
      <Initial x={x + 28} y={cy} r={15} ch={initial} seed={`${seed}-i`} />
      <Txt x={x + 52} y={cy - 9} size={12.5} weight={500}>
        {name}
      </Txt>
      <Txt x={x + 52} y={cy + 13} size={15} weight={750}>
        {task}
      </Txt>
      <Txt x={sx} y={cy + 5} size={13} weight={650} muted el={`${el}-run`}>
        {labels.run}
      </Txt>
      <StatusMark x={sx + 10} y={cy - (note ? 8 : 0)} status="wait" text={labels.wait} el={`${el}-wait`} />
      <g data-el={`${el}-ok`}>
        <StatusMark x={sx + 10} y={cy - (note ? 8 : 0)} status="ok" text={labels.ok} />
        {note && (
          <Txt x={sx} y={cy + 17} size={11.5} weight={600} muted>
            {note}
          </Txt>
        )}
      </g>
    </g>
  )
}

/** 짐 꼬리표(오각형) 안에 1~2줄 글자. (x, y) = 왼쪽 위 */
export function Tag({ x, y, w, h, lines, el, seed, size = 12.5 }: { x: number; y: number; w: number; h: number; lines: readonly string[]; el?: string; seed: string; size?: number }) {
  const d = `M ${x + 10} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + 10} ${y + h} L ${x} ${y + h / 2} Z`
  const cx = x + 5 + w / 2
  const lh = size + 3
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.36
  return (
    <g data-el={el}>
      <path d={d} style={{ fill: 'var(--bg)' }} />
      <RPath d={d} rough={0.25} seed={seed} strokeWidth={1.3} />
      <circle cx={x + 8} cy={y + h / 2} r={2.2} style={{ fill: 'none', stroke: 'currentColor' }} strokeWidth={1.2} />
      {lines.map((l, i) => (
        <Txt key={i} x={cx} y={y0 + i * lh} size={size} weight={650} anchor="middle">
          {l}
        </Txt>
      ))}
    </g>
  )
}

/** 상자(선반 위 데이터 묶음). (x, y) = 왼쪽 위 */
export function Box({ x, y, w, h, label, el, seed, labelY }: { x: number; y: number; w: number; h: number; label: string; el?: string; seed: string; labelY?: number }) {
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={w} h={h} rough={0.35} seed={seed} fill="var(--surface)" />
      <RLine x1={x + 8} y1={y + 10} x2={x + w - 8} y2={y + 10} rough={0.2} seed={`${seed}-lid`} strokeWidth={1} />
      <Txt x={x + w / 2} y={labelY ?? y + h / 2 + 10} size={14.5} weight={750} anchor="middle">
        {label}
      </Txt>
    </g>
  )
}

/**
 * 날짜 파티션 띠: 칸이 촘촘한 세로줄. 읽은 칸 덮개(data-el=`${el}-read`), 스캔 빛줄기(`${el}-beam`)
 */
export function Band({ x, y, w, h, n, el, seed }: { x: number; y: number; w: number; h: number; n: number; el: string; seed: string }) {
  const cw = w / n
  const lines = Array.from({ length: n - 1 }, (_, i) => `M ${(x + cw * (i + 1)).toFixed(2)} ${y + 3} V ${y + h - 3}`).join(' ')
  return (
    <g data-el={el}>
      <rect x={x} y={y} width={w} height={h} style={{ fill: 'var(--surface)' }} />
      <g data-el={`${el}-read`}>
        <rect x={x} y={y} width={w} height={h} style={{ fill: 'var(--accent)', opacity: 0.42 }} />
      </g>
      <path d={lines} style={{ stroke: 'var(--line)', opacity: 0.55, fill: 'none' }} strokeWidth={0.8} />
      <RRect x={x} y={y} w={w} h={h} rough={0.3} seed={seed} />
      <rect data-el={`${el}-beam`} x={x - 3} y={y - 7} width={7} height={h + 14} rx={2} style={{ fill: 'var(--accent)' }} />
    </g>
  )
}

/** 꺾은선을 따라 점선 조각들을 만든다(한 조각 = path 하나). 조각을 차례로 켜면 '그려지는' 점선이 된다 */
export function dashSegments(pts: [number, number][], dash = 4, gap = 6): string[] {
  const L = [0]
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  const total = L[L.length - 1]
  const pointAt = (s: number): [number, number] => {
    let i = 1
    while (i < L.length - 1 && L[i] < s) i++
    const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1)
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]
  }
  const out: string[] = []
  for (let s = 0; s < total - 1; s += dash + gap) {
    const e = Math.min(s + dash, total)
    const pp = [pointAt(s), ...pts.filter((_, i) => L[i] > s && L[i] < e), pointAt(e)]
    out.push('M ' + pp.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '))
  }
  return out
}

/** 제어 점선(조각 data-el=`${el}`) + 끝 화살촉(`${el}-head`) */
export function DashArrow({ pts, el, width = 1.6 }: { pts: [number, number][]; el: string; width?: number }) {
  const [px, py] = pts[pts.length - 2]
  const [ex, ey] = pts[pts.length - 1]
  const a = Math.atan2(ey - py, ex - px)
  const hd = 8
  const head = `M ${ex - hd * Math.cos(a - 0.45)} ${ey - hd * Math.sin(a - 0.45)} L ${ex} ${ey} L ${ex - hd * Math.cos(a + 0.45)} ${ey - hd * Math.sin(a + 0.45)}`
  return (
    <g style={{ opacity: 0.85 }}>
      {dashSegments(pts).map((d, i) => (
        <path key={i} data-el={el} d={d} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={width} strokeLinecap="round" />
      ))}
      <path data-el={`${el}-head`} d={head} style={{ fill: 'none', stroke: 'var(--line)' }} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}
