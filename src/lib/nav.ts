import { CHAPTER_IDS } from '../content/types'
import { ensureMounted } from '../state/mount'
import { refreshTriggers } from './refresh'

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

/** 챕터(또는 그 안의 앵커)로 이동. 아직 마운트 안 된 챕터면 그 챕터까지 먼저 마운트한다. 모션 줄이기면 즉시 이동 */
export async function goTo(id: string) {
  const chapter = CHAPTER_IDS.find((c) => id === c || id.startsWith(`${c}-`))
  // 첫 로드 직후에는 아직 자리(placeholder)도 그려지기 전일 수 있다
  for (let i = 0; i < 120 && !document.getElementById(chapter ?? id); i++) await nextFrame()
  if (chapter) {
    const idx = CHAPTER_IDS.indexOf(chapter)
    const waiting = () => CHAPTER_IDS.slice(0, idx + 1).some((c) => document.getElementById(c)?.hasAttribute('data-placeholder'))
    if (waiting()) {
      ensureMounted(idx)
      // 지연 로드된 챕터(목표와 그 앞 챕터 모두)가 실제로 그려질 때까지 기다린다(최대 약 3초)
      for (let i = 0; i < 180 && waiting(); i++) await nextFrame()
      // 새로 그려진 장면들의 트리거 위치를 먼저 계산해 둔다(refresh는 스크롤 위치를 되돌리므로 스크롤보다 먼저)
      await nextFrame()
      await nextFrame()
      refreshTriggers()
    }
  }
  const el = document.getElementById(id)
  if (!el) return
  const reduced = document.documentElement.dataset.motion === 'reduced'
  // 먼 거리는 즉시 이동(수만 px를 부드럽게 굴리면 오래 걸린다)
  const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 3
  el.scrollIntoView({ behavior: reduced || far ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  // 키보드 사용자를 위해 포커스도 옮긴다
  const heading = document.getElementById(`${id}-heading`) ?? el
  heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}
