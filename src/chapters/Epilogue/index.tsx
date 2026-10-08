import { epilogue as c } from '../../content/chapters/epilogue'
import { LEVELS, PEOPLE } from '../../content/people'
import { tocOf } from '../../content/toc'
import { UI } from '../../content/ui'
import { ChapterShell } from '../../components/Chapter'
import { StepScene } from '../../components/StepScene'
import { DexBoard, MapNav, Restart } from './blocks'
import { buildCycle, buildDex, buildSentence, buildZoom, CycleFig, DexFig, SentenceFig, ZoomFig } from './scenes'

// 에필로그: 오프닝·퀴즈·성장 연출 없이 줌아웃 → 한 문장 → 순환 → 도감 → 처음부터 다시 보기(바이블 0-8)
export function Epilogue() {
  const toc = tocOf('epilogue')
  return (
    <ChapterShell id="epilogue">
      <header className="max-w-[48rem] pt-[16svh]">
        <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-muted">
          <span>{toc.label}</span>
          <span>{toc.scale}</span>
          <span>
            {PEOPLE.juni.name} {UI.hud.level(toc.level, LEVELS[toc.level])}
          </span>
        </p>
        <h2 id="epilogue-heading" className="mt-3 text-[2.5rem] font-extrabold leading-[1.12] tracking-[-0.02em] md:text-[4rem]">
          {toc.title}
        </h2>
        <p className="mt-3 text-xl text-muted md:text-2xl">{toc.topic}</p>
      </header>
      <StepScene id="epilogue-zoom" kind="story" scene={c.scenes.zoom} diagram={() => <ZoomFig />} build={buildZoom} tall />
      <MapNav />
      <StepScene id="epilogue-sentence" kind="concept" scene={c.scenes.sentence} diagram={() => <SentenceFig />} build={buildSentence} tall />
      <StepScene id="epilogue-cycle" kind="story" scene={c.scenes.cycle} diagram={() => <CycleFig />} build={buildCycle} tall />
      <StepScene id="epilogue-dex" kind="story" scene={c.scenes.dex} diagram={() => <DexFig />} build={buildDex} tall />
      <DexBoard />
      <Restart />
    </ChapterShell>
  )
}
