import { useEffect, useReducer } from 'react'
import { loadStore, saveStore } from './lib/storage'
import { reducer } from './lib/reducer'
import { EventPage } from './pages/EventPage'
import { SharePage } from './pages/SharePage'
import { TopPage } from './pages/TopPage'
import { navigate, useRoute } from './router'

export default function App() {
  const [store, dispatch] = useReducer(reducer, undefined, loadStore)
  const route = useRoute()
  const event = route.page === 'event' ? store.events.find((e) => e.id === route.id) : undefined
  const missing = route.page === 'notFound' || (route.page === 'event' && !event)

  useEffect(() => saveStore(store), [store])

  // 存在しない URL・削除済みイベントはトップへ
  useEffect(() => {
    if (missing) navigate('/', { replace: true })
  }, [missing])

  return (
    <main className="container">
      {route.page === 'top' && <TopPage store={store} dispatch={dispatch} />}
      {route.page === 'event' && event && <EventPage key={event.id} event={event} tab={route.tab} dispatch={dispatch} />}
      {route.page === 'share' && <SharePage store={store} dispatch={dispatch} />}
      <footer className="app-footer">データはこの端末のブラウザ内にのみ保存されます</footer>
    </main>
  )
}
