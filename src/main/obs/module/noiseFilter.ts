/**
 * [module] 噪音抑制滤镜
 *
 * 职责：为输入源创建并附加噪音抑制滤镜。无状态、不缓存。
 * 滤镜附着在 IInput 上，其释放由 api 层在删源时通过 input.filters 统一回收，
 * 故本模块不持有引用、不提供销毁逻辑。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'

const log = createLogger('noiseFilter')

/** 默认噪音抑制等级（dB），范围 -60 ~ 0，越低抑制越强 */
const DEFAULT_SUPPRESS_LEVEL = -30

/**
 * 为输入源附加噪音抑制滤镜。
 * @param input 目标输入源
 * @param suppressLevel 抑制等级（dB），默认 -30
 */
export function attach(input: osn.IInput, suppressLevel = DEFAULT_SUPPRESS_LEVEL): void {
  const filterName = `${input.name}_noise_suppress`
  log.debug('Adding noise suppress filter:', filterName)

  const filter = osn.FilterFactory.create('noise_suppress_filter', filterName)
  const settings = filter.settings
  settings['suppress_level'] = suppressLevel
  filter.update(settings)
  input.addFilter(filter)

  log.debug(`Noise suppress filter added, suppress_level=${suppressLevel}`)
}
