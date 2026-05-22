/**
 * 窗口捕获源管理模块
 */
import * as osn from '@shen9401/obs-studio-node'
import { isOBSInitialized } from './core'
import { addSourceToScene } from './scene'
import type { WindowDevice } from './types'

const WINDOW_CAPTURE_TYPE = 'window_capture'

/**
 * 获取可捕获的窗口列表
 */
export function getWindowDevices(): WindowDevice[] {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return []
  }

  let tempInput: osn.IInput | null = null

  try {
    // macOS：创建时传入 { window: '' }，遍历属性找到 type 为列表的 window 项
    tempInput = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, `__temp_window_enum_${Date.now()}`, {})

    if (!tempInput?.properties) {
      return []
    }

    const windows: WindowDevice[] = []

    // 遍历属性
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prop: any = tempInput.properties.first()

    while (prop) {
      // type 6 表示列表类型属性
      if (prop.name === 'window' && prop.type === 6 && prop.details?.items) {
        prop.details.items.forEach((item: { name?: string; value?: number | string }) => {
          const name = item.name
          const nameStr = String(name ?? '')
          const value = item.value

          if (name && value !== -1 && value) {
            windows.push({
              id: String(value),
              name: nameStr
            })
          }
        })
        break
      }
      prop = prop.next()
    }

    return windows
  } catch (error) {
    console.error('Failed to get window devices:', error)
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
 * 检查窗口是否有效绑定
 */
function windowBindCheck(source: osn.IInput | null): boolean {
  if (!source?.properties) {
    return false
  }

  let prop = source.properties.first()

  while (prop) {
    if (prop.name === 'window') {
      const winVal = prop.value
      if (winVal == null || String(winVal) === '0') {
        return false
      }
      return true
    }
    prop = prop.next()
  }

  return false
}

/**
 * 添加窗口捕获源
 * @param windowId 窗口ID
 * @param sourceName 可选的源名称
 */
export function addWindowSource(windowId: string, sourceName?: string): string | null {
  if (!isOBSInitialized()) {
    console.error('OBS not initialized')
    return null
  }

  let windowCapture: osn.IInput | null = null

  try {
    const isMacOS = process.platform === 'darwin'
    const name = sourceName || `window_${Date.now()}`

    if (isMacOS) {
      // macOS：windowId 需要转换为数字
      const windowSetting = parseInt(String(windowId ?? '').trim(), 10)

      if (Number.isNaN(windowSetting)) {
        console.error(`Invalid window ID: ${windowId}`)
        return null
      }

      windowCapture = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, name, {
        window: windowSetting,
        show_cursor: true
      })

      // 验证窗口是否有效绑定
      const bind = windowBindCheck(windowCapture)
      if (!bind) {
        console.error(`Invalid window: ${windowSetting}`)
        windowCapture.release()
        return null
      }
    } else {
      // Windows：直接使用 windowId 字符串
      windowCapture = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, name, {
        window: windowId
      })
    }

    // 添加到场景
    const sceneItem = addSourceToScene(windowCapture)
    if (!sceneItem) {
      windowCapture.release()
      return null
    }

    console.debug('Window source added:', name)
    return name
  } catch (error) {
    console.error('Failed to add window source:', error)
    if (windowCapture) {
      try {
        windowCapture.release()
      } catch {
        // ignore
      }
    }
    return null
  }
}
