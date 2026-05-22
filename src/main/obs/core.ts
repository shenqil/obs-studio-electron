/**
 * OBS 核心模块 - 初始化和销毁
 */
import * as osn from '@shen9401/obs-studio-node'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getNativeModulePath, getAppDataPath } from '../utils'
import { setSetting } from './obs_utils'

// 信号回调类型
type SignalCallback = (signal: { type: string; code: number; error?: string }) => void

// 信号回调存储
let signalCallback: SignalCallback | null = null

// 初始化状态
let isInitialized = false

// 视频上下文
let videoContext: osn.IVideo | null = null

// 默认视频配置
export const DEFAULT_VIDEO_CONFIG = {
  fpsNum: 30,
  fpsDen: 1,
  baseWidth: 1920,
  baseHeight: 1080,
  outputWidth: 1920,
  outputHeight: 1080,
  outputFormat: 2,
  colorspace: 2,
  range: 1,
  scaleType: 3,
  fpsType: 2
}

/**
 * 获取视频配置
 */
export function getVideoConfig(): typeof DEFAULT_VIDEO_CONFIG {
  return DEFAULT_VIDEO_CONFIG
}

/**
 * 获取视频上下文
 */
export function getVideoContext(): osn.IVideo | null {
  return videoContext
}

/**
 * 创建视频上下文
 */
export function createVideoContext(name: string = 'horizontal'): osn.IVideo {
  const context = osn.VideoFactory.create()
  context.video = {
    ...DEFAULT_VIDEO_CONFIG
  }
  osn.NodeObs.OBS_service_setVideoInfo(context, name)
  return context
}

/**
 * 配置视频输出设置
 */
function configureVideo(config: typeof DEFAULT_VIDEO_CONFIG): void {
  console.log('create videoInfo')

  videoContext = osn.VideoFactory.create()
  videoContext.video = {
    ...config
  }
  osn.NodeObs.OBS_service_setVideoInfo(videoContext, 'horizontal')
}

/**
 * 配置输出设置
 */
function configureOutput(): void {
  // 设置输出模式为高级模式
  setSetting('Output', 'Mode', 'Advanced')

  // 视频编码器设置
  setSetting('Output', 'Encoder', 'obs_x264')
  setSetting('Output', 'VBitrate', 2500)
  setSetting('Output', 'Preset', 'veryfast')
  setSetting('Output', 'KeyframeInterval', 1)

  // 音频编码器设置
  setSetting('Output', 'ABitrate', 128)

  console.debug('Output configured')
}

/**
 * 初始化 OBS
 */
export function initOBSCore(): boolean {
  if (isInitialized) {
    console.warn('OBS already initialized')
    return true
  }

  console.debug('Initializing OBS core...')

  try {
    // 设置 IPC host
    osn.NodeObs.IPC.host(`obs-studio-electron-${uuidv4()}`)

    // 设置工作目录
    const obsNodePath = getNativeModulePath('@shen9401/obs-studio-node')
    console.debug('OBS node path:', obsNodePath)
    osn.NodeObs.SetWorkingDirectory(obsNodePath)

    // OBS Studio 配置和日志目录
    const obsDataPath = getAppDataPath('obs-data')
    console.debug('OBS data path:', obsDataPath)

    // 确保数据目录存在
    if (!fs.existsSync(obsDataPath)) {
      fs.mkdirSync(obsDataPath, { recursive: true })
      console.debug('Created OBS data directory:', obsDataPath)
    }

    // 参数：语言、配置和日志存储目录、应用版本
    const initResult = osn.NodeObs.OBS_API_initAPI('en-US', obsDataPath, '1.0.0')

    if (initResult !== 0) {
      const errorReasons: Record<string, string> = {
        '-2': 'DirectX could not be found on your system. Please install the latest version of DirectX.',
        '-5': 'Failed to initialize OBS. Your video drivers may be out of date.'
      }

      const errorMessage =
        errorReasons[initResult.toString()] ||
        `An unknown error #${initResult} was encountered while initializing OBS.`

      console.error('OBS init failure:', errorMessage)
      throw new Error(errorMessage)
    }

    // 连接输出信号
    osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
      if (signalCallback) {
        signalCallback({
          type: signalInfo.type || '',
          code: signalInfo.code || 0,
          error: signalInfo.error
        })
      }
    })

    // 配置视频设置
    configureVideo(DEFAULT_VIDEO_CONFIG)

    // 配置输出设置
    configureOutput()

    isInitialized = true
    console.debug('OBS core initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize OBS:', error)
    throw error
  }
}

/**
 * 关闭 OBS
 */
export function shutdownOBSCore(): void {
  if (!isInitialized) {
    return
  }

  console.debug('Shutting down OBS core...')
  try {
    osn.NodeObs.OBS_service_removeCallback()
    osn.NodeObs.IPC.disconnect()
    isInitialized = false
    console.debug('OBS core shutdown complete')
  } catch (error) {
    console.error('Error during OBS shutdown:', error)
  }
}

/**
 * 设置信号回调
 */
export function setSignalCallback(callback: SignalCallback | null): void {
  signalCallback = callback
}

/**
 * 检查是否已初始化
 */
export function isOBSInitialized(): boolean {
  return isInitialized
}
