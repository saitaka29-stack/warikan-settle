import { emptyStore, type EventData, type Ledger, type Store } from './types'

export const STORAGE_KEY = 'warikan-settle:v2'
export const LEGACY_STORAGE_KEY = 'warikan-settle:v1'
export const SHARE_PATH = '/share'
const HASH_PREFIX = '#s='

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')

function isLedger(v: Obj): v is Obj & Ledger {
  return (
    Array.isArray(v.members) &&
    v.members.every((m) => isObj(m) && typeof m.id === 'string' && typeof m.name === 'string') &&
    Array.isArray(v.expenses) &&
    v.expenses.every(
      (e) =>
        isObj(e) &&
        typeof e.id === 'string' &&
        typeof e.title === 'string' &&
        Number.isInteger(e.amount) &&
        (e.amount as number) > 0 &&
        typeof e.payerId === 'string' &&
        isStrArray(e.participantIds),
    )
  )
}

export function parseEvent(v: unknown): EventData | null {
  if (!isObj(v) || !isLedger(v)) return null
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return null
  if (typeof v.createdAt !== 'number' || !isStrArray(v.settled)) return null
  const { id, name, createdAt, members, expenses, settled } = v
  return { id, name, createdAt, members, expenses, settled }
}

export function parseStore(v: unknown): Store | null {
  if (!isObj(v) || v.version !== 2 || !Array.isArray(v.events)) return null
  const events = v.events.map(parseEvent)
  return events.every((e) => e !== null) ? { version: 2, events: events as EventData[] } : null
}

/** MVP 版（v1）のデータを 1 つのイベントに変換する */
export function migrateLegacy(v: unknown, id: string, now: number): EventData | null {
  if (!isObj(v) || v.version !== 1 || !isLedger(v)) return null
  if (v.members.length === 0 && v.expenses.length === 0) return null
  return { id, name: 'マイイベント', createdAt: now, members: v.members, expenses: v.expenses, settled: [] }
}

// UTF-8 対応の base64url（btoa は日本語をそのまま扱えないため）
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const bin = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function buildShareUrl(event: EventData, origin: string): string {
  return `${origin}${SHARE_PATH}${HASH_PREFIX}${toBase64Url(JSON.stringify({ version: 2, event }))}`
}

/** 共有 URL のハッシュからイベントを取り出す。v2 と MVP 版（v1）の両方に対応 */
export function decodeShare(hash: string, legacyId = 'shared-legacy', now = Date.now()): EventData | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const data: unknown = JSON.parse(fromBase64Url(hash.slice(HASH_PREFIX.length)))
    if (isObj(data) && data.version === 2) return parseEvent(data.event)
    return migrateLegacy(data, legacyId, now)
  } catch {
    return null
  }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return parseStore(JSON.parse(raw)) ?? emptyStore()
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    const migrated = legacy ? migrateLegacy(JSON.parse(legacy), crypto.randomUUID(), Date.now()) : null
    return migrated ? { version: 2, events: [migrated] } : emptyStore()
  } catch {
    return emptyStore()
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // プライベートモード等で保存できなくてもアプリは動かす
  }
}
