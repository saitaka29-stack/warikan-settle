import type { ReactNode } from 'react'
import { memberName, yen } from '../lib/settle'
import type { Expense, Ledger } from '../lib/types'

export function ExpenseItem({ ledger, expense: e, children }: { ledger: Ledger; expense: Expense; children?: ReactNode }) {
  const split =
    e.participantIds.length === ledger.members.length
      ? '全員'
      : e.participantIds.map((id) => memberName(ledger, id)).join('・')
  return (
    <li>
      <div>
        <strong>{e.title}</strong>
        <span className="amount">{yen(e.amount)}</span>
        <div className="sub">
          {memberName(ledger, e.payerId)} が立て替え ・ {split}で割る
        </div>
      </div>
      {children && <div className="item-actions">{children}</div>}
    </li>
  )
}
