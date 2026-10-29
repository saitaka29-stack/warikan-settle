import { useMemo, useSyncExternalStore } from 'react'
import { parseRoute, type Route } from './lib/route'

// ルーティングはライブラリを使わず History API で行う（CLAUDE.md 参照）
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

export function navigate(to: string, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', to)
  else {
    history.pushState(null, '', to)
    window.scrollTo(0, 0)
  }
  listeners.forEach((l) => l())
}

export function useRoute(): Route {
  const location = useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search)
  return useMemo(() => {
    const url = new URL(location, window.location.origin)
    return parseRoute(url.pathname, url.search)
  }, [location])
}
