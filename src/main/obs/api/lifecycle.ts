/**
 * [api] 生命周期
 *
 * 不再集中编排各模块的 init/destroy，而是作为「根触发器 + 渲染进程转发器」：
 *   - initialize(): 发出根事件 `lifecycle:init`（带 window），各模块按依赖链自驱动初始化；
 *   - destroy():    发出根事件 `lifecycle:destroy`，各模块按逆依赖链自驱动销毁。
 *
 * 依赖编排完全由各模块在 common 事件总线上自行监听完成（见各 module/api 文件末尾的
 * 「事件驱动生命周期」段）。本层不 import 任何 module 的 init/destroy 函数，避免耦合顺序。
 *
 * 同步性：Node EventEmitter.emit 为同步调用，故 `emit('lifecycle:init')` 返回时，
 * 整条 init DAG 已执行完毕（core -> scene/preview -> media）；destroy 同理。
 * 因此本层在 emit 之后即可安全地置 ready 标记并通知渲染进程。
 */
import type { BrowserWindow } from 'electron'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import { IPC_CHANNELS } from '../../../shared/types'

const log = createLogger('api')

let ready = false
/**
 * 本层注册的「业务事件 -> 转发到渲染进程」订阅的取消函数集合。
 * 每次 initialize 注册、destroy 时逐个取消；只取消本层订阅，
 * 不用 obsEvents.removeAll() 以免误删各模块在模块加载期注册的生命周期订阅。
 */
let forwardingUnsubs: Array<() => void> = []

export interface InitializeOptions {
  /** 宿主窗口（必填）：用于预览渲染和事件转发 */
  window: BrowserWindow
}

/** OBS 是否已完成初始化 */
export function isReady(): boolean {
  return ready
}

/** 注册「业务事件 -> 渲染进程」转发订阅，返回取消函数集合。 */
function registerForwarding(window: BrowserWindow): Array<() => void> {
  const send = (channel: string, payload?: unknown): void => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload)
    }
  }

  return [
    // 推流状态：由 streaming 模块依据 OBS 输出信号驱动（唯一真相），这里只转发
    obsEvents.on('stream:state', (streamState) => {
      log.info(`Sending stream:state to renderer: ${streamState}`)
      send(IPC_CHANNELS.STREAM_STATE_CHANGED, streamState)
    }),
    // 源列表变化
    obsEvents.on('sources:changed', (sources) => {
      log.info(`Sending sources:changed to renderer, count: ${sources.length}`)
      send(IPC_CHANNELS.SOURCES_CHANGED, sources)
    }),
    // 选中变化（轻量）
    obsEvents.on('selection:changed', (selectedId) => {
      send(IPC_CHANNELS.SELECTION_CHANGED, selectedId)
    }),
    // 预览光标变化
    obsEvents.on('preview:cursor', (cursor) => {
      send(IPC_CHANNELS.PREVIEW_CURSOR_CHANGED, cursor)
    }),
    // 媒体播放进度
    obsEvents.on('media:progress', (status) => {
      send(IPC_CHANNELS.MEDIA_PROGRESS, status)
    }),
    // 扬声器单例状态变更
    obsEvents.on('speaker:changed', (state) => {
      send(IPC_CHANNELS.SPEAKER_CHANGED, state)
    })
  ]
}

/**
 * 初始化：发出根事件 `lifecycle:init`，各模块按依赖链自驱动初始化。
 * 预览的真正创建由渲染进程 Preview 组件挂载时触发；RTMP 配置由渲染进程启动后读取。
 */
export function initialize(options: InitializeOptions): void {
  if (ready) {
    log.warn('OBS already initialized, skip')
    return
  }

  log.info('=== OBS initialize: start ===')

  // 1. 先注册业务事件转发（在模块初始化前注册无副作用，且避免漏接首批事件）
  forwardingUnsubs = registerForwarding(options.window)

  // 2. 发出根初始化事件：core 监听并最先初始化，随后 scene/preview/media 沿依赖链接力。
  //    emit 同步执行，返回时整条 init DAG 已完成。core.init 失败会同步抛出，由 main 捕获。
  obsEvents.emit('lifecycle:init', { window: options.window })

  ready = true
  log.info('=== OBS initialize: done ===')

  // 3. 整条链已就绪：广播「全部初始化完成」与通知渲染进程
  obsEvents.emit('lifecycle:after-init')
  if (!options.window.isDestroyed()) {
    options.window.webContents.send(IPC_CHANNELS.OBS_READY)
  }
}

/**
 * 销毁：发出根事件 `lifecycle:destroy`，各模块按逆依赖链自驱动销毁。
 *
 * 先置 ready=false，避免 window-all-closed 与 before-quit 重复进入。
 * 销毁顺序由各模块的事件 join 保证（streaming/preview/media -> scene -> core），
 * 每个模块以 try/finally 无条件发出自己的 *:destroyed 事件，故不会互锁。
 */
export function destroy(): void {
  if (!ready) return
  ready = false

  log.info('=== OBS destroy: start ===')

  // 发出根销毁事件：emit 同步执行，返回时整条 destroy DAG 已完成。
  obsEvents.emit('lifecycle:destroy')

  // 仅取消本层注册的转发订阅；模块级生命周期订阅由各模块自行维护、常驻有效。
  forwardingUnsubs.forEach((unsub) => unsub())
  forwardingUnsubs = []

  log.info('=== OBS destroy: done ===')

  // 广播「销毁完成」
  obsEvents.emit('lifecycle:after-destroy')
}
