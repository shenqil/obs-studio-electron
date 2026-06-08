/**
 * 推流管理 Slice
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { StreamState, RTMPConfig } from '../../types/obs'

export interface StreamingState {
  server: string
  key: string
  streamState: StreamState
  isLoading: boolean
  error: string | null
}

const getInitialRTMPConfig = (): { server: string; key: string } => {
  let server = localStorage.getItem('rtmp_server')
  let key = localStorage.getItem('rtmp_key')

  if (server === null || key === null) {
    server = 'rtmp://127.0.0.1:1935/live'
    key = 'test'
    localStorage.setItem('rtmp_server', server)
    localStorage.setItem('rtmp_key', key)
  }
  return { server, key }
}

const initialConfig = getInitialRTMPConfig()

const initialState: StreamingState = {
  server: initialConfig.server,
  key: initialConfig.key,
  streamState: 'idle',
  isLoading: false,
  error: null
}

export const startStreaming = createAsyncThunk(
  'streaming/startStreaming',
  async (_, { rejectWithValue }) => {
    const ok = await window.api.obs.startStreaming()
    if (!ok) return rejectWithValue('Failed to start streaming')
    return true
  }
)

export const stopStreaming = createAsyncThunk(
  'streaming/stopStreaming',
  async (_, { rejectWithValue }) => {
    const ok = await window.api.obs.stopStreaming()
    if (!ok) return rejectWithValue('Failed to stop streaming')
    return true
  }
)

/** 设置 RTMP 配置（写入 OBS + 写入 localStorage + 更新 store） */
export const setRTMPConfig = createAsyncThunk(
  'streaming/setRTMPConfig',
  async (config: RTMPConfig) => {
    localStorage.setItem('rtmp_server', config.server)
    localStorage.setItem('rtmp_key', config.key)
    await window.api.obs.setRTMPConfig(config)
    return config
  }
)

/** 从 localStorage 读取当前 RTMP 配置并同步给 OBS 后端 */
export const getRTMPConfig = createAsyncThunk('streaming/getRTMPConfig', async () => {
  let server = localStorage.getItem('rtmp_server')
  let key = localStorage.getItem('rtmp_key')

  if (server === null || key === null) {
    server = 'rtmp://127.0.0.1:1935/live'
    key = 'test'
    localStorage.setItem('rtmp_server', server)
    localStorage.setItem('rtmp_key', key)
  }

  const config = { server, key }
  await window.api.obs.setRTMPConfig(config)
  return config
})

const streamingSlice = createSlice({
  name: 'streaming',
  initialState,
  reducers: {
    setStreamState: (state, action) => {
      state.streamState = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // 设置 RTMP 配置
      .addCase(setRTMPConfig.fulfilled, (state, action) => {
        state.server = action.payload.server
        state.key = action.payload.key
      })
      // 读取 RTMP 配置
      .addCase(getRTMPConfig.fulfilled, (state, action) => {
        state.server = action.payload.server
        state.key = action.payload.key
      })
      // 开始推流：仅触发底层开始并给出即时「连接中」反馈；
      // 真正的 streaming/error/idle 由主进程依据 OBS 输出信号回灌（onStreamStateChanged）。
      .addCase(startStreaming.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.streamState = 'connecting'
      })
      .addCase(startStreaming.fulfilled, (state) => {
        state.isLoading = false
        // 不在此乐观置 'streaming'：等待信号驱动，避免「未连上就显示已推流」
      })
      .addCase(startStreaming.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.streamState = 'error'
      })
      // 停止推流：触发底层停止；状态回落 idle 同样由信号确认
      .addCase(stopStreaming.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(stopStreaming.fulfilled, (state) => {
        state.isLoading = false
        // 不在此乐观置 'idle'：等待 stop/deactivate 信号确认
      })
      .addCase(stopStreaming.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { setStreamState } = streamingSlice.actions
export default streamingSlice.reducer
