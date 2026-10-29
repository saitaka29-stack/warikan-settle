import { useMemo, useState, type Dispatch } from 'react'
import { BalanceTable } from '../components/BalanceTable'
import { ExpenseItem } from '../components/ExpenseItem'
import { Link } from '../components/Link'
import { TransferList } from '../components/TransferList'
import { useToast } from '../components/useToast'
import type { Action } from '../lib/reducer'
import { eventPath } from '../lib/route'
import { memberName, summarize, transferKey, yen } from '../lib/settle'
import { decodeShare } from '../lib/storage'
import type { Store } from '../lib/types'
import { navigate } from '../router'

export function SharePage({ store, dispatch }: { store: Store; dispatch: Dispatch<Action> }) {
  const event = useMemo(() => decodeShare(window.location.hash, crypto.randomUUID()), [])
  const [meId, setMeId] = useState<string | null>(null)
  const toast = useToast()

  if (!event) {
    return (
      <section className="card error">
        <h2>リンクを読み込めませんでした</h2>
        <p className="hint">共有リンクが途中で切れている可能性があります。幹事の方にもう一度送ってもらってください。</p>
        <Link to="/">トップへ</Link>
      </section>
    )
  }

  const { total, transfers } = summarize(event)
  const mine = meId ? transfers.filter((t) => t.fromId === meId || t.toId === meId) : []

  const importEvent = () => {
    const exists = store.events.some((e) => e.id === event.id)
    if (exists && !confirm('このイベントはすでに端末にあります。共有された内容で上書きしますか？')) return
    dispatch({ type: 'importEvent', event })
    navigate(eventPath(event.id, 'settle'))
  }

  return (
    <>
      <header className="event-header">
        <p className="eyebrow">共有された精算結果</p>
        <h1>{event.name}</h1>
        <p className="sub">
          {event.members.length}人 ・ 合計 {yen(total)} ・ 送金 {transfers.length} 回
        </p>
      </header>

      <section className="card">
        <h2>あなたは誰？</h2>
        <div className="member-picker">
          {event.members.map((m) => (
            <button key={m.id} type="button" aria-pressed={meId === m.id} onClick={() => setMeId(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        {meId && (
          <div className="me-card">
            {mine.length === 0 ? (
              <p className="me-line">{memberName(event, meId)} さんは送金も受け取りもありません 🎉</p>
            ) : (
              mine.map((t) => {
                const pay = t.fromId === meId
                const other = memberName(event, pay ? t.toId : t.fromId)
                const done = event.settled.includes(transferKey(t))
                return (
                  <div key={transferKey(t)} className={`me-line ${pay ? 'pay' : 'receive'}`}>
                    <span>
                      {pay ? `${other} さんに` : `${other} さんから`}
                      <strong>{yen(t.amount)}</strong>
                      {pay ? 'を払う' : 'を受け取る'}
                      {done && <span className="done-mark">済</span>}
                    </span>
                    {pay && (
                      <button type="button" onClick={() => toast.copy(String(t.amount), '金額をコピーしました')}>
                        金額をコピー
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
        <div className="toast" role="status" aria-live="polite">
          {toast.message}
        </div>
      </section>

      <section className="card result">
        <h2>全体の送金リスト</h2>
        <TransferList event={event} transfers={transfers} highlightId={meId ?? undefined} />
        <BalanceTable ledger={event} />
      </section>

      <section className="card">
        <h2>支払いの明細</h2>
        <ul className="expense-list">
          {event.expenses.map((e) => (
            <ExpenseItem key={e.id} ledger={event} expense={e} />
          ))}
        </ul>
      </section>

      <section className="card">
        <p className="hint">このページは閲覧専用です。自分でも編集・管理したい場合は端末に取り込めます。</p>
        <button type="button" onClick={importEvent}>
          自分の端末に取り込む
        </button>
      </section>
    </>
  )
}
