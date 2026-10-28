import type { Dispatch } from 'react'
import type { Action } from '../lib/reducer'
import type { State } from '../lib/types'

export type SectionProps = { state: State; dispatch: Dispatch<Action> }
