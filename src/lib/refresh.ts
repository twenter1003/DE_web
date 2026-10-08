// ScrollTrigger 위치 다시 계산하기. GSAP은 첫 화면에 필요 없어서 챕터와 함께 나중에 불러오고,
// 불러오기 전에는 다시 계산할 트리거도 없으니 아무것도 하지 않는다.
type ST = { refresh: () => void; getScrollFunc: (el: Window) => (v: number) => unknown }
let st: ST | null = null
export const setScrollTrigger = (s: ST) => {
  st = s
}
export const refreshTriggers = () => st?.refresh()

/** 세로 스크롤 이동. ScrollTrigger가 기억하는 스크롤 값도 함께 바꿔, 다음 refresh가 옛 위치로 되돌리지 않게 한다 */
export const scrollToY = (y: number) => (st ? st.getScrollFunc(window)(y) : window.scrollTo({ top: y, behavior: 'instant' }))
