// docs/storyboard/*.md 를 docs/STORYBOARD.md 하나로 합친다.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
const dir = 'docs/storyboard'
const files = readdirSync(dir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()
const head = '# STORYBOARD — Data Engineering A to Z\n\n챕터별 장면 단위 스토리보드. 원본 파일은 `docs/storyboard/`에 있고, 이 문서는 그 파일들을 순서대로 이어 붙인 것이다(수정은 원본 파일에서 하고 다시 합친다: `node scripts/storyboard.mjs`).\n\n'
writeFileSync('docs/STORYBOARD.md', head + files.map((f) => readFileSync(`${dir}/${f}`, 'utf8').trim() + '\n\n---\n').join('\n'))
console.log(`합침: ${files.length}개 파일`)
