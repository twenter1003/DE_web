// 배경음악: 음원 파일 없이 Web Audio로 그 자리에서 합성한다(다운로드 0, 저작권 걱정 없음).
// 파이프라인 맵이 자라듯 챕터(스테이지)가 진행될수록 악기가 한 겹씩 늘어난다.
//   0 패드 → 1 피아노 → 3 베이스 → 5 킥·하이햇 → 7 블루프린트(피아노 8분음표·밝은 패드·스네어) → 8 멜로디
//   → 11 에필로그(드럼·베이스가 빠지고 처음의 결로 돌아온다)
// 처음 켤 때만 불러오는 모듈이다(state/bgm.ts의 동적 import).

const BPM = 76
const BEAT = 60 / BPM
const HALF = BEAT / 2 // 스케줄 단위: 8분음표

// 8마디 진행(C장조): Cmaj7 Am7 Fmaj7 G6 Em7 Am7 Dm7 G7sus4. [베이스, 패드 음 4개] (MIDI 번호)
const CHORDS = [
  [48, 60, 64, 67, 71],
  [45, 60, 64, 67, 69],
  [41, 60, 64, 65, 69],
  [43, 59, 62, 64, 67],
  [40, 59, 62, 64, 67],
  [45, 60, 64, 67, 69],
  [38, 60, 62, 65, 69],
  [43, 60, 62, 65, 67],
]
// 멜로디: 마디마다 [8분음표 위치, 음, 길이(박)]
const MELODY = [
  [[0, 76, 1.5], [3, 79, 0.5], [4, 81, 2]],
  [[0, 79, 1], [2, 76, 1], [4, 72, 2]],
  [[0, 81, 1.5], [3, 79, 0.5], [4, 76, 2]],
  [[0, 74, 2], [4, 79, 2]],
  [[0, 79, 1.5], [3, 81, 0.5], [4, 83, 2]],
  [[0, 84, 1], [2, 81, 1], [4, 76, 2]],
  [[0, 77, 1.5], [3, 76, 0.5], [4, 74, 2]],
  [[0, 72, 2], [4, 74, 1], [6, 79, 1]],
]
// 피아노 음형(패드 음 4개의 번호, 4 = 첫 음의 한 옥타브 위): 종이 스테이지는 4분음표, 블루프린트는 8분음표
const KEYS_QUARTER = [0, 2, 1, 3]
const KEYS_EIGHTH = [0, 1, 2, 3, 4, 3, 2, 1]
// 베이스: [8분음표 위치, 근음에서 반음 수, 길이(박)]
const BASS = [
  [0, 0, 2.5],
  [5, 7, 0.5],
  [6, 0, 1], // 다음 마디 근음과 겹치지 않게 마디 안에서 끝낸다
]

const LAYERS = ['pad', 'keys', 'bass', 'drums', 'lead'] as const
type Layer = (typeof LAYERS)[number]
const LEVEL: Record<Layer, number> = { pad: 0.55, keys: 0.5, bass: 0.55, drums: 0.4, lead: 0.5 }
// 겹이 늘어도 음량은 거의 그대로: 읽다가 점점 시끄러워지지 않게 단계별로 전체를 조금씩 낮춘다
const trim = (stage: number) => (stage >= 11 ? 0.9 : stage >= 7 ? 0.7 : stage >= 3 ? 0.8 : 1)
const FROM: Record<Layer, number> = { pad: 0, keys: 1, bass: 3, drums: 5, lead: 8 }
const layersFor = (stage: number): Layer[] => (stage >= 11 ? ['pad', 'keys', 'lead'] : LAYERS.filter((l) => stage >= FROM[l]))
const isBlueprint = (stage: number) => stage >= 7 && stage <= 10

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12)

function noiseBuffer(ctx: BaseAudioContext, sec: number, decay = 0) {
  const n = Math.floor(ctx.sampleRate * sec)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (decay ? (1 - i / n) ** decay : 1)
  }
  return b
}

/** 합성 엔진. AudioContext(실시간)와 OfflineAudioContext(미리 듣기 렌더) 모두에서 쓴다. */
export function createBgm(ctx: BaseAudioContext) {
  const master = ctx.createGain()
  master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -20
  comp.ratio.value = 3
  master.connect(comp).connect(ctx.destination)

  // 공간 울림: 감쇠하는 잡음을 임펄스 응답으로 쓰는 리버브
  const verb = ctx.createConvolver()
  verb.buffer = noiseBuffer(ctx, 2.6, 3)
  const verbOut = ctx.createGain()
  verbOut.gain.value = 0.28
  verb.connect(verbOut).connect(master)

  // 멜로디에만 거는 점8분음표 메아리
  const delay = ctx.createDelay(1)
  delay.delayTime.value = BEAT * 0.75
  const feedback = ctx.createGain()
  feedback.gain.value = 0.3
  const delayOut = ctx.createGain()
  delayOut.gain.value = 0.3
  delay.connect(feedback).connect(delay)
  delay.connect(delayOut).connect(master)

  const bus = {} as Record<Layer, GainNode>
  for (const l of LAYERS) {
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(master)
    g.connect(verb)
    bus[l] = g
  }
  bus.lead.connect(delay)
  // 패드 필터: 종이 스테이지는 따뜻하게, 블루프린트는 조금 밝게
  const padTone = ctx.createBiquadFilter()
  padTone.type = 'lowpass'
  padTone.frequency.value = 850
  padTone.connect(bus.pad)
  const noise = noiseBuffer(ctx, 1)

  // 레이어를 끈 뒤에도 페이드아웃 동안은 음을 계속 넣는다
  const liveUntil: Record<Layer, number> = { pad: Infinity, keys: 0, bass: 0, drums: 0, lead: 0 }
  let blueprint = false
  let origin = 0
  let step = 0
  let leadFrom = 0

  const osc = (type: OscillatorType, f: number, t: number, end: number, out: AudioNode, detune = 0) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = f
    o.detune.value = detune
    o.connect(out)
    o.start(t)
    o.stop(end)
    return o
  }
  const gain = (out: AudioNode) => {
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(out)
    return g
  }

  function pad(notes: number[], t: number, dur: number) {
    // 빨리 차오르고 빨리 빠져야 앞 화음이 새 화음 첫 박을 덮지 않는다
    const g = gain(padTone)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.08, t + 0.5)
    g.gain.setValueAtTime(0.08, t + dur)
    g.gain.setTargetAtTime(0, t + dur, 0.25)
    // 살짝 어긋난 두 톱니파를 좌우로 벌려 소리에 폭을 준다
    const sides = [-0.6, 0.6].map((p) => {
      const s = ctx.createStereoPanner()
      s.pan.value = p
      s.connect(g)
      return s
    })
    for (const m of notes) [-7, 7].forEach((d, i) => osc('sawtooth', hz(m), t, t + dur + 1.9, sides[i], d))
  }

  // 일렉트릭 피아노 비슷한 소리: 기음 + 옥타브 위 배음, 빠르게 사라지는 엔벨로프
  function keys(m: number, t: number, vel: number) {
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2400
    tone.connect(bus.keys)
    const g = gain(tone)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0008, t + 1.6)
    osc('sine', hz(m), t, t + 1.7, g)
    const tine = gain(g)
    tine.gain.value = 0.22
    osc('sine', hz(m) * 2, t, t + 1.7, tine)
  }

  function bass(m: number, t: number, dur: number) {
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 520
    tone.connect(bus.bass)
    const g = gain(tone)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.1, t + 0.02)
    g.gain.setTargetAtTime(0.07, t + 0.02, 0.25)
    g.gain.setTargetAtTime(0, t + dur, 0.06)
    osc('sawtooth', hz(m), t, t + dur + 0.4, g) // 배음이 있어야 작은 스피커에서도 들린다
    osc('sine', hz(m), t, t + dur + 0.4, g)
  }

  function kick(t: number) {
    const g = gain(bus.drums)
    g.gain.setValueAtTime(0.3, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    const o = osc('sine', 110, t, t + 0.35, g)
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18)
  }

  function hiss(t: number, vel: number, type: BiquadFilterType, f: number, len: number) {
    const src = ctx.createBufferSource()
    src.buffer = noise
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.value = f
    const g = gain(bus.drums)
    g.gain.setValueAtTime(vel, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + len)
    src.connect(filter).connect(g)
    src.start(t, Math.random() * 0.5)
    src.stop(t + len + 0.02)
  }

  // 종소리 비슷한 멜로디: FM(모듈레이터가 캐리어의 주파수를 흔든다), 흔드는 양이 줄며 소리가 둥글어진다
  function lead(m: number, t: number, dur: number) {
    const f = hz(m)
    const g = gain(bus.lead)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.2, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 1.2)
    const carrier = osc('sine', f, t, t + dur + 1.3, g)
    const depth = ctx.createGain()
    depth.gain.setValueAtTime(f * 1.4, t)
    depth.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.7)
    depth.connect(carrier.frequency)
    osc('sine', f * 2, t, t + dur + 1.3, depth)
  }

  function play(s: number, t: number) {
    const bar = Math.floor(s / 8) % 8
    const pos = s % 8
    const [root, ...notes] = CHORDS[bar]
    const on = (l: Layer) => t < liveUntil[l]
    t += pos % 2 ? BEAT * 0.07 : 0 // 뒷박을 살짝 늦춰 느긋하게(모든 악기 함께)
    if (pos === 0 && on('pad')) pad(notes, t, BEAT * 4)
    if (on('keys')) {
      const pattern = blueprint ? KEYS_EIGHTH : pos % 2 ? null : KEYS_QUARTER
      const i = pattern?.[blueprint ? pos : pos / 2]
      if (i !== undefined) keys(i === 4 ? notes[0] + 12 : notes[i], t, (pos === 0 ? 0.24 : 0.17) + Math.random() * 0.04)
    }
    if (on('bass')) for (const [p, iv, d] of BASS) if (p === pos) bass(root + iv, t, d * BEAT)
    if (on('drums')) {
      if (pos === 0 || pos === 5) kick(t)
      if (blueprint && (pos === 2 || pos === 6)) hiss(t, 0.2, 'bandpass', 1800, 0.14)
      hiss(t, pos % 2 ? 0.07 : 0.045, 'highpass', 7000, 0.05)
    }
    // 멜로디는 8마디 부르고 8마디 쉰다(들어온 순간부터 센다) — 오래 읽어도 덜 지치게
    if (on('lead') && Math.floor((s - leadFrom) / 64) % 2 === 0) for (const [p, m, d] of MELODY[bar]) if (p === pos) lead(m, t, d * BEAT)
  }

  return {
    master,
    /** 이 시각까지 연주할 음을 미리 예약한다. 메인 스레드가 오래 멈췄다면 이미 지난 박은 건너뛴다. */
    scheduleUntil(until: number) {
      for (; origin + step * HALF < until; step++) {
        const t = origin + step * HALF
        if (t >= ctx.currentTime - 0.02) play(step, t)
      }
    },
    restartAt(t: number) {
      origin = t
      step = 0
    },
    setStage(stage: number, at = ctx.currentTime) {
      const want = layersFor(stage)
      if (want.includes('lead') && liveUntil.lead !== Infinity) leadFrom = step
      for (const l of LAYERS) {
        const on = want.includes(l)
        bus[l].gain.cancelScheduledValues(at)
        bus[l].gain.setTargetAtTime(on ? LEVEL[l] * trim(stage) : 0, at, on ? 1.2 : 0.7)
        liveUntil[l] = on ? Infinity : Math.min(liveUntil[l], at + 4)
      }
      blueprint = isBlueprint(stage)
      padTone.frequency.cancelScheduledValues(at)
      padTone.frequency.setTargetAtTime(blueprint ? 1500 : 850, at, 2)
    },
  }
}

const VOLUME = 0.8

/** 실시간 재생 제어: 켜고 끄기(페이드), 탭이 가려지면 멈춤 */
export function live(ctx: AudioContext, stage: number) {
  const bgm = createBgm(ctx)
  bgm.setStage(stage)
  bgm.restartAt(ctx.currentTime + 0.1)
  let on = false
  let timer = 0
  let suspendTimer = 0
  // 0.12초마다 1초 앞까지 예약한다(챕터를 그리느라 메인 스레드가 잠깐 멈춰도 음이 끊기지 않게).
  // 탭이 가려지면 컨텍스트를 멈춰 시간도 같이 멈춘다.
  const tick = () => bgm.scheduleUntil(ctx.currentTime + 1)
  // 소리를 끊거나 되살릴 때는 늘 페이드: 파형 중간에서 멈추면 '툭' 소리가 난다
  const fade = (to: number, sec: number) => {
    const g = bgm.master.gain
    const now = ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(to, now + sec)
  }
  const fadeOutThen = (sec: number, after: () => void) => {
    fade(0, sec)
    suspendTimer = window.setTimeout(after, sec * 1000 + 100)
  }
  const play = (sec: number) => {
    void ctx.resume()
    if (!timer) timer = window.setInterval(tick, 120)
    tick()
    fade(VOLUME, sec)
  }
  document.addEventListener('visibilitychange', () => {
    if (!on) return
    window.clearTimeout(suspendTimer)
    if (document.hidden) fadeOutThen(0.25, () => void ctx.suspend())
    else play(0.8)
  })
  // 켜 둔 채 화면이 보이는데 시스템이 소리를 멈췄다면(iOS 전화·Siri, 출력 장치 변경 등) 다시 켠다.
  // 사용자 동작이 있어야 다시 켜지는 브라우저를 위해 다음 클릭·키 입력 때도 한 번 더 시도한다.
  const unlock = () => {
    if (on && !document.hidden && ctx.state !== 'running') void ctx.resume()
  }
  ctx.addEventListener('statechange', () => {
    if (!on || document.hidden || ctx.state === 'running' || ctx.state === 'closed') return
    void ctx.resume().catch(() => {})
    for (const ev of ['pointerdown', 'keydown'] as const) addEventListener(ev, unlock, { once: true, capture: true })
  })
  return {
    setStage: (s: number) => bgm.setStage(s),
    setOn(next: boolean) {
      on = next
      window.clearTimeout(suspendTimer)
      if (next) {
        // 가려진 탭에서는 시작하지 않는다. 돌아오면 visibilitychange가 켠다.
        if (!document.hidden) play(1.5)
      } else {
        fadeOutThen(0.6, () => {
          window.clearInterval(timer)
          timer = 0
          void ctx.suspend()
        })
      }
    },
  }
}
