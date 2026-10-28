import type { State } from './types'

export const STORAGE_KEY = 'warikan-settle:v1'
const HASH_PREFIX = '#s='

export function parseState(value: unknown): State | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (v.version !== 1 || !Array.isArray(v.members) || !Array.isArray(v.expenses)) return null
  const membersOk = v.members.every(
    (m) => typeof m?.id === 'string' && typeof m?.name === 'string',
  )
  const expensesOk = v.expenses.every(
    (e) =>
      typeof e?.id === 'string' &&
      typeof e?.title === 'string' &&
      Number.isInteger(e?.amount) &&
      e.amount > 0 &&
      typeof e?.payerId === 'string' &&
      Array.isArray(e?.participantIds) &&
      e.participantIds.every((id: unknown) => typeof id === 'string'),
  )
  return membersOk && expensesOk ? (value as State) : null
}

// UTF-8 対応の base64url
export function encodeState(state: State): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeState(encoded: string): State | null {
  try {
    const bin = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return parseState(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

export function buildShareUrl(state: State, base: string): string {
  return `${base.split('#')[0]}${HASH_PREFIX}${encodeState(state)}`
}

export function stateFromHash(hash: string): State | null {
  return hash.startsWith(HASH_PREFIX) ? decodeState(hash.slice(HASH_PREFIX.length)) : null
}

export function loadSaved(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseState(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function save(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // プライベートモード等で保存できなくてもアプリは動かす
  }
}
