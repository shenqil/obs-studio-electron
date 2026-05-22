/**
 * Redux Store 配置
 */
import { configureStore } from '@reduxjs/toolkit'
import sourcesReducer from './slices/sourcesSlice'
import streamingReducer from './slices/streamingSlice'

export const store = configureStore({
  reducer: {
    sources: sourcesReducer,
    streaming: streamingReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
