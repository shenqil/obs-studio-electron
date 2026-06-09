/**
 * [module] 屏幕（显示器）
 *
 * 职责：枚举显示器、创建屏幕采集输入源。
 * 仅返回 IInput，不负责加入场景（由 api 层组装）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import {
  SCREEN_CAPTURE_TYPE,
  SCREEN_DISPLAY_PROP,
  SOURCE_NAME_PREFIX,
  PROPERTY_TYPE_LIST
} from '../common/constants'
import type { MonitorDevice, CreateSourceParams } from '../../../shared/types'

const log = createLogger('screen')

/**
 * 获取显示器列表。
 *
 * macOS：display_capture 使用属性名 "display_uuid"，值为 UUID 字符串。
 * Windows：monitor_capture 使用属性名 "monitor_id"，值为字符串。
 *
 * 通过创建一个临时采集源、遍历其属性中的列表项来枚举，枚举完成后立即释放临时源。
 */
export function listDevices(): MonitorDevice[] {
  log.debug('Listing screen devices')
  let tempInput: osn.IInput | null = null

  try {
    tempInput = osn.InputFactory.create(SCREEN_CAPTURE_TYPE, `__temp_screen_${Date.now()}`, {})
    if (!tempInput.properties) {
      log.warn('Screen capture input has no properties')
      return []
    }

    const monitors: MonitorDevice[] = []
    let prop = tempInput.properties.first()

    while (prop) {
      if (prop.type === PROPERTY_TYPE_LIST && prop.name === SCREEN_DISPLAY_PROP) {
        const items = (prop as osn.IListProperty).details?.items ?? []
        items.forEach((item, index) => {
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

    log.info(`Found ${monitors.length} screen device(s)`)
    return monitors
  } finally {
    if (tempInput) {
      tempInput.release()
    }
  }
}

/**
 * 创建屏幕采集输入源。
 *
 * 只写设备相关 settings；name/label/type 由 api 层写入本地缓存（sourceStore），不入 OBS settings。
 * @returns 创建的输入源
 */
export function createInput(params: CreateSourceParams): osn.IInput {
  const sourceName = `${SOURCE_NAME_PREFIX.screen}${Date.now()}`
  log.debug('Creating screen input:', sourceName)
  // 属性名由 SCREEN_DISPLAY_PROP 统一管理（macOS=display_uuid / Windows=monitor_id）
  const input = osn.InputFactory.create(SCREEN_CAPTURE_TYPE, sourceName, {
    [SCREEN_DISPLAY_PROP]: params.id
  })
  log.info('Screen input created:', sourceName)
  return input
}

/**
 * 切换显示器（更新已有源的 display 设备 settings）。入参与 createInput 一致。
 */
export function switchDevice(input: osn.IInput, params: CreateSourceParams): void {
  log.info('Switching screen device to:', params.id)
  input.update({ [SCREEN_DISPLAY_PROP]: params.id })
}
