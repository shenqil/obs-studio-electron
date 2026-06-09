/**
 * 扬声器 Slice
 *
 * 扬声器走独立全局输出通道，是单例（非场景项，不在 sources 列表）。
 * 状态以主进程广播的 speaker:changed 为唯一真相，通过 setSpeakerState 回灌。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SpeakerState } from '../../types/obs'

export interface SpeakerSliceState {
  /** 扬声器单例状态，未创建为 null */
  state: SpeakerState | null
}

const initialState: SpeakerSliceState = {
  state: null
}

const speakerSlice = createSlice({
  name: 'speaker',
  initialState,
  reducers: {
    /** 由主进程 speaker:changed 事件回灌最新状态 */
    setSpeakerState(state, action: PayloadAction<SpeakerState | null>) {
      state.state = action.payload
    }
  }
})

export const { setSpeakerState } = speakerSlice.actions
export default speakerSlice.reducer
