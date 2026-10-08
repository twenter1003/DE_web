import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { useGSAP } from '@gsap/react'
import { setScrollTrigger } from './refresh'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MotionPathPlugin, useGSAP)
// 모바일 주소창이 접히고 펴질 때마다 트리거를 다시 계산하지 않는다.
ScrollTrigger.config({ ignoreMobileResize: true })
gsap.defaults({ ease: 'power2.out' })
setScrollTrigger(ScrollTrigger)

// 퀴즈 해설·성장 블록·인터랙션 기록처럼 마운트 뒤에 내용이 늘어나면 아래쪽 트리거가 모두 어긋난다.
// 페이지 높이가 바뀔 때마다(잠깐 모아서) 한 번에 다시 계산한다.
if (typeof ResizeObserver !== 'undefined') {
  let h = 0
  let timer = 0
  new ResizeObserver(([e]) => {
    const nh = Math.round(e.contentRect.height)
    if (nh === h) return
    h = nh
    clearTimeout(timer)
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
  }).observe(document.body)
}

export { gsap, ScrollTrigger, useGSAP }
