import { emptyState, type Expense, type State } from './types'

export type Action =
  | { type: 'addMember'; name: string }
  | { type: 'removeMember'; id: string }
  | { type: 'addExpense'; expense: Omit<Expense, 'id'> }
  | { type: 'removeExpense'; id: string }
  | { type: 'reset' }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addMember': {
      const name = action.name.trim()
      if (!name) return state
      return { ...state, members: [...state.members, { id: crypto.randomUUID(), name }] }
    }
    case 'removeMember':
      // そのメンバーが払った支払いは消し、対象者からも外す（対象者が 0 人になった支払いも消す）
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.id),
        expenses: state.expenses
          .filter((e) => e.payerId !== action.id)
          .map((e) => ({ ...e, participantIds: e.participantIds.filter((id) => id !== action.id) }))
          .filter((e) => e.participantIds.length > 0),
      }
    case 'addExpense':
      return { ...state, expenses: [...state.expenses, { ...action.expense, id: crypto.randomUUID() }] }
    case 'removeExpense':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'reset':
      return emptyState()
  }
}
