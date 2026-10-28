import { describe, expect, it } from 'vitest'
import { buildShareUrl, decodeState, encodeState, parseState, stateFromHash } from './storage'
import type { State } from './types'

const state: State = {
  version: 1,
  members: [
    { id: 'a', name: 'たろう' },
    { id: 'b', name: '花子🌸' },
  ],
  expenses: [{ id: '1', title: '焼肉', amount: 8000, payerId: 'a', participantIds: ['a', 'b'] }],
}

describe('storage', () => {
  it('日本語・絵文字を含む状態を encode → decode で復元できる', () => {
    expect(decodeState(encodeState(state))).toEqual(state)
  })
  it('共有 URL のハッシュから復元できる', () => {
    const url = buildShareUrl(state, 'https://example.com/#old')
    expect(url.startsWith('https://example.com/#s=')).toBe(true)
    expect(stateFromHash(new URL(url).hash)).toEqual(state)
  })
  it('不正な入力は null', () => {
    expect(decodeState('!!!')).toBeNull()
    expect(stateFromHash('#other')).toBeNull()
    expect(parseState({ version: 2, members: [], expenses: [] })).toBeNull()
    expect(parseState({ ...state, expenses: [{ ...state.expenses[0], amount: 1.5 }] })).toBeNull()
  })
})
