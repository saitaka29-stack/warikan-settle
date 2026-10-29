export const TABS = ['members', 'expenses', 'settle'] as const
export type Tab = (typeof TABS)[number]

export type Route =
  | { page: 'top' }
  | { page: 'event'; id: string; tab: Tab }
  | { page: 'share' }
  | { page: 'notFound' }

export function parseRoute(pathname: string, search: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { page: 'top' }
  if (path === '/share') return { page: 'share' }
  const m = path.match(/^\/events\/([^/]+)$/)
  if (m) {
    const tab = new URLSearchParams(search).get('tab')
    return { page: 'event', id: decodeURIComponent(m[1]), tab: TABS.includes(tab as Tab) ? (tab as Tab) : 'members' }
  }
  return { page: 'notFound' }
}

export const eventPath = (id: string, tab: Tab = 'members') =>
  `/events/${encodeURIComponent(id)}${tab === 'members' ? '' : `?tab=${tab}`}`
