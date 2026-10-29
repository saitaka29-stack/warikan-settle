import { describe, expect, it } from 'vitest'
import { calcBalances, formatSettlementText, settle, splitAmount, summarize, transferKey } from './settle'
import type { EventData, Ledger } from './types'

const members = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id.toUpperCase() }))
const all = members.map((m) => m.id)

function applyTransfers(state: Ledger) {
  const balances = calcBalances(state)
  const transfers = settle(balances)
  const after = new Map(balances.map((b) => [b.memberId, b.balance]))
  for (const t of transfers) {
    after.set(t.fromId, after.get(t.fromId)! + t.amount)
    after.set(t.toId, after.get(t.toId)! - t.amount)
  }
  return { transfers, after }
}

describe('splitAmount', () => {
  it('余りを先頭から 1 円ずつ配り、合計が一致する', () => {
    const s = splitAmount(1000, ['a', 'b', 'c'])
    expect([...s.values()]).toEqual([334, 333, 333])
  })
  it('対象者 0 人なら空', () => {
    expect(splitAmount(1000, []).size).toBe(0)
  })
})

describe('calcBalances', () => {
  it('一部参加の支払いを反映し、収支の合計が 0 になる', () => {
    const state: Ledger = {
      members,
      expenses: [
        { id: '1', title: 'ホテル', amount: 40000, payerId: 'a', participantIds: all },
        { id: '2', title: 'お酒', amount: 3001, payerId: 'b', participantIds: ['b', 'c', 'd'] },
      ],
    }
    const balances = calcBalances(state)
    expect(balances.find((b) => b.memberId === 'a')).toMatchObject({ paid: 40000, owed: 10000, balance: 30000 })
    expect(balances.reduce((s, b) => s + b.balance, 0)).toBe(0)
  })
  it('削除済みメンバーの id は無視する', () => {
    const state: Ledger = {
      members,
      expenses: [{ id: '1', title: 'x', amount: 900, payerId: 'zz', participantIds: all }],
    }
    expect(calcBalances(state).every((b) => b.balance === 0)).toBe(true)
  })
})

describe('settle', () => {
  it('精算どおりに送金すると全員 0 になり、回数は n-1 以下', () => {
    const state: Ledger = {
      members,
      expenses: [
        { id: '1', title: 'ホテル', amount: 48000, payerId: 'a', participantIds: all },
        { id: '2', title: 'レンタカー', amount: 15800, payerId: 'b', participantIds: all },
        { id: '3', title: '夕食', amount: 12345, payerId: 'c', participantIds: all },
        { id: '4', title: 'お酒', amount: 5000, payerId: 'c', participantIds: ['a', 'c', 'd'] },
        { id: '5', title: 'ガソリン', amount: 4200, payerId: 'd', participantIds: ['a', 'b'] },
      ],
    }
    const { transfers, after } = applyTransfers(state)
    expect([...after.values()].every((v) => v === 0)).toBe(true)
    expect(transfers.length).toBeLessThanOrEqual(members.length - 1)
    expect(transfers.every((t) => t.amount > 0)).toBe(true)
  })
  it('全員の収支が 0 なら送金なし', () => {
    expect(settle(calcBalances({ members, expenses: [] }))).toEqual([])
  })
})

describe('formatSettlementText', () => {
  it('名前と金額を含むテキストを作る', () => {
    const state: Ledger = {
      members: members.slice(0, 2),
      expenses: [{ id: '1', title: '昼食', amount: 2000, payerId: 'a', participantIds: ['a', 'b'] }],
    }
    const text = formatSettlementText(state, settle(calcBalances(state)))
    expect(text).toBe('【精算結果】合計 ¥2,000\nB → A：¥1,000')
  })
})

describe('formatSettlementText（イベント名つき）', () => {
  it('イベント名を見出しに入れる', () => {
    const ledger: Ledger = {
      members: members.slice(0, 2),
      expenses: [{ id: '1', title: '昼食', amount: 2000, payerId: 'a', participantIds: ['a', 'b'] }],
    }
    const text = formatSettlementText({ ...ledger, name: '沖縄旅行' }, settle(calcBalances(ledger)))
    expect(text.split('\n')[0]).toBe('【沖縄旅行の精算】合計 ¥2,000')
  })
})

describe('summarize', () => {
  const base: EventData = {
    id: 'ev',
    name: '旅行',
    createdAt: 0,
    members: members.slice(0, 3),
    expenses: [{ id: '1', title: '宿', amount: 9000, payerId: 'a', participantIds: ['a', 'b', 'c'] }],
    settled: [],
  }

  it('精算済みの数と完了状態を出す', () => {
    const s = summarize(base)
    expect(s.total).toBe(9000)
    expect(s.transfers).toHaveLength(2)
    expect(s.done).toBe(false)
    const all = summarize({ ...base, settled: s.transfers.map(transferKey) })
    expect(all.settledCount).toBe(2)
    expect(all.done).toBe(true)
  })

  it('支払いが変わって送金額が変わると、精算済みは数えない', () => {
    const settled = summarize(base).transfers.map(transferKey)
    const changed = { ...base, settled, expenses: [{ ...base.expenses[0], amount: 12000 }] }
    expect(summarize(changed).settledCount).toBe(0)
  })

  it('支払いがなければ完了扱いにしない', () => {
    expect(summarize({ ...base, expenses: [] }).done).toBe(false)
  })
})
