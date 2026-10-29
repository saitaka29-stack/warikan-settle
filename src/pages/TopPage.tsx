import { useState, type Dispatch, type FormEvent } from 'react'
import { Link } from '../components/Link'
import type { Action } from '../lib/reducer'
import { eventPath } from '../lib/route'
import { summarize, yen } from '../lib/settle'
import type { EventData, Store } from '../lib/types'
import { navigate } from '../router'

function StatusBadge({ event }: { event: EventData }) {
  const { transfers, settledCount, done } = summarize(event)
  if (event.expenses.length === 0) return <span className="badge muted">支払い未登録</span>
  if (transfers.length === 0 || done) return <span className="badge ok">精算完了</span>
  return (
    <span className="badge">
      精算 {settledCount}/{transfers.length}
    </span>
  )
}

export function TopPage({ store, dispatch }: { store: Store; dispatch: Dispatch<Action> }) {
  const [name, setName] = useState('')

  const create = (e: FormEvent) => {
    e.preventDefault()
    const id = crypto.randomUUID()
    dispatch({ type: 'createEvent', id, name, now: Date.now() })
    navigate(eventPath(id))
  }

  const remove = (event: EventData) => {
    if (confirm(`「${event.name}」を削除します。元に戻せません。よろしいですか？`)) {
      dispatch({ type: 'deleteEvent', eventId: event.id })
    }
  }

  return (
    <>
      <header className="hero">
        <h1>ワリカンスッキリ</h1>
        <p>旅行や飲み会の立て替えを入力するだけで、最小限の送金回数で精算できます。登録不要・無料。</p>
        <ol className="steps">
          <li>
            <span className="step">1</span>メンバーを登録
          </li>
          <li>
            <span className="step">2</span>立て替えを記録
          </li>
          <li>
            <span className="step">3</span>送金リストを共有
          </li>
        </ol>
      </header>

      <section className="card">
        <h2>新しいイベント</h2>
        <form className="row" onSubmit={create}>
          <input
            aria-label="イベント名"
            placeholder="例：沖縄旅行、忘年会"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="primary">
            作成
          </button>
        </form>
      </section>

      <section className="card">
        <h2>イベント一覧</h2>
        {store.events.length === 0 ? (
          <p className="hint">まだイベントはありません。上のフォームから作成しましょう</p>
        ) : (
          <ul className="event-list">
            {store.events.map((ev) => (
              <li key={ev.id} className="event-card">
                <Link to={eventPath(ev.id)} className="event-link">
                  <span className="event-name">{ev.name}</span>
                  <span className="sub">
                    {ev.members.length}人 ・ 支払い{ev.expenses.length}件 ・ 合計 {yen(summarize(ev).total)}
                  </span>
                  <StatusBadge event={ev} />
                </Link>
                <button type="button" className="ghost danger" aria-label={`${ev.name}を削除`} onClick={() => remove(ev)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
