# 직군 트랙 (바구니 유니버스) 구현 가이드

DE 트랙(`index.html`)과 별도 페이지로 직군 트랙을 얹는다. 지금은 PM 트랙의 첫 장(P1)이 시범판(`pm.html`)으로 구현돼 있다. 시나리오는 `docs/STORY_BIBLE_UNIVERSE.md`, 장면 스토리보드는 `docs/storyboard/pm/`·`docs/storyboard/analyst/`.

## 구조
```
pm.html                      PM 트랙 진입 페이지 (vite 멀티 페이지 입력: vite.config.ts)
src/pm/main.tsx, PmApp.tsx   페이지 루트. 장을 여기서 이어 붙인다
src/pm/progress.tsx          PM 진행도(localStorage 키 pm-atoz:progress). DE 진행도와 분리
src/pm/Track.tsx             TrackShell(장 틀·팔레트), TrackOpening, TrackGrowth
src/pm/anim.ts               buildAppear: data-el 이름별 나타남/사라짐 문법
src/pm/P1/                   장 하나 = index.tsx(배치) + scenes.tsx(그림+build) + 인터랙션
src/content/pm/types.ts      TrackChapter 타입, PM 역량 6축, PM 레벨 이름
src/content/pm/p1.ts         P1 문구·퀴즈·카드·역량 (스토리보드 최종 문구)
```
DE 쪽 공통 부품을 그대로 쓴다: `StepScene`(스크롤 장면), `Fig`·`Txt`·`SvgTable`·`R*`(그림), `Bubble`(말풍선), `InteractionFrame`, `Summary`, `Rich`. 퀴즈는 저장을 밖에서 받는 `QuizView`로 나눠 두 트랙이 같이 쓴다(`Quiz`는 DE용 래퍼).

## 새 장 추가 순서
1. 스토리보드의 문구를 `src/content/pm/pN.ts`에 `TrackChapter`로 옮긴다(스토리보드와 한 글자도 다르지 않게).
2. `src/pm/PN/scenes.tsx`에 장면마다 그림(`<Fig>`)과 build를 만든다. 대부분은 `buildAppear({ 이름: step번호 | {in,out,stagger} })`로 충분하다. 숫자가 올라가는 곳은 `countTo`.
3. 인터랙션은 네이티브 컨트롤로 만들고 `InteractionFrame` 안에 둔다. 규칙·계산은 content 파일의 순수 함수로 두어 화면 없이 검산할 수 있게 한다.
4. `src/pm/PN/index.tsx`에서 장면 → 인터랙션 → 요약 → 퀴즈 → 성장 순으로 배치하고, `PmApp.tsx`에 추가한다.
5. 확인: `npx tsc -p .`, `npm run build`, 개발 서버에서 `node scripts/shot.mjs --url http://localhost:5288/pm.html --at "#p1-problem@0.5"`로 데스크톱·`--mobile`·`--reduced` 확인, 콘솔 에러 0.

## 아직 안 한 것
- PM 트랙 P2~P8, 다온 트랙 D1~D8, 소라·태오 트랙
- 트랙 선택 첫 화면, 트랙 사이 교차 링크, 직군 통합 도감·HUD
- 카드 글자 충돌 해결(바이블 §13): 지금 PM 카드 글자는 임시 배정이라 DE 카드와 겹칠 수 있다
- 장면 수가 늘면 장(챕터) 지연 로딩과 목차 레일이 필요하다(DE의 `DeferredChapter`/`ChapterRail` 참고)
