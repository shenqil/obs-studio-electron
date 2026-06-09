/**
 * [module] OBS 核心
 *
 * 职责：OBS API 的初始化 / 销毁、视频上下文与输出编码配置。
 * 该模块只依赖基础设施（constants/logger/events/settings），不依赖其它业务模块。
 */
import * as osn from '@shen9401/obs-studio-node'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getNativeModulePath, getAppDataPath } from '../../utils'
import { createLogger } from '../common/logger'
import { obsEvents } from '../common/events'
import { applyOutputSettings } from '../common/settings'
import { tryRun } from '../common/safe'
import {
  OBS_NODE_MODULE,
  OBS_DATA_DIR,
  OBS_LOCALE,
  OBS_API_VERSION,
  VIDEO_CONTEXT_NAME,
  OBS_INIT_ERROR_REASON,
  DEFAULT_VIDEO_CONFIG
} from '../common/constants'

const log = createLogger('core')

let initialized = false
let videoContext: osn.IVideo | null = null

/** 是否已完成初始化 */
export function isInitialized(): boolean {
  return initialized
}

/**
 * 原生调用前的就绪守卫：OBS 未初始化（或已销毁）时拒绝，避免裸调原生崩溃。
 * @param op 调用方操作名，用于日志
 * @returns 已就绪返回 true；未就绪记一条 warn 并返回 false
 */
export function ensureReady(op: string): boolean {
  if (!initialized) {
    log.warn(`${op}: OBS not initialized, ignored`)
    return false
  }
  return true
}

/** 获取当前视频上下文（预览等需要它进行渲染） */
export function getVideoContext(): osn.IVideo | null {
  return videoContext
}

/**
 * 初始化 OBS 核心。
 * @param videoConfig 视频配置，默认使用 DEFAULT_VIDEO_CONFIG
 */
export function init(videoConfig: osn.IVideoInfo = DEFAULT_VIDEO_CONFIG): void {
  if (initialized) {
    log.warn('Core already initialized, skip')
    return
  }

  log.info('Initializing OBS core...')

  // 1. 启动 IPC host
  const hostId = `obs-studio-electron-${uuidv4()}`
  log.debug('Starting IPC host:', hostId)
  osn.NodeObs.IPC.host(hostId)

  // 2. 设置原生模块工作目录
  const obsNodePath = getNativeModulePath(OBS_NODE_MODULE)
  log.debug('Set working directory:', obsNodePath)
  osn.NodeObs.SetWorkingDirectory(obsNodePath)

  // 3. 准备数据 / 日志目录
  const obsDataPath = getAppDataPath(OBS_DATA_DIR)
  if (!fs.existsSync(obsDataPath)) {
    fs.mkdirSync(obsDataPath, { recursive: true })
    log.debug('Created data directory:', obsDataPath)
  }
  log.debug('OBS data path:', obsDataPath)

  // 4. 初始化 OBS API
  log.debug('Calling OBS_API_initAPI...')
  const initResult = osn.NodeObs.OBS_API_initAPI(OBS_LOCALE, obsDataPath, OBS_API_VERSION)
  if (initResult !== 0) {
    const reason =
      OBS_INIT_ERROR_REASON[initResult] ?? `Unknown error #${initResult} while initializing OBS.`
    log.error('OBS_API_initAPI failed:', reason)
    throw new Error(reason)
  }
  log.debug('OBS_API_initAPI success')

  // 5. 连接输出信号 -> 转发到内部事件总线
  log.debug('Connecting output signals')
  osn.NodeObs.OBS_service_connectOutputSignals(
    (signalInfo: { type?: string; signal?: string; code?: number; error?: string }) => {
      // 完整透传 type + signal：推流状态机依赖 signal 名（starting/start/stop...），
      // 旧实现只取 type 丢掉了 signal，导致状态无法从底层信号驱动。
      obsEvents.emit('output:signal', {
        type: signalInfo.type ?? '',
        signal: signalInfo.signal ?? '',
        code: signalInfo.code ?? 0,
        error: signalInfo.error
      })
    }
  )

  // 6. 配置视频上下文
  log.debug('Creating video context:', VIDEO_CONTEXT_NAME)
  videoContext = osn.VideoFactory.create()
  videoContext.video = { ...videoConfig }
  osn.NodeObs.OBS_service_setVideoInfo(videoContext, VIDEO_CONTEXT_NAME)

  // 7. 写入默认输出 / 编码器设置
  log.debug('Applying default output settings')
  applyOutputSettings()

  initialized = true
  log.info('OBS core initialized')
}

/**
 * 销毁 OBS 核心，释放视频上下文并断开 IPC。
 */
export function shutdown(): void {
  if (!initialized) {
    log.warn('Core not initialized, skip shutdown')
    return
  }

  log.info('Shutting down OBS core...')

  log.debug('Removing output signal callback')
  tryRun('OBS_service_removeCallback', () => osn.NodeObs.OBS_service_removeCallback())

  if (videoContext) {
    tryRun('videoContext.destroy', () => videoContext!.destroy())
    videoContext = null
  }

  // 必须在断开 IPC 之前正式销毁 OBS 后端，否则后端进程/资源残留，
  // 同进程内二次 initialize 会在未销毁的后端上重复 initAPI。
  log.debug('Destroying OBS API')
  tryRun('OBS_API_destroyOBS_API', () => osn.NodeObs.OBS_API_destroyOBS_API())

  log.debug('Disconnecting IPC')
  tryRun('IPC.disconnect', () => osn.NodeObs.IPC.disconnect())

  initialized = false
  log.info('OBS core shutdown complete')
}
