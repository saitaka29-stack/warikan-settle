import type { Dispatch } from 'react'
import type { Action } from '../lib/reducer'
import type { Tab } from '../lib/route'
import type { EventData } from '../lib/types'

export type TabProps = { event: EventData; dispatch: Dispatch<Action>; goTab: (tab: Tab) => void }
