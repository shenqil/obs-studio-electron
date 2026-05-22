import * as osn from '@shen9401/obs-studio-node'
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { getNativeModulePath, getAppDataPath } from './utils'

// 信号处理
const signals = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next: (signalInfo: any) => {
    console.debug('OBS signal:', signalInfo)
    // 这里可以处理 OBS 的各种信号
    switch (signalInfo.type) {
      case 'streaming_starting':
        console.log('Streaming starting...')
        break
      case 'streaming_started':
        console.log('Streaming started!')
        break
      case 'streaming_stopping':
        console.log('Streaming stopping...')
        break
      case 'streaming_stopped':
        console.log('Streaming stopped.')
        break
      case 'recording_starting':
        console.log('Recording starting...')
        break
      case 'recording_started':
        console.log('Recording started!')
        break
      case 'recording_stopping':
        console.log('Recording stopping...')
        break
      case 'recording_stopped':
        console.log('Recording stopped.')
        break
      case 'error':
        console.error('OBS error:', signalInfo)
        break
    }
  }
}

// 初始化 OBS
export function initOBS(): void {
  console.debug('Initializing OBS...')

  // 设置 IPC host
  osn.NodeObs.IPC.host(`obs-studio-electron-${uuidv4()}`)

  // 设置工作目录
  const obsNodePath = getNativeModulePath('@shen9401/obs-studio-node')
  console.debug('OBS node path:', obsNodePath)
  osn.NodeObs.SetWorkingDirectory(obsNodePath)

  // OBS Studio 配置和日志目录
  // 使用应用数据目录
  const obsDataPath = getAppDataPath('obs-data')
  console.debug('OBS data path:', obsDataPath)

  // 确保数据目录存在
  try {
    if (!fs.existsSync(obsDataPath)) {
      fs.mkdirSync(obsDataPath, { recursive: true })
      console.debug('Created OBS data directory:', obsDataPath)
    }
  } catch (error) {
    console.warn('Failed to create OBS data directory:', error)
  }

  // 参数：语言、配置和日志存储目录、应用版本
  const initResult = osn.NodeObs.OBS_API_initAPI('en-US', obsDataPath, '1.0.0')

  if (initResult !== 0) {
    const errorReasons: Record<string, string> = {
      '-2': 'DirectX could not be found on your system. Please install the latest version of DirectX for your machine here <https://www.microsoft.com/en-us/download/details.aspx?id=35?> and try again.',
      '-5': 'Failed to initialize OBS. Your video drivers may be out of date, or Streamlabs OBS may not be supported on your system.',
    }

    const errorMessage = errorReasons[initResult.toString()] ||
      `An unknown error #${initResult} was encountered while initializing OBS.`

    console.error('OBS init failure', errorMessage)
    throw new Error(errorMessage)
  }

  // 连接输出信号
  osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
    signals.next(signalInfo)
  })

  console.debug('OBS initialized successfully')
}

// 关闭 OBS
export function shutdownOBS(): void {
  console.debug('Shutting down OBS...')
  try {
    osn.NodeObs.OBS_service_removeCallback()
    osn.NodeObs.IPC.disconnect()
    console.debug('OBS shutdown complete')
  } catch (error) {
    console.error('Error during OBS shutdown:', error)
  }
}

