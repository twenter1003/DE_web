import { T } from './content/map'
import { PipelineMap } from './components/PipelineMap'
import { StageCtx } from './components/sketch'
import { STAGES, stageVars } from './lib/stages'

// 개발 전용: ?debug=map 으로 모든 시점의 맵을 한 화면에서 확인한다(프로덕션 빌드에서 제외).
const POINTS: [string, number, number][] = [
  ['P', T.prologue, 0], ['1', T.ch1, 1], ['2', T.ch2, 2], ['3', T.ch3, 3], ['4', T.ch4, 4], ['5', T.ch5, 5],
  ['6', T.ch6, 6], ['7', T.ch7, 7], ['8', T.ch8, 8], ['9', T.ch9, 9], ['10p', T.ch10Proposal, 10],
  ['10c', T.ch10Climax, 10], ['10b', T.ch10Buy, 10], ['10f', T.ch10Final, 10], ['E', T.epilogue, 11],
]

export function DevMaps({ vertical }: { vertical?: boolean }) {
  return (
    <div className="grid gap-4 p-4" style={{ gridTemplateColumns: vertical ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)' }}>
      {POINTS.map(([k, t, s]) => (
        <StageCtx.Provider key={k} value={STAGES[s]}>
          <div className="paper-grid border p-2 text-ink" style={stageVars(STAGES[s]) as React.CSSProperties}>
            <p className="font-mono text-sm">{k}</p>
            <div style={{ height: vertical ? 640 : 300 }}>
              <PipelineMap t={t} vertical={vertical} />
            </div>
          </div>
        </StageCtx.Provider>
      ))}
    </div>
  )
}
