import { formatSettlementText, summarize, yen } from '../lib/settle'
import { buildShareUrl } from '../lib/storage'
import { BalanceTable } from './BalanceTable'
import { TransferList } from './TransferList'
import type { TabProps } from './types'
import { useToast } from './useToast'

export function SettleTab({ event, dispatch, goTab }: TabProps) {
  const { total, transfers, settledCount, done } = summarize(event)
  const toast = useToast()

  if (event.expenses.length === 0) {
    return (
      <section className="card">
        <h2>精算結果</h2>
        <p className="hint">支払いを登録すると、ここに「誰が誰にいくら払うか」が表示されます</p>
        <button type="button" className="next" onClick={() => goTab('expenses')}>
          ← 支払いを入力する
        </button>
      </section>
    )
  }

  const share = async () => {
    const url = buildShareUrl(event, window.location.origin)
    if (navigator.share) {
      try {
        await navigator.share({ title: `${event.name}の精算`, text: formatSettlementText(event, transfers), url })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    await toast.copy(url, '共有URLをコピーしました')
  }

  return (
    <section className="card result">
      <h2>精算結果</h2>
      <p className="total">
        合計 <strong>{yen(total)}</strong>
        <span className="sub">／送金 {transfers.length} 回で完了</span>
      </p>

      {done && transfers.length > 0 && <p className="banner-done">🎉 全員の精算が完了しました</p>}
      {transfers.length > 0 && (
        <p className="progress">
          精算済み {settledCount} / {transfers.length}
          <span className="sub">（送金を確認したら「未」をタップ）</span>
        </p>
      )}
      <TransferList event={event} transfers={transfers} onToggle={(key) => dispatch({ type: 'toggleSettled', eventId: event.id, key })} />

      <BalanceTable ledger={event} />

      <div className="actions">
        <button type="button" className="primary" onClick={share}>
          参加者に共有
        </button>
        <button type="button" onClick={() => toast.copy(formatSettlementText(event, transfers), '精算結果をコピーしました')}>
          結果をテキストでコピー
        </button>
      </div>
      <p className="sub note">共有リンクを知っている人は、このイベントの内容を見られます。データはサーバーには送信されません。</p>
      <div className="toast" role="status" aria-live="polite">
        {toast.message}
      </div>
    </section>
  )
}
