import { useSyncExternalStore } from 'react'

// 배경음악 켜짐 여부. 기본은 꺼짐(자동 재생 금지) — 사용자가 버튼을 눌러야 시작한다.
// 합성 엔진(lib/bgm.ts)은 처음 켤 때만 불러온다.

type Live = ReturnType<typeof import('../lib/bgm').live>

let on = false
let stage = 0
let ctx: AudioContext | null = null
let engine: Promise<Live | null> | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function toggleBgm() {
  if (!ctx) {
    if (typeof AudioContext === 'undefined') return
    // 클릭 처리 안에서 바로 만들어야 사파리도 소리를 낸다. iOS 무음 스위치가 켜져 있어도 들리게 '재생' 세션으로.
    const c = (ctx = new AudioContext())
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
    engine = import('../lib/bgm')
      .then((m) => m.live(c, stage))
      .catch(() => {
        // 조각을 못 받았다(오프라인·배포 교체): 꺼짐으로 되돌리고 다음 클릭에 다시 시도한다
        void c.close()
        ctx = null
        engine = null
        on = false
        notify()
        return null
      })
  }
  on = !on
  notify()
  if (on) void ctx.resume()
  const next = on
  void engine?.then((e) => e?.setOn(next))
}

export function setBgmStage(s: number) {
  stage = s
  void engine?.then((e) => e?.setStage(s))
}

export function useBgm() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => on,
    () => false,
  )
}
