# 아키텍처 · 디자인 시스템 · 기술 리스크

## 1. 디자인 계획 (스케치 → 설계도)

### 색 (스테이지 팔레트)
배경은 챕터마다 한 단계씩 바뀐다. 섹션마다 자기 배경을 갖고, 챕터 사이에는 텍스트가 없는 그라디언트 띠(divider)로 이어 붙인다. 그래서 텍스트는 항상 검증된 단색 배경 위에만 놓인다(중간 톤 위에 글자가 놓이는 구간이 없다).

| 역할 | 종이 구간 (Prologue~Ch6) | 블루프린트 구간 (Ch7~Epilogue) |
|---|---|---|
| 배경 | 제도 용지 `#ECEFE6` → 트레이싱지 `#C9D8E7` (7단계) | 남색 `#1D4472` → `#0E2A4F` (5단계) |
| 잉크(본문) | 흑연 `#20252B` | 설계선 흰색 `#EEF4FB` |
| 보조 잉크 | `#4A535C` 계열 | `#B9CCE3` 계열 |
| 데이터 입자(강조색) | 신호 주황 `#C94A06` | 신호 주황(밝게) `#FF8A3D` |
| 실패 | `#B42318` + ✕ | `#FF8A80` + ✕ |
| 성공 | `#1F7A3A` + ✓ | `#7EE0A8` + ✓ |

- 모든 스테이지의 본문·보조 텍스트 대비는 `scripts/contrast.mjs`로 WCAG AA(4.5:1) 이상, 강조색·상태색은 비텍스트 3:1 이상을 검증한다.
- 배경 무늬: 제도 용지 격자(5칸마다 진한 선). 블루프린트 구간에선 밝은 격자. 격자 간격은 후반으로 갈수록 촘촘해진다.

### 타이포
- 본문·제목: Pretendard Variable. 본문 18px / 줄간격 1.75 / `word-break: keep-all`(한국어 어절 단위 줄바꿈).
- 코드·노드 라벨·HUD 숫자·챕터 번호: JetBrains Mono.
- 제목은 굵기(800)와 크기 대비로만 위계를 만든다. 한 단어만 색을 바꾸는 강조, 대문자 라벨은 쓰지 않는다.

### 레이아웃
```
데스크톱 ≥ 1024px                          모바일 < 768px
┌────┬──────────────────────────────┐     ┌──────────────┐
│레일│ 텍스트 step  │  sticky 다이어그램 │     │ sticky 다이어 │ 52svh
│    │ (34rem)      │  (나머지, 100svh)  │     │  그램        │
│ ●  │ step 1       │                   │     ├──────────────┤
│ ●  │ step 2       │    [SVG]          │     │ step 텍스트   │
│ ○  │ step 3       │                   │     │ (다이어그램 아래로 스크롤) │
└────┴──────────────────────────────┘     └──────────────┘
```
- 왼쪽 정렬. 텍스트 칼럼 최대 34rem(한 줄 약 40~45자).
- HUD는 오른쪽 위 고정, 작게. 챕터 레일은 데스크톱 왼쪽 고정.

### 원칙
1. **기억에 남는 한 가지는 '선'이다.** 선의 거칠기(rough.js roughness)가 챕터마다 2.6 → 0으로 줄어든다. 나머지 크롬(HUD, 버튼, 카드)은 조용하게.
2. **파이프라인 맵이 척추다.** 모든 챕터는 맵에 무엇이 생기고(또는 사라지고) 끝난다.
3. **움직임은 설명이다.** 장식 모션 없음. 자동 재생은 짧고, 다시 보기 버튼이 있다.

## 2. 폴더 구조

```
docs/                  ARCHITECTURE, CHAPTER_GUIDE, STORYBOARD, CONTENT_REVIEW
scripts/               contrast.mjs (대비 검증), shot.mjs (Playwright 스크린샷)
src/
  main.tsx, App.tsx
  styles/index.css     Tailwind + 디자인 토큰(CSS 변수), 스테이지 팔레트
  content/             ← 모든 문구. 컴포넌트를 건드리지 않고 수정 가능
    types.ts           콘텐츠 타입
    ui.ts              HUD·버튼·안내 문구
    characters.ts      등장인물 이름·역할
    levels.ts          레벨 이름·승급 조건
    stats.ts           역량 축 이름
    cards.ts           A–Z 카드 26장
    map.ts             파이프라인 맵 노드 라벨·등장/퇴장 챕터
    chapters/          prologue.ts, ch01.ts … ch10.ts, epilogue.ts
  state/
    progress.tsx       진행도·카드·퀴즈 (localStorage, try/catch)
    motion.tsx         모션 줄이기 (prefers-reduced-motion + 토글)
    activeChapter.ts   현재 보고 있는 챕터 (IntersectionObserver)
    derive.ts          레벨·역량·맵 상태 파생 함수
  lib/                 gsap 등록, rough 래퍼, 스테이지 값, 작은 유틸
  components/          공통 컴포넌트 (아래 3)
  chapters/            챕터 = 독립 컴포넌트 + 자체 타임라인
    registry.ts
    Prologue/ index.tsx, scenes.tsx(다이어그램 + build 함수)
    Ch01/ … Ch10/, Epilogue/
```

## 3. 공통 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `ChapterShell` | 챕터 섹션. 스테이지 팔레트·roughness 컨텍스트, 앵커 id, 앞 챕터와 이어지는 그라디언트 띠 |
| `ChapterOpening` | 챕터 번호·제목·회사 규모 + 주니의 책상(레벨별 환경) + 오프닝 대사 |
| `StepScene` | **모션 문법의 핵심.** sticky 다이어그램 + 스크롤되는 step 텍스트, scrub 타임라인. 모션 줄이기 모드에선 step마다 정지 그림 + 텍스트 |
| `StepText` / `Dialogue` / `Bubble` | step 텍스트(2~3문장), 인물 말풍선 |
| `Juni` | 라인아트 캐릭터, 표정 4종(당황·집중·뿌듯·여유) |
| `Desk` | 레벨별 책상 환경 + 질문하러 온 동료 수 |
| `Rough*` | rough.js로 그린 사각형·원·선·경로. seed 고정, roughness는 챕터에서 받음 |
| `Node` / `Arrow` | 파이프라인 노드와 화살표(데이터/제어/제안) |
| `Particles` | 강조색 데이터 입자 |
| `CodeType` | 스크롤 연동 코드 타이핑(전체 코드는 스크린리더용으로 항상 DOM에) |
| `DataTable` | 행·열 하이라이트 가능한 표 |
| `Gauge` / `Meter` | 부하 게이지, 요금 미터기 |
| `StatusIcon` | ✓ ✕ ⏸ ↻ + 텍스트 라벨 |
| `Interaction` 틀 | 인터랙션 영역(제목·안내·aria-live 결과) |
| `Summary` | 한 줄 요약 |
| `Quiz` | 1문항, 보기별 해설, 공통 해설, 통과 처리 |
| `ChapterGrowth` | 카드 획득·역량 변화·맵 변화·레벨업·주니 한마디. 자동 재생 + 다시 보기 |
| `TermCard` | A–Z 카드 |
| `Radar` | 역량 레이더(SVG) |
| `PipelineMap` | 진화하는 맵. 상태는 `mapStateAt(stage, phase)`에서 파생. 노드 클릭 → 해당 챕터로 이동 |
| `Hud` / `HudPanel` | 레벨·진행도·카드 수, 클릭하면 `<dialog>`로 도감·역량·맵·목차·설정 |
| `ChapterRail` | 데스크톱 챕터 내비게이션 |
| `MotionToggle` | 모션 줄이기 토글 |

### StepScene 계약
```ts
type SceneBuild = (q: (sel: string) => Element[], tl: gsap.core.Timeline, env: { mobile: boolean }) => void
```
- 다이어그램은 `data-el="…"` 속성으로 대상 요소를 표시한다(전역 id 금지 → 같은 다이어그램을 여러 번 렌더 가능).
- step i의 전환은 타임라인 시간 `[i, i+1)` 구간에 넣는다. 타임라인 길이 = step 수.
- scrub 모드: 스크롤 진행률 → 타임라인 진행률. step 블록이 화면 가운데를 지날 때 해당 전환이 재생된다.
- 정지 모드: step마다 다이어그램을 하나씩 렌더하고 `tl.progress((i+1)/N)`로 그 step의 최종 상태에 멈춘다.
- 다이어그램과 타임라인은 장면(정지 모드는 step)이 화면에 가까워질 때(위·아래 1.5화면) 만든다. 그림 칸은 높이가 고정이라 늦게 그려도 레이아웃이 밀리지 않는다. 장면 밖에서 장면 그림 요소를 찾지 않는다.
- 그림 칸이 설계 크기(440×480)보다 작으면(모바일·태블릿) 작은 라벨을 키운다(`--fs-lift`, `fs()`).

## 4. 핀 고정 방식
ScrollTrigger의 `pin` 대신 CSS `position: sticky`로 다이어그램을 고정하고, ScrollTrigger는 scrub(진행률 → 타임라인)만 맡는다.
- 스크롤 속도·관성에 개입하지 않는다(하이재킹 없음).
- pin-spacer가 레이아웃을 바꾸지 않아 리사이즈·폰트 로딩에 강하다.
- 고정 구간 길이 = step 수 × step 높이(데스크톱 70svh). 장면당 3~4 step으로 짧게 유지.

## 5. 반응형·모션 축소 분기
- `gsap.matchMedia()` 조건: `desktop (min-width: 768px)`, `mobile (max-width: 767px)`, `reduce (prefers-reduced-motion: reduce)`.
- 페이지 내 토글은 시스템 설정을 덮어쓴다(켬/끔/시스템 따름). 모션 줄이기 상태면 `StepScene`이 정지 모드로 렌더한다.
- 모바일에서는 입자 수를 줄이고, 다이어그램을 세로 배치용 좌표로 바꾼다.

## 6. 기술 리스크와 대응

| 리스크 | 대응 |
|---|---|
| ScrollTrigger 수십 개로 인한 끊김 | transform·opacity만 애니메이션, scrub 스무딩 0.5, 입자 수 상한(데스크톱 60 / 모바일 24), rough 경로 메모이즈, blur·filter 애니메이션 금지 |
| 폰트 로딩 후 레이아웃 변화로 트리거 위치 어긋남 | `document.fonts.ready` 후 `ScrollTrigger.refresh()`, 모션 토글·리사이즈 후에도 refresh |
| 언마운트 시 트리거 누수·중복 | 모든 타임라인은 `useGSAP`(scope 지정) 안에서 생성 → 자동 revert |
| 챕터 마운트가 메인 스레드를 오래 막음(느린 폰에서 1초 가까이) | 장면 그림은 가까워질 때 렌더, 첫 렌더 전에 GSAP transform을 한꺼번에 읽어 레이아웃 강제 반복 방지 |
| 사전 렌더 HTML과 첫 클라이언트 렌더 불일치(hydration) | 첫 렌더는 서버와 같은 값(모션·모바일·토글은 서버 스냅숏, 진행도는 레이아웃 효과에서 로드), rough 좌표 반올림, 개발 서버도 사전 렌더해 콘솔로 확인 |
| 모바일 주소창 높이 변화 | `svh` 단위, `ScrollTrigger.config({ ignoreMobileResize: true })` |
| 모바일에서 다이어그램이 작아짐 | sticky 52svh 영역 + 세로 배치 좌표, 라벨 최소 12px |
| 모션 축소 시 내용 손실 | 정지 모드에서도 모든 step 그림·텍스트 표시, 인터랙션은 결과만 즉시 반영 |
| 색만으로 의미 전달 | 상태는 항상 아이콘 + 텍스트, 실패/성공은 모양(✕/✓)도 다름 |
| 배경이 바뀌는 구간의 대비 | 섹션 단색 배경 + 텍스트 없는 그라디언트 띠, 스크립트로 전 스테이지 대비 검증 |
| 키보드 접근 | 인터랙션은 네이티브 `button`/`input[type=range]`/`radio`, HUD 패널은 `<dialog>`(포커스 가둠·Esc 기본 제공), 포커스 링 항상 표시 |
| 스크린리더 | 다이어그램은 `role="img"` + 설명, step마다 그림 설명(sr-only), 퀴즈·인터랙션 결과는 `aria-live` |
| localStorage 차단(사파리 프라이빗 등) | 모든 접근 try/catch, 실패 시 메모리 상태로 동작 |
| GitHub Pages 하위 경로 | Vite `base: './'` 상대 경로 빌드 |
| 한국어 줄바꿈 | `word-break: keep-all`, `text-wrap: pretty` |
