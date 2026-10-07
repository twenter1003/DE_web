// 화면 곳곳의 고정 문구(버튼·안내·HUD). 챕터 본문은 chapters/ 아래에 있다.

export const UI = {
  title: 'Data Engineering A to Z',
  subtitle: '주니어에서 시니어까지',
  skip: '본문으로 건너뛰기',

  hero: {
    lede: '신입 데이터 엔지니어 주니가 시니어가 되기까지. 작은 쇼핑몰이 1,000만 명 서비스로 커지는 동안 터지는 데이터 문제를 따라가며, 데이터 엔지니어링을 처음부터 배워요.',
    facts: [
      { k: '대상', v: '코딩을 몰라도 괜찮아요' },
      { k: '분량', v: '12개 장, 약 35분' },
      { k: '방법', v: '스크롤하면 이야기가 진행돼요' },
    ],
    start: '처음부터 시작하기',
    resume: (label: string) => `${label}부터 이어 보기`,
    scrollCue: '아래로 스크롤하면 시작해요',
    cardsCaption: '챕터를 마칠 때마다 용어 카드를 한 장씩 모아요. 26장이면 A부터 Z까지.',
    sceneAlt: '책상 앞에 앉은 신입 주니. 노트북 한 대와 CSV 파일 한 장이 전부예요.',
  },

  moods: { panic: '당황한 표정', focus: '집중한 표정', proud: '뿌듯한 표정', relaxed: '여유로운 표정' },

  sceneKinds: {
    problem: '문제',
    attempt: '시도와 실패',
    concept: '개념',
    solution: '해결',
    climax: '결정',
    story: '이야기',
  },

  chapterMinutes: '약 3분',
  figure: '그림 설명',
  simplified: '단순화한 모델이에요',

  summary: '한 줄 요약',

  quiz: {
    title: '확인 퀴즈',
    legend: '보기 중 하나를 고르세요',
    submit: '정답 확인',
    correct: '정답이에요.',
    wrong: (n: number) => `아쉬워요. 정답은 ${n}번이에요.`,
    pass: '해설까지 읽었으니 이 챕터는 통과예요.',
    yourPick: '내가 고른 답',
    answer: '정답',
    explanation: '해설',
  },

  growth: {
    title: '성장',
    cards: '얻은 카드',
    locked: '위 퀴즈를 풀면 이 카드를 얻어요',
    stats: '역량 변화',
    statsLocked: '퀴즈를 풀면 역량이 올라가요',
    map: '파이프라인 맵',
    nodes: (a: number, b: number) => `노드 ${a}개에서 ${b}개로`,
    levelUp: '승급',
    levelUpLocked: (lv: number, name: string) => `퀴즈를 풀면 Lv${lv} ${name}(으)로 승급해요`,
    replay: '다시 보기',
    newTag: '새로',
    goneTag: '걷어냄',
  },

  hud: {
    open: '주니의 기록 열기: 도감, 역량, 맵, 목차, 설정',
    level: (lv: number, name: string) => `Lv${lv} ${name}`,
    progress: (p: number) => `진행 ${p}%`,
    cards: (n: number) => `카드 ${n}/26`,
  },

  panel: {
    title: '주니의 기록',
    close: '닫기',
    tabs: { cards: '도감', stats: '역량', map: '맵', toc: '목차', settings: '설정' },
    cardsCount: (n: number) => `26장 중 ${n}장을 모았어요`,
    cardFrom: (label: string) => `${label}에서 얻음`,
    cardLocked: (label: string) => `${label} 퀴즈를 풀면 열려요`,
    radarNote: '레이더는 이야기 속 성장을 보여주는 학습 장치예요. 실제 역량 평가가 아니에요.',
    mapHint: '노드를 누르면 그 노드가 처음 등장한 챕터로 이동해요.',
    tocDone: '완료',
    tocHere: '지금 보는 중',
    reset: '진행도 초기화',
    resetConfirm: '모은 카드와 퀴즈 기록이 모두 지워져요. 초기화할까요?',
    resetYes: '초기화',
    resetNo: '취소',
    resetDone: '초기화했어요.',
  },

  motion: {
    label: '모션 줄이기',
    options: { system: '시스템 설정 따르기', reduce: '줄이기', full: '모두 보기' },
    systemNow: (reduced: boolean) => (reduced ? '지금 시스템 설정: 모션 줄이기' : '지금 시스템 설정: 보통'),
    desc: '모션을 줄이면 애니메이션 대신 단계별 정지 그림과 글로 보여줘요. 배우는 내용은 똑같아요.',
    toggleOn: '모션 줄이기 켜짐',
    toggleOff: '모션 줄이기 꺼짐',
  },

  rail: { label: '챕터 목록', done: '완료' },

  interaction: { label: '직접 해보기' },

  map: {
    aria: (n: number) => `파이프라인 맵, 노드 ${n}개`,
    goto: (label: string, chapter: string) => `${label}: ${chapter}로 이동`,
    proposal: '제안',
    check: '품질 검사',
  },

  footer: {
    note: '바구니와 등장인물은 모두 가상이에요. 도구 이름은 대표적인 예시로만 소개했어요.',
  },
} as const
