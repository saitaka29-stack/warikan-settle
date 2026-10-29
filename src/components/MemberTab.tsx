import { useState, type FormEvent } from 'react'
import type { TabProps } from './types'

export function MemberTab({ event, dispatch, goTab }: TabProps) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const eventId = event.id

  const add = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'addMember', eventId, id: crypto.randomUUID(), name })
    setName('')
  }

  const startEdit = (id: string, current: string) => {
    setEditingId(id)
    setEditName(current)
  }

  const commitEdit = () => {
    if (editingId) dispatch({ type: 'renameMember', eventId, memberId: editingId, name: editName })
    setEditingId(null)
  }

  const remove = (id: string, memberName: string) => {
    const used = event.expenses.some((e) => e.payerId === id || e.participantIds.includes(id))
    if (used && !confirm(`${memberName} さんを削除すると、関係する支払いも変更されます。削除しますか？`)) return
    dispatch({ type: 'removeMember', eventId, memberId: id })
  }

  return (
    <section className="card">
      <h2>メンバー</h2>
      <form className="row" onSubmit={add}>
        <input
          aria-label="メンバー名"
          placeholder="名前（例：たろう）"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          追加
        </button>
      </form>
      {event.members.length === 0 ? (
        <p className="hint">一緒に割り勘する人を追加しましょう（自分も含めます）</p>
      ) : (
        <>
          <ul className="chips">
            {event.members.map((m) =>
              editingId === m.id ? (
                <li key={m.id} className="chip editing">
                  <input
                    aria-label={`${m.name}の新しい名前`}
                    value={editName}
                    maxLength={20}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                </li>
              ) : (
                <li key={m.id} className="chip">
                  <button type="button" className="chip-name" aria-label={`${m.name}の名前を変更`} onClick={() => startEdit(m.id, m.name)}>
                    {m.name}
                  </button>
                  <button type="button" aria-label={`${m.name}を削除`} onClick={() => remove(m.id, m.name)}>
                    ×
                  </button>
                </li>
              ),
            )}
          </ul>
          <p className="hint">名前をタップすると変更できます</p>
        </>
      )}
      {event.members.length >= 2 && (
        <button type="button" className="primary next" onClick={() => goTab('expenses')}>
          支払いの入力へ →
        </button>
      )}
    </section>
  )
}
