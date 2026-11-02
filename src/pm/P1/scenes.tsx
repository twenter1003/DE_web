import { SvgTable } from '../../components/diagram'
import { Fig, Txt, countTo } from '../../components/fig'
import { RArrow, RLine, RRect } from '../../components/sketch'
import { type SceneBuild } from '../../components/StepScene'
import { ORDERS } from '../../content/pm/p1'
import { buildAppear } from '../anim'

const n0 = (n: number) => n.toLocaleString('ko-KR')

/** 카드 한 장: 상자 + 제목 + (선택) 두 번째 줄 */
function Card({ x, y, w, h, title, sub, seed, el, dash, fill = 'var(--surface)' }: { x: number; y: number; w: number; h: number; title: string; sub?: string; seed: string; el?: string; dash?: string; fill?: string }) {
  return (
    <g data-el={el}>
      <RRect x={x} y={y} w={w} h={h} seed={seed} rough={0.5} fill={fill} dash={dash} />
      <Txt x={x + w / 2} y={y + (sub ? h * 0.3 : h * 0.6)} anchor="middle" size={13} weight={700}>
        {title}
      </Txt>
      {sub && (
        <Txt x={x + w / 2} y={y + h * 0.5} anchor="middle" size={11.5} muted>
          {sub}
        </Txt>
      )}
    </g>
  )
}

// ─────────────────────────────────────────────────────────────
// 장면 2. 문제 — 이름표는 붙었는데 '매출'은 아직
// ─────────────────────────────────────────────────────────────
const DOCS = [
  { t: '경영 대시보드', x: 24, y: 70 },
  { t: '주간 슬랙 보고', x: 236, y: 70 },
  { t: '광고 리포트', x: 24, y: 340 },
  { t: '정산 시트', x: 236, y: 340 },
  { t: '신입 온보딩 문서', x: 130, y: 410 },
]
const COLS = [
  { key: 'id', label: '주문', w: 56 },
  { key: 'price', label: '상품가', w: 80, align: 'end' as const },
  { key: 'ship', label: '배송비', w: 72, align: 'end' as const },
  { key: 'disc', label: '할인', w: 64, align: 'end' as const },
  { key: 'st', label: '상태', w: 64 },
]

export function ProblemFig() {
  return (
    <Fig>
      {/* step 1: 퍼져 있는 '매출' */}
      <g data-el="docs-label">
        <Txt x={24} y={34} size={13} weight={700}>
          '매출'이 적힌 곳
        </Txt>
        <Txt x={118} y={34} size={13} weight={700} el="found">
          5
        </Txt>
        <Txt x={128} y={34} size={13} weight={700}>
          곳 · 뜻이 적힌 곳 0곳
        </Txt>
      </g>
      <g data-el="docs-center">
        <Txt x={220} y={248} anchor="middle" size={52} weight={800}>
          매출
        </Txt>
      </g>
      {DOCS.map((d) => (
        <g key={d.t} data-el="doc">
          <RRect x={d.x} y={d.y} w={d.t.length > 6 ? 180 : 170} h={52} seed={`doc-${d.t}`} rough={0.5} fill="var(--surface)" />
          <Txt x={d.x + 12} y={d.y + 22} size={13} weight={700}>
            {d.t}
          </Txt>
          <Txt x={d.x + 12} y={d.y + 40} size={11.5} muted>
            뜻: ?
          </Txt>
        </g>
      ))}

      {/* step 2: 주문 4건 */}
      <g data-el="orders">
        <Txt x={40} y={52} size={12.5} muted>
          주문 4건만 떼어 본 예시 · 가상 수치
        </Txt>
        <SvgTable
          x={40}
          y={64}
          cols={COLS}
          rows={ORDERS.map((o) => ({ id: o.id, price: n0(o.price), ship: n0(o.ship), disc: n0(o.disc), st: o.status }))}
          rowH={30}
          seed="p1-orders"
          el="o"
        />
        <RRect x={40} y={246} w={340} h={70} seed="p1-ra" rough={0.5} fill="var(--surface)" />
        <Txt x={52} y={270} size={12.5} weight={700}>
          규칙 A · 할인 전 · 배송비 포함 · 취소·환불 포함
        </Txt>
        <Txt x={368} y={304} anchor="end" size={20} weight={800} el="sumA">
          0원
        </Txt>
        <RRect x={40} y={330} w={340} h={70} seed="p1-rb" rough={0.5} fill="var(--surface)" />
        <Txt x={52} y={354} size={12.5} weight={700}>
          규칙 B · 할인 후 · 배송비 제외 · 취소·환불 제외
        </Txt>
        <Txt x={368} y={388} anchor="end" size={20} weight={800} el="sumB">
          0원
        </Txt>
        <Txt x={220} y={432} anchor="middle" size={14} weight={700} el="both">
          둘 다 '매출'
        </Txt>
      </g>

      {/* step 3: 객단가 요청 */}
      <g data-el="req">
        <RRect x={60} y={40} w={320} h={86} seed="p1-req" rough={0.5} fill="var(--surface)" />
        <Txt x={76} y={68} size={14} weight={700}>
          객단가
        </Txt>
        <Txt x={76} y={90} size={12} muted>
          요청자 소라 · 기한 오늘
        </Txt>
        <RRect x={76} y={98} w={288} h={20} seed="p1-req-empty" rough={0.4} stroke="var(--fail)" dash="4 4" />
        <Txt x={88} y={113} size={11.5} color="var(--fail)">
          ✕ 정의 없음
        </Txt>
        <RArrow x1={150} y1={134} x2={110} y2={186} seed="p1-ra1" rough={0.5} />
        <RArrow x1={290} y1={134} x2={330} y2={186} seed="p1-ra2" rough={0.5} />
        <Card x={20} y={190} w={190} h={92} title="규칙 A" sub="119,000 ÷ 주문 4건" seed="p1-ka" />
        <Txt x={115} y={272} anchor="middle" size={18} weight={800}>
          29,750원
        </Txt>
        <Card x={230} y={190} w={190} h={92} title="규칙 B" sub="72,000 ÷ 완료 주문 2건" seed="p1-kb" />
        <Txt x={325} y={272} anchor="middle" size={18} weight={800}>
          36,000원
        </Txt>
        <Txt x={220} y={340} anchor="middle" size={26} weight={800} color="var(--fail)">
          ≠
        </Txt>
        <Txt x={220} y={372} anchor="middle" size={12.5} muted>
          뜻이 비어 있으면 같은 요청에서 다른 숫자가 나와요
        </Txt>
        <Txt x={220} y={460} anchor="middle" size={11.5} muted>
          단순한 예 · 가상 수치
        </Txt>
      </g>
    </Fig>
  )
}

export const buildProblem: SceneBuild = (q, tl, env) => {
  buildAppear({
    'docs-label': 0,
    'docs-center': 0,
    doc: { in: 0, stagger: 0.12, out: 1 },
    orders: { in: 1, out: 2 },
    req: 2,
  })(q, tl, env)
  buildAppear({ 'docs-label': { out: 1 }, 'docs-center': { out: 1 } })(q, tl, env)
  buildAppear({ 'sumA': 1.3, 'sumB': 1.5, both: 1.7 })(q, tl, env)
  countTo(tl, q('[data-el="found"]')[0], 0, 5, (n) => String(n), 0.1, 0.6)
  countTo(tl, q('[data-el="sumA"]')[0], 0, 119000, (n) => `${n0(n)}원`, 1.3, 0.5)
  countTo(tl, q('[data-el="sumB"]')[0], 0, 72000, (n) => `${n0(n)}원`, 1.5, 0.5)
}

// ─────────────────────────────────────────────────────────────
// 장면 3. 시도와 실패 — '하나로 통일합시다'
// ─────────────────────────────────────────────────────────────
export function AttemptFig() {
  return (
    <Fig>
      <g>
        <RRect x={20} y={28} w={400} h={112} seed="p1-notice" rough={0.5} fill="var(--surface)" />
        <Txt x={34} y={52} size={12} muted>
          # 전체 공지 · 슬랙
        </Txt>
        <g data-el="notice-text">
          <Txt x={34} y={78} size={13.5} weight={700}>
            [공지] 공식 매출 기준을 순매출 하나로
          </Txt>
          <Txt x={34} y={100} size={13.5} weight={700}>
            통일합니다. 총매출은 내일부터 쓰지 않습니다.
          </Txt>
        </g>
        <g data-el="strike">
          <RLine x1={30} y1={74} x2={410} y2={74} seed="p1-strike1" rough={0.4} stroke="var(--fail)" strokeWidth={2} />
          <RLine x1={30} y1={96} x2={410} y2={96} seed="p1-strike2" rough={0.4} stroke="var(--fail)" strokeWidth={2} />
          <Txt x={410} y={126} anchor="end" size={12} weight={700} color="var(--fail)">
            삭제됨
          </Txt>
        </g>
        <Txt x={34} y={126} size={12} muted el="send">
          [보내기]
        </Txt>
      </g>
      <g data-el="reply-sora">
        <RRect x={20} y={156} w={250} h={60} seed="p1-sora" rough={0.5} fill="var(--surface)" />
        <Txt x={32} y={178} size={12} muted>
          소라
        </Txt>
        <Txt x={32} y={200} size={12.5}>
          광고는 총매출로 봐야 해요!
        </Txt>
      </g>
      <g data-el="ad">
        <RRect x={286} y={156} w={134} h={60} seed="p1-ad" rough={0.5} fill="var(--surface)" />
        <Txt x={296} y={178} size={12.5} weight={700}>
          광고 리포트
        </Txt>
        <Txt x={296} y={200} size={12} color="var(--wait)">
          ⏸ 총매출 없음
        </Txt>
      </g>
      <g data-el="reply-minjae">
        <RRect x={20} y={228} w={250} h={60} seed="p1-minjae" rough={0.5} fill="var(--surface)" />
        <Txt x={32} y={250} size={12} muted>
          민재
        </Txt>
        <Txt x={32} y={272} size={12.5}>
          그냥 '매출'만 쓰면 또 섞여요.
        </Txt>
      </g>
      <g data-el="votes">
        <Txt x={296} y={250} size={13} weight={700} color="var(--fail)">
          소라 ✕ 반대
        </Txt>
        <Txt x={296} y={274} size={13} weight={700} color="var(--wait)">
          민재 △ 조건부
        </Txt>
      </g>
      <g data-el="board">
        <RRect x={40} y={330} w={360} h={104} seed="p1-board2" rough={0.6} fill="var(--surface)" />
        <Txt x={220} y={376} anchor="middle" size={17} weight={800}>
          숫자 하나? ✕
        </Txt>
        <Txt x={220} y={408} anchor="middle" size={17} weight={800} color="var(--ok)">
          → 약속 하나 ✓
        </Txt>
      </g>
    </Fig>
  )
}

export const buildAttempt: SceneBuild = (q, tl, env) => {
  buildAppear({
    'reply-sora': 1,
    ad: 1,
    'reply-minjae': 2,
    votes: 2,
    strike: 3,
    board: 3,
  })(q, tl, env)
}

// ─────────────────────────────────────────────────────────────
// 장면 4. 개념 — 지표 정의서, 숫자의 규칙서
// ─────────────────────────────────────────────────────────────
const FORM: [string, string][] = [
  ['이름', '총매출'],
  ['한 줄 뜻', '주문된 금액 그대로의 합계'],
  ['계산 규칙', '할인 전 · 배송비 포함 · 취소·환불 포함'],
  ['담당자', '소라'],
  ['쓰이는 곳', '광고 리포트'],
  ['바꿀 때 규칙', '쓰는 곳에 먼저 알리고 합의한 뒤'],
]

export function ConceptFig() {
  return (
    <Fig>
      {/* step 1: 규칙서 비유 */}
      <g data-el="rooms">
        <Txt x={110} y={44} anchor="middle" size={13} weight={700}>
          규칙서 없음
        </Txt>
        <Txt x={330} y={44} anchor="middle" size={13} weight={700}>
          규칙서 있음
        </Txt>
        <RRect x={20} y={64} w={180} h={150} seed="p1-room1" rough={0.5} fill="var(--surface)" />
        <Txt x={110} y={104} anchor="middle" size={12.5}>
          방 1 · "한 칸 더!"
        </Txt>
        <Txt x={110} y={164} anchor="middle" size={12.5}>
          방 2 · "한 번 쉬어!"
        </Txt>
        <RLine x1={30} y1={134} x2={190} y2={134} seed="p1-room-l" rough={0.4} dash="4 4" />
        <RRect x={240} y={64} w={180} h={150} seed="p1-room2" rough={0.5} fill="var(--surface)" />
        <Txt x={330} y={118} anchor="middle" size={13} weight={700}>
          📖 규칙서
        </Txt>
        <Txt x={330} y={150} anchor="middle" size={12.5}>
          "규칙서대로!"
        </Txt>
        <Txt x={220} y={290} anchor="middle" size={13.5} weight={700}>
          지표 정의서 = 숫자의 규칙서
        </Txt>
      </g>

      {/* step 2~3: 여섯 칸 양식 */}
      <g data-el="form">
        <RRect x={20} y={28} w={400} h={246} seed="p1-form" rough={0.5} fill="var(--surface)" />
        {FORM.map(([k, v], i) => (
          <g key={k} data-el={`form-r${i}`}>
            <RLine x1={20} y1={28 + i * 41} x2={420} y2={28 + i * 41} seed={`p1-form-l${i}`} rough={0.3} strokeWidth={0.9} />
            <Txt x={32} y={54 + i * 41} size={12.5} weight={700}>
              {k}
            </Txt>
            <Txt x={118} y={54 + i * 41} size={12.5}>
              {v}
            </Txt>
          </g>
        ))}
      </g>
      <g data-el="used">
        <RArrow x1={300} y1={190} x2={300} y2={296} seed="p1-used1" rough={0.5} />
        {['광고 리포트', '경영 대시보드', '정산 시트'].map((t, i) => (
          <Card key={t} x={20 + i * 140} y={304} w={130} h={40} title={t} seed={`p1-used-${i}`} />
        ))}
        <Txt x={220} y={376} anchor="middle" size={13} weight={700}>
          담당자 = 바뀌면 알리는 사람
        </Txt>
        <Txt x={220} y={398} anchor="middle" size={12} muted>
          쿼리를 짜는 사람이 아니라 정의의 주인
        </Txt>
      </g>

      {/* step 4: 기본값 규칙 */}
      <g data-el="rule">
        <RRect x={20} y={28} w={400} h={110} seed="p1-rule" rough={0.5} fill="var(--surface)" />
        <Txt x={220} y={68} anchor="middle" size={16} weight={800}>
          '매출'만 쓰면 = 순매출
        </Txt>
        <Txt x={220} y={100} anchor="middle" size={16} weight={800}>
          총매출은 풀네임으로만
        </Txt>
        <Card x={20} y={168} w={400} h={52} title="경영 대시보드 머리글 · 매출(순매출)" seed="p1-ex1" />
        <Card x={20} y={232} w={400} h={52} title="광고 리포트 · 총매출" seed="p1-ex2" />
        <Txt x={220} y={316} anchor="middle" size={12} muted>
          바구니 내부 규칙이에요.
        </Txt>
      </g>
    </Fig>
  )
}

export const buildConcept: SceneBuild = (q, tl, env) => {
  buildAppear({
    rooms: { in: 0, out: 1 },
    form: { in: 1, out: 3 },
    used: { in: 2, out: 3 },
    rule: 3,
  })(q, tl, env)
  // 양식 여섯 칸은 step 2 안에서 위에서부터 차례로
  buildAppear(Object.fromEntries(FORM.map((_, i) => [`form-r${i}`, { in: 1 + i * 0.1 }])))(q, tl, env)
}

// ─────────────────────────────────────────────────────────────
// 장면 5. 해결 — 정의서 두 장, 기본값 하나
// ─────────────────────────────────────────────────────────────
function Sheet({ x, name, owner, rule, seed }: { x: number; name: string; owner: string; rule: string; seed: string }) {
  return (
    <g>
      <RRect x={x} y={36} w={200} h={250} seed={seed} rough={0.5} fill="var(--surface)" />
      <Txt x={x + 12} y={64} size={15} weight={800}>
        {name}
      </Txt>
      {['이름', '뜻', '계산 규칙', '담당자', '쓰이는 곳', '바꿀 때'].map((k, i) => (
        <Txt key={k} x={x + 12} y={92 + i * 28} size={11.5} muted>
          {k} ✓
        </Txt>
      ))}
      <Txt x={x + 12} y={266} size={11.5}>
        {rule}
      </Txt>
      <Txt x={x + 188} y={266} anchor="end" size={12} weight={700} color="var(--ok)">
        {owner} ✓
      </Txt>
    </g>
  )
}

export function SolutionFig() {
  return (
    <Fig>
      <g data-el="sheets">
        <Sheet x={10} name="총매출" owner="소라" rule="담당 소라" seed="p1-sh1" />
        <Sheet x={230} name="순매출" owner="민재" rule="담당 민재" seed="p1-sh2" />
      </g>
      <g data-el="dash">
        <RRect x={20} y={36} w={400} h={110} seed="p1-dash" rough={0.5} fill="var(--surface)" />
        <Txt x={34} y={62} size={12} muted>
          경영 대시보드 · 정의서 보기
        </Txt>
        <Txt x={34} y={92} size={14} weight={700}>
          매출(순매출) · 10월
        </Txt>
        <Txt x={406} y={124} anchor="end" size={24} weight={800}>
          98,000,000원
        </Txt>
        <RRect x={20} y={170} w={400} h={110} seed="p1-ad2" rough={0.5} fill="var(--surface)" />
        <Txt x={34} y={196} size={12} muted>
          광고 리포트 · ▶ 재개
        </Txt>
        <Txt x={34} y={226} size={14} weight={700}>
          총매출 · 10월
        </Txt>
        <Txt x={406} y={258} anchor="end" size={24} weight={800}>
          120,000,000원
        </Txt>
        <Txt x={220} y={312} anchor="middle" size={12} muted>
          가상 수치
        </Txt>
      </g>
      <g data-el="req2">
        <RRect x={40} y={60} w={360} h={140} seed="p1-req2" rough={0.5} fill="var(--surface)" />
        <Txt x={56} y={90} size={14} weight={700}>
          객단가 · 요청자 소라
        </Txt>
        <RRect x={56} y={106} w={328} h={34} seed="p1-def" rough={0.4} stroke="var(--ok)" />
        <Txt x={68} y={128} size={13}>
          정의: 총매출 ÷ 전체 주문 수 · 담당 소라
        </Txt>
        <Txt x={56} y={170} size={13} weight={700} color="var(--ok)">
          ✓ 정의 확인 → 쿼리 요청 가능
        </Txt>
      </g>
    </Fig>
  )
}

export const buildSolution: SceneBuild = (q, tl, env) => {
  buildAppear({ sheets: { in: 0, out: 1 }, dash: { in: 1, out: 2 }, req2: 2 })(q, tl, env)
}
