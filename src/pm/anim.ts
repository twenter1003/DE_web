import { at, type SceneBuild } from '../components/StepScene'
import { gsap } from '../lib/gsap'

// 트랙 장면용 간단한 나타남/사라짐 문법.
// 이름(data-el)마다 어느 step 전환에서 나타나고(in) 사라지는지(out)를 적는다. step i 전환은 시간 [i, i+0.9) 안에서 일어난다.
// 소수 step(1.4처럼)을 쓰면 그 step 안에서 조금 늦게 시작한다. stagger는 같은 이름이 여러 개일 때 차례로 나타나는 간격.
export type AppearSpec = Record<string, number | { in?: number; out?: number; stagger?: number }>

export function buildAppear(spec: AppearSpec): SceneBuild {
  return (q, tl) => {
    for (const [name, v] of Object.entries(spec)) {
      const els = q(`[data-el="${name}"]`)
      if (!els.length) continue
      const o = typeof v === 'number' ? { in: v } : v
      if (o.in !== undefined) {
        // 초기 상태는 DOM에도 바로 적용(0초로 되감을 때도 나타나기 전 그림이 되게)
        gsap.set(els, { opacity: 0 })
        tl.set(els, { opacity: 0 }, 0)
        tl.to(els, { opacity: 1, duration: 0.4, ease: 'power1.out', stagger: o.stagger ?? 0 }, at(o.in))
      }
      if (o.out !== undefined) tl.to(els, { opacity: 0, duration: 0.3, ease: 'power1.in' }, at(o.out))
    }
  }
}
