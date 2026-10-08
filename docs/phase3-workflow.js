export const meta = {
  name: 'phase3-polish',
  description: 'Phase 3: parallel audits (mobile, keyboard/a11y, contrast, reduced motion, performance, content accuracy, completion), fixes by file ownership, final verification',
  phases: [
    { title: 'Audit', detail: 'read-only audits with screenshots' },
    { title: 'Fix', detail: 'shared components first, then chapters in parallel' },
    { title: 'Verify', detail: 'build, Lighthouse, completion checklist, commit' },
  ],
}

const ROOT = '/Users/kimtaewoo/DE_web'
const CHAPTERS = [
  ['prologue', 'Prologue'], ['ch1', 'Ch01'], ['ch2', 'Ch02'], ['ch3', 'Ch03'], ['ch4', 'Ch04'], ['ch5', 'Ch05'],
  ['ch6', 'Ch06'], ['ch7', 'Ch07'], ['ch8', 'Ch08'], ['ch9', 'Ch09'], ['ch10', 'Ch10'], ['epilogue', 'Epilogue'],
]
const CTX = `Project root ${ROOT}: Korean scroll-driven data-engineering course (Vite/React/GSAP). Read ${ROOT}/CLAUDE.md, ${ROOT}/docs/SPEC.md (sections 4, 9, 10), ${ROOT}/docs/CHAPTER_GUIDE.md.
Dev server: http://localhost:5288 (already running; do not start/kill servers). Screenshot tool: node scripts/shot.mjs (read its header; it adds ?mount=all so every chapter is mounted). Downscale PNGs before reading: sips -Z 900 in.png --out out.png. For DOM checks write short playwright snippets (require('playwright')) against http://localhost:5288/?mount=all.
SCRATCH FILES: keep temporary files in your own folder (e.g. shots/<your-label>-* or /private/tmp/claude-501/-Users-kimtaewoo-DE-web/87f927fd-5f5a-4ca9-8840-608bdfafed08/scratchpad/<your-label>/); never delete files you did not create — other agents share these folders.
Known issues already spotted by the lead (verify and include if real): Ch4 star-schema step 4 — an accent dot overlaps the labels '주문 항목 팩트' and '1~3일치만 담은 예시'; Epilogue zoom step 4 — chapter tags crowd/overlap node labels (e.g. the Ch8 tag over 레이크하우스); Ch1 SQL runner on mobile — diagram keeps the tallest step's height leaving empty space; Ch2 code runner mobile ELT — ~200px empty space.`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'repo-relative path of the file to change' },
          chapter: { type: 'string', description: 'chapter id (prologue, ch1..ch10, epilogue) or "shared"' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          problem: { type: 'string' },
          evidence: { type: 'string', description: 'screenshot path, selector, measurement, or quote' },
          fix: { type: 'string', description: 'concrete change to make' },
        },
        required: ['file', 'chapter', 'severity', 'problem', 'evidence', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

const AUDITS = [
  { key: 'mobile', prompt: `Audit MOBILE layout for every chapter at 390×844 and 360×740 (--mobile, and a custom --w 360 --h 740 run). For each chapter: opening, 2 steps of every scene (first and last), interaction (operate it), quiz, growth. Check: text clipped/overlapping, diagram unreadable (labels < ~11px rendered), sticky diagram covering text, HUD overlapping content, horizontal page scroll (document.documentElement.scrollWidth > innerWidth), touch targets < 40px. Report findings only (do not edit).` },
  { key: 'keyboard', prompt: `Audit KEYBOARD and SCREEN-READER use across the whole page. With playwright, Tab from the top through: skip link, HUD buttons, the HUD dialog (all tabs, Esc closes, focus returns to the opener), rail links, every interaction, every quiz (radios with arrow keys, submit), growth replay buttons, epilogue buttons. Check focus is always visible (screenshot focused elements), no keyboard traps, logical order, aria-live regions announce meaningful text, headings form a sensible outline (h1 > h2 per chapter > h3 per scene), images/diagrams have role=img + label or are aria-hidden with text equivalents, buttons have accessible names. Report findings only.` },
  { key: 'contrast', prompt: `Audit COLOR and CONTRAST on all 12 stage palettes. Run node scripts/contrast.mjs. Then for each chapter (screenshots + computed styles via playwright) find text drawn with accent/fail/ok/wait colors at small sizes (< 18px) or on non-verified backgrounds, SVG text on custom fills, low-contrast dashed/proposal elements, and any meaning conveyed by color alone (status without icon/text). Also run Lighthouse accessibility on the dev page with ?mount=all scrolled to each chapter if practical (npx -y lighthouse@12 with CHROME_PATH from require('playwright').chromium.executablePath()). Report findings only.` },
  { key: 'reduced', prompt: `Audit REDUCED MOTION mode for every chapter (--reduced, desktop and mobile). Every step must show a complete static picture of that step's final state (compare with the storyboard 화면 in docs/storyboard/NN-*.md), no element stuck invisible or overlapping because of a timeline mistake; interactions give instant results; nothing auto-animates; the HUD motion toggle switches modes live without breaking layout. Report findings only.` },
  { key: 'perf', prompt: `Audit PERFORMANCE. 1) npm run build, then serve dist with \`npx vite preview --port 5299 --strictPort\` in the background if not already served there, run Lighthouse mobile and desktop (CHROME_PATH from playwright) and record scores. 2) With playwright on the dev server ?mount=all, scroll the full page at a steady speed while recording performance.now()-based long tasks (PerformanceObserver 'longtask') and rAF frame gaps; report chapters/scenes with frames > 50 ms. 3) grep the chapter build functions for tweens of layout-affecting properties (width, height, top, left, x/y on HTML that should be transforms are fine; flag 'width', 'height', 'left', 'top', 'filter', 'boxShadow') and for particle counts above the guide's limits. 4) DOM size with ?mount=all. Report findings with concrete fixes.` },
  ...[
    ['prologue', 'ch1', 'ch2', 'ch3'],
    ['ch4', 'ch5', 'ch6', 'ch7'],
    ['ch8', 'ch9', 'ch10', 'epilogue'],
  ].map((ids, i) => ({
    key: `content${i + 1}`,
    prompt: `CONTENT ACCURACY audit (deliverable for the product owner) for chapters ${ids.join(', ')}: read src/content/chapters/<id>.ts fully (all step texts, dialogue, figure labels, interaction strings, quiz). As a senior data engineer, list every sentence that is technically inaccurate, misleading, or over-simplified without a disclaimer. For each: quote it, explain the problem, give a corrected Korean sentence that keeps the beginner tone and 2–3 sentence limit. Severity high = factually wrong; medium = misleading/over-simplified without disclosure; low = could be clearer. Also flag invented real-world statistics. Report findings only (file = the content file).`,
  })),
  { key: 'completion', prompt: `Audit the SPEC section 10 completion criteria end to end with playwright on ?mount=all (fresh localStorage): every chapter has real content (no stubs, no placeholders, no 'TODO'), Prologue–Ch10 follow problem → attempt → concept → solution → quiz → growth; answer every quiz (any option) and confirm the HUD reaches 26/26 cards and Lv5 after the Ch10 climax; the pipeline map grows per chapter, gets simpler at Ch10, and the epilogue zooms out to the full platform; the dex in the epilogue shows 26 owned cards; reduced-motion mode and mobile both work. Also check spec 9: npm run build passes and no console errors on a full scroll. Report each failure as a finding.` },
]

phase('Audit')
const audits = await parallel(AUDITS.map((a) => () => agent(`${CTX}\n\n${a.prompt}\nReturn structured findings; be specific (file, selector, step, measurement).`, { label: `audit:${a.key}`, phase: 'Audit', schema: FINDINGS })))
const all = audits.filter(Boolean).flatMap((r, i) => r.findings.map((f) => ({ ...f, audit: AUDITS[i].key })))
log(`${all.length} findings from ${audits.filter(Boolean).length} audits`)

phase('Fix')
const shared = all.filter((f) => f.chapter === 'shared' || !CHAPTERS.some(([id]) => id === f.chapter))
const sharedReport = shared.length
  ? await agent(`${CTX}\n\nYou fix SHARED-code findings (components, state, styles, scripts, content outside src/content/chapters). Nobody else is editing right now. Apply each fix that is correct; skip ones that are wrong (explain). Verify with typecheck and screenshots. Do not edit chapter folders.\nFindings:\n${JSON.stringify(shared, null, 1)}\nReturn: what you fixed, what you skipped and why.`, { label: 'fix:shared', phase: 'Fix' })
  : 'no shared findings'
const perChapter = await parallel(
  CHAPTERS.map(([id, folder]) => () => {
    const mine = all.filter((f) => f.chapter === id)
    if (!mine.length) return Promise.resolve(`${id}: no findings`)
    return agent(`${CTX}\n\nYou fix findings for chapter ${id} ONLY (files: src/content/chapters/${id}.ts, src/chapters/${folder}/*, and docs/storyboard file for that chapter if copy changes). Other agents fix other chapters concurrently — touch nothing else. Shared fixes already applied: ${sharedReport}\nApply correct fixes (content accuracy fixes: keep beginner tone, 2–3 sentences, first-use term format; update the storyboard text to match). Verify with typecheck and screenshots of the affected steps (desktop, --mobile, --reduced).\nFindings:\n${JSON.stringify(mine, null, 1)}\nReturn: fixed / skipped (with reason).`, { label: `fix:${id}`, phase: 'Fix' })
  }),
)

phase('Verify')
const verify = await agent(`${CTX}\n\nFINAL VERIFICATION after Phase 3 fixes. 1) npm run build (must pass) and node scripts/storyboard.mjs (regenerate docs/STORYBOARD.md). 2) Re-run the completion checklist of SPEC section 10 quickly (all quizzes → 26/26, Lv5, map grows then simplifies at Ch10, epilogue zoom-out, reduced motion, mobile) and a full-page scroll with zero console errors. 3) Lighthouse mobile + desktop on the production build (serve dist via vite preview on port 5299) and report scores. 4) Commit everything changed in this phase with a clear message ending with "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>". Do not push.\nShared fix report: ${sharedReport}\nChapter fix reports:\n${perChapter.join('\n---\n')}\nReturn: build result, checklist results, Lighthouse scores, commit hash, anything still failing.`, { label: 'verify', phase: 'Verify' })

return {
  contentFindings: all.filter((f) => f.audit.startsWith('content')),
  otherFindings: all.filter((f) => !f.audit.startsWith('content')).length,
  sharedReport,
  perChapter,
  verify,
}
