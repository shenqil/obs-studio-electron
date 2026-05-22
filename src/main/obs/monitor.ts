/**
 * 显示器捕获源管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'
import { addSourceToScene } from './scene'
import type { MonitorDevice } from './types'

// macOS 使用 display_capture，Windows 使用 monitor_capture
const DESKTOP_CAPTURE_TYPE = process.platform === 'darwin' ? 'display_capture' : 'monitor_capture'

/**
 * 获取显示器列表
 */
export function getMonitorDevices(): MonitorDevice[] {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return []
  }

  let tempInput: osn.IInput | null = null

  try {
    tempInput = osn.InputFactory.create(
      DESKTOP_CAPTURE_TYPE,
      `__temp_monitor_enum_${Date.now()}`,
      {}
    )

    if (!tempInput?.properties) {
      return []
    }

    const monitors: MonitorDevice[] = []

    // 遍历属性
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prop: any = tempInput.properties.first()

    while (prop) {
      if (prop.type == 6 && prop.details?.items) {
        prop.details.items.forEach((item, index) => {
          const value = String(item.value ?? '')
          // 跳过 "Auto" 选项
          if (value.toLowerCase() === 'auto') return

          monitors.push({
            id: value,
            name: String(item.name || `显示器 ${index + 1}`)
          })
        })
        break
      }
      prop = prop.next()
    }

    return monitors
  } catch (error) {
    console.error('Failed to get monitor devices:', error)
    return []
  } finally {
    try {
      tempInput?.release()
    } catch {
      // ignore
    }
  }
}

/**
 * 添加显示器捕获源
 */
export function addMonitorSource(monitorId: string): string | null {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return null
  }

  try {
    const sourceName = `monitor_${Date.now()}`

    const source = osn.InputFactory.create(DESKTOP_CAPTURE_TYPE, sourceName, {
      monitor_id: monitorId
    })

    // 添加到场景
    const sceneItem = addSourceToScene(source)
    if (!sceneItem) {
      source.release()
      return null
    }

    console.debug('Monitor source added:', sourceName)
    return sourceName
  } catch (error) {
    console.error('Failed to add monitor source:', error)
    return null
  }
}
