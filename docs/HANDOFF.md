# HANDOFF — 새 세션은 여기부터

사용자 요청: Phase 0~3을 **멈추지 말고** 끝까지 완료. 컨텍스트 70% 근처에서 이 문서를 갱신하고 새 세션으로 넘김. 가정·질문은 최종 보고에 모은다.

## 현재 상태 (최신: 2026-10-09 두 번째 세션)
- **Phase 0~3 완료**(아래 '지난 기록'). 이번 세션은 Phase 3 뒤 '남은 과제(선택)'를 처리했다. 작업 브랜치 `ccr-4c70042a-eeawss`, 초안 PR https://github.com/twenter1003/DE_web/pull/1 (main에 합치면 GitHub Pages 배포).
- **이번 세션에서 한 일**
  - **모바일 성능(남은 과제 ①)**: Lighthouse 모바일(이 클라우드 환경, gzip 정적 서버) 76·80·82 → **98·98·98**(TBT 720~1110 → 140~170ms, CLS 0.045 → 0, LCP = FCP 1.5s), 데스크톱 100. 접근성·권장·SEO 100.
    - `main.tsx`: 사전 렌더 HTML이 있으면 `hydrateRoot`. 첫 렌더는 서버와 같은 값: 모션 줄이기·모바일·페이지 토글은 서버 스냅숏이 있는 외부 저장소(`env.tsx`), 저장된 진행도는 레이아웃 효과에서 불러옴(`progress.tsx`의 `load` 액션).
    - `rough.ts`: 경로 좌표 소수 둘째 자리 반올림(Node·브라우저 삼각함수 끝자리 차이로 hydration 불일치). 사전 렌더 HTML 102KB → 60KB(gzip 15KB).
    - 히어로 제목: 모바일은 줄을 직접 나눔(웹폰트 도착 때 412px에서 3줄→2줄로 바뀌던 CLS).
    - **진짜 원인은 로드 직후 프롤로그 미리 마운트**(4배 감속에서 1초짜리 작업). `StepScene`: 장면 그림·타임라인은 화면에 가까워질 때(위·아래 1.5화면, `useNear`) 만든다 → 926ms → 212ms. 그림 칸 높이가 고정이라 레이아웃은 안 밀림.
    - `StepScene` `primeTransforms`: 첫 렌더 전에 transform 대상들을 한꺼번에 읽어 GSAP 캐시에(SVG에서 '읽기→쓰기' 반복이 대상마다 전체 레이아웃을 강제하던 것, 프롤로그 32회 → 3회).
    - 개발 서버도 사전 렌더 HTML을 내보냄(`vite.config.ts` `prerenderInDev`) → hydration 불일치가 개발 중 콘솔 에러로 보인다.
  - **태블릿 라벨(②)**: `StepScene`이 그림 칸 크기를 재서(ResizeObserver) 440×480보다 작으면 모바일과 같은 `--fs-lift: 7px`. 10px 미만 라벨: 768×1024 752 → 308, 820×1180 377 → 239, 1024×768 422 → 289(데스크톱 1440에도 일부러 작게 그린 라벨이 약 240개). 글자 수로 폭을 잰 프롤로그 JSON 칩은 `Txt fit`(textLength)로 칩 안에 맞춤(모바일에서 이미 넘치던 것도 해결).
  - **Ch1 375×667(③)**: 모바일 말풍선을 촘촘하게(아바타 36px, 여백 축소, 데스크톱 그대로). Ch1 문제 step 1 여유 6 → 30px. 375×667에서 그림 칸 아래 띠보다 긴 step 27 → 14개.
  - **BGM 독립 검토**(이전 검토 워크플로 결과는 새 세션에서 볼 수 없어 다시 함): 음표 예약 0.5 → 1초 앞(메인 스레드가 잠깐 멈춰도 안 끊김), 켜 둔 채 화면이 보이는데 시스템이 소리를 멈추면(iOS 전화·Siri, 출력 장치 변경) 다시 켜고 다음 클릭·키 입력 때 한 번 더 시도. 오프라인 렌더(스테이지 0~11): RMS −28.1 ~ −25.4 dBFS, 피크 ≤ −11 dBFS, 클리핑·NaN 없음. 켜기/끄기·탭 가림/복귀·외부 정지 복구 E2E 확인.
  - **도구**: `scripts/scrollcheck.mjs`(전체 지연 스크롤: 콘솔 + 보이는데 빈 그림, 실패 시 종료 코드 1), `shot.mjs`는 `?mount=all` 챕터가 다 그려지고 한가해질 때까지 기다림·`--mobile --w 375 --h 667` 조합 가능·`PW_CHROMIUM`.
- **검증(이번 세션)**: `npm run build`·contrast 통과. hydration 경고 0(새 방문·저장된 진행도·페이지 토글·시스템 모션 줄이기·모바일). 키보드로 퀴즈 11개 → 26/26·Lv4 → 클라이맥스 → Lv5 → 새로고침 후 유지(1440·375). 전체 지연 스크롤 1440·375·768 × 모션/줄이기: 장면 61/61, 정지 그림 209/209, 보이는데 빈 그림 0, 콘솔 0. 작업 전 커밋(a333ae0)과 같은 지점 스크린샷 비교(에필로그 줌아웃, Ch3 해결 등) 동일.
- **남은 과제(선택)**
  1. 한글 폰트 서브셋: 사이트 전체 한글 854자(코드포인트 1,007개)만 담으면 198KB 파일 하나(지금 첫 화면 18개 474KB, 끝까지 읽으면 39개 1.1MB). 단 Pretendard는 OFL에 **예약 글꼴 이름(RFN 'Pretendard')**이 있어 직접 만든 서브셋은 글꼴 내부 이름을 바꿔야 배포할 수 있고, 글자가 늘면 다시 만들어야 한다(fonttools). 사용자 결정 필요. Lighthouse 점수에는 영향 없음(폰트는 load 뒤에 받음).
  2. content1#2(Ch2 원본 표의 글자 가격)는 남김.
  3. 원격 브랜치 `wip/phase3-finish`는 main에 반영됨 → 사용자 승인 후 삭제.
  4. 375×667에서 그림 칸 아래 띠보다 긴 step 14개(예: epilogue-sentence 1, ch6-window 4, ch10-serve 2)는 글이 그림 밑으로 스크롤되며 읽힌다(Phase 3에서 '본문 길이 문제'로 남김). 줄이려면 문구를 손질.

## 실행·검증
- 개발 서버: `npx vite --port 5288 --strictPort` (5173은 사용자 다른 앱이 씀 — 건드리지 말 것). `.claude/launch.json`에 `dev` 설정. 개발 서버도 첫 화면을 사전 렌더해 hydration 경로로 돈다(`?debug=…`는 제외).
- 스크린샷: `node scripts/shot.mjs --at "#prologue-problem [data-step]:nth-child(2)@0.8" [--mobile] [--reduced] [--click "role=button[name='…']"]` → `shots/`. 보기 전에 줄이기: macOS `sips -Z 900 in.png --out out.png`, Linux `convert in.png -resize 900x out.png`.
- 클라우드 컨테이너(Linux)에서는 Playwright가 받은 브라우저 대신 `PW_CHROMIUM=/opt/pw-browsers/chromium`을 지정(`shot.mjs`·`montage.mjs`·`scrollcheck.mjs`).
- 전체 스크롤 점검: `node scripts/scrollcheck.mjs [--mobile] [--reduced] [--size 768x1024]`.
- 맵 전 시점 갤러리: `http://localhost:5288/?debug=map` (세로 배치: `&vertical`), 엔진 점검: `?debug=scene` (개발 빌드에서만).
- `npm run build`, `npm run typecheck`, `node scripts/contrast.mjs`.
- Lighthouse: `npm run build` 뒤 `npm run preview`(gzip 압축, 기본 4173)로 띄워 잰다. 클라우드 컨테이너에서는 `CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse … --chrome-flags="--headless=new --no-sandbox"`.

## 핵심 결정 (바꾸지 말 것)
- 핀 고정 = CSS sticky + ScrollTrigger는 진행률만(`StepScene`). step i 전환은 `[i, i+0.9)`, 초기 상태는 `tl.set(...,0)` 후 `to`.
- 모션 줄이기 = `StaticScene`(step마다 다이어그램 스냅샷 `tl.time(i+0.97)`).
- 다이어그램은 440×480 세로형 좌표계 하나로 데스크톱·모바일 공용(모바일 라벨 ≈ 12~13px). 패널 최대 폭 36rem.
- 배경은 섹션 단색 + 텍스트 없는 그라디언트 띠(6→7에서 종이→블루프린트).
- 맵 시간축: Ch10은 10(제안)→10.25(클라이맥스)→10.5(Build vs Buy)→10.75(ML·Reverse ETL). HUD 맵은 furthest 스테이지(ch10은 climax면 10.75).
- 레벨 = 1 + ch2·ch4·ch7 완료 + ch10 클라이맥스 도달(`markClimax`). 카드·역량은 퀴즈 완료 시.
- 모노 글꼴 스택 맨 앞 'Mono Space KR'(공백만 Pretendard) — 한글 라벨 띄어쓰기 벌어짐 방지. `pre/code`는 진짜 고정폭.
- 색은 SVG 속성 대신 `style`(CSS 변수). rough 채우기 색은 sketch.tsx의 FILL 표식 → style 치환.
- 첫 화면은 사전 렌더 HTML을 `hydrateRoot`로 이어받는다. 첫 렌더에 클라이언트 전용 값(localStorage·matchMedia)을 쓰지 말 것: 외부 저장소면 `useSyncExternalStore`의 서버 스냅숏, 아니면 레이아웃 효과에서 불러오기. 개발 서버 콘솔의 hydration 경고 0 유지.
- rough 경로 좌표는 소수 둘째 자리(`rough.ts`). 사전 렌더 첫 화면에 들어가는 다른 수치 계산도 엔진마다 끝자리가 다를 수 있으니 반올림.
- 장면 그림은 화면에 가까워질 때 그린다(`StepScene` `useNear`, 1.5화면). 장면 밖에서 장면 그림 요소를 찾는 코드를 만들지 말 것(없을 수 있음). 그림 칸 높이는 고정 유지.
- 작은 라벨 키우기(`--fs-lift`): 모바일은 CSS, 768px 이상은 그림 칸이 440×480보다 작을 때 `StepScene`이 준다. 글자 수로 폭을 잰 칩 안의 글자는 `Txt fit`.

## 가정(최종 보고에 포함)
- 회사 '바구니', 인물 이름(바이블 0-2)은 임의로 정함.
- Prologue에도 인터랙션 1개('가게 직접 이용해보기'), Ch2는 ETL↔ELT 토글이 인터랙션.
- Ch10 맵 단순화를 위해 Build vs Buy에서 etl·cdc를 관리형 Zero-ETL 연결선으로 대체.
- 강조색은 신호 주황(종이 #C24705 / 블루프린트 #FF8A3D).
- 스토리보드 분량 기준(1,200~1,800자)은 공백 제외로 해석.
- Ch8에서 맵이 16→15 노드로 줄어드는 건 레이크하우스 통합(호수+창고)으로 의도한 SPEC 10 예외. Ch10 최종 16 노드는 Ch8보다 많아서, Ch10의 '단순해짐'은 제안안 21→16 대비로 보여 준다.
- BGM은 기본 꺼짐, 켠 상태를 저장하지 않음, 음량 슬라이더 없음(기기 음량으로 조절).
- Prologue의 세 역할 비유는 해결 장면 앞부분에, Ch1의 시도와 실패는 두 장면(SQL 성공 → 운영 DB 과부하)으로 나뉨(스토리보드 검토자 판단 유지).
- 그림 칸이 설계 크기보다 작은 태블릿에서도 모바일과 같은 라벨 키우기(7px)를 쓴다(모바일에서 검증된 값, 좌표는 사용자 단위라 겹침 양상이 같음).
- 모바일 말풍선은 데스크톱보다 촘촘하게(아바타 36px).

## 지난 기록
### 2026-10-08~09 Phase 3 (이번 세션 전 '현재 상태')
- **Phase 0·1·2 완료**: 12개 장 모두 구현·검토·커밋. Ch1·Ch2 인터랙션은 사용자 요청으로 '코드 실행기'.
- **Phase 3 일부 완료**: 감사 9개 끝 → 결과 150건이 `docs/phase3-findings.json`에 저장됨(high 8 / medium 56 / low 86).
  - 공유 코드 38건 처리(31건 완료, 3건 일부, 4건 건너뜀 — `sharedFixReport` 참고). Ch5 수정 완료(`chapterFixReports.ch5`).
  - **남은 일 = 챕터별 수정 + 최종 검증**: Prologue, Ch1~4, Ch6~10, Epilogue의 findings(`audits.*.findings`에서 `chapter`가 그 챕터인 것). 일부는 1fa35dc에 이미 반영됐을 수 있으니 고치기 전에 현재 파일 확인.
- **2026-10-08 세션(울트라코드, Opus)**: 수정 단계만 도는 워크플로 `wf_1815db3c-e6d` 실행 — 챕터마다 수정 → 독립 검토(콘텐츠 정확성 + UI 회귀, 읽기 전용) → 재수정(최대 2회) → 최종 검증(build·Lighthouse / SPEC 10장·콘솔 / 375·360·모션 줄이기·키보드) → 실패 시 최종 수정·재검증. 커밋은 메인 세션이 함. 스크립트는 세션 폴더 `workflows/scripts/phase3-fix-review-verify-*.js`(세션이 바뀌면 resume 불가 → `git diff`로 반영 상태 확인 후 남은 챕터만 다시). 챕터별 findings 추출 도우미: `node -e` 로 `audits.*.findings`를 `chapter`로 거르면 됨(id = `<audit>#<index>`).
- **사용자 추가 요청: BGM**(같은 세션) — Web Audio 합성(파일 없음) `src/lib/bgm.ts`(첫 클릭 때 지연 로드), 상태 `src/state/bgm.ts`, HUD `BgmToggle`(기본 꺼짐, aria-pressed, 설정 탭에도), 문구 `UI.bgm`. 스테이지마다 악기 추가(0 패드·1 피아노·3 베이스·5 킥/햇·7 블루프린트·8 멜로디·11 에필로그). 단계별 RMS -28.5→-22.9 dBFS, 피크 ≤ -9.9. 독립 검토 워크플로 `wf_1b9526e6-040`(엔진/UX/음악) 결과 반영 필요. 히어로 제목 800~1000px 단어 끊김도 고침(`md:text-[clamp(3rem,6.2vw,5.25rem)]`).
- **GitHub**: 공개 저장소 https://github.com/twenter1003/DE_web (origin, 사용자 승인). `main` push → `.github/workflows/pages.yml`이 https://twenter1003.github.io/DE_web/ 에 배포. Phase 3·BGM 커밋 후 다시 push할 것(사용자 승인됨).
- **2026-10-09 Phase 3 완료**: 남은 공용·low 항목 반영(맵 운영 DB→CSV, StepScene 태블릿 열 md 40%/lg 45%, progress 컨텍스트 분리, 카드 Q, 바이블, 에필로그 '처음부터' 스크롤, 터치 영역 44px 등) → 독립 검토 → SPEC 10 검증 통과(키보드로 퀴즈 11개 → 26/26·Lv5, 맵 4→…→17, Ch10 21→16, 에필로그 16·도감 26, 지연 마운트 전체 스크롤 1440·375 모션/줄이기 콘솔 0, 375·360 가로 넘침 0). `npm run build`·contrast 통과. Lighthouse(프로덕션, 3회): 데스크톱 100/100/100/100, 모바일 성능 75·77·91(중앙값 77, LCP 3.8s — 히어로 문단 렌더 지연)·접근성 100·권장 100·SEO 100. 콘텐츠 검수 목록: `docs/CONTENT_REVIEW.md`(57건: 고침 53, 남김 1, 화면 문제 3).
- **남은 과제(선택)**: ① 모바일 성능 90+: `createRoot`가 사전 렌더 DOM을 버리고 다시 그려 LCP가 늦음 → `hydrateRoot` 전환 검토(모션 줄이기·진행도 등 클라이언트 전용 값 때문에 hydration 불일치 주의), 한글 폰트 서브셋 요청 줄이기. ② 768px에서 그림 라벨 8~9px(전보다 크게 나아졌지만 작음). ③ Ch1 문제 step 1이 375×667에서 여유 6px. ④ content1#2(Ch2 원본 표의 글자 가격)는 남김. ⑤ 원격 브랜치 `wip/phase3-finish`는 main에 반영됐으니 지워도 됨.
- (지난 기록) 다음 세션에서 할 순서:
  1. 개발 서버 `npx vite --port 5288 --strictPort` 띄우기(5173은 사용자 다른 앱).
  2. 챕터마다 에이전트 하나씩(병렬, 자기 챕터 파일만): `docs/phase3-findings.json`에서 그 챕터 findings를 읽어 수정 → typecheck·스크린샷(데스크톱/--mobile/--reduced)으로 확인. (`docs/phase3-workflow.js`를 그대로 돌리면 감사부터 다시 돈다 — 세션이 바뀌면 resume 불가. 수정 단계만 돌리는 스크립트로 바꿔 쓸 것.)
  3. 최종 검증: `npm run build`, SPEC 10장 완료 기준(퀴즈 전부 → 26/26, Lv5, 맵 성장·Ch10 단순화·에필로그 줌아웃, 모션 줄이기, 모바일), 전체 스크롤 콘솔 에러 0, Lighthouse(모바일·데스크톱), 커밋.
  4. 사용자에게 보고: `contentFindings`(content1~3 감사)를 '부정확하거나 지나치게 단순화한 문장' 목록으로 정리해 보고(SPEC Phase 3 요구), 고친 것/남긴 것 표시.


### 진행 중(이 세션 후반)
- Phase 2 워크플로 `wf_cdfbb66e-c7f` 실행 중(`docs/phase2-workflow.js`). 배치마다 gate 에이전트가 빌드·커밋.
- **사용자 추가 요청(2026-10-08)**: "유저가 코드를 입력·실행하면 그 과정을 모션그래픽으로 보여주기". 결정: 챕터당 인터랙션 1개 규칙을 지키려고 *교체*로 반영 —
  Ch1 SQL 놀이터 → 편집 가능한 'SQL 실행기'(FROM→JOIN→WHERE→GROUP BY→SELECT 논리 순서로 단계 실행), Ch2 ETL↔ELT 토글 → '파이프라인 코드 실행기'(extract→정제→load를 줄마다 실행, load를 위로 올리면 ELT). 미리 채운 코드 + 한 번 누르는 실험 버튼(비전공자용), 작은 자체 해석기(무거운 SQL 엔진 없음). 워크플로 `wf_c0d6ffbf-47b`. 다른 챕터(예: Ch7 YAML 테스트)로 넓힐지는 사용자 의견 대기.
- 성능: 챕터 지연 마운트(`src/state/mount.ts`, `Deferred.tsx`, `?mount=all`로 전부), 첫 화면 사전 렌더(`scripts/prerender.mjs`, build에 포함), GSAP 지연 로드. Lighthouse 데스크톱 99/100/100/100, 모바일 성능 ~82(한글 웹폰트 서브셋 ~300KB가 느린 4G 시뮬레이션의 첫 그리기를 좌우).


### 이전 기록
- Phase 0: 완료. `docs/SPEC.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CHAPTER_GUIDE.md`, `docs/storyboard/00-bible.md` + `01~12` 챕터 스토리보드(작성 → 적대적 검토 완료, 일관성 검토는 워크플로 `wf_0a2dde01-551` 마지막 단계). **`docs/STORYBOARD.md`(00-bible + 01~12 이어 붙이기)는 아직 안 만듦.**
- Phase 1: 기반 + Prologue 완료(커밋 `11f0673`). Ch1·Ch2는 워크플로 `wf_54d91a1f-b2d`(build → review)로 구현 중. 끝나면 직접 스크린샷 검토 후 커밋.
- Phase 2(Ch3~Ch10, Epilogue)·Phase 3: 아직.


### 초기 계획(완료) — 다음 할 일
1. Ch1·Ch2 워크플로 결과 확인 → 스크린샷 검토 → 커밋. `src/content/cards.ts` 정의를 각 스토리보드 '카드 정의'와 맞추기(S·U·J·O·E·B부터).
2. `docs/STORYBOARD.md` 합치기.
3. Phase 2: Ch3~Ch10, Epilogue를 2~3개씩 묶어 병렬 에이전트로(같은 방식: 스텁 + registry 미리 등록 → 각자 자기 폴더만), 묶음마다 빌드·커밋. Ch10은 `markClimax()`를 클라이맥스 step의 `onStep`에서 호출, 맵은 `T.ch10Proposal → ch10Climax → ch10Buy → ch10Final`. Epilogue는 퀴즈 없음, 맵 `t=11` 줌아웃 + 도감 완성 + '처음부터 다시 보기'.
4. Phase 3: 모바일·키보드·대비·모션 축소 전 구간 점검, Lighthouse(성능·접근성 90+), 콘텐츠 정확성 목록, README.

