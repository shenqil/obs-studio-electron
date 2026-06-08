/**
 * OBS 常量定义
 *
 * 所有跨模块共享的常量集中在此文件，避免散落在各处。
 * 模块层与 api 层均从这里读取常量，禁止内联魔法值。
 */

// ============================================================================
// 平台
// ============================================================================

/** 当前是否运行在 macOS 平台 */
export const IS_MACOS = process.platform === 'darwin'

// ============================================================================
// 源 / 采集输入类型
// ============================================================================

/** 摄像头输入类型：macOS 使用 av_capture_input，Windows 使用 dshow_input */
export const CAMERA_INPUT_TYPE = IS_MACOS ? 'av_capture_input' : 'dshow_input'

/** 屏幕采集输入类型：macOS 使用 display_capture，Windows 使用 monitor_capture */
export const SCREEN_CAPTURE_TYPE = IS_MACOS ? 'display_capture' : 'monitor_capture'

/** 窗口采集输入类型 */
export const WINDOW_CAPTURE_TYPE = 'window_capture'

/** 麦克风（音频输入）输入类型：macOS 使用 coreaudio_input_capture，Windows 使用 wasapi_input_capture */
export const MIC_INPUT_TYPE = IS_MACOS ? 'coreaudio_input_capture' : 'wasapi_input_capture'

/** 本地视频（媒体源）输入类型 */
export const MEDIA_SOURCE_TYPE = 'ffmpeg_source'

/** 源名称前缀，用于在源列表中反推源类型 */
export const SOURCE_NAME_PREFIX = {
  camera: 'camera_',
  screen: 'monitor_',
  window: 'window_',
  microphone: 'mic_',
  media: 'media_'
} as const

// ============================================================================
// 场景 / 预览
// ============================================================================

/** 默认主场景名称 */
export const MAIN_SCENE_NAME = 'MainScene'

/** 主场景输出通道 */
export const MAIN_SCENE_OUTPUT_CHANNEL = 0

/**
 * 主过渡（transition）名称与类型。
 *
 * 选择框「闸门 2」：channel 0 必须放 transition 而不是 scene。
 * OBS 主预览通过 obs_transition_get_active_source(channel0) 取场景，
 * 若 channel0 直接是 scene 会返回 null，导致 DrawSelectedSource 整块被跳过（有画面、无框）。
 * cut_transition 为直切、无过渡动画，画面与推流表现均不变。
 */
export const MAIN_TRANSITION_NAME = 'MainTransition'
export const MAIN_TRANSITION_TYPE = 'cut_transition'

/** 预览显示的唯一 ID */
export const DISPLAY_ID = 'preview-display'

/** 预览底色：与渲染层暗色背景（#0f172a）一致，避免未对齐时出现白/黑边 */
export const PREVIEW_PADDING_RGB = { r: 15, g: 23, b: 42 }

/** 预览四周留白尺寸（设备像素），给选择框手柄留出可操作空间 */
export const PREVIEW_PADDING_SIZE = 10

// ============================================================================
// OBS 初始化参数
// ============================================================================

/** OBS 原生模块包名 */
export const OBS_NODE_MODULE = '@shen9401/obs-studio-node'

/** OBS 数据 / 日志目录名 */
export const OBS_DATA_DIR = 'obs-data'

/** OBS 初始化语言 */
export const OBS_LOCALE = 'en-US'

/** 上报给 OBS 的应用版本号 */
export const OBS_API_VERSION = '1.0.0'

/** 视频上下文名称 */
export const VIDEO_CONTEXT_NAME = 'horizontal'

/** OBS 初始化错误码对应的可读信息 */
export const OBS_INIT_ERROR_REASON: Readonly<Record<number, string>> = {
  [-2]: 'DirectX could not be found on your system. Please install the latest version of DirectX.',
  [-5]: 'Failed to initialize OBS. Your video drivers may be out of date.'
}

// ============================================================================
// 视频 / 输出 / 推流 默认配置
// ============================================================================

/**
 * 默认视频配置（1080p / 30fps）
 *
 * obs-studio-node 的枚举是 const enum，esbuild 无法跨模块内联，
 * 因此这里直接使用对应数值，注释标注原始枚举名。
 */
export const DEFAULT_VIDEO_CONFIG = {
  fpsNum: 30,
  fpsDen: 1,
  baseWidth: 1920,
  baseHeight: 1080,
  outputWidth: 1920,
  outputHeight: 1080,
  outputFormat: 2, // EVideoFormat.NV12
  colorspace: 2, // EColorSpace.CS709
  range: 1, // ERangeType.Partial
  scaleType: 3, // EScaleType.Bilinear
  fpsType: 2 // EFPSType.Fractional
}

/** 默认输出（编码器）配置，初始化时逐项写入 OBS 设置 */
export const DEFAULT_OUTPUT_SETTINGS: ReadonlyArray<{
  category: string
  parameter: string
  value: string | number
}> = [
  { category: 'Output', parameter: 'Mode', value: 'Advanced' },
  { category: 'Output', parameter: 'Encoder', value: 'obs_x264' },
  { category: 'Output', parameter: 'VBitrate', value: 2500 },
  { category: 'Output', parameter: 'Preset', value: 'veryfast' },
  // Advanced 模式下 x264 流编码器的关键帧间隔参数名为 keyint_sec（单位秒，0=自动）；
  // 旧的 KeyframeInterval 是 Simple 模式的字段，在 Advanced 模式不生效。
  { category: 'Output', parameter: 'keyint_sec', value: 1 },
  { category: 'Output', parameter: 'ABitrate', value: 128 }
]

// ============================================================================
// OBS 枚举数值（const enum 无法被 esbuild 跨模块内联，直接用数字）
// ============================================================================

/** EPropertyType.List — 属性列表类型 */
export const PROPERTY_TYPE_LIST = 6

/** ERenderingMode.OBS_MAIN_RENDERING — 主渲染模式 */
export const RENDERING_MODE_MAIN = 0

/**
 * EFaderType.Cubic — 音量推子算法（立方曲线）。
 * OBS 音量条默认用 Cubic，其 deflection（0..1）即 0%~100% 的感知音量。
 * const enum 无法被 esbuild 跨模块内联，这里直接用数值并注释原枚举名。
 */
export const FADER_TYPE_CUBIC = 0

/** 推流（Stream）设置分类与字段名 */
export const STREAM_SETTINGS = {
  category: 'Stream',
  type: 'rtmp_custom',
  typeField: 'streamType',
  serverField: 'server',
  keyField: 'key'
} as const

// ============================================================================
// 推流输出信号（OBS_service_connectOutputSignals 回调驱动状态机）
// ============================================================================

/**
 * 输出信号回调的 `type` 字段（输出种类）。我们只关心推流。
 * OBS 同一回调会同时上报 streaming / recording / replay-buffer 等输出的信号。
 */
export const OUTPUT_TYPE_STREAMING = 'streaming'

/**
 * 输出信号回调的 `signal` 字段（信号名）。
 * 推流的真实生命周期由这些信号驱动，而非 start()/stop() 调用本身：
 *   starting -> activate(start) -> ... -> stopping -> deactivate(stop)
 * 连接失败 / 中断会带非 0 的 code 一起到达 stop / 不可用信号。
 */
export const OUTPUT_SIGNAL = {
  starting: 'starting',
  start: 'start',
  activate: 'activate',
  stopping: 'stopping',
  stop: 'stop',
  deactivate: 'deactivate',
  reconnect: 'reconnect',
  reconnectSuccess: 'reconnect_success'
} as const

/** EOutputCode.Success — 输出正常结束/无错误的码值（const enum 数值拷贝）。 */
export const OUTPUT_CODE_SUCCESS = 0

// ============================================================================
// 源移动方向（从 shared/types 重导出，前后端共享）
// ============================================================================

export { SourceMoveDirection } from '../../../shared/types'
