export type Member = { id: string; name: string }

export type Expense = {
  id: string
  title: string
  /** 整数（円） */
  amount: number
  payerId: string
  participantIds: string[]
}

/** 精算計算に必要な部分だけ */
export type Ledger = { members: Member[]; expenses: Expense[] }

/** 1 つの旅行・飲み会。DOM の Event と衝突しないよう EventData と呼ぶ */
export type EventData = Ledger & {
  id: string
  name: string
  createdAt: number
  /** 精算済みの送金キー（transferKey）。送金内容が変わると自然に一致しなくなる */
  settled: string[]
}

export type Store = { version: 2; events: EventData[] }

export type SharePayload = { version: 2; event: EventData }

/** MVP 版（v1）の保存形式。読み込み時の移行にだけ使う */
export type LegacyState = Ledger & { version: 1 }

export type Balance = { memberId: string; paid: number; owed: number; balance: number }

export type Transfer = { fromId: string; toId: string; amount: number }

export const emptyStore = (): Store => ({ version: 2, events: [] })
