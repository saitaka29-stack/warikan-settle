import { describe, expect, it } from 'vitest'
import { reducer, type Action } from './reducer'
import { emptyStore, type Store } from './types'

const run = (actions: Action[], store: Store = emptyStore()) => actions.reduce(reducer, store)
const ev = (s: Store) => s.events[0]

const setup = run([
  { type: 'createEvent', id: 'e1', name: ' 沖縄旅行 ', now: 1 },
  { type: 'addMember', eventId: 'e1', id: 'a', name: 'たろう' },
  { type: 'addMember', eventId: 'e1', id: 'b', name: 'はなこ' },
  { type: 'addMember', eventId: 'e1', id: 'c', name: 'けんた' },
  { type: 'addExpense', eventId: 'e1', id: 'x1', expense: { title: '宿', amount: 9000, payerId: 'a', participantIds: ['a', 'b', 'c'] } },
  { type: 'addExpense', eventId: 'e1', id: 'x2', expense: { title: '酒', amount: 3000, payerId: 'b', participantIds: ['b', 'c'] } },
])

describe('reducer', () => {
  it('イベントを作成する（名前は trim、空なら既定名、新しいものが先頭）', () => {
    expect(ev(setup)).toMatchObject({ id: 'e1', name: '沖縄旅行', createdAt: 1, settled: [] })
    const s = run([{ type: 'createEvent', id: 'e2', name: '  ', now: 2 }], setup)
    expect(s.events.map((e) => e.id)).toEqual(['e2', 'e1'])
    expect(ev(s).name).toBe('新しいイベント')
  })

  it('イベントの名前変更と削除', () => {
    expect(ev(run([{ type: 'renameEvent', eventId: 'e1', name: '北海道' }], setup)).name).toBe('北海道')
    expect(ev(run([{ type: 'renameEvent', eventId: 'e1', name: ' ' }], setup)).name).toBe('沖縄旅行')
    expect(run([{ type: 'deleteEvent', eventId: 'e1' }], setup).events).toEqual([])
  })

  it('メンバー名を変更しても支払いは id で紐づいたまま', () => {
    const s = run([{ type: 'renameMember', eventId: 'e1', memberId: 'a', name: 'タロウ' }], setup)
    expect(ev(s).members[0]).toEqual({ id: 'a', name: 'タロウ' })
    expect(ev(s).expenses[0].payerId).toBe('a')
  })

  it('メンバー削除で、その人の立替は消え、対象からも外れる', () => {
    const s = run([{ type: 'removeMember', eventId: 'e1', memberId: 'b' }], setup)
    expect(ev(s).members.map((m) => m.id)).toEqual(['a', 'c'])
    expect(ev(s).expenses).toEqual([
      { id: 'x1', title: '宿', amount: 9000, payerId: 'a', participantIds: ['a', 'c'] },
    ])
  })

  it('支払いを更新・削除できる（id は変わらない）', () => {
    const updated = run(
      [{ type: 'updateExpense', eventId: 'e1', expenseId: 'x2', expense: { title: 'お酒', amount: 4000, payerId: 'c', participantIds: ['a', 'c'] } }],
      setup,
    )
    expect(ev(updated).expenses[1]).toEqual({ id: 'x2', title: 'お酒', amount: 4000, payerId: 'c', participantIds: ['a', 'c'] })
    expect(ev(run([{ type: 'removeExpense', eventId: 'e1', expenseId: 'x1' }], setup)).expenses.map((x) => x.id)).toEqual(['x2'])
  })

  it('精算済みをトグルする', () => {
    const on = run([{ type: 'toggleSettled', eventId: 'e1', key: 'b>a:3000' }], setup)
    expect(ev(on).settled).toEqual(['b>a:3000'])
    expect(ev(run([{ type: 'toggleSettled', eventId: 'e1', key: 'b>a:3000' }], on)).settled).toEqual([])
  })

  it('取り込み：新しい id は先頭に追加、同じ id は上書き', () => {
    const imported = { ...ev(setup), id: 'e9', name: '共有された旅行' }
    expect(run([{ type: 'importEvent', event: imported }], setup).events.map((e) => e.id)).toEqual(['e9', 'e1'])
    const overwritten = run([{ type: 'importEvent', event: { ...ev(setup), name: '上書き' } }], setup)
    expect(overwritten.events).toHaveLength(1)
    expect(ev(overwritten).name).toBe('上書き')
  })
})
