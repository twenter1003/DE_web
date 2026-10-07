import { PEOPLE } from '../content/people'
import { UI } from '../content/ui'
import type { Line, Mood, Who } from '../content/types'
import { Rich } from '../lib/rich'
import { REllipse, RLine, RPath } from './sketch'

// 주니 얼굴(라인아트). 좌표계 0~100. 표정 4종: 당황·집중·뿌듯·여유
const FACE: Record<Mood, { brows: string[]; eyes: string[]; mouth: string; extra?: string }> = {
  panic: {
    brows: ['M31 41 L43 37', 'M57 37 L69 41'],
    eyes: ['M38.2 54.5 a1.9 1.9 0 1 0 0.1 0', 'M60.2 54.5 a1.9 1.9 0 1 0 0.1 0'],
    mouth: 'M41 73 Q45.5 69.5 50 73 Q54.5 76.5 59 73',
    extra: 'M83 33 C 87 40, 87 44, 83 44 C 79 44, 79 40, 83 33 Z',
  },
  focus: {
    brows: ['M31 41 L43 44', 'M57 44 L69 41'],
    eyes: ['M35.5 55 L42.5 55', 'M57.5 55 L64.5 55'],
    mouth: 'M45 72.5 L55.5 71.5',
  },
  proud: {
    brows: ['M31 40 Q37 35.5 43 39', 'M57 39 Q63 35.5 69 40'],
    eyes: ['M34.5 57 Q39 51.5 43.5 57', 'M56.5 57 Q61 51.5 65.5 57'],
    mouth: 'M40 69 Q50 81 60 69',
  },
  relaxed: {
    brows: ['M32 42 Q37.5 40 43 42', 'M57 42 Q62.5 40 68 42'],
    eyes: ['M35 54.5 Q39 58 43 54.5', 'M57 54.5 Q61 58 65 54.5'],
    mouth: 'M43 71 Q50 76.5 57 71',
  },
}

const HAIR = 'M19 52 C 15 26, 36 13, 52 14 C 71 15, 87 29, 81 53 C 76 40, 67 31, 52 33 C 38 34, 27 41, 19 52 Z'

/** 주니의 얼굴. 다른 SVG 안에 넣을 수 있도록 <g>만 그린다(0~100 좌표). */
export function JuniFace({ mood = 'focus', seed = 'juni' }: { mood?: Mood; seed?: string }) {
  const f = FACE[mood]
  return (
    <g data-el="juni-face">
      <REllipse cx={50} cy={52} w={62} h={64} rough={0.45} seed={`${seed}-head`} fill="var(--surface)" />
      <RPath d={HAIR} rough={0.35} seed={`${seed}-hair`} fill="var(--line)" fillStyle="hachure" />
      {/* 동그란 안경 */}
      <REllipse cx={39} cy={55} w={17} h={16} rough={0.3} seed={`${seed}-g1`} />
      <REllipse cx={61} cy={55} w={17} h={16} rough={0.3} seed={`${seed}-g2`} />
      <RLine x1={47.5} y1={55} x2={52.5} y2={55} rough={0.2} seed={`${seed}-gb`} />
      {f.brows.map((d, i) => (
        <RPath key={`b${i}`} d={d} rough={0.25} seed={`${seed}-${mood}-b${i}`} />
      ))}
      {f.eyes.map((d, i) => (
        <RPath key={`e${i}`} d={d} rough={0.15} seed={`${seed}-${mood}-e${i}`} fill={mood === 'panic' ? 'var(--line)' : undefined} />
      ))}
      <RPath d={f.mouth} rough={0.25} seed={`${seed}-${mood}-m`} />
      {f.extra && <RPath d={f.extra} rough={0.2} seed={`${seed}-sweat`} fill="var(--surface)" />}
    </g>
  )
}

/** 인물 아바타. 주니는 표정이 있는 얼굴, 다른 인물은 이름 첫 글자 */
export function Avatar({ who, mood, size = 44 }: { who: Who; mood?: Mood; size?: number }) {
  if (who === 'juni')
    return (
      <svg viewBox="8 8 84 84" width={size} height={size} className="diagram shrink-0" aria-hidden="true">
        <JuniFace mood={mood} seed="avatar" />
      </svg>
    )
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} className="diagram shrink-0" aria-hidden="true">
      <REllipse cx={22} cy={22} w={38} h={38} rough={0.4} seed={`av-${who}`} fill="var(--surface)" />
      <text x={22} y={27.5} textAnchor="middle" className="t-sans" style={{ fontSize: 15, fontWeight: 700 }}>
        {PEOPLE[who].name.replace(' 대표', '').replace(' 리드', '').slice(0, 1)}
      </text>
    </svg>
  )
}

/** 말풍선 한 줄 */
export function Bubble({ line, compact }: { line: Line; compact?: boolean }) {
  const p = PEOPLE[line.who]
  const isJuni = line.who === 'juni'
  return (
    <div className="flex items-start gap-3">
      <Avatar who={line.who} mood={line.mood} size={compact ? 36 : 44} />
      <div
        className={`min-w-0 rounded-2xl border-[1.5px] border-edge bg-surface px-4 py-2.5 ${isJuni ? 'rounded-tl-sm' : 'rounded-tl-sm'}`}
      >
        <p className="font-mono text-[0.75rem] leading-5 text-muted">
          {p.name}
          {line.mood && isJuni ? <span className="sr-only"> ({UI.moods[line.mood]})</span> : null}
        </p>
        <p className="text-[1rem] leading-7">
          <Rich text={line.text} />
        </p>
      </div>
    </div>
  )
}
