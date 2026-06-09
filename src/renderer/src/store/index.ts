/**
 * Redux Store 配置
 */
import { configureStore } from '@reduxjs/toolkit'
import sourcesReducer from './slices/sourcesSlice'
import streamingReducer from './slices/streamingSlice'
import mediaReducer from './slices/mediaSlice'
import speakerReducer from './slices/speakerSlice'

export const store = configureStore({
  reducer: {
    sources: sourcesReducer,
    streaming: streamingReducer,
    media: mediaReducer,
    speaker: speakerReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
