# 챕터 구현 가이드

Prologue·Ch1·Ch2가 기준 구현이다. 새 챕터는 그 구조를 그대로 따른다. 규칙 요약은 `CLAUDE.md`, 장면 내용은 `docs/storyboard/NN-*.md`.

## 파일
```
src/content/chapters/<id>.ts     ← 모든 문구(본문·대사·그림 설명·퀴즈·인터랙션 문구·성장 대사)
src/chapters/<Id>/index.tsx      ← 챕터 컴포넌트(장면 배치)
src/chapters/<Id>/scenes.tsx     ← 장면별 다이어그램 + build 함수
src/chapters/<Id>/<Interaction>.tsx (있으면)
```
`src/chapters/registry.ts`에 순서대로 등록한다. 챕터끼리 import 하지 않는다. 공통 부품이 필요하면 `src/components/`에 추가한다.

## 콘텐츠 파일 형식
`ChapterContent<SceneKeys, InteractionStrings>` (src/content/types.ts).
- `opening.lines` 2~4줄, `opening.alt` 책상 그림 설명
- `scenes.<key>.steps[]`: `text`(2~3문장, `**강조**`·`` `코드` `` 허용), `lines?`(말풍선 0~2줄), `alt`(이 step 정지 그림 설명)
- `quiz`: 보기마다 `feedback`, 정답 하나 `correct: true`, `explanation`
- `growth.line`(주니 한마디), `growth.mapNote`(맵 변화 한 줄)
- 인터랙션 문구는 `interaction` 객체에 (형태는 챕터마다 정의)

## 챕터 컴포넌트 골격
```tsx
<ChapterShell id="ch3">
  <ChapterOpening id="ch3" opening={c.opening} visitors={1} />
  <StepScene id="ch3-problem" kind="problem" scene={c.scenes.problem} diagram={ProblemDiagram} build={buildProblem} />
  <StepScene id="ch3-attempt" kind="attempt" … />
  <StepScene id="ch3-concept" kind="concept" … />
  <InteractionFrame …>…</InteractionFrame>        {/* 바이블 0-10에 있는 챕터만 */}
  <StepScene id="ch3-solution" kind="solution" … />
  <Summary text={c.summary} />
  <Quiz id="ch3" quiz={c.quiz} />
  <ChapterGrowth id="ch3" growth={c.growth} />
</ChapterShell>
```

## 다이어그램 + build 함수 규칙
- 다이어그램은 순수 렌더 함수 `() => <svg viewBox=… className="diagram h-full w-full">…</svg>`. 상태(state) 없음. 정지 모드에서 step 수만큼 다시 그려진다.
- 애니메이션 대상은 `data-el="이름"`. 전역 id 금지.
- build: `(q, tl, { mobile }) => { … }`
  - 초기 상태는 `tl.set(el, {...}, 0)`로 먼저 고정하고, 이후 `tl.to(...)`. 같은 속성에 `from`을 여러 번 쓰지 않는다.
  - step i 전환은 `at(i)`(= i + 0.08)에서 시작해 `i + 0.9` 전에 끝낸다. 길이 기본 `DUR`(0.72).
  - transform·opacity 위주. `attr`(viewBox·points) 트윈은 허용. blur·filter 금지.
  - 입자 수: 데스크톱 ≤ 60, `mobile`이면 ≤ 24.
  - SVG 회전은 `svgOrigin`(게이지 바늘은 `data-origin` 값 사용).
- 색: 데이터 = `var(--accent)`, 실패 `var(--fail)` + ✕, 성공 `var(--ok)` + ✓, 대기 `var(--wait)` + ⏸. 상태는 `Badge`/`Node statuses`로 — 색만 바꾸지 않는다.
- 선은 `Rough*`/`Node`/`RArrow`를 쓴다. 거칠기는 챕터 스테이지가 정한다. 작은 그림은 `rough={0.4}`처럼 낮춘다.
- 모바일: `useEnv().mobile`이면 세로 배치 좌표로 그린다(다이어그램 영역이 화면 위쪽 50svh).
- 맵 변화는 `<PipelineMap t={…} from={…} />` + `mapTransition(q, tl, at(i))`.

## 인터랙션
- 네이티브 컨트롤(`button`, `input type=range`, `radio`, `aria-pressed` 토글)만. 키보드로 전부 조작.
- 결과 영역은 `aria-live="polite"`. 모션 줄이기면 애니메이션 없이 결과만 바뀐다(`useEnv().reduced`).
- 문구는 콘텐츠 파일에서. 단순화한 모델이면 `UI.simplified` 고지를 보여준다.

## 확인
1. `npm run typecheck` (여러 작업자가 동시에 돌려도 안전)
2. 개발 서버(포트 5288)에서 `node scripts/shot.mjs --at "#<id>-problem@0.4" …` 데스크톱 / `--mobile` / `--reduced`로 장면마다 스크린샷을 찍어 직접 본다. 콘솔 에러 0.
3. 텍스트가 스토리보드와 일치하는지, 플레이스홀더가 없는지.
