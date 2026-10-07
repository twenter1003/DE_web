import { Fragment } from 'react'

/** 콘텐츠 문자열의 아주 작은 마크업만 해석한다: **강조**, `코드` */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="rounded bg-surface px-1 py-0.5 font-mono text-[0.88em]">
              {p.slice(1, -1)}
            </code>
          )
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}

/** 마크업을 걷어낸 순수 텍스트(aria-label 등) */
export const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
