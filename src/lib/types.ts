export type Member = { id: string; name: string }

export type Expense = {
  id: string
  title: string
  /** 整数（円） */
  amount: number
  payerId: string
  participantIds: string[]
}

export type State = { version: 1; members: Member[]; expenses: Expense[] }

export type Balance = { memberId: string; paid: number; owed: number; balance: number }

export type Transfer = { fromId: string; toId: string; amount: number }

export const emptyState = (): State => ({ version: 1, members: [], expenses: [] })
