# HANDOFF — 새 세션은 여기부터

사용자 요청: Phase 0~3을 **멈추지 말고** 끝까지 완료. 컨텍스트 70% 근처에서 이 문서를 갱신하고 새 세션으로 넘김. 가정·질문은 최종 보고에 모은다.

## 현재 상태 (Phase 0 거의 완료, Phase 1 기반 코드 작성 중 — 아직 빌드 안 돌려봄)

### 완료
- `docs/SPEC.md` 원문 저장, `CLAUDE.md` 규칙, `docs/ARCHITECTURE.md`(디자인 토큰·폴더·컴포넌트·리스크)
- `docs/storyboard/00-bible.md` 스토리 바이블(고정값: 인물, 맵 노드 계획, 카드 26장, 역량 수치, 용어 첫 등장 위치)
- `docs/storyboard/01-prologue.md` ~ `12-epilogue.md`: 워크플로(작성 → 적대적 검토 → 일관성 검토)로 작성. **마지막 세션에서 검토/일관성 단계가 끝났는지 불확실** → 파일 존재·품질 확인 후 필요하면 일관성 검토만 다시 돌릴 것.
- 아직 안 한 것: 챕터 파일들을 합쳐 `docs/STORYBOARD.md` 만들기(00-bible + 01~12 순서대로 이어 붙이기).
- 패키지 설치 완료(React 19, Vite 8, TS 7, Tailwind 4, GSAP 3.15, roughjs, pretendard, JetBrains Mono, playwright). 크로미움 설치돼 있음.
- 작성된 코드:
  - `src/lib/stages.ts` 스테이지 12단계 팔레트(대비 검증 통과: `node scripts/contrast.mjs`), `gsap.ts`, `storage.ts`, `rough.ts`, `rich.tsx`
  - `src/content/types.ts, toc.ts, people.ts(레벨·역량), cards.ts(26장 — 스토리보드 정의와 맞춰볼 것), map.ts(노드·엣지 시간축), ui.ts`
  - `src/state/derive.ts(레벨·역량·맵 상태·뷰박스), env.tsx(gsap.matchMedia로 모션 줄이기·모바일), progress.tsx, active.ts`
  - `src/components/sketch.tsx(Rough* 도형, StageCtx), people.tsx(주니 얼굴 4표정·아바타·말풍선), diagram.tsx(Node·Badge·Particles·SvgTable·Gauge·CodeType), StepScene.tsx(모션 문법 핵심), PipelineMap.tsx(맵 + mapTransition)`

### 다음 할 일 (순서대로)
1. `docs/STORYBOARD.md` 합치기, 스토리보드 Ch10 맵 순서·카드 정의를 `src/content/cards.ts`·`map.ts`와 대조.
2. 나머지 공통 컴포넌트: `ChapterShell`(StageCtx.Provider + stageVars 인라인 + 앞 챕터와 그라디언트 띠 + IntersectionObserver로 setActive/reach), `ChapterOpening`+`Desk`(레벨별 책상, 동료 수), `Summary`, `Quiz`(라디오 + 확인, 보기별 해설, aria-live, answer()로 완료), `TermCard`, `Radar`, `ChapterGrowth`(카드·역량·맵 전환·레벨업 자동 재생 + 다시 보기), `Hud` + `<dialog>` 패널(도감/역량/맵/목차/설정), `ChapterRail`, `MotionToggle`, `Hero`.
3. `index.html`(lang=ko), `src/main.tsx`, `src/App.tsx`, `src/chapters/registry.ts`. `document.fonts.ready` 후 `ScrollTrigger.refresh()`.
4. `npm run build` 통과시키기(TS 7 — 오류 나면 tsconfig 옵션 확인).
5. Prologue·Ch1·Ch2를 스토리보드대로 최종 품질 구현(`src/content/chapters/*.ts` + `src/chapters/<Id>/`). `scripts/shot.mjs`(Playwright 스크린샷 + 콘솔 에러 수집) 만들어 데스크톱 1440×900 / 모바일 390×844 / reduced-motion 확인. 커밋.
6. Phase 2: Ch3~Ch10, Epilogue를 2~3개씩 병렬 에이전트로 구현(각자 자기 폴더만 수정, `npm run typecheck`만 실행), 묶음마다 빌드 후 커밋.
7. Phase 3: 모바일·키보드·대비·모션 축소 전 구간 점검, Lighthouse, 콘텐츠 정확성 목록, README.

### 핵심 결정 (바꾸지 말 것)
- 핀 고정 = CSS sticky + ScrollTrigger는 진행률만. step i 전환은 타임라인 `[i, i+1)`, `i+0.9` 전에 끝냄. 초기 상태는 `tl.set(...,0)` 후 `to` (같은 속성에 from 여러 번 금지).
- 모션 줄이기 = React에서 `StaticScene`(step마다 다이어그램 스냅샷 `tl.time(i+0.97)`).
- 배경은 섹션 단색 + 텍스트 없는 그라디언트 띠(6→7에서 종이→블루프린트).
- 맵 시간축: Ch10은 10(제안)→10.25(클라이맥스)→10.5(Build vs Buy)→10.75(ML·Reverse ETL). HUD 맵은 furthest 스테이지(ch10은 climax면 10.75).
- 레벨 = 1 + ch2·ch4·ch7 완료 + ch10 클라이맥스 도달. 카드·역량은 퀴즈 완료 시.
- 색은 SVG 속성 대신 `style`로(CSS 변수). rough 채우기 색은 sketch.tsx의 FILL 표식 → style 치환.

### 가정(최종 보고에 포함)
- 회사 이름 '바구니', 인물 이름(바이블 0-2)은 임의로 정함.
- Prologue에도 인터랙션 1개('가게 직접 이용해보기') 추가, Ch2는 ETL↔ELT 토글이 인터랙션.
- Ch10 맵 단순화를 위해 Build vs Buy에서 etl·cdc를 관리형 Zero-ETL 연결선으로 대체.
- 강조색은 신호 주황(종이 #C24705 / 블루프린트 #FF8A3D).
