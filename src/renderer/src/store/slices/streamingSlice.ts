/**
 * 推流管理 Slice
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { StreamState, RTMPConfig } from '../../types/obs'

export interface StreamingState {
  streamState: StreamState
  isLoading: boolean
  error: string | null
}

const initialState: StreamingState = {
  streamState: 'idle',
  isLoading: false,
  error: null
}

// 开始推流
export const startStreaming = createAsyncThunk(
  'streaming/startStreaming',
  async (_, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.startStreaming()
      if (!result) {
        return rejectWithValue('Failed to start streaming')
      }
      return result
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to start streaming')
    }
  }
)

// 停止推流
export const stopStreaming = createAsyncThunk(
  'streaming/stopStreaming',
  async (_, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.stopStreaming()
      if (!result) {
        return rejectWithValue('Failed to stop streaming')
      }
      return result
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to stop streaming')
    }
  }
)

// 设置 RTMP 配置
export const setRTMPConfig = createAsyncThunk(
  'streaming/setRTMPConfig',
  async (config: RTMPConfig, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.setRTMPConfig(config)
      if (!result) {
        return rejectWithValue('Failed to set RTMP config')
      }
      return config
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to set RTMP config')
    }
  }
)

// 获取 RTMP 配置
export const getRTMPConfig = createAsyncThunk(
  'streaming/getRTMPConfig',
  async (_, { rejectWithValue }) => {
    try {
      const result = await window.api.obs.getRTMPConfig()
      return result
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to get RTMP config')
    }
  }
)

const streamingSlice = createSlice({
  name: 'streaming',
  initialState,
  reducers: {
    setStreamState: (state, action) => {
      state.streamState = action.payload
    },
    setStreamError: (state, action) => {
      state.error = action.payload
      state.streamState = 'error'
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // 开始推流
      .addCase(startStreaming.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(startStreaming.fulfilled, (state) => {
        state.isLoading = false
        state.streamState = 'streaming'
      })
      .addCase(startStreaming.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // 停止推流
      .addCase(stopStreaming.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(stopStreaming.fulfilled, (state) => {
        state.isLoading = false
        state.streamState = 'idle'
      })
      .addCase(stopStreaming.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // 设置 RTMP 配置
      .addCase(setRTMPConfig.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const { setStreamState, setStreamError, clearError } = streamingSlice.actions
export default streamingSlice.reducer
