import { Fragment } from 'react'

/**
 * 가운뎃점으로 이어 쓴 말(ETL(Extract·Transform·Load, …), 추출·변환·적재)은 띄어쓰기가 없어 한 덩어리로 줄을 바꾼다.
 * 휴대폰의 좁은 글 칸에서는 이 덩어리가 칸보다 길어지므로 점 뒤에서 줄을 바꿀 수 있게 한다.
 * 넓은 화면에서는 덩어리째 다음 줄로 넘기는 편이 읽기 좋아서 줄바꿈 자리를 숨긴다.
 */
function Dots({ text }: { text: string }) {
  const bits = text.split('·')
  return bits.map((b, j) => (
    <Fragment key={j}>
      {b}
      {j < bits.length - 1 && (
        <>
          ·
          <span className="md:hidden">
            <wbr />
          </span>
        </>
      )}
    </Fragment>
  ))
}

/** 콘텐츠 문자열의 아주 작은 마크업만 해석한다: **강조**, `코드` */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return (
            <strong key={i} className="font-bold">
              <Dots text={p.slice(2, -2)} />
            </strong>
          )
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="rounded bg-surface px-1 py-0.5 font-mono text-[0.88em]">
              {p.slice(1, -1)}
            </code>
          )
        return <Dots key={i} text={p} />
      })}
    </>
  )
}

/** 마크업을 걷어낸 순수 텍스트(aria-label 등) */
export const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
