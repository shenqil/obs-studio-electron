/**
 * OBS 模块对外入口
 *
 * 架构分两层：
 *   - module/  独立能力模块，互不依赖（core/scene/camera/screen/window/streaming/preview）
 *   - api/     组装业务流程，依赖 module 层
 * 基础设施：constants / logger / events / settings
 *
 * 外部只从这里导入能力。
 *
 * ⚠️ 生命周期依赖「模块被加载」：各模块在文件末尾的「事件驱动生命周期」段于模块加载时
 * 注册 obsEvents 订阅（监听 lifecycle:init / 各 *:initialized|destroyed）。若某模块未被
 * 任何路径 import，其订阅不会注册，init/destroy 链会在该处断裂。为保证全部注册，这里
 * 显式做一次 module 层的副作用导入，不依赖 api 内部恰好 import 了 '../module'。
 */
import './module'

export * from './api'
export type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  DeviceInfo,
  CreateSourceParams,
  Vec2,
  SourceInfo,
  SourceType,
  RTMPConfig,
  StreamState,
  OBSSignal
} from '../../shared/types'
