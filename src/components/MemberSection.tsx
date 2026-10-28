import { useState, type FormEvent } from 'react'
import type { SectionProps } from './props'

export function MemberSection({ state, dispatch }: SectionProps) {
  const [name, setName] = useState('')

  const add = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'addMember', name })
    setName('')
  }

  const remove = (id: string, memberName: string) => {
    const used = state.expenses.some((e) => e.payerId === id || e.participantIds.includes(id))
    if (used && !confirm(`${memberName} さんを削除すると、関係する支払いも変更されます。削除しますか？`)) return
    dispatch({ type: 'removeMember', id })
  }

  return (
    <section className="card">
      <h2>
        <span className="step">1</span>メンバー
      </h2>
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
      {state.members.length === 0 ? (
        <p className="hint">まずは一緒に割り勘する人を追加しましょう</p>
      ) : (
        <ul className="chips">
          {state.members.map((m) => (
            <li key={m.id} className="chip">
              {m.name}
              <button type="button" aria-label={`${m.name}を削除`} onClick={() => remove(m.id, m.name)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
