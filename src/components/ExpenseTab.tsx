import { useState, type FormEvent } from 'react'
import type { Expense } from '../lib/types'
import { ExpenseItem } from './ExpenseItem'
import type { TabProps } from './types'

export function ExpenseTab({ event, dispatch, goTab }: TabProps) {
  const { members, expenses } = event
  const eventId = event.id
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [payerId, setPayerId] = useState('')
  // 対象から「外した」人を持つ（既定は全員対象。後から追加したメンバーも自動で対象になる）
  const [excluded, setExcluded] = useState<string[]>([])

  const payer = members.some((m) => m.id === payerId) ? payerId : (members[0]?.id ?? '')
  const participantIds = members.map((m) => m.id).filter((id) => !excluded.includes(id))
  const amountNum = Number(amount)
  const valid = Number.isInteger(amountNum) && amountNum > 0 && payer !== '' && participantIds.length > 0

  const toggle = (id: string) =>
    setExcluded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const clear = () => {
    setEditingId(null)
    setTitle('')
    setAmount('')
    setExcluded([])
  }

  const startEdit = (e: Expense) => {
    setEditingId(e.id)
    setTitle(e.title)
    setAmount(String(e.amount))
    setPayerId(e.payerId)
    setExcluded(members.map((m) => m.id).filter((id) => !e.participantIds.includes(id)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const expense = { title: title.trim() || '支払い', amount: amountNum, payerId: payer, participantIds }
    if (editingId) dispatch({ type: 'updateExpense', eventId, expenseId: editingId, expense })
    else dispatch({ type: 'addExpense', eventId, id: crypto.randomUUID(), expense })
    clear()
  }

  const remove = (id: string) => {
    if (editingId === id) clear()
    dispatch({ type: 'removeExpense', eventId, expenseId: id })
  }

  if (members.length === 0) {
    return (
      <section className="card">
        <h2>立て替えた支払い</h2>
        <p className="hint">先にメンバーを追加してください</p>
        <button type="button" className="next" onClick={() => goTab('members')}>
          ← メンバーを追加する
        </button>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>{editingId ? '支払いを編集' : '立て替えた支払い'}</h2>
      <form className={`expense-form${editingId ? ' editing' : ''}`} onSubmit={submit}>
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
        <div className="form-actions">
          <button type="submit" className="primary" disabled={!valid}>
            {editingId ? '更新する' : '支払いを登録'}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={clear}>
              キャンセル
            </button>
          )}
        </div>
      </form>
      {expenses.length > 0 && (
        <>
          <ul className="expense-list">
            {expenses.map((e) => (
              <ExpenseItem key={e.id} ledger={event} expense={e}>
                <button type="button" className="ghost" aria-label={`${e.title}を編集`} onClick={() => startEdit(e)}>
                  編集
                </button>
                <button type="button" className="ghost" aria-label={`${e.title}を削除`} onClick={() => remove(e.id)}>
                  削除
                </button>
              </ExpenseItem>
            ))}
          </ul>
          <button type="button" className="primary next" onClick={() => goTab('settle')}>
            精算結果を見る →
          </button>
        </>
      )}
    </section>
  )
}
