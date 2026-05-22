/**
 * 源管理 Slice
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { SourceInfo } from '../../types/obs'

export interface SourcesState {
  sources: SourceInfo[]
  isLoading: boolean
  error: string | null
  initialized: boolean
}

const initialState: SourcesState = {
  sources: [],
  isLoading: false,
  error: null,
  initialized: false
}

// 获取源列表
export const fetchSources = createAsyncThunk('sources/fetchSources', async () => {
  const result = await window.api.obs.getSources()
  return result
})

// 移除源
export const removeSource = createAsyncThunk(
  'sources/removeSource',
  async (sourceName: string, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.removeSource(sourceName)
      if (!result) {
        return rejectWithValue('Failed to remove source')
      }
      return sourceName
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to remove source')
    }
  }
)

// 设置源可见性
export const setSourceVisible = createAsyncThunk(
  'sources/setSourceVisible',
  async (
    { sourceName, visible }: { sourceName: string; visible: boolean },
    { rejectWithValue }
  ) => {
    try {
      const result = await window.api.obs.setSourceVisible(sourceName, visible)
      if (!result) {
        return rejectWithValue('Failed to set source visibility')
      }
      return { sourceName, visible }
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to set source visibility')
    }
  }
)

// 上移源
export const moveSourceUp = createAsyncThunk(
  'sources/moveSourceUp',
  async (sourceName: string, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.moveSourceUp(sourceName)
      if (!result) {
        return rejectWithValue('Failed to move source up')
      }
      return sourceName
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to move source up')
    }
  }
)

// 下移源
export const moveSourceDown = createAsyncThunk(
  'sources/moveSourceDown',
  async (sourceName: string, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.moveSourceDown(sourceName)
      if (!result) {
        return rejectWithValue('Failed to move source down')
      }
      return sourceName
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to move source down')
    }
  }
)

const sourcesSlice = createSlice({
  name: 'sources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 获取源列表
      .addCase(fetchSources.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSources.fulfilled, (state, action) => {
        state.isLoading = false
        state.sources = action.payload
        state.initialized = true
      })
      .addCase(fetchSources.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch sources'
      })
      // 移除源
      .addCase(removeSource.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeSource.fulfilled, (state, action) => {
        state.isLoading = false
        state.sources = state.sources.filter((s) => s.sourceName !== action.payload)
      })
      .addCase(removeSource.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // 设置源可见性
      .addCase(setSourceVisible.fulfilled, (state, action) => {
        const { sourceName, visible } = action.payload
        const source = state.sources.find((s) => s.sourceName === sourceName)
        if (source) {
          source.visible = visible
        }
      })
      // 上移源
      .addCase(moveSourceUp.fulfilled, (state, action) => {
        const index = state.sources.findIndex((s) => s.sourceName === action.payload)
        if (index > 0) {
          const temp = state.sources[index]
          state.sources[index] = state.sources[index - 1]
          state.sources[index - 1] = temp
        }
      })
      // 下移源
      .addCase(moveSourceDown.fulfilled, (state, action) => {
        const index = state.sources.findIndex((s) => s.sourceName === action.payload)
        if (index < state.sources.length - 1) {
          const temp = state.sources[index]
          state.sources[index] = state.sources[index + 1]
          state.sources[index + 1] = temp
        }
      })
  }
})

export default sourcesSlice.reducer
