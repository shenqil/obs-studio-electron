/**
 * OBS 相关类型定义
 * 主进程和渲染进程共享
 */

// 源类型
export type SourceType = 'camera' | 'monitor' | 'window' | 'microphone' | 'media'

// 二维向量（位置 / 缩放）
export interface Vec2 {
  x: number
  y: number
}

// 设备信息基类：枚举设备统一返回 id + name
export interface DeviceInfo {
  id: string
  name: string
}

// 摄像头设备信息
export type CameraDevice = DeviceInfo

// 显示器设备信息
export type MonitorDevice = DeviceInfo

// 窗口设备信息
export type WindowDevice = DeviceInfo

// 麦克风（音频输入）设备信息
export type MicrophoneDevice = DeviceInfo

/**
 * 创建源的入参。
 * id 沿用各设备原有逻辑（摄像头 deviceId / 显示器 monitorId / 窗口 windowId）。
 * name、label（可选）连同 type 会写入源的 settings（带自定义前缀）。
 */
export interface CreateSourceParams {
  id: string
  name: string
  label?: string
}

/**
 * 源信息（场景项视角）。
 * id / visible / position / scale 取自场景项 item；
 * sourceLabel / sourceType / sourceName 取自 item.source.settings 中的自定义字段；
 * sourceId 为 item.source.name（OBS 内部源名）。
 */
export interface SourceInfo {
  id: number
  visible: boolean
  selected: boolean
  muted: boolean
  position: Vec2
  scale: Vec2
  sourceLabel: string
  sourceType: SourceType
  sourceName: string
  sourceId: string
}

// RTMP 配置
export interface RTMPConfig {
  server: string
  key: string
}

// ============================================================================
// 媒体（本地视频）播放
// ============================================================================

/**
 * 媒体源播放状态快照。
 * 主进程按选中项轮询读取并推送（media:progress），UI 据此渲染进度/音量，
 * 并根据进度是否推进自行判断播放/停止（主进程不再上报播放态）。
 * 时间单位为毫秒；volume 为 0..1 的线性增益。
 */
export interface MediaStatus {
  /** 场景项 id */
  itemId: number
  /** 总时长（毫秒），不可用时为 0 */
  duration: number
  /** 当前播放位置（毫秒） */
  currentTime: number
  /** 音量（0..1） */
  volume: number
  /** 是否循环播放 */
  looping: boolean
  /** 本地监听（回放）是否开启：true=本地有声+推流有声；false=仅推流有声 */
  monitoring: boolean
}

// 流状态
export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error'

// 源移动方向
export enum SourceMoveDirection {
  Up = 'up',
  Down = 'down',
  Top = 'top',
  Bottom = 'bottom'
}

/**
 * OBS 原生输出信号（推流/录制底层信号）。
 * - type：输出类型，如 'streaming' / 'recording'（OBS 输出种类）。
 * - signal：信号名，如 'starting' / 'start' / 'stopping' / 'stop' / 'reconnect'。
 * - code：结束/失败时的输出码（见 EOutputCode，0 表示正常）。
 * 主进程据此驱动推流状态机，再以 StreamState 形式回灌渲染进程。
 */
export interface OBSSignal {
  type: string
  signal: string
  code: number
  error?: string
}

/**
 * 预览区光标样式。
 * 取值即合法 CSS cursor，渲染层直接设到容器 style.cursor。
 * 目前用于：悬浮在选中源的 8 个缩放手柄上时给出对应的 resize 光标。
 */
export type PreviewCursor = 'default' | 'nwse-resize' | 'nesw-resize' | 'ns-resize' | 'ew-resize'

/**
 * 预览区鼠标事件类型。
 * 用于后续在预览里拖拽 / 缩放源；目前仅透传到主进程打印。
 */
export type PreviewMouseEventType =
  | 'mousedown'
  | 'mouseup'
  | 'mousemove'
  | 'mouseenter'
  | 'mouseleave'
  | 'dblclick'
  | 'wheel'

/**
 * 预览区鼠标事件负载。
 * 坐标 offsetX/offsetY 相对预览容器左上角（CSS 像素，由容器 rect 自算，
 * 不用 nativeEvent.offset 以免受子元素影响）。
 * containerWidth/Height 为容器 CSS 尺寸，供主进程换算时参考（去时序耦合）。
 * 后续结合 OBS_content_getDisplayPreviewOffset/Size 换算到画布坐标。
 */
export interface PreviewMouseEvent {
  type: PreviewMouseEventType
  offsetX: number
  offsetY: number
  containerWidth: number
  containerHeight: number
  button: number
  buttons: number
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  metaKey: boolean
  /** 仅 wheel 事件：滚轮增量 */
  deltaX?: number
  deltaY?: number
}

// IPC 通道名称
export const IPC_CHANNELS = {
  // 摄像头
  GET_CAMERAS: 'obs:getCameras',
  ADD_CAMERA: 'obs:addCamera',

  // 显示器
  GET_MONITORS: 'obs:getMonitors',
  ADD_MONITOR: 'obs:addMonitor',

  // 窗口
  GET_WINDOWS: 'obs:getWindows',
  ADD_WINDOW: 'obs:addWindow',

  // 麦克风（音频输入）
  GET_MICROPHONES: 'obs:getMicrophones',
  ADD_MICROPHONE: 'obs:addMicrophone',
  SET_MIC_VOLUME: 'obs:setMicVolume',
  GET_MIC_VOLUME: 'obs:getMicVolume',
  SWITCH_MIC_DEVICE: 'obs:switchMicDevice',

  // 本地视频（媒体源）
  ADD_MEDIA: 'obs:addMedia',
  MEDIA_PLAY: 'obs:mediaPlay',
  MEDIA_PAUSE: 'obs:mediaPause',
  MEDIA_RESTART: 'obs:mediaRestart',
  MEDIA_STOP: 'obs:mediaStop',
  MEDIA_SEEK: 'obs:mediaSeek',
  MEDIA_SET_VOLUME: 'obs:mediaSetVolume',
  MEDIA_SET_LOOPING: 'obs:mediaSetLooping',
  MEDIA_SET_MONITORING: 'obs:mediaSetMonitoring',
  GET_MEDIA_STATUS: 'obs:getMediaStatus',

  // 源管理
  GET_SOURCES: 'obs:getSources',
  REMOVE_SOURCE: 'obs:removeSource',
  SET_SOURCE_VISIBLE: 'obs:setSourceVisible',
  SET_SOURCE_MUTED: 'obs:setSourceMuted',
  MOVE_SOURCE: 'obs:moveSource',
  SELECT_SOURCE: 'obs:selectSource',
  CLEAR_SOURCE_SELECTION: 'obs:clearSourceSelection',

  // 推流
  SET_RTMP_CONFIG: 'obs:setRTMPConfig',
  GET_RTMP_CONFIG: 'obs:getRTMPConfig',
  START_STREAMING: 'obs:startStreaming',
  STOP_STREAMING: 'obs:stopStreaming',
  GET_STREAM_STATE: 'obs:getStreamState',

  // 预览
  RESIZE_PREVIEW: 'obs:resizePreview',
  SETUP_PREVIEW: 'obs:setupPreview',
  DESTROY_PREVIEW: 'obs:destroyPreview',
  PREVIEW_MOUSE_EVENT: 'obs:previewMouseEvent',

  // OBS 状态
  IS_OBS_READY: 'obs:isReady',
  OBS_READY: 'obs:ready',

  // 事件
  STREAM_STATE_CHANGED: 'obs:streamStateChanged',
  SOURCES_CHANGED: 'obs:sourcesChanged',
  SELECTION_CHANGED: 'obs:selectionChanged',
  PREVIEW_CURSOR_CHANGED: 'obs:previewCursorChanged',
  MEDIA_PROGRESS: 'obs:mediaProgress'
} as const
