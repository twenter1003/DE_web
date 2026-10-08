// 챕터 스테이지별 팔레트와 선 정밀도.
// '스케치에서 설계도로': 앞쪽은 제도 용지 + 거친 흑연 선, 뒤쪽은 남색 블루프린트 + 정밀한 흰 선.
// 대비는 scripts/contrast.mjs 로 검증한다(본문 4.5:1, 비텍스트 3:1).

export interface Stage {
  index: number
  dark: boolean
  bg: string
  ink: string // 본문
  muted: string // 보조 텍스트
  line: string // 다이어그램 선
  surface: string // 카드·말풍선 배경
  edge: string // 얇은 경계선
  grid: string // 격자 잔선
  gridStrong: string // 격자 굵은 선(5칸마다)
  gridSize: number // px
  accent: string // 데이터 입자
  fail: string
  ok: string
  wait: string
  roughness: number
  bowing: number
  strokeWidth: number
}

type Palette = Omit<Stage, 'index' | 'roughness' | 'bowing' | 'strokeWidth' | 'gridSize'>

const paper = (bg: string, ink: string, muted: string, surface: string): Palette => ({
  dark: false,
  bg,
  ink,
  muted,
  line: ink,
  surface,
  edge: 'rgba(32, 37, 43, 0.22)',
  grid: 'rgba(52, 92, 82, 0.08)',
  gridStrong: 'rgba(52, 92, 82, 0.15)',
  accent: '#C24705',
  fail: '#B42318',
  ok: '#19692F',
  wait: '#5F6B78',
})

const blueprint = (bg: string, surface: string): Palette => ({
  dark: true,
  bg,
  ink: '#EEF4FB',
  muted: '#BCD0E8',
  line: '#DDE9F8',
  surface,
  edge: 'rgba(221, 233, 248, 0.28)',
  grid: 'rgba(221, 233, 248, 0.07)',
  gridStrong: 'rgba(221, 233, 248, 0.14)',
  accent: '#FF8A3D',
  fail: '#FFB4AC',
  ok: '#7EE0A8',
  wait: '#A9BCD4',
})

const palettes: Palette[] = [
  paper('#ECEFE6', '#20252B', '#4A535C', '#F7F8F3'), // 0 Prologue — 제도 용지
  paper('#EAEEE6', '#1F252C', '#48525D', '#F6F8F3'), // 1
  paper('#E6EBE6', '#1E242D', '#46505D', '#F4F7F3'), // 2
  paper('#E1E8E7', '#1C2430', '#434F5E', '#F2F6F5'), // 3
  paper('#DBE4E9', '#1A2333', '#404D60', '#EFF4F7'), // 4 — 트레이싱지로
  paper('#D3DFEA', '#182236', '#3D4A60', '#ECF2F8'), // 5
  paper('#C9D8E7', '#15213A', '#38465F', '#E7EFF8'), // 6
  blueprint('#1D4472', '#285488'), // 7 — 블루프린트
  blueprint('#1A3F6B', '#244E80'), // 8
  blueprint('#173A64', '#214978'), // 9
  blueprint('#13335B', '#1E436F'), // 10
  blueprint('#0F2C52', '#1A3C66'), // 11 Epilogue
]

// 선 정밀도: 거친 스케치(2.6) → 정밀한 설계도(0)
const roughness = [2.6, 2.3, 2.0, 1.7, 1.45, 1.2, 0.95, 0.7, 0.45, 0.25, 0.05, 0]
const bowing = [2.2, 2.0, 1.7, 1.4, 1.2, 1.0, 0.8, 0.6, 0.4, 0.2, 0, 0]
const strokeWidth = [1.7, 1.7, 1.65, 1.6, 1.55, 1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.25]
const gridSize = [32, 32, 30, 30, 28, 28, 26, 24, 24, 22, 20, 20]

export const STAGES: Stage[] = palettes.map((p, i) => ({
  ...p,
  index: i,
  roughness: roughness[i],
  bowing: bowing[i],
  strokeWidth: strokeWidth[i],
  gridSize: gridSize[i],
}))

export const stageVars = (s: Stage): Record<string, string> => ({
  '--bg': s.bg,
  '--ink': s.ink,
  '--muted': s.muted,
  '--line': s.line,
  '--surface': s.surface,
  '--edge': s.edge,
  '--grid': s.grid,
  '--grid-strong': s.gridStrong,
  '--grid-size': `${s.gridSize}px`,
  '--accent': s.accent,
  '--fail': s.fail,
  '--ok': s.ok,
  '--wait': s.wait,
})
