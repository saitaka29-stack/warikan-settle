import { useMemo, useState } from 'react'
import { calcBalances, formatSettlementText, settle, yen } from '../lib/settle'
import { buildShareUrl } from '../lib/storage'
import type { SectionProps } from './props'

export function ResultSection({ state, dispatch }: SectionProps) {
  const balances = useMemo(() => calcBalances(state), [state])
  const transfers = useMemo(() => settle(balances), [balances])
  const [toast, setToast] = useState('')

  const name = (id: string) => state.members.find((m) => m.id === id)?.name ?? '?'
  const total = state.expenses.reduce((sum, e) => sum + e.amount, 0)

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(message)
    } catch {
      setToast('コピーできませんでした')
    }
    setTimeout(() => setToast(''), 2000)
  }

  const reset = () => {
    if (confirm('メンバーと支払いをすべて消去します。よろしいですか？')) dispatch({ type: 'reset' })
  }

  if (state.expenses.length === 0) {
    return (
      <section className="card">
        <h2>
          <span className="step">3</span>精算結果
        </h2>
        <p className="hint">支払いを登録すると、ここに「誰が誰にいくら払うか」が表示されます</p>
      </section>
    )
  }

  return (
    <section className="card result">
      <h2>
        <span className="step">3</span>精算結果
      </h2>
      <p className="total">
        合計 <strong>{yen(total)}</strong>
        <span className="sub">／送金 {transfers.length} 回で完了</span>
      </p>

      {transfers.length === 0 ? (
        <p className="hint">精算の必要はありません 🎉</p>
      ) : (
        <ol className="transfers">
          {transfers.map((t) => (
            <li key={`${t.fromId}-${t.toId}`}>
              <span className="from">{name(t.fromId)}</span>
              <span className="arrow">→</span>
              <span className="to">{name(t.toId)}</span>
              <span className="amount">{yen(t.amount)}</span>
            </li>
          ))}
        </ol>
      )}

      <details className="balances">
        <summary>一人ずつの内訳</summary>
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>立て替え</th>
              <th>負担</th>
              <th>差額</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.memberId}>
                <td>{name(b.memberId)}</td>
                <td>{yen(b.paid)}</td>
                <td>{yen(b.owed)}</td>
                <td className={b.balance > 0 ? 'plus' : b.balance < 0 ? 'minus' : ''}>
                  {b.balance > 0 ? '+' : ''}
                  {yen(b.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div className="actions">
        <button type="button" className="primary" onClick={() => copy(formatSettlementText(state, transfers), '精算結果をコピーしました')}>
          結果をコピー
        </button>
        <button type="button" onClick={() => copy(buildShareUrl(state, location.href), '共有URLをコピーしました')}>
          共有URLをコピー
        </button>
        <button type="button" className="ghost danger" onClick={reset}>
          全リセット
        </button>
      </div>
      <div className="toast" role="status" aria-live="polite">
        {toast}
      </div>
    </section>
  )
}
