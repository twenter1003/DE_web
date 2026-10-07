import type { Card } from '../content/cards'
import { STAT_KEYS, STAT_LABELS, type StatKey } from '../content/people'
import { tocOf } from '../content/toc'
import { UI } from '../content/ui'
import { RRect } from './sketch'

/** A–Z 용어 카드. tall = 성장 연출용 세로 카드, row = 도감 목록용 가로 카드 */
export function TermCard({ card, owned, variant = 'tall', el }: { card: Card; owned: boolean; variant?: 'tall' | 'row'; el?: string }) {
  const from = tocOf(card.chapter).label
  const label = owned ? `${card.letter}: ${card.term}${card.ko ? ` (${card.ko})` : ''}. ${card.def}` : `${card.letter} 카드: ${UI.panel.cardLocked(from)}`
  if (variant === 'row')
    return (
      <li data-el={el} className={`flex gap-4 rounded-xl border-[1.5px] p-3 ${owned ? 'border-edge bg-surface' : 'border-dashed border-edge'}`} aria-label={label}>
        <span className={`w-10 shrink-0 text-center font-mono text-3xl font-bold leading-10 ${owned ? '' : 'text-muted'}`} aria-hidden="true">
          {card.letter}
        </span>
        <span className="min-w-0" aria-hidden="true">
          {owned ? (
            <>
              <span className="block font-bold leading-snug">
                {card.term}
                {card.ko && <span className="font-normal text-muted"> {card.ko}</span>}
              </span>
              <span className="mt-0.5 block text-[0.9rem] leading-snug">{card.def}</span>
              <span className="mt-1 block font-mono text-xs text-muted">{UI.panel.cardFrom(from)}</span>
            </>
          ) : (
            <span className="block pt-2 text-[0.9rem] text-muted">{UI.panel.cardLocked(from)}</span>
          )}
        </span>
      </li>
    )
  return (
    <article data-el={el} aria-label={label} className="relative w-[11.5rem] shrink-0">
      <svg viewBox="0 0 184 252" className="diagram absolute inset-0 h-full w-full" aria-hidden="true">
        <RRect x={3} y={3} w={178} h={246} rough={0.5} seed={`card-${card.letter}`} fill={owned ? 'var(--surface)' : undefined} dash={owned ? undefined : '6 6'} />
      </svg>
      <div className="relative flex aspect-[184/252] flex-col p-4" aria-hidden="true">
        <span className={`font-mono text-[3.25rem] font-bold leading-none ${owned ? '' : 'text-muted'}`}>{card.letter}</span>
        {owned ? (
          <>
            <span className="mt-auto block text-lg font-bold leading-tight">{card.term}</span>
            {card.ko && <span className="block text-sm text-muted">{card.ko}</span>}
            <span className="mt-2 block text-[0.8125rem] leading-snug">{card.def}</span>
          </>
        ) : (
          <span className="mt-auto block text-sm text-muted">{UI.growth.locked}</span>
        )}
      </div>
    </article>
  )
}

const R = 100
const CX = 160
const CY = 132
const angle = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / STAT_KEYS.length
const pt = (i: number, v: number) => [CX + (R * v * Math.cos(angle(i))) / 100, CY + (R * v * Math.sin(angle(i))) / 100]
export const radarPoints = (vals: Record<StatKey, number>) =>
  STAT_KEYS.map((k, i) => pt(i, Math.min(100, vals[k])).map((n) => n.toFixed(1)).join(',')).join(' ')

/** 역량 레이더(6축, 0~100). prev를 주면 이전 모양을 점선으로 */
export function Radar({ values, prev, el = 'radar', className = '' }: { values: Record<StatKey, number>; prev?: Record<StatKey, number>; el?: string; className?: string }) {
  const label = STAT_KEYS.map((k) => `${STAT_LABELS[k]} ${values[k]}`).join(', ')
  return (
    <svg viewBox="-66 -6 452 280" className={`diagram ${className}`} role="img" aria-label={label}>
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={STAT_KEYS.map((_, i) => pt(i, r).join(',')).join(' ')} style={{ fill: 'none', stroke: 'var(--edge)' }} strokeWidth={1} />
      ))}
      {STAT_KEYS.map((_, i) => {
        const [x, y] = pt(i, 100)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} style={{ stroke: 'var(--edge)' }} strokeWidth={1} />
      })}
      {prev && <polygon points={radarPoints(prev)} style={{ fill: 'none', stroke: 'var(--muted)' }} strokeWidth={1.5} strokeDasharray="4 4" />}
      <polygon data-el={`${el}-poly`} points={radarPoints(values)} style={{ fill: 'var(--accent)', fillOpacity: 0.18, stroke: 'var(--accent)' }} strokeWidth={2.5} strokeLinejoin="round" />
      {STAT_KEYS.map((k, i) => {
        const [x, y] = pt(i, 124)
        const anchor = Math.abs(x - CX) < 8 ? 'middle' : x > CX ? 'start' : 'end'
        return (
          <text key={k} x={x} y={y + 4} textAnchor={anchor} className="t-sans" style={{ fontSize: 12.5, fontWeight: 600 }}>
            {STAT_LABELS[k]}
          </text>
        )
      })}
    </svg>
  )
}
