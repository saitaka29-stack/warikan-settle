import { useEffect, useReducer } from 'react'
import { ExpenseSection } from './components/ExpenseSection'
import { MemberSection } from './components/MemberSection'
import { ResultSection } from './components/ResultSection'
import { reducer } from './lib/reducer'
import { loadSaved, save, stateFromHash } from './lib/storage'
import { emptyState, type State } from './lib/types'

// 共有 URL → 保存データ → 空 の順で初期状態を決める
function init(): State {
  const shared = stateFromHash(location.hash)
  if (shared) {
    history.replaceState(null, '', location.pathname + location.search)
    return shared
  }
  return loadSaved() ?? emptyState()
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => save(state), [state])

  return (
    <main className="container">
      <header className="app-header">
        <h1>ワリカンスッキリ</h1>
        <p>立て替えを入力するだけで、最小限の送金回数で精算</p>
      </header>
      <MemberSection state={state} dispatch={dispatch} />
      <ExpenseSection state={state} dispatch={dispatch} />
      <ResultSection state={state} dispatch={dispatch} />
      <footer className="app-footer">データはこの端末のブラウザ内にのみ保存されます</footer>
    </main>
  )
}
