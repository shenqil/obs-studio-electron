/**
 * [api] 核心生命周期编排
 *
 * core 模块本身是纯能力（init/shutdown、videoContext），不监听事件。
 * 本文件把 core 接入事件驱动的生命周期链：
 *
 *   init：监听根触发 lifecycle:init → core.init() → 发出 core:initialized
 *         （携带 window + videoContext，供 scene/preview 接力，避免它们 import core）。
 *   destroy：core 是销毁链末端。core.shutdown 会销毁 videoContext，而 streaming 与 scene
 *         都持有/引用它，故必须等 scene:destroyed 且 streaming:destroyed 两者都到齐再 shutdown。
 *         用 try/finally 保证 core:destroyed 无条件发出，下游（lifecycle）不会永久挂起。
 */
import { core } from '../module'
import { obsEvents } from '../common/events'

obsEvents.on('lifecycle:init', ({ window }) => {
  // init 失败为致命错误，异常向上传播由 main 捕获；成功才发出完成事件接力下游。
  core.init()
  obsEvents.emit('core:initialized', { window, videoContext: core.getVideoContext() })
})

obsEvents.onAll(['scene:destroyed', 'streaming:destroyed'], () => {
  try {
    core.shutdown()
  } finally {
    obsEvents.emit('core:destroyed')
  }
})
