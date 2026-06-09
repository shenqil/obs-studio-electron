/**
 * 通用设备列表 Hook
 *
 * 取代 useCamera / useMonitor / useWindow 三个几乎一致的 hook，
 * 根据 DeviceKind 从设备目录读取枚举方法，统一管理 loading / error / 列表状态。
 */
import { useState, useEffect, useCallback } from 'react'
import type { DeviceInfo } from '@renderer/types/obs'
import { DEVICE_CATALOG, type DeviceKind } from '@renderer/lib/deviceCatalog'

interface UseDeviceListReturn {
  devices: DeviceInfo[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDeviceList(kind: DeviceKind): UseDeviceListReturn {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      setDevices(await DEVICE_CATALOG[kind].list())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setIsLoading(false)
    }
  }, [kind])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { devices, isLoading, error, refresh }
}
