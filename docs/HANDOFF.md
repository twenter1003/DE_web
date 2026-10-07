# HANDOFF — 새 세션은 여기부터

사용자 요청: Phase 0~3을 **멈추지 말고** 끝까지 완료. 컨텍스트 70% 근처에서 이 문서를 갱신하고 새 세션으로 넘김. 가정·질문은 최종 보고에 모은다.

## 현재 상태 (최신: 커밋 90b5067)
- **Phase 1 완료**: Prologue·Ch1·Ch2 구현·검토·커밋. `docs/STORYBOARD.md` 합침(`node scripts/storyboard.mjs`). 카드 26장 정의를 스토리보드와 동기화. Ch3~Epilogue는 스텁(`return null`)으로 registry에 등록돼 있음.
- **다음 = Phase 2**: `docs/phase2-workflow.js`를 Workflow 도구에 `script`로 그대로 넣어 실행(배치 3개: Ch3·4·5 → Ch6·7·8 → Ch9·10·Epilogue, 각 build → review → gate가 빌드·커밋). 실행 전 개발 서버(포트 5288)가 떠 있어야 함.
- 검토자가 남긴 공유 컴포넌트 과제(Phase 3에서 처리): ① 모바일 세로 맵에서 app과 운영 DB가 나란히 놓여 연결선이 짧음(`PipelineMap` verticalLayout), ② Ch1 `scenes.tsx`의 `primed()` 래퍼는 StepScene 수정으로 이제 불필요(지워도 됨).

## 이전 기록
- Phase 0: 완료. `docs/SPEC.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CHAPTER_GUIDE.md`, `docs/storyboard/00-bible.md` + `01~12` 챕터 스토리보드(작성 → 적대적 검토 완료, 일관성 검토는 워크플로 `wf_0a2dde01-551` 마지막 단계). **`docs/STORYBOARD.md`(00-bible + 01~12 이어 붙이기)는 아직 안 만듦.**
- Phase 1: 기반 + Prologue 완료(커밋 `11f0673`). Ch1·Ch2는 워크플로 `wf_54d91a1f-b2d`(build → review)로 구현 중. 끝나면 직접 스크린샷 검토 후 커밋.
- Phase 2(Ch3~Ch10, Epilogue)·Phase 3: 아직.

## 실행·검증
- 개발 서버: `npx vite --port 5288 --strictPort` (5173은 사용자 다른 앱이 씀 — 건드리지 말 것). `.claude/launch.json`에 `dev` 설정.
- 스크린샷: `node scripts/shot.mjs --at "#prologue-problem [data-step]:nth-child(2)@0.8" [--mobile] [--reduced] [--click "role=button[name='…']"]` → `shots/`. 보기 전에 `sips -Z 900 in.png --out out.png`.
- 맵 전 시점 갤러리: `http://localhost:5288/?debug=map` (세로 배치: `&vertical`), 엔진 점검: `?debug=scene` (개발 빌드에서만).
- `npm run build`, `npm run typecheck`, `node scripts/contrast.mjs`.

## 핵심 결정 (바꾸지 말 것)
- 핀 고정 = CSS sticky + ScrollTrigger는 진행률만(`StepScene`). step i 전환은 `[i, i+0.9)`, 초기 상태는 `tl.set(...,0)` 후 `to`.
- 모션 줄이기 = `StaticScene`(step마다 다이어그램 스냅샷 `tl.time(i+0.97)`).
- 다이어그램은 440×480 세로형 좌표계 하나로 데스크톱·모바일 공용(모바일 라벨 ≈ 12~13px). 패널 최대 폭 36rem.
- 배경은 섹션 단색 + 텍스트 없는 그라디언트 띠(6→7에서 종이→블루프린트).
- 맵 시간축: Ch10은 10(제안)→10.25(클라이맥스)→10.5(Build vs Buy)→10.75(ML·Reverse ETL). HUD 맵은 furthest 스테이지(ch10은 climax면 10.75).
- 레벨 = 1 + ch2·ch4·ch7 완료 + ch10 클라이맥스 도달(`markClimax`). 카드·역량은 퀴즈 완료 시.
- 모노 글꼴 스택 맨 앞 'Mono Space KR'(공백만 Pretendard) — 한글 라벨 띄어쓰기 벌어짐 방지. `pre/code`는 진짜 고정폭.
- 색은 SVG 속성 대신 `style`(CSS 변수). rough 채우기 색은 sketch.tsx의 FILL 표식 → style 치환.

## 다음 할 일
1. Ch1·Ch2 워크플로 결과 확인 → 스크린샷 검토 → 커밋. `src/content/cards.ts` 정의를 각 스토리보드 '카드 정의'와 맞추기(S·U·J·O·E·B부터).
2. `docs/STORYBOARD.md` 합치기.
3. Phase 2: Ch3~Ch10, Epilogue를 2~3개씩 묶어 병렬 에이전트로(같은 방식: 스텁 + registry 미리 등록 → 각자 자기 폴더만), 묶음마다 빌드·커밋. Ch10은 `markClimax()`를 클라이맥스 step의 `onStep`에서 호출, 맵은 `T.ch10Proposal → ch10Climax → ch10Buy → ch10Final`. Epilogue는 퀴즈 없음, 맵 `t=11` 줌아웃 + 도감 완성 + '처음부터 다시 보기'.
4. Phase 3: 모바일·키보드·대비·모션 축소 전 구간 점검, Lighthouse(성능·접근성 90+), 콘텐츠 정확성 목록, README.

## 가정(최종 보고에 포함)
- 회사 '바구니', 인물 이름(바이블 0-2)은 임의로 정함.
- Prologue에도 인터랙션 1개('가게 직접 이용해보기'), Ch2는 ETL↔ELT 토글이 인터랙션.
- Ch10 맵 단순화를 위해 Build vs Buy에서 etl·cdc를 관리형 Zero-ETL 연결선으로 대체.
- 강조색은 신호 주황(종이 #C24705 / 블루프린트 #FF8A3D).
- 스토리보드 분량 기준(1,200~1,800자)은 공백 제외로 해석.
- Prologue의 세 역할 비유는 해결 장면 앞부분에, Ch1의 시도와 실패는 두 장면(SQL 성공 → 운영 DB 과부하)으로 나뉨(스토리보드 검토자 판단 유지).
