import type { Balance, State, Transfer } from './types'

/** amount を participantIds で割る。余りは先頭から 1 円ずつ配り、合計を必ず一致させる */
export function splitAmount(amount: number, participantIds: string[]): Map<string, number> {
  const shares = new Map<string, number>()
  const n = participantIds.length
  if (n === 0) return shares
  const base = Math.floor(amount / n)
  const remainder = amount - base * n
  participantIds.forEach((id, i) => shares.set(id, base + (i < remainder ? 1 : 0)))
  return shares
}

export function calcBalances(state: State): Balance[] {
  const byId = new Map<string, Balance>(
    state.members.map((m) => [m.id, { memberId: m.id, paid: 0, owed: 0, balance: 0 }]),
  )
  for (const e of state.expenses) {
    const payer = byId.get(e.payerId)
    const participants = e.participantIds.filter((id) => byId.has(id))
    if (!payer || participants.length === 0) continue
    payer.paid += e.amount
    for (const [id, share] of splitAmount(e.amount, participants)) byId.get(id)!.owed += share
  }
  for (const b of byId.values()) b.balance = b.paid - b.owed
  return [...byId.values()]
}

/** 貪欲法：最大の債権者と最大の債務者を相殺していく。送金回数は最大 n-1 回 */
export function settle(balances: Balance[]): Transfer[] {
  const creditors = balances.filter((b) => b.balance > 0).map((b) => ({ id: b.memberId, rest: b.balance }))
  const debtors = balances.filter((b) => b.balance < 0).map((b) => ({ id: b.memberId, rest: -b.balance }))
  creditors.sort((a, b) => b.rest - a.rest)
  debtors.sort((a, b) => b.rest - a.rest)

  const transfers: Transfer[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].rest, creditors[j].rest)
    transfers.push({ fromId: debtors[i].id, toId: creditors[j].id, amount })
    debtors[i].rest -= amount
    creditors[j].rest -= amount
    if (debtors[i].rest === 0) i++
    if (creditors[j].rest === 0) j++
  }
  return transfers
}

export const yen = (n: number) => `${n < 0 ? '-' : ''}¥${Math.abs(n).toLocaleString('ja-JP')}`

export function formatSettlementText(state: State, transfers: Transfer[]): string {
  const name = (id: string) => state.members.find((m) => m.id === id)?.name ?? '?'
  const total = state.expenses.reduce((sum, e) => sum + e.amount, 0)
  const lines = [`【精算結果】合計 ${yen(total)}`]
  if (transfers.length === 0) lines.push('精算の必要はありません')
  for (const t of transfers) lines.push(`${name(t.fromId)} → ${name(t.toId)}：${yen(t.amount)}`)
  return lines.join('\n')
}
