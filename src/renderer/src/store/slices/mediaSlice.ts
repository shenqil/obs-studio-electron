/**
 * 媒体（本地视频）播放状态 Slice
 *
 * 以主进程广播的 media:progress 为唯一真相回灌当前选中媒体源的进度/音量。
 * status 为 null 表示当前选中项不是媒体源（或无选中），UI 据此收起媒体控制条。
 *
 * 播放态不再由主进程上报：主进程每 500ms 推一次进度，本 slice 在回灌时比较
 * currentTime 是否相对上一次推进——推进则视为播放，连续未变化（约等于 1s）则视为非播放。
 * 命令（播放/暂停/进度/音量）由组件直接调用 window.api.obs，结果通过 media:progress 回灌。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MediaStatus } from '../../types/obs'

export interface MediaState {
  status: MediaStatus | null
  /** 依据进度是否推进推断的播放态 */
  isPlaying: boolean
}

const initialState: MediaState = {
  status: null,
  isPlaying: false
}

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    /** 由主进程 media:progress 事件回灌当前媒体进度/音量，并据此推断播放态 */
    setMediaStatus(state, action: PayloadAction<MediaStatus | null>) {
      const next = action.payload

      // 收起：无媒体源选中
      if (!next) {
        state.status = null
        state.isPlaying = false
        return
      }

      const prev = state.status
      // 同一个源且进度推进 => 播放；切换源时先按未播放处理，等下一帧进度推进再点亮
      if (prev && prev.itemId === next.itemId) {
        state.isPlaying = next.currentTime !== prev.currentTime
      } else {
        state.isPlaying = false
      }

      state.status = next
    }
  }
})

export const { setMediaStatus } = mediaSlice.actions
export default mediaSlice.reducer
