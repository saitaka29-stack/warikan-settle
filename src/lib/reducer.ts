import type { EventData, Expense, Store } from './types'

type ExpenseInput = Omit<Expense, 'id'>

export type Action =
  | { type: 'createEvent'; id: string; name: string; now: number }
  | { type: 'renameEvent'; eventId: string; name: string }
  | { type: 'deleteEvent'; eventId: string }
  | { type: 'importEvent'; event: EventData }
  | { type: 'addMember'; eventId: string; id: string; name: string }
  | { type: 'renameMember'; eventId: string; memberId: string; name: string }
  | { type: 'removeMember'; eventId: string; memberId: string }
  | { type: 'addExpense'; eventId: string; id: string; expense: ExpenseInput }
  | { type: 'updateExpense'; eventId: string; expenseId: string; expense: ExpenseInput }
  | { type: 'removeExpense'; eventId: string; expenseId: string }
  | { type: 'toggleSettled'; eventId: string; key: string }

function updateEvent(store: Store, eventId: string, fn: (e: EventData) => EventData): Store {
  return { ...store, events: store.events.map((e) => (e.id === eventId ? fn(e) : e)) }
}

export function reducer(store: Store, action: Action): Store {
  switch (action.type) {
    case 'createEvent': {
      const name = action.name.trim() || '新しいイベント'
      const event: EventData = { id: action.id, name, createdAt: action.now, members: [], expenses: [], settled: [] }
      return { ...store, events: [event, ...store.events] }
    }
    case 'renameEvent': {
      const name = action.name.trim()
      return name ? updateEvent(store, action.eventId, (e) => ({ ...e, name })) : store
    }
    case 'deleteEvent':
      return { ...store, events: store.events.filter((e) => e.id !== action.eventId) }
    case 'importEvent': {
      const exists = store.events.some((e) => e.id === action.event.id)
      return exists
        ? updateEvent(store, action.event.id, () => action.event)
        : { ...store, events: [action.event, ...store.events] }
    }
    case 'addMember': {
      const name = action.name.trim()
      if (!name) return store
      return updateEvent(store, action.eventId, (e) => ({ ...e, members: [...e.members, { id: action.id, name }] }))
    }
    case 'renameMember': {
      const name = action.name.trim()
      if (!name) return store
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        members: e.members.map((m) => (m.id === action.memberId ? { ...m, name } : m)),
      }))
    }
    case 'removeMember':
      // そのメンバーが払った支払いは消し、対象者からも外す（対象者が 0 人になった支払いも消す）
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        members: e.members.filter((m) => m.id !== action.memberId),
        expenses: e.expenses
          .filter((x) => x.payerId !== action.memberId)
          .map((x) => ({ ...x, participantIds: x.participantIds.filter((id) => id !== action.memberId) }))
          .filter((x) => x.participantIds.length > 0),
      }))
    case 'addExpense':
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        expenses: [...e.expenses, { ...action.expense, id: action.id }],
      }))
    case 'updateExpense':
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        expenses: e.expenses.map((x) => (x.id === action.expenseId ? { ...action.expense, id: x.id } : x)),
      }))
    case 'removeExpense':
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        expenses: e.expenses.filter((x) => x.id !== action.expenseId),
      }))
    case 'toggleSettled':
      return updateEvent(store, action.eventId, (e) => ({
        ...e,
        settled: e.settled.includes(action.key) ? e.settled.filter((k) => k !== action.key) : [...e.settled, action.key],
      }))
  }
}
