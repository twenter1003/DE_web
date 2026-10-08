import { DevMaps } from './DevMaps'
import { DevScene } from './DevScene'
import { EnvProvider } from './state/env'
import { ProgressProvider } from './state/progress'

// 개발 서버에서만 쓰는 점검 화면: ?debug=map(&vertical), ?debug=scene
export function DevRoot() {
  return (
    <EnvProvider>
      <ProgressProvider>{location.search.includes('debug=map') ? <DevMaps vertical={location.search.includes('vertical')} /> : <DevScene />}</ProgressProvider>
    </EnvProvider>
  )
}
