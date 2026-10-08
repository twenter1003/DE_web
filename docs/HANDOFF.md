# HANDOFF — 새 세션은 여기부터

사용자 요청: Phase 0~3을 **멈추지 말고** 끝까지 완료. 컨텍스트 70% 근처에서 이 문서를 갱신하고 새 세션으로 넘김. 가정·질문은 최종 보고에 모은다.

## 현재 상태 (최신: 커밋 1fa35dc 이후)
- **Phase 0·1·2 완료**: 12개 장 모두 구현·검토·커밋. Ch1·Ch2 인터랙션은 사용자 요청으로 '코드 실행기'.
- **Phase 3 일부 완료**: 감사 9개 끝 → 결과 150건이 `docs/phase3-findings.json`에 저장됨(high 8 / medium 56 / low 86).
  - 공유 코드 38건 처리(31건 완료, 3건 일부, 4건 건너뜀 — `sharedFixReport` 참고). Ch5 수정 완료(`chapterFixReports.ch5`).
  - **남은 일 = 챕터별 수정 + 최종 검증**: Prologue, Ch1~4, Ch6~10, Epilogue의 findings(`audits.*.findings`에서 `chapter`가 그 챕터인 것). 일부는 1fa35dc에 이미 반영됐을 수 있으니 고치기 전에 현재 파일 확인.
- **2026-10-08 세션(울트라코드, Opus)**: 수정 단계만 도는 워크플로 `wf_1815db3c-e6d` 실행 — 챕터마다 수정 → 독립 검토(콘텐츠 정확성 + UI 회귀, 읽기 전용) → 재수정(최대 2회) → 최종 검증(build·Lighthouse / SPEC 10장·콘솔 / 375·360·모션 줄이기·키보드) → 실패 시 최종 수정·재검증. 커밋은 메인 세션이 함. 스크립트는 세션 폴더 `workflows/scripts/phase3-fix-review-verify-*.js`(세션이 바뀌면 resume 불가 → `git diff`로 반영 상태 확인 후 남은 챕터만 다시). 챕터별 findings 추출 도우미: `node -e` 로 `audits.*.findings`를 `chapter`로 거르면 됨(id = `<audit>#<index>`).
- **사용자 추가 요청: BGM**(같은 세션) — Web Audio 합성(파일 없음) `src/lib/bgm.ts`(첫 클릭 때 지연 로드), 상태 `src/state/bgm.ts`, HUD `BgmToggle`(기본 꺼짐, aria-pressed, 설정 탭에도), 문구 `UI.bgm`. 스테이지마다 악기 추가(0 패드·1 피아노·3 베이스·5 킥/햇·7 블루프린트·8 멜로디·11 에필로그). 단계별 RMS -28.5→-22.9 dBFS, 피크 ≤ -9.9. 독립 검토 워크플로 `wf_1b9526e6-040`(엔진/UX/음악) 결과 반영 필요. 히어로 제목 800~1000px 단어 끊김도 고침(`md:text-[clamp(3rem,6.2vw,5.25rem)]`).
- **GitHub**: 공개 저장소 https://github.com/twenter1003/DE_web (origin, 사용자 승인). `main` push → `.github/workflows/pages.yml`이 https://twenter1003.github.io/DE_web/ 에 배포. Phase 3·BGM 커밋 후 다시 push할 것(사용자 승인됨).
- **2026-10-09 (토큰 부족으로 중단)**: 체크포인트 `9082f25`(BGM·히어로), `fc9be38`(챕터 수정·검토 완료)까지 `main`에 push. 마지막 정리 워크플로 `wf_07eb3914-47f`는 수정 단계 중간에 사용자 요청으로 멈춤 → 그 수정(28개 파일, **검토·검증 전**)은 브랜치 `wip/phase3-finish`에 커밋·push(사이트 배포 안 됨). 다음 세션: ① `git diff main wip/phase3-finish`로 확인 후 가져오기(`git merge wip/phase3-finish`) — 항목 목록은 그 브랜치의 `docs/phase3-todo.json`. ② 남은 일: 공용 항목(map.ts 운영 DB→CSV 연결선, StepScene 태블릿 열, progress 컨텍스트 분리, cards Q, 바이블 ELT·처리 시간) 마무리 → 독립 검토 → 최종 검증(SPEC 10: 키보드로 퀴즈 전부 → 26/26·Lv5, 맵 성장·Ch10 단순화·에필로그 줌아웃, 지연 마운트 전체 스크롤 콘솔 0, 375/360/375×667·모션 줄이기) → `npm run build`·`node scripts/storyboard.mjs` → Lighthouse(모바일·데스크톱) → 커밋·push(승인됨). ③ 보고: 부정확·과단순 문장 목록(`docs/phase3-findings.json` content1~3 + 검토 결과) 고친 것/남긴 것, Lighthouse 점수.
- 다음 세션에서 할 순서(위 워크플로가 끝나지 않았을 때):
  1. 개발 서버 `npx vite --port 5288 --strictPort` 띄우기(5173은 사용자 다른 앱).
  2. 챕터마다 에이전트 하나씩(병렬, 자기 챕터 파일만): `docs/phase3-findings.json`에서 그 챕터 findings를 읽어 수정 → typecheck·스크린샷(데스크톱/--mobile/--reduced)으로 확인. (`docs/phase3-workflow.js`를 그대로 돌리면 감사부터 다시 돈다 — 세션이 바뀌면 resume 불가. 수정 단계만 돌리는 스크립트로 바꿔 쓸 것.)
  3. 최종 검증: `npm run build`, SPEC 10장 완료 기준(퀴즈 전부 → 26/26, Lv5, 맵 성장·Ch10 단순화·에필로그 줌아웃, 모션 줄이기, 모바일), 전체 스크롤 콘솔 에러 0, Lighthouse(모바일·데스크톱), 커밋.
  4. 사용자에게 보고: `contentFindings`(content1~3 감사)를 '부정확하거나 지나치게 단순화한 문장' 목록으로 정리해 보고(SPEC Phase 3 요구), 고친 것/남긴 것 표시.

## 진행 중(이 세션 후반)
- Phase 2 워크플로 `wf_cdfbb66e-c7f` 실행 중(`docs/phase2-workflow.js`). 배치마다 gate 에이전트가 빌드·커밋.
- **사용자 추가 요청(2026-10-08)**: "유저가 코드를 입력·실행하면 그 과정을 모션그래픽으로 보여주기". 결정: 챕터당 인터랙션 1개 규칙을 지키려고 *교체*로 반영 —
  Ch1 SQL 놀이터 → 편집 가능한 'SQL 실행기'(FROM→JOIN→WHERE→GROUP BY→SELECT 논리 순서로 단계 실행), Ch2 ETL↔ELT 토글 → '파이프라인 코드 실행기'(extract→정제→load를 줄마다 실행, load를 위로 올리면 ELT). 미리 채운 코드 + 한 번 누르는 실험 버튼(비전공자용), 작은 자체 해석기(무거운 SQL 엔진 없음). 워크플로 `wf_c0d6ffbf-47b`. 다른 챕터(예: Ch7 YAML 테스트)로 넓힐지는 사용자 의견 대기.
- 성능: 챕터 지연 마운트(`src/state/mount.ts`, `Deferred.tsx`, `?mount=all`로 전부), 첫 화면 사전 렌더(`scripts/prerender.mjs`, build에 포함), GSAP 지연 로드. Lighthouse 데스크톱 99/100/100/100, 모바일 성능 ~82(한글 웹폰트 서브셋 ~300KB가 느린 4G 시뮬레이션의 첫 그리기를 좌우).

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
- Ch8에서 맵이 16→15 노드로 줄어드는 건 레이크하우스 통합(호수+창고)으로 의도한 SPEC 10 예외. Ch10 최종 16 노드는 Ch8보다 많아서, Ch10의 '단순해짐'은 제안안 21→16 대비로 보여 준다.
- BGM은 기본 꺼짐, 켠 상태를 저장하지 않음, 음량 슬라이더 없음(기기 음량으로 조절).
- Prologue의 세 역할 비유는 해결 장면 앞부분에, Ch1의 시도와 실패는 두 장면(SQL 성공 → 운영 DB 과부하)으로 나뉨(스토리보드 검토자 판단 유지).
