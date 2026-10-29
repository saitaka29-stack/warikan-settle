import { describe, expect, it } from 'vitest'
import { eventPath, parseRoute } from './route'

describe('parseRoute', () => {
  it('各ページを判定する', () => {
    expect(parseRoute('/', '')).toEqual({ page: 'top' })
    expect(parseRoute('/share', '')).toEqual({ page: 'share' })
    expect(parseRoute('/share/', '')).toEqual({ page: 'share' })
    expect(parseRoute('/events/abc', '?tab=settle')).toEqual({ page: 'event', id: 'abc', tab: 'settle' })
    expect(parseRoute('/nope', '')).toEqual({ page: 'notFound' })
    expect(parseRoute('/events/a/b', '')).toEqual({ page: 'notFound' })
  })
  it('tab がない・不正ならメンバータブ', () => {
    expect(parseRoute('/events/abc', '')).toMatchObject({ tab: 'members' })
    expect(parseRoute('/events/abc', '?tab=hack')).toMatchObject({ tab: 'members' })
  })
  it('eventPath と往復できる', () => {
    expect(eventPath('abc')).toBe('/events/abc')
    const [path, search = ''] = eventPath('a b', 'expenses').split('?')
    expect(parseRoute(path, `?${search}`)).toEqual({ page: 'event', id: 'a b', tab: 'expenses' })
  })
})
