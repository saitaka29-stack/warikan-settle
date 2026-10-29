import { calcBalances, memberName, yen } from '../lib/settle'
import type { Ledger } from '../lib/types'

export function BalanceTable({ ledger }: { ledger: Ledger }) {
  return (
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
          {calcBalances(ledger).map((b) => (
            <tr key={b.memberId}>
              <td>{memberName(ledger, b.memberId)}</td>
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
  )
}
