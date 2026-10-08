// ScrollTrigger 위치 다시 계산하기. GSAP은 첫 화면에 필요 없어서 챕터와 함께 나중에 불러오고,
// 불러오기 전에는 다시 계산할 트리거도 없으니 아무것도 하지 않는다.
let st: { refresh: () => void } | null = null
export const setScrollTrigger = (s: { refresh: () => void }) => {
  st = s
}
export const refreshTriggers = () => st?.refresh()
