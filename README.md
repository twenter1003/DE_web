# Data Engineering A to Z — 주니어에서 시니어까지

데이터 엔지니어링을 처음 배우는 사람(비전공자, 코딩 경험 거의 없음)을 위한 스크롤 기반 학습 페이지예요.
가상의 쇼핑몰 '바구니'의 신입 데이터 엔지니어 주니가 시니어가 되기까지, 회사가 커질 때마다 터지는 데이터 문제를 따라가며 핵심 개념을 A부터 Z까지 배워요.

- 12개 장(Prologue, Ch1~Ch10, Epilogue), 약 35분
- 챕터마다 '문제 → 시도와 실패 → 개념 → 해결 → 퀴즈 → 성장'
- 진화하는 파이프라인 맵, A–Z 용어 카드 26장, 레벨(Lv1 신입 → Lv5 시니어)과 역량 레이더
- 선이 챕터마다 정밀해지는 '스케치에서 설계도로' 비주얼
- 모션 줄이기(시스템 설정 또는 페이지 토글)에서도 단계별 정지 그림과 글로 모든 내용을 배울 수 있어요

## 실행

Node.js 20 이상이 필요해요.

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 터미널에 표시된 주소(기본 `http://localhost:5173`)를 열어요. 다른 포트를 쓰려면 `npm run dev -- --port 5288`.

## 빌드와 배포

```bash
npm run build
```

`dist/`에 정적 파일이 만들어져요. 빌드는 상대 경로(`base: './'`)라서 어느 경로에 올려도 동작해요. `npm run preview`로 빌드 결과를 미리 볼 수 있어요.

- **Vercel**: 저장소를 가져오면 Vite 프로젝트로 인식해요. Build Command `npm run build`, Output Directory `dist`.
- **GitHub Pages**: 저장소 Settings → Pages에서 Source를 GitHub Actions로 정하고, 아래 워크플로를 `.github/workflows/pages.yml`로 추가해요.

  ```yaml
  name: Pages
  on:
    push:
      branches: [main]
  permissions:
    contents: read
    pages: write
    id-token: write
  jobs:
    deploy:
      runs-on: ubuntu-latest
      environment:
        name: github-pages
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 22
        - run: npm ci && npm run build
        - uses: actions/upload-pages-artifact@v3
          with:
            path: dist
        - uses: actions/deploy-pages@v4
  ```

## 문구 고치기 (컴포넌트를 건드리지 않고)

모든 텍스트는 `src/content/` 아래에 있어요.

| 고칠 것 | 파일 |
|---|---|
| 챕터 본문·대사·그림 속 라벨·퀴즈·성장 대사 | `src/content/chapters/<챕터>.ts` (`prologue`, `ch1` … `ch10`, `epilogue`) |
| A–Z 카드 정의 | `src/content/cards.ts` |
| 챕터 제목·주제·회사 규모 | `src/content/toc.ts` |
| 인물 이름, 레벨 이름, 역량 축과 챕터별 상승치 | `src/content/people.ts` |
| 파이프라인 맵 노드 라벨, 등장·퇴장 시점 | `src/content/map.ts` |
| 버튼·HUD·안내 문구 | `src/content/ui.ts` |

챕터 파일의 `scenes.<장면>.steps[]`에서 `text`는 화면 왼쪽 글, `lines`는 말풍선, `alt`는 그 단계 그림의 설명(모션 줄이기·스크린리더용)이에요. `**굵게**`, `` `코드` `` 두 가지 표기만 쓸 수 있어요.
step 개수를 바꾸면 그 장면의 애니메이션(`src/chapters/<챕터>/scenes.tsx`)도 함께 고쳐야 해요. 문장만 고칠 때는 콘텐츠 파일만 바꾸면 돼요.

장면 기획 원본은 `docs/storyboard/`에 있고, `node scripts/storyboard.mjs`로 `docs/STORYBOARD.md` 한 파일로 합쳐요.

## 구조

```
src/content/      문구(위 표)
src/chapters/     챕터 = 독립 컴포넌트 + 자체 타임라인 (registry.ts 에 순서)
src/components/   공통 부품: StepScene(모션 문법), PipelineMap, Quiz, ChapterGrowth, Hud, Desk, Rough* …
src/state/        진행도(localStorage), 모션 줄이기·모바일 감지(gsap.matchMedia), 레벨·역량·맵 파생
src/lib/          스테이지 팔레트·선 정밀도, gsap 등록, rough.js 래퍼
docs/             SPEC(요구사항), STORYBOARD, ARCHITECTURE, CHAPTER_GUIDE, HANDOFF
scripts/          contrast.mjs(팔레트 대비 검증), shot.mjs(스크린샷), storyboard.mjs
```

자세한 설계와 규칙은 `docs/ARCHITECTURE.md`, `docs/CHAPTER_GUIDE.md`, `CLAUDE.md`에 있어요.

## 점검 도구

- `npm run typecheck` — 타입 검사
- `node scripts/contrast.mjs` — 12개 스테이지 팔레트의 WCAG 대비 검증(본문 4.5:1, 그래픽 3:1)
- `node scripts/shot.mjs --at "#ch3@0" --mobile --reduced` — 개발 서버를 띄운 상태에서 주요 지점 스크린샷(`shots/`)과 콘솔 에러 확인. 옵션은 파일 맨 위 주석에 있어요.
- 개발 서버에서만: `?debug=map`(맵의 모든 시점), `?debug=scene`(장면 엔진 점검)

## 사용한 것

React 19, TypeScript, Vite, Tailwind CSS 4, GSAP·ScrollTrigger, rough.js. 글꼴은 Pretendard와 JetBrains Mono(둘 다 SIL Open Font License).
바구니와 등장인물은 모두 가상이고, 도구 이름은 대표적인 예시로만 소개했어요.
