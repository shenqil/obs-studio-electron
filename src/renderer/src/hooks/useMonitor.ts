/**
 * 显示器设备管理 Hook
 */
import { useState, useCallback } from 'react'
import type { MonitorDevice } from '../types/obs'

interface UseMonitorReturn {
  monitors: MonitorDevice[]
  isLoading: boolean
  error: string | null
  refreshMonitors: () => Promise<void>
}

export function useMonitor(): UseMonitorReturn {
  const [monitors, setMonitors] = useState<MonitorDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取显示器列表
  const refreshMonitors = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const devices = await window.api.obs.getMonitors()
      setMonitors(devices)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get monitors')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    monitors,
    isLoading,
    error,
    refreshMonitors
  }
}
