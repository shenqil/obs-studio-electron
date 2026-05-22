/**
 * OBS 工具函数
 */
import * as osn from '@shen9401/obs-studio-node'

/**
 * 设置 OBS 配置项
 */
export function setSetting(category: string, parameter: string, value: string | number): void {
  let oldValue: string | number | undefined

  const settings = osn.NodeObs.OBS_settings_getSettings(category).data

  settings.forEach(
    (subCategory: { parameters: { name: string; currentValue: string | number }[] }) => {
      subCategory.parameters.forEach((param) => {
        if (param.name === parameter) {
          oldValue = param.currentValue
          param.currentValue = value
        }
      })
    }
  )

  // Saving updated settings container
  if (value !== oldValue) {
    osn.NodeObs.OBS_settings_saveSettings(category, settings)
  }
}

/**
 * 获取 OBS 配置项
 */
export function getSetting(category: string, parameter: string): string | number | undefined {
  const settings = osn.NodeObs.OBS_settings_getSettings(category).data

  for (const subCategory of settings) {
    for (const param of subCategory.parameters) {
      if (param.name === parameter) {
        return param.currentValue
      }
    }
  }

  return undefined
}
