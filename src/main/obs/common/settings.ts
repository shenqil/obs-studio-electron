/**
 * OBS 设置读写
 *
 * OBS 的 settings 是嵌套的 category -> subCategory -> parameters 结构，
 * 读写都需要遍历查找，这里封装的是“有逻辑”的访问，而非简单透传。
 *
 * 健壮性：OBS_settings_getSettings 在异常状态下可能返回非数组 / 空结构，
 * 故对 .data 做数组校验；setSetting 未命中目标 parameter 时不再触发无意义 save。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from './logger'

const log = createLogger('settings')

type SettingValue = string | number

interface SettingsParameter {
  name: string
  currentValue: SettingValue
}

interface SettingsSubCategory {
  parameters?: SettingsParameter[]
}

/** 读取某分类的 settings 子分类数组，结构异常时返回 null。 */
function getSubCategories(category: string): SettingsSubCategory[] | null {
  const result = osn.NodeObs.OBS_settings_getSettings(category)
  const data = result?.data
  if (!Array.isArray(data)) {
    log.warn(`OBS_settings_getSettings("${category}") returned no data array`)
    return null
  }
  return data as SettingsSubCategory[]
}

/**
 * 写入单个 OBS 设置项，仅在命中且值变化时落盘保存。
 * @returns 是否实际写入并保存
 */
export function setSetting(category: string, parameter: string, value: SettingValue): boolean {
  const settings = getSubCategories(category)
  if (!settings) {
    return false
  }

  let found = false
  let oldValue: SettingValue | undefined

  for (const subCategory of settings) {
    if (!Array.isArray(subCategory.parameters)) {
      continue
    }
    for (const param of subCategory.parameters) {
      if (param.name === parameter) {
        found = true
        oldValue = param.currentValue
        param.currentValue = value
      }
    }
  }

  // 未命中目标参数：不触发无意义的 save
  if (!found) {
    log.warn(`setSetting: parameter "${parameter}" not found in category "${category}", skip save`)
    return false
  }

  if (value === oldValue) {
    return false
  }

  osn.NodeObs.OBS_settings_saveSettings(category, settings)
  return true
}

/**
 * 读取单个 OBS 设置项的当前值，未命中或结构异常返回 undefined。
 */
export function getSetting(category: string, parameter: string): SettingValue | undefined {
  const settings = getSubCategories(category)
  if (!settings) {
    return undefined
  }

  for (const subCategory of settings) {
    if (!Array.isArray(subCategory.parameters)) {
      continue
    }
    for (const param of subCategory.parameters) {
      if (param.name === parameter) {
        return param.currentValue
      }
    }
  }

  return undefined
}
