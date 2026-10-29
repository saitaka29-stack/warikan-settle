import { memberName, transferKey, yen } from '../lib/settle'
import type { EventData, Transfer } from '../lib/types'

type Props = {
  event: EventData
  transfers: Transfer[]
  /** 指定するとチェックボタンを出す（幹事用） */
  onToggle?: (key: string) => void
  /** この人が関わる送金を強調する（参加者用） */
  highlightId?: string
}

export function TransferList({ event, transfers, onToggle, highlightId }: Props) {
  if (transfers.length === 0) return <p className="hint">精算の必要はありません 🎉</p>
  return (
    <ol className="transfers">
      {transfers.map((t) => {
        const key = transferKey(t)
        const done = event.settled.includes(key)
        const mine = highlightId !== undefined && (t.fromId === highlightId || t.toId === highlightId)
        const cls = [done && 'settled', mine && 'mine', highlightId && !mine && 'dim'].filter(Boolean).join(' ')
        return (
          <li key={key} className={cls}>
            <span className="from">{memberName(event, t.fromId)}</span>
            <span className="arrow">→</span>
            <span className="to">{memberName(event, t.toId)}</span>
            <span className="amount">{yen(t.amount)}</span>
            {onToggle ? (
              <button
                type="button"
                className={`check-btn${done ? ' on' : ''}`}
                aria-pressed={done}
                aria-label={`${memberName(event, t.fromId)}から${memberName(event, t.toId)}への送金を精算済みにする`}
                onClick={() => onToggle(key)}
              >
                {done ? '✓ 済' : '未'}
              </button>
            ) : (
              done && <span className="done-mark">済</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
