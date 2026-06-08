/**
 * [api] api 层统一出口
 *
 * 这里是 OBS 模块对外暴露的全部能力，外部（IPC 等）只与此层交互。
 *
 * 生命周期编排集中在 api 层：各 domain 在自己的文件末尾「事件驱动生命周期」段订阅
 * obsEvents（lifecycle:* / *:initialized / *:destroyed），module 层只提供纯能力、不监听事件。
 * 无导出的纯编排文件（core/scene）需在此显式副作用 import，确保订阅在模块加载期注册。
 */

// 仅副作用导入：注册 core / scene 的事件驱动生命周期订阅（无函数导出，必须显式 import）。
// preview / streaming / source / media 的订阅随其函数 re-export 一并加载。
import './core'
import './scene'

// 生命周期：初始化 / 销毁 / 状态查询
export { initialize, destroy, isReady } from './lifecycle'
export type { InitializeOptions } from './lifecycle'

// 设备枚举
export { listCameras, listScreens, listWindows, listMicrophones } from './source'

// 添加源
export { addCamera, addScreen, addWindow, addMedia, addMicrophone } from './source'

// 源管理：列表 / 移动 / 可见 / 删除 / 选中
export {
  listSources,
  moveSource,
  setSourceVisible,
  setSourceMuted,
  removeSource,
  selectSource,
  clearSourceSelection
} from './source'

// 麦克风控制
export { setMicVolume, getMicVolume, switchMicDevice } from './source'

// 推流
export {
  setRTMPConfig,
  getRTMPConfig,
  startStreaming,
  stopStreaming,
  getStreamState
} from './streaming'

// 预览
export { setupPreview, resizePreview, destroyPreview } from './preview'

// 预览编辑器（鼠标事件 -> 后续拖拽/缩放源）
export { handlePreviewMouseEvent } from './editor'

// 媒体（本地视频）播放控制
export {
  play as mediaPlay,
  pause as mediaPause,
  restart as mediaRestart,
  stop as mediaStop,
  seek as mediaSeek,
  setVolume as mediaSetVolume,
  setLooping as mediaSetLooping,
  getStatus as getMediaStatus
} from './media'

// 事件订阅与移动方向枚举
export { obsEvents } from '../common/events'
export type { OBSEventMap } from '../common/events'
export { SourceMoveDirection } from '../common/constants'
