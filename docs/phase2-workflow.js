export const meta = {
  name: 'phase2-chapters',
  description: 'Build Ch3–Ch10 and Epilogue in three batches (build → adversarial review), then build-check and commit each batch',
  phases: [
    { title: 'Batch 1', detail: 'Ch3, Ch4, Ch5' },
    { title: 'Batch 2', detail: 'Ch6, Ch7, Ch8' },
    { title: 'Batch 3', detail: 'Ch9, Ch10, Epilogue' },
  ],
}

const ROOT = '/Users/kimtaewoo/DE_web'
const SHARED = `
Project root: ${ROOT}. You are building one chapter of a Korean scroll-driven learning page (Vite + React 19 + TS 7 + Tailwind 4 + GSAP 3.15 + roughjs). Read BEFORE coding:
- ${ROOT}/CLAUDE.md (project rules — binding) and ${ROOT}/docs/CHAPTER_GUIDE.md (how to build a chapter — binding)
- ${ROOT}/docs/storyboard/00-bible.md (fixed story values)
- Reference implementations (read fully, copy their structure and quality): Prologue (${ROOT}/src/content/chapters/prologue.ts, ${ROOT}/src/chapters/Prologue/*), Ch1 (${ROOT}/src/content/chapters/ch1.ts, ${ROOT}/src/chapters/Ch01/*), Ch2 (${ROOT}/src/content/chapters/ch2.ts, ${ROOT}/src/chapters/Ch02/*)
- Shared components (read, do NOT edit): ${ROOT}/src/components/{StepScene,Chapter,diagram,fig,sketch,PipelineMap,Growth,Quiz,people,Desk,Collection,Hud}.tsx, ${ROOT}/src/content/{types,map,ui,toc,people,cards}.ts, ${ROOT}/src/state/{progress,env,derive}.ts*
Hard rules:
- Touch ONLY your chapter's files: src/content/chapters/<id>.ts and src/chapters/<Folder>/*. Other agents build other chapters in the same working tree right now — never edit shared files, registry.ts (already registers your stub), other chapters, or package.json. If a shared component lacks something, implement it locally in your folder.
- Keep the app compiling at all times (shared dev server): write the content file and scenes before replacing the stub index.tsx; never leave a broken import.
- All Korean copy lives in the content file (scene text/alt/lines, diagram labels in \`figures\`, interaction strings in \`interaction\`, quiz, growth). No Korean sentences in components.
- Diagram coordinate space ~440×480 portrait (like Prologue/Ch1/Ch2) so one layout works on desktop and mobile; main labels ≥ 13 units.
- Step transitions in [i, i+0.9) via at(i); initial states with tl.set(...,0) then tl.to — static (reduced-motion) snapshots must show each step's final picture correctly.
- Status = icon + text (Badge / Node statuses). Data particles = var(--accent). No decorative motion; every motion explains one concept.
- Interaction (only if the storyboard has one): native controls, keyboard operable, aria-live results, reduced-motion = instant results, simplified-model notice where the storyboard asks.
- Pipeline map: <PipelineMap t={…} from={…} /> + mapTransition(q, tl, at(i)); node lists come from src/content/map.ts (do not change it). For annotations pinned to nodes use PipelineMap's \`overlay\` prop. For staged per-node reveals inside one transition, select nodes by [data-node="id"] / edges by [data-edge="from>to"] / quality badges by [data-check] in your build function.
- Use ChapterOpening (visitors/board per the storyboard & bible 0-3) / StepScene / InteractionFrame / Summary / Quiz / ChapterGrowth exactly like the references. ChapterGrowth handles cards, radar, map growth, level-up stamp (TOC promotesTo).
Verification (required):
1. cd ${ROOT} && npm run typecheck — no errors in your files (errors only in another chapter's folder aren't yours; mention them).
2. Dev server already runs at http://localhost:5288 (do NOT start/kill servers). Use node scripts/shot.mjs (read its header) to screenshot EVERY step of every scene (desktop), key steps with --mobile and --reduced, the interaction after operating it (--click "role=button[name='…']" etc.). View PNGs with Read after downscaling (sips -Z 900 in.png --out out.png). Fix overlaps, clipped text, wrong step states, empty frames. Console must say "콘솔 에러 없음".
3. Re-check the content file against the storyboard text (exact wording; only obvious typos may be fixed).
Report concisely: files, scenes/steps, verification done, deviations + why, open issues.`

const C = (id, folder, story, notes) => ({ id, folder, story, notes })
const BATCHES = [
  [
    C('ch3', 'Ch03', '04-ch3.md', `Ch3 새벽 3시의 장애. Opening: Lv2 desk, visitors 1. Interaction "DAG 실패 시뮬레이터": DAG nodes must be real <button>s (DOM layout or SVG <g role="button" tabIndex=0> with Enter/Space) — clicking fails a node (✕), downstream nodes ⏸ 대기, a [재시도] button runs a ↻ → ✓ chain (instant in reduced motion), idempotency note after every retry as the storyboard says, aria-live narration. Show cron vs orchestrator, idempotent vs non-idempotent rerun side-by-side. Map in solution: t=3 from=2.`),
    C('ch4', 'Ch04', '05-ch4.md', `Ch4 매출이 두 개예요. Promotes Lv2→Lv3 (stamp handled by ChapterGrowth). Opening: Lv2 desk (monitor DAG has 5 nodes like end of Ch3 — Desk draws a small DAG already), visitors 1; first appearance of 소라·민재·다온. No interaction. Row vs column store "light beam" over only the needed columns; normalization → star schema (fact center, dimensions around); SSOT definitions. Map in solution: t=4 from=3 (warehouse relabel, model enters, bi relabel to BI 대시보드).`),
    C('ch5', 'Ch05', '06-ch5.md', `Ch5 데이터가 노트북에 안 들어가요. Opening: Lv3 desk (whiteboard scribble, dual monitors), visitors 2. Interaction "워커 수 슬라이더": input type=range over the storyboard's discrete worker counts with the storyboard's exact table of times; bars for divisible work / coordination+shuffle / non-divisible work; mark the diminishing-returns point; '단순화한 모델' notice; aria-live. Partition folders opening only the needed date. Map in solution: t=5 from=4 (lake, spark, media).`),
  ],
  [
    C('ch6', 'Ch06', '07-ch6.md', `Ch6 지금 이 순간 — 스트리밍. Opening: Lv3 desk, visitors 2. No interaction. Topic partitions as lanes, events flowing into 5-minute window boxes, a late event; CDC stream; exactly-once as at-least-once + idempotent processing. Keep the foreshadowing line "근데… 모든 게 실시간이어야 할까?" exactly where the storyboard puts it. Map in solution: t=6 from=5 (kafka, cdc, fraud, stock).`),
    C('ch7', 'Ch07', '08-ch7.md', `Ch7 월요일 아침, 매출이 0원. Promotes Lv3→Lv4. This is the FIRST blueprint (dark navy) stage — all colors come from CSS vars so diagrams adapt; double-check contrast of any custom fills and that nothing assumes a light background. Opening: visitors per storyboard. No interaction. Number dropping to 0 while all jobs are ✓; lineage traced backwards; YAML tests typed with CodeType; checkpoints installed on arrows. Map in solution: t=7 from=6 — reveal the 4 quality badges ([data-check]) and contract with staged tl steps (badges exist on 'stay' edges so set them hidden at 0 and reveal); alert relabels to 모니터링·알림.`),
    C('ch8', 'Ch08', '09-ch8.md', `Ch8 호수와 창고를 합치다 — 레이크하우스. Opening: Lv4 desk (neat board, books, plant), visitors 3. Interaction "타임 트래블 슬라이더": input type=range v1..v4 with the storyboard's exact tables and change log lines; aria-live; plus the always-visible intro text the storyboard specifies. Medallion layers muddy → clear colors. Map in solution: t=8 from=7 — the first time the map SHRINKS (lake + warehouse merge into lakehouse); make that legible.`),
  ],
  [
    C('ch9', 'Ch09', '10-ch9.md', `Ch9 청구서와 개인정보. Opening: Lv4 desk, visitors exactly 3 (민재, 다온, 소라). No interaction. Cost meter spinning on full scan vs barely moving with partition pruning; storage tiering; access grid; masking mosaic over PII columns; pseudonymization vs anonymization. Map in solution: t=9 from=8 (catalog, cost) — stage cost/catalog reveals per the storyboard with [data-node] selectors. SCRATCH FILES: put temporary files only in your own folder (e.g. /private/tmp/claude-501/-Users-kimtaewoo-DE-web/87f927fd-5f5a-4ca9-8840-608bdfafed08/scratchpad/<chapter-id>/ or shots/<chapter-id>-*); never delete or overwrite files you did not create (other agents share these folders).`),
    C('ch10', 'Ch10', '11-ch10.md', `Ch10 시니어가 되는 순간 — the climax chapter. Opening: Lv4 desk with board="crowded", visitors per storyboard. Map states: proposal t=10 (from 9), climax t=10.25 (from 10, use ghosts so removed nodes show '걷어냄'), Build vs Buy t=10.5 (from 10.25: etl+cdc removed, Zero-ETL edge appears), ML·Reverse ETL t=10.75 (from 10.5). Import T from src/content/map.ts. CLIMAX: in the climax StepScene pass onStep={(i) => i === <climax step index> && markClimax()} using useProgress().markClimax — this is when Juni becomes Lv5 (HUD level updates); render the in-scene Lv5 level-up stamp inside that step's diagram (local component). Interaction "트레이드오프 저울": range slider over latency levels with relative cost / operations-complexity bars, '단순화한 모델' notice, aria-live. ChapterGrowth id='ch10' (it shows the Lv5 stamp when climax is reached). SCRATCH FILES: put temporary files only in your own folder (e.g. /private/tmp/claude-501/-Users-kimtaewoo-DE-web/87f927fd-5f5a-4ca9-8840-608bdfafed08/scratchpad/<chapter-id>/ or shots/<chapter-id>-*); never delete or overwrite files you did not create (other agents share these folders). A previous attempt left a partial src/content/chapters/ch10.ts — read it, keep what is correct, finish or rewrite it.`),
    C('epilogue', 'Epilogue', '12-epilogue.md', `Epilogue 다시 A부터. NO ChapterOpening, NO Quiz, NO ChapterGrowth (follow the storyboard's 5 scenes). ChapterShell id="epilogue". Scene 1 zoom-out: PipelineMap t=11 from=0 with mapTransition (the whole platform emerges from the first 3-node sketch), plus an interactive (clickable) full map somewhere per the storyboard (PipelineMap interactive onNavigate={goTo} — import goTo from src/lib/nav). Scene 3 cycle: newbie 새봄 with a CSV (Desk level 5 newbie) and the map zooming back to t=0. Scene 4 dex: render all CARDS with owned state from useProgress().cards (TermCard), count of missing cards with links to their chapters (goTo). Scene 5 restart (not scroll-linked): '처음부터 다시 보기' (scroll to #top keeping progress) and a reset option with an inline confirm (useProgress().reset), plus final Radar and Lv display. The content file still uses ChapterContent — put a short quiz-less structure: you may define the epilogue content with its own local type in the content file if ChapterContent's quiz/growth don't fit (do not edit types.ts). SCRATCH FILES: put temporary files only in your own folder (e.g. /private/tmp/claude-501/-Users-kimtaewoo-DE-web/87f927fd-5f5a-4ca9-8840-608bdfafed08/scratchpad/<chapter-id>/ or shots/<chapter-id>-*); never delete or overwrite files you did not create (other agents share these folders).`),
  ],
]

for (let b = 0; b < BATCHES.length; b++) {
  const batch = BATCHES[b]
  phase(`Batch ${b + 1}`)
  const results = await pipeline(
    batch,
    (c) =>
      agent(`${SHARED}

YOUR CHAPTER: ${c.id} — storyboard ${ROOT}/docs/storyboard/${c.story} (read fully; it specifies every step).
Files: ${ROOT}/src/content/chapters/${c.id}.ts, ${ROOT}/src/chapters/${c.folder}/index.tsx (export function ${c.folder} — replace the stub), ${ROOT}/src/chapters/${c.folder}/scenes.tsx, plus an interaction component if the storyboard has one.
Chapter notes:
${c.notes}
Build it to final quality now, verify, and report.`, { label: `build:${c.id}`, phase: `Batch ${b + 1}` }),
    (built, c) =>
      agent(`${SHARED}

You are the adversarial REVIEWER for chapter ${c.id}, just implemented by another agent (report below). Assume defects exist; find and FIX them in that chapter's own files only. Storyboard: ${ROOT}/docs/storyboard/${c.story}.
Check with screenshots of every step (desktop) and key steps (--mobile, --reduced):
1. Storyboard fidelity: every step's 화면 (labels, numbers, states) and 모션; nothing decorative; map changes exactly per storyboard + src/content/map.ts.
2. Reduced-motion static snapshots show each step's final state.
3. Copy: matches storyboard; 2–3 sentence blocks; term first-use format; no placeholders.
4. Technical accuracy (data engineering facts, numbers, interaction results for EVERY control state — operate them).
5. Accessibility: keyboard, visible focus, aria-live, status = icon + text, no small accent-colored text, contrast on this chapter's stage palette.
6. Layout at 1440×900 and 390×844: no overlaps/clipping, no horizontal page scroll.
7. typecheck clean for this chapter; no console errors.
Builder report:
${built}
Return: defects found and fixed, remaining issues.`, { label: `review:${c.id}`, phase: `Batch ${b + 1}` }),
  )
  const ids = batch.map((c) => c.id).join(', ')
  await agent(`Project root ${ROOT}. Batch ${b + 1} chapters (${ids}) were just built and reviewed by other agents. You are the batch gate.
1. Run \`cd ${ROOT} && npm run build\`. If it fails, fix the cause — but ONLY inside these chapters' files: ${batch.map((c) => `src/content/chapters/${c.id}.ts, src/chapters/${c.folder}/`).join('; ')}. Never edit shared files or other chapters. (If a failure comes from a chapter outside this batch that is still being worked on, wait a minute and retry; report it if it persists.)
2. Smoke test with node scripts/shot.mjs (dev server at http://localhost:5288): for each batch chapter screenshot its opening (#<id>@0) and growth section (#<id>-growth@0 — the epilogue has none) on desktop and --mobile; confirm "콘솔 에러 없음". View the PNGs (downscale with sips -Z 900).
3. Commit ONLY this batch's files: \`git add ${batch.map((c) => `src/content/chapters/${c.id}.ts src/chapters/${c.folder}`).join(' ')}\` then \`git commit -m "<summary of batch ${b + 1}: chapters ${ids}>" \` with a body line listing each chapter's interaction/scenes, ending with the line "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Do not push.
Reviewer reports for context:
${results.map((r, i) => `### ${batch[i].id}\n${r}`).join('\n\n')}
Return: build result, smoke-test findings, commit hash.`, { label: `gate:batch${b + 1}`, phase: `Batch ${b + 1}` })
  log(`Batch ${b + 1} (${ids}) done`)
}
return 'all batches done'
