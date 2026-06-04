/**
 * 源管理 Slice
 *
 * 源列表（含 selected/visible/顺序等）以主进程广播的 sources:changed 为唯一真相，
 * 通过 setSources 回灌。增删/可见/选中/移动等命令由组件直接调用 window.api.obs，
 * 结果统一通过 sources:changed 回灌，本地不维护任何派生状态。
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SourceInfo } from '../../types/obs'

export interface SourcesState {
  sources: SourceInfo[]
}

const initialState: SourcesState = {
  sources: []
}

const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {
    /** 由主进程 sources:changed 事件回灌最新列表 */
    setSources(state, action: PayloadAction<SourceInfo[]>) {
      state.sources = action.payload
    },
    /** 由主进程 selection:changed 事件轻量更新选中标记（P1.3），不重排列表 */
    setSelection(state, action: PayloadAction<number | null>) {
      const selectedId = action.payload
      for (const s of state.sources) {
        s.selected = s.id === selectedId
      }
    }
  }
})

export const { setSources, setSelection } = sourcesSlice.actions
export default sourcesSlice.reducer
