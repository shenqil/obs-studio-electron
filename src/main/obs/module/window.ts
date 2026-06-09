/**
 * [module] 窗口
 *
 * 职责：枚举可捕获窗口、创建窗口采集输入源。
 * 仅返回 IInput，不负责加入场景（由 api 层组装）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import {
  WINDOW_CAPTURE_TYPE,
  IS_MACOS,
  SOURCE_NAME_PREFIX,
  PROPERTY_TYPE_LIST
} from '../common/constants'
import type { WindowDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('window')

/**
 * 获取可捕获窗口列表。
 */
export function listDevices(): WindowDevice[] {
  log.debug('Listing window devices')
  let tempInput: osn.IInput | null = null

  try {
    tempInput = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, `__temp_window_${Date.now()}`, {})
    if (!tempInput.properties) {
      log.warn('Window capture input has no properties')
      return []
    }

    const windows: WindowDevice[] = []
    let prop = tempInput.properties.first()

    while (prop) {
      if (prop.name === 'window' && prop.type === PROPERTY_TYPE_LIST) {
        const items = (prop as osn.IListProperty).details?.items ?? []
        items.forEach((item) => {
          const value = item.value
          if (item.name && value !== -1 && value) {
            windows.push({ id: String(value), name: String(item.name) })
          }
        })
        break
      }
      prop = prop.next()
    }

    log.info(`Found ${windows.length} window device(s)`)
    return windows
  } finally {
    if (tempInput) {
      tempInput.release()
    }
  }
}

/**
 * 校验窗口采集源是否成功绑定到目标窗口（主要用于 macOS）。
 */
function isWindowBound(source: osn.IInput): boolean {
  if (!source.properties) {
    return false
  }
  let prop = source.properties.first()
  while (prop) {
    if (prop.name === 'window') {
      const value = prop.value
      return value != null && String(value) !== '0'
    }
    prop = prop.next()
  }
  return false
}

/**
 * 创建窗口采集输入源。
 *
 * 只写设备相关 settings；name/label/type 由 api 层写入本地缓存（sourceStore），不入 OBS settings。
 * macOS 下 windowId 需为数字且需要校验绑定有效性；Windows 直接使用字符串 ID。
 * @returns 创建的输入源；创建失败（无效窗口）返回 null
 */
export function createInput(params: CreateSourceParams): osn.IInput | null {
  const sourceName = `${SOURCE_NAME_PREFIX.window}${Date.now()}`
  const windowId = params.id

  if (IS_MACOS) {
    const numericId = parseInt(String(windowId ?? '').trim(), 10)
    if (Number.isNaN(numericId)) {
      log.error('Invalid macOS window ID:', windowId)
      return null
    }

    log.debug('Creating window input (macOS):', { sourceName, windowId: numericId })
    const input = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, sourceName, {
      window: numericId,
      show_cursor: true
    })

    if (!isWindowBound(input)) {
      log.error('Window not bound, releasing input:', numericId)
      input.release()
      return null
    }
    log.info('Window input created:', sourceName)
    return input
  }

  log.debug('Creating window input (win32):', { sourceName, windowId })
  const input = osn.InputFactory.create(WINDOW_CAPTURE_TYPE, sourceName, {
    window: windowId
  })
  log.info('Window input created:', sourceName)
  return input
}

/**
 * 切换窗口（更新已有源的 window 设备 settings）。入参与 createInput 一致。
 * macOS 需数字 id；Windows 直接用字符串 id。
 */
export function switchDevice(input: osn.IInput, params: CreateSourceParams): void {
  const windowId = params.id
  if (IS_MACOS) {
    const numericId = parseInt(String(windowId ?? '').trim(), 10)
    if (Number.isNaN(numericId)) {
      log.error('switchDevice: invalid macOS window ID:', windowId)
      return
    }
    log.info('Switching window (macOS) to:', numericId)
    input.update({ window: numericId, show_cursor: true })
    // 与 createInput 一致：校验是否成功绑定到目标窗口
    if (!isWindowBound(input)) {
      log.error('switchDevice: window not bound after update (macOS):', numericId)
    }
    return
  }
  log.info('Switching window (win32) to:', windowId)
  input.update({ window: windowId })
}
