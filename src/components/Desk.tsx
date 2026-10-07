import type { Mood } from '../content/types'
import { JuniFace } from './people'
import { RLine, RPath, RRect, REllipse } from './sketch'

// 주니의 책상. 성장은 외모가 아니라 환경과 행동으로 보여준다(바이블 0-3).
// Lv1 노트북·머그·포스트잇 → Lv2 외장 모니터(작은 DAG) → Lv3 화이트보드·듀얼 모니터
// → Lv4 정돈된 아키텍처·책·화분 → Lv5 오히려 단순: 모니터 하나, 단순한 그림 한 장, 멘티 의자

export type Board = 'none' | 'scribble' | 'neat' | 'crowded' | 'simple'

interface Props {
  level: 1 | 2 | 3 | 4 | 5
  mood?: Mood
  /** 질문하러 온 동료 수 */
  visitors?: number
  /** 책상 위 CSV 한 장(프롤로그·에필로그) */
  csv?: boolean
  /** 새 신입 새봄(에필로그) */
  newbie?: boolean
  board?: Board
  className?: string
}

function Visitor({ x, i, ask = true }: { x: number; i: number; ask?: boolean }) {
  const y = 116 + (i % 2) * 6
  return (
    <g data-el="visitor">
      <REllipse cx={x} cy={y} w={26} h={27} rough={0.4} seed={`v${i}h`} fill="var(--surface)" />
      <RPath d={`M ${x - 19} 210 C ${x - 18} ${y + 34}, ${x - 9} ${y + 18}, ${x} ${y + 17} C ${x + 9} ${y + 18}, ${x + 18} ${y + 34}, ${x + 19} 210`} rough={0.4} seed={`v${i}b`} />
      <RLine x1={x - 8} y1={210} x2={x - 9} y2={286} rough={0.3} seed={`v${i}l1`} />
      <RLine x1={x + 8} y1={210} x2={x + 9} y2={286} rough={0.3} seed={`v${i}l2`} />
      {ask && (
        <g>
          <RRect x={x - 11} y={y - 46} w={22} h={22} rough={0.3} seed={`v${i}q`} fill="var(--surface)" />
          <text x={x} y={y - 29.5} textAnchor="middle" className="t-sans" style={{ fontSize: 15, fontWeight: 800 }}>
            ?
          </text>
        </g>
      )}
    </g>
  )
}

function Screen({ x, y, w, h, kind, seed }: { x: number; y: number; w: number; h: number; kind: 'dag' | 'chart' | 'map'; seed: string }) {
  const cx = x + w / 2
  const cy = y + h / 2
  return (
    <g>
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.5} fill="var(--surface)" />
      {kind === 'dag' && (
        <g style={{ color: 'var(--muted)' }}>
          <RRect x={x + 10} y={cy - 7} w={18} h={14} rough={0.3} seed={`${seed}a`} />
          <RRect x={cx - 9} y={y + 10} w={18} h={14} rough={0.3} seed={`${seed}b`} />
          <RRect x={cx - 9} y={y + h - 24} w={18} h={14} rough={0.3} seed={`${seed}c`} />
          <RRect x={x + w - 28} y={cy - 7} w={18} h={14} rough={0.3} seed={`${seed}d`} />
          <RLine x1={x + 28} y1={cy} x2={cx - 9} y2={y + 17} rough={0.2} seed={`${seed}e`} />
          <RLine x1={x + 28} y1={cy} x2={cx - 9} y2={y + h - 17} rough={0.2} seed={`${seed}f`} />
          <RLine x1={cx + 9} y1={y + 17} x2={x + w - 28} y2={cy} rough={0.2} seed={`${seed}g`} />
          <RLine x1={cx + 9} y1={y + h - 17} x2={x + w - 28} y2={cy} rough={0.2} seed={`${seed}h`} />
        </g>
      )}
      {kind === 'chart' && (
        <g style={{ color: 'var(--muted)' }}>
          {[0.45, 0.7, 0.35, 0.85, 0.6].map((v, i) => (
            <rect key={i} x={x + 12 + i * ((w - 24) / 5)} y={y + h - 8 - v * (h - 20)} width={(w - 24) / 5 - 6} height={v * (h - 20)} style={{ fill: 'var(--accent)', opacity: 0.75 }} />
          ))}
        </g>
      )}
      {kind === 'map' && (
        <g style={{ color: 'var(--muted)' }}>
          {[0, 1, 2].map((i) => (
            <RRect key={i} x={x + 10 + i * ((w - 20) / 3)} y={cy - 7} w={(w - 20) / 3 - 10} h={14} rough={0.2} seed={`${seed}m${i}`} />
          ))}
        </g>
      )}
    </g>
  )
}

function Whiteboard({ board }: { board: Board }) {
  if (board === 'none') return null
  const x = 300
  const y = 8
  const w = 176
  const h = 74
  return (
    <g data-el="board">
      <RRect x={x} y={y} w={w} h={h} rough={0.5} seed="wb" fill="var(--surface)" />
      <g style={{ color: 'var(--muted)' }}>
        {board === 'scribble' && (
          <>
            <REllipse cx={340} cy={36} w={38} h={26} rough={1.4} seed="wb1" />
            <REllipse cx={378} cy={52} w={30} h={22} rough={1.4} seed="wb2" />
            <RPath d="M 410 24 L 466 24 M 410 40 L 458 40 M 410 56 L 462 56" rough={1.2} seed="wb3" />
            <RPath d="M 316 64 Q 340 70 362 62" rough={1.2} seed="wb4" />
          </>
        )}
        {(board === 'neat' || board === 'crowded') && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <RRect key={i} x={312 + i * 40} y={22} w={28} h={16} rough={0.3} seed={`wn${i}`} />
            ))}
            {[0, 1, 2].map((i) => (
              <RLine key={i} x1={340 + i * 40} y1={30} x2={352 + i * 40} y2={30} rough={0.2} seed={`wa${i}`} />
            ))}
            <RRect x={352} y={52} w={28} h={16} rough={0.3} seed="wn9" />
            <RLine x1={366} y1={38} x2={366} y2={52} rough={0.2} seed="wa9" />
          </>
        )}
        {board === 'crowded' && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <RRect key={i} x={394 + (i % 2) * 36} y={46 + Math.floor(i / 2) * 14} w={26} h={10} rough={0.3} seed={`wc${i}`} dash="3 3" />
            ))}
            <RPath d="M 312 60 L 340 60 M 312 68 L 334 68" rough={0.3} seed="wc9" />
          </>
        )}
        {board === 'simple' && (
          <>
            {[0, 1, 2].map((i) => (
              <RRect key={i} x={318 + i * 54} y={34} w={34} h={18} rough={0.2} seed={`ws${i}`} />
            ))}
            {[0, 1].map((i) => (
              <RLine key={i} x1={352 + i * 54} y1={43} x2={372 + i * 54} y2={43} rough={0.1} seed={`wsa${i}`} />
            ))}
          </>
        )}
      </g>
    </g>
  )
}

export function Desk({ level, mood = 'focus', visitors = 0, csv, newbie, board, className = '' }: Props) {
  const b: Board = board ?? (level >= 5 ? 'simple' : level === 4 ? 'neat' : level === 3 ? 'scribble' : 'none')
  // Lv5는 멘티 의자와 새봄 자리 때문에 동료가 조금 더 오른쪽에 선다
  const visitorX = level === 5 ? [585, 625, 665] : [500, 540, 580, 620]
  // 그림의 오른쪽 끝: 빈 공간 없이 잘라 그린다
  const right = visitors > 0 ? visitorX[Math.min(visitors, visitorX.length) - 1] + 34 : newbie ? 572 : level === 5 ? 530 : 490
  return (
    <svg viewBox={`20 0 ${right - 20} 300`} className={`diagram h-auto w-full ${className}`} aria-hidden="true">
      <Whiteboard board={b} />

      {/* 주니 */}
      <RPath d="M 150 214 C 152 176, 170 156, 196 154 C 222 156, 240 176, 242 214" rough={0.5} seed="juni-body" fill="var(--surface)" />
      <g transform="translate(146 48)">
        <JuniFace mood={mood} seed="desk" />
      </g>
      {/* 사원증 끈 */}
      <RPath d="M 184 158 L 196 188 L 208 158" rough={0.3} seed="lanyard" />

      {/* 책상 */}
      <RRect x={40} y={196} w={420} h={12} rough={0.6} seed="desk-top" fill="var(--surface)" />
      <RLine x1={64} y1={208} x2={64} y2={290} rough={0.4} seed="leg1" />
      <RLine x1={436} y1={208} x2={436} y2={290} rough={0.4} seed="leg2" />

      {/* 노트북(뒷면) — Lv5에서는 치워져 있다 */}
      {level < 5 && (
        <g>
          <RRect x={160} y={150} w={74} h={46} rough={0.5} seed="laptop" fill="var(--surface)" />
          <REllipse cx={197} cy={172} w={10} h={10} rough={0.3} seed="laptop-dot" />
          {level === 1 && (
            <g>
              <RRect x={166} y={156} w={14} h={14} rough={0.4} seed="sticky1" fill="var(--accent)" fillStyle="hachure" />
              <RRect x={214} y={176} w={14} h={14} rough={0.4} seed="sticky2" fill="var(--accent)" fillStyle="hachure" />
            </g>
          )}
        </g>
      )}

      {/* 모니터: Lv2부터. Lv3·Lv4는 둘, Lv5는 하나 */}
      {level >= 2 && (
        <g>
          <Screen x={300} y={100} w={118} h={74} kind={level >= 4 ? 'map' : 'dag'} seed="mon1" />
          <RLine x1={359} y1={174} x2={359} y2={196} rough={0.3} seed="stand1" />
          <RLine x1={340} y1={196} x2={378} y2={196} rough={0.3} seed="base1" />
        </g>
      )}
      {(level === 3 || level === 4) && (
        <g>
          <Screen x={60} y={118} w={88} h={56} kind="chart" seed="mon2" />
          <RLine x1={104} y1={174} x2={104} y2={196} rough={0.3} seed="stand2" />
        </g>
      )}

      {/* 머그 */}
      <RRect x={256} y={174} w={18} h={22} rough={0.4} seed="mug" fill="var(--surface)" />
      <RPath d="M 274 180 Q 284 185 274 190" rough={0.3} seed="mug-h" />

      {/* 책과 화분: Lv4부터 */}
      {level >= 4 && (
        <g>
          <RRect x={400} y={186} w={46} h={10} rough={0.3} seed="book1" />
          <RRect x={404} y={176} w={40} h={10} rough={0.3} seed="book2" />
          {level === 4 && <RRect x={398} y={166} w={44} h={10} rough={0.3} seed="book3" />}
          <RPath d="M 448 196 L 444 172 L 470 172 L 466 196 Z" rough={0.4} seed="pot" fill="var(--surface)" />
          <RPath d="M 457 172 C 450 150, 438 146, 434 140 M 457 172 C 462 152, 474 146, 480 138 M 457 172 L 457 146" rough={0.5} seed="leaf" />
        </g>
      )}

      {/* CSV 한 장 */}
      {csv && (
        <g data-el="csv">
          <RPath d="M 76 195 L 94 160 L 150 160 L 132 195 Z" rough={0.4} seed="csv" fill="var(--surface)" />
          <RPath d="M 96 172 L 136 172 M 92 180 L 132 180 M 88 188 L 112 188" rough={0.3} seed="csv-lines" stroke="var(--muted)" strokeWidth={1} />
          <text x={124} y={170} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700 }}>
            CSV
          </text>
        </g>
      )}

      {/* 멘티 의자: Lv5 */}
      {level === 5 && (
        <g>
          <RPath d="M 470 214 L 470 160 M 470 214 L 516 214 M 474 214 L 474 288 M 512 214 L 512 288" rough={0.3} seed="chair" />
        </g>
      )}

      {/* 질문하러 온 동료들 */}
      {visitorX.slice(0, visitors).map((x, i) => (
        <Visitor key={i} x={x} i={i} />
      ))}

      {/* 새 신입: CSV를 든 새봄 */}
      {newbie && (
        <g data-el="newbie">
          <Visitor x={540} i={9} ask={false} />
          <RPath d="M 518 158 L 526 136 L 552 136 L 544 158 Z" rough={0.4} seed="nb-csv" fill="var(--surface)" />
          <text x={535} y={151} textAnchor="middle" style={{ fontSize: 8, fontWeight: 700 }}>
            CSV
          </text>
        </g>
      )}
    </svg>
  )
}
