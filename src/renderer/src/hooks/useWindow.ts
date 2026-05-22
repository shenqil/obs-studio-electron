/**
 * 窗口设备管理 Hook
 */
import { useState, useCallback } from 'react'
import type { WindowDevice } from '../types/obs'

interface UseWindowReturn {
  windows: WindowDevice[]
  isLoading: boolean
  error: string | null
  refreshWindows: () => Promise<void>
}

export function useWindow(): UseWindowReturn {
  const [windows, setWindows] = useState<WindowDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取窗口列表
  const refreshWindows = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const devices = await window.api.obs.getWindows()
      setWindows(devices)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get windows')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    windows,
    isLoading,
    error,
    refreshWindows
  }
}
