import { useId, useState } from 'react'
import { InteractionFrame } from '../../components/Chapter'
import { countedAmount, GROSS_RULE, nameOf, NET_RULE, ORDERS, P1_TEXT, totalOf, type Rules } from '../../content/pm/p1'
import { Rich } from '../../lib/rich'

const T = P1_TEXT.interaction
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`

/** 규칙 스위치로 정의서 채우기: 같은 주문 4건이 규칙에 따라 여덟 가지 '매출'이 되는 걸 직접 본다 */
export function RuleSwitches() {
  const [rules, setRules] = useState<Rules>(GROSS_RULE)
  const total = totalOf(rules)
  const named = nameOf(rules)
  const rulePreview = `${rules.afterDiscount ? '할인 후' : '할인 전'} · 배송비 ${rules.withShip ? '포함' : '제외'} · 취소·환불 ${rules.withCancelled ? '포함' : '제외'}`
  const badge = named ? T.named(named.name, named.owner) : T.unnamed

  return (
    <InteractionFrame title={T.title} hint={T.hint} note={T.note}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.8125rem] sm:text-[0.9375rem]">
            <caption className="sr-only">주문 4건과 이 규칙에서 센 금액</caption>
            <thead>
              <tr className="border-b-[1.5px] border-edge text-sm text-muted">
                {Object.values(T.cols).map((c) => (
                  <th key={c} scope="col" className="px-1 py-2 font-bold sm:px-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => {
                const amount = countedAmount(o, rules)
                return (
                  <tr key={o.id} className="border-b border-edge">
                    <th scope="row" className="px-1 py-2 font-mono font-bold sm:px-2">
                      {o.id}
                    </th>
                    <td className={`px-1 py-2 sm:px-2 ${amount === null ? 'line-through text-muted' : ''}`}>{o.price.toLocaleString('ko-KR')}</td>
                    <td className={`px-1 py-2 sm:px-2 ${amount === null || !rules.withShip ? 'text-muted' : ''} ${amount === null ? 'line-through' : ''}`}>{o.ship.toLocaleString('ko-KR')}</td>
                    <td className={`px-1 py-2 sm:px-2 ${amount === null || !rules.afterDiscount ? 'text-muted' : ''} ${amount === null ? 'line-through' : ''}`}>{o.disc.toLocaleString('ko-KR')}</td>
                    <td className="px-1 py-2 sm:px-2">{o.status}</td>
                    <td className="px-1 py-2 font-mono font-bold sm:px-2">
                      {amount === null ? (
                        <span className="text-muted">
                          <span aria-hidden="true">✕ </span>
                          {T.excluded}
                        </span>
                      ) : (
                        amount.toLocaleString('ko-KR')
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={5} className="px-2 py-3 text-right text-sm text-muted">
                  {T.total}
                </th>
                <td className="px-1 py-3 font-mono text-base font-extrabold sm:px-2 sm:text-xl">{won(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="space-y-5">
          <fieldset className="space-y-4">
            <legend className="sr-only">규칙 스위치</legend>
            <Switch label={T.switches.discount.label} off={T.switches.discount.off} on={T.switches.discount.on} value={rules.afterDiscount} onChange={(v) => setRules({ ...rules, afterDiscount: v })} />
            <Switch label={T.switches.ship.label} off={T.switches.ship.off} on={T.switches.ship.on} value={rules.withShip} onChange={(v) => setRules({ ...rules, withShip: v })} />
            <Switch label={T.switches.cancelled.label} off={T.switches.cancelled.off} on={T.switches.cancelled.on} value={rules.withCancelled} onChange={(v) => setRules({ ...rules, withCancelled: v })} />
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => setRules(GROSS_RULE)}>
              {T.presets.gross}
            </button>
            <button type="button" className="btn" onClick={() => setRules(NET_RULE)}>
              {T.presets.net}
            </button>
          </div>
          <div aria-live="polite" className="rounded-xl border-[1.5px] border-edge bg-bg p-4">
            <p className="sr-only">{T.live(rulePreview, won(total), badge)}</p>
            <p className="font-mono text-sm text-muted">
              {T.rulePreview}: {rulePreview}
            </p>
            <p className={`mt-2 font-bold ${named ? 'text-ok' : ''}`}>
              <span aria-hidden="true">{named ? '✓ ' : '△ '}</span>
              <Rich text={badge} />
            </p>
          </div>
        </div>
      </div>
    </InteractionFrame>
  )
}

/** 두 상태를 오가는 스위치. 네이티브 라디오 두 개로 만들어 키보드로 조작 */
function Switch({ label, off, on, value, onChange }: { label: string; off: string; on: string; value: boolean; onChange: (v: boolean) => void }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="w-28 font-bold">{label}</span>
      <div className="inline-flex overflow-hidden rounded-lg border-[1.5px] border-ink">
        {[
          [false, off],
          [true, on],
        ].map(([v, text]) => (
          <label
            key={String(v)}
            className={`cursor-pointer px-4 py-2 text-[0.9375rem] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] ${
              value === v ? 'bg-ink font-bold text-bg' : 'bg-surface'
            }`}
          >
            <input type="radio" name={name} checked={value === v} onChange={() => onChange(v as boolean)} className="sr-only" />
            {text as string}
          </label>
        ))}
      </div>
    </div>
  )
}
