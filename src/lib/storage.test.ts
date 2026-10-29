import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  buildShareUrl,
  decodeShare,
  loadStore,
  migrateLegacy,
  parseEvent,
  parseStore,
  saveStore,
} from './storage'
import type { EventData, LegacyState } from './types'

const event: EventData = {
  id: 'ev1',
  name: '沖縄旅行🌺',
  createdAt: 1700000000000,
  members: [
    { id: 'a', name: 'たろう' },
    { id: 'b', name: '花子' },
  ],
  expenses: [{ id: '1', title: '焼肉', amount: 8000, payerId: 'a', participantIds: ['a', 'b'] }],
  settled: ['b>a:4000'],
}

const legacy: LegacyState = { version: 1, members: event.members, expenses: event.expenses }

// Node 環境用の最小の localStorage
function mockLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  })
  return data
}

afterEach(() => vi.unstubAllGlobals())

describe('共有 URL', () => {
  it('日本語・絵文字を含むイベントを /share#s= で往復できる', () => {
    const url = buildShareUrl(event, 'https://example.com')
    expect(url.startsWith('https://example.com/share#s=')).toBe(true)
    expect(decodeShare(new URL(url).hash)).toEqual(event)
  })

  it('MVP 版（v1）の共有 URL も読める', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(legacy))
    const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const decoded = decodeShare(`#s=${b64}`, 'legacy-id', 123)
    expect(decoded).toMatchObject({ id: 'legacy-id', name: 'マイイベント', createdAt: 123, settled: [] })
    expect(decoded?.expenses).toEqual(legacy.expenses)
  })

  it('不正な入力は null', () => {
    expect(decodeShare('#s=!!!')).toBeNull()
    expect(decodeShare('#other')).toBeNull()
    expect(parseEvent({ ...event, expenses: [{ ...event.expenses[0], amount: 1.5 }] })).toBeNull()
    expect(parseEvent({ ...event, settled: 'x' })).toBeNull()
    expect(parseStore({ version: 1, events: [] })).toBeNull()
  })
})

describe('migrateLegacy', () => {
  it('v1 のデータを「マイイベント」に変換する', () => {
    expect(migrateLegacy(legacy, 'id', 0)).toMatchObject({ id: 'id', name: 'マイイベント', members: legacy.members })
  })
  it('空の v1 データは移行しない', () => {
    expect(migrateLegacy({ version: 1, members: [], expenses: [] }, 'id', 0)).toBeNull()
  })
})

describe('loadStore / saveStore', () => {
  it('v2 がなければ v1 から移行する', () => {
    mockLocalStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) })
    const store = loadStore()
    expect(store.events).toHaveLength(1)
    expect(store.events[0].name).toBe('マイイベント')
  })

  it('保存したものを読み戻せる（v2 が優先）', () => {
    const data = mockLocalStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) })
    saveStore({ version: 2, events: [event] })
    expect(JSON.parse(data.get(STORAGE_KEY)!).events[0].id).toBe('ev1')
    expect(loadStore().events).toEqual([event])
  })

  it('壊れたデータなら空で始める', () => {
    mockLocalStorage({ [STORAGE_KEY]: '{broken' })
    expect(loadStore()).toEqual({ version: 2, events: [] })
  })
})
