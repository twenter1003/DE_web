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

export { gsap, ScrollTrigger, useGSAP }
