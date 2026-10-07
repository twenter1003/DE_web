/** 챕터 앵커로 이동. 모션 줄이기면 즉시 이동 */
export function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduced = document.documentElement.dataset.motion === 'reduced'
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
  // 키보드 사용자를 위해 포커스도 옮긴다
  const heading = document.getElementById(`${id}-heading`) ?? el
  heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}
