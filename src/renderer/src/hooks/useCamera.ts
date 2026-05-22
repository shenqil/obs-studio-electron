/**
 * 摄像头设备管理 Hook
 */
import { useState, useCallback } from 'react'
import type { CameraDevice } from '../types/obs'

interface UseCameraReturn {
  cameras: CameraDevice[]
  isLoading: boolean
  error: string | null
  refreshCameras: () => Promise<void>
}

export function useCamera(): UseCameraReturn {
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取摄像头列表
  const refreshCameras = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const devices = await window.api.obs.getCameras()
      setCameras(devices)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cameras')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    cameras,
    isLoading,
    error,
    refreshCameras
  }
}
