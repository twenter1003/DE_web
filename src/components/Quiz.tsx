import { useEffect, useId, useRef, useState } from 'react'
import { UI } from '../content/ui'
import type { ChapterId, Quiz as QuizT } from '../content/types'
import { Rich } from '../lib/rich'
import { useProgress } from '../state/progress'

/** 확인 퀴즈 1문항. 답을 고르면 모든 보기의 해설이 열리고, 틀려도 해설을 보면 통과 */
export function Quiz({ id, quiz }: { id: ChapterId; quiz: QuizT }) {
  const { answers, answer } = useProgress()
  const saved = answers[id]
  const [pick, setPick] = useState<string | null>(saved ?? null)
  const name = useId()
  const done = Boolean(saved)
  const correctIdx = quiz.options.findIndex((o) => o.correct)
  const correct = quiz.options[correctIdx]
  const chosen = saved ?? pick
  // 제출하면 버튼이 사라지고 보기가 잠긴다 → 포커스를 결과 상자로 옮겨 제자리를 잃지 않게(처음부터 푼 상태면 옮기지 않음)
  const result = useRef<HTMLDivElement>(null)
  const submitted = useRef(false)
  useEffect(() => {
    if (done && submitted.current) result.current?.focus()
  }, [done])

  return (
    <section className="py-[8svh]">
      <h3 id={`${id}-quiz`} className="font-mono text-sm text-muted">
        {UI.quiz.title}
      </h3>
      <form
        className="mt-3 max-w-[46rem]"
        onSubmit={(e) => {
          e.preventDefault()
          if (pick && !done) {
            submitted.current = true
            answer(id, pick)
          }
        }}
      >
        <fieldset disabled={done}>
          <legend className="text-[1.375rem] font-bold leading-snug md:text-[1.625rem]">
            <Rich text={quiz.question} />
          </legend>
          <p className="sr-only">{UI.quiz.legend}</p>
          <div className="mt-6 space-y-3">
            {quiz.options.map((o, i) => {
              const isPick = chosen === o.id
              const state = done ? (o.correct ? 'correct' : isPick ? 'wrong' : 'other') : isPick ? 'picked' : 'idle'
              return (
                <label
                  key={o.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border-[1.5px] bg-surface p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
                    state === 'correct' ? 'border-ok' : state === 'wrong' ? 'border-fail' : state === 'picked' ? 'border-ink' : 'border-edge'
                  } ${done ? 'cursor-default' : 'hover:border-ink'}`}
                >
                  <input
                    type="radio"
                    name={name}
                    value={o.id}
                    checked={isPick}
                    onChange={() => setPick(o.id)}
                    className="mt-1.5 size-4 shrink-0 accent-[var(--ink)]"
                  />
                  <span className="min-w-0">
                    <span className="font-mono text-sm text-muted">{i + 1}. </span>
                    <Rich text={o.text} />
                    {done && (
                      <span className="mt-2 block text-[0.9375rem] leading-relaxed">
                        <span className={`mr-1 font-bold ${o.correct ? 'text-ok' : isPick ? 'text-fail' : 'text-muted'}`} aria-hidden="true">
                          {o.correct ? '✓' : isPick ? '✕' : '·'}
                        </span>
                        <span className="font-bold">{o.correct ? UI.quiz.answer : isPick ? UI.quiz.yourPick : ''}</span>
                        {(o.correct || isPick) && ' '}
                        <Rich text={o.feedback} />
                      </span>
                    )}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
        {!done && (
          <button type="submit" disabled={!pick} className="btn btn-solid mt-6">
            {UI.quiz.submit}
          </button>
        )}
      </form>
      <div aria-live="polite" className="max-w-[46rem]">
        {done && (
          <div ref={result} tabIndex={-1} className="mt-6 rounded-xl border-[1.5px] border-edge bg-surface p-5">
            <p className="font-bold">
              <span aria-hidden="true">{saved === correct.id ? '✓ ' : '✕ '}</span>
              {saved === correct.id ? UI.quiz.correct : UI.quiz.wrong(correctIdx + 1)}
            </p>
            <p className="mt-2">
              <span className="font-mono text-sm text-muted">{UI.quiz.explanation} </span>
              <Rich text={quiz.explanation} />
            </p>
            <p className="mt-2 text-muted">{UI.quiz.pass}</p>
          </div>
        )}
      </div>
    </section>
  )
}
