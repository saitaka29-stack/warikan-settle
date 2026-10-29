import { useState, type Dispatch } from 'react'
import { ExpenseTab } from '../components/ExpenseTab'
import { Link } from '../components/Link'
import { MemberTab } from '../components/MemberTab'
import { SettleTab } from '../components/SettleTab'
import type { Action } from '../lib/reducer'
import { eventPath, type Tab } from '../lib/route'
import type { EventData } from '../lib/types'
import { navigate } from '../router'

const TAB_LABELS: Record<Tab, string> = { members: 'メンバー', expenses: '支払い', settle: '精算' }

export function EventPage({ event, tab, dispatch }: { event: EventData; tab: Tab; dispatch: Dispatch<Action> }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(event.name)

  // タブ切り替えは履歴を増やさない（戻るボタンで一覧に戻れるように）
  const goTab = (t: Tab) => navigate(eventPath(event.id, t), { replace: true })
  const counts: Record<Tab, number | null> = {
    members: event.members.length,
    expenses: event.expenses.length,
    settle: null,
  }

  const commit = () => {
    dispatch({ type: 'renameEvent', eventId: event.id, name })
    setEditing(false)
  }

  const props = { event, dispatch, goTab }

  return (
    <>
      <nav className="topbar">
        <Link to="/">← イベント一覧</Link>
      </nav>
      <header className="event-header">
        {editing ? (
          <input
            className="title-input"
            aria-label="イベント名"
            value={name}
            maxLength={30}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <h1>
            <button
              type="button"
              className="title-button"
              aria-label="イベント名を変更"
              onClick={() => {
                setName(event.name)
                setEditing(true)
              }}
            >
              {event.name} <span aria-hidden="true">✎</span>
            </button>
          </h1>
        )}
      </header>

      <div className="tabs" role="tablist">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === tab} className="tab" onClick={() => goTab(t)}>
            {TAB_LABELS[t]}
            {counts[t] !== null && <span className="count">{counts[t]}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'members' && <MemberTab {...props} />}
        {tab === 'expenses' && <ExpenseTab {...props} />}
        {tab === 'settle' && <SettleTab {...props} />}
      </div>
    </>
  )
}
