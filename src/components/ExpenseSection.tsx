import { useState, type FormEvent } from 'react'
import { yen } from '../lib/settle'
import type { SectionProps } from './props'

export function ExpenseSection({ state, dispatch }: SectionProps) {
  const { members, expenses } = state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState('')
  // 対象から「外した」人を持つ（既定は全員対象。後から追加したメンバーも自動で対象になる）
  const [excluded, setExcluded] = useState<string[]>([])

  const name = (id: string) => members.find((m) => m.id === id)?.name ?? '?'
  const payer = members.some((m) => m.id === payerId) ? payerId : (members[0]?.id ?? '')
  const participantIds = members.map((m) => m.id).filter((id) => !excluded.includes(id))
  const amountNum = Number(amount)
  const valid = Number.isInteger(amountNum) && amountNum > 0 && payer !== '' && participantIds.length > 0

  const toggle = (id: string) =>
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    dispatch({
      type: 'addExpense',
      expense: { title: title.trim() || '支払い', amount: amountNum, payerId: payer, participantIds },
    })
    setTitle('')
    setAmount('')
    setExcluded([])
  }

  return (
    <section className="card">
      <h2>
        <span className="step">2</span>立て替えた支払い
      </h2>
      {members.length === 0 ? (
        <p className="hint">メンバーを追加すると入力できます</p>
      ) : (
        <form className="expense-form" onSubmit={add}>
          <label>
            内容
            <input placeholder="例：ホテル代" value={title} maxLength={30} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            金額（円）
            <input
              inputMode="numeric"
              placeholder="例：12000"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </label>
          <label>
            払った人
            <select value={payer} onChange={(e) => setPayerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>誰の分？（{participantIds.length}人で割る）</legend>
            <div className="checks">
              {members.map((m) => (
                <label key={m.id} className="check">
                  <input type="checkbox" checked={!excluded.includes(m.id)} onChange={() => toggle(m.id)} />
                  {m.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="primary" disabled={!valid}>
            支払いを登録
          </button>
        </form>
      )}
      {expenses.length > 0 && (
        <ul className="expense-list">
          {expenses.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.title}</strong>
                <span className="amount">{yen(e.amount)}</span>
                <div className="sub">
                  {name(e.payerId)} が立て替え ・{' '}
                  {e.participantIds.length === members.length ? '全員' : e.participantIds.map(name).join('・')}で割る
                </div>
              </div>
              <button
                type="button"
                className="ghost"
                aria-label={`${e.title}を削除`}
                onClick={() => dispatch({ type: 'removeExpense', id: e.id })}
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
