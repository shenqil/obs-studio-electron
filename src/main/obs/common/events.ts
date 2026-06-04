/**
 * OBS 内部事件总线
 *
 * 用类型安全的事件机制取代旧的 setSignalCallback 单一回调。
 * 各能力模块互不 import，仅通过事件 + 事件负载交换信息与编排生命周期。
 *
 * 生命周期（事件驱动、依赖有序）：
 *   - api/lifecycle 发出根触发 `lifecycle:init`（带 window）/ `lifecycle:destroy`。
 *   - 每个模块监听它「所依赖模块」的完成事件，到齐后执行自身 init/destroy，
 *     完成后再发出自己的 `*:initialized` / `*:destroyed` 事件，供下游接力。
 *   - 依赖关系是有向无环图（DAG）：init 按拓扑序、destroy 按逆拓扑序推进。
 *
 * 防互锁不变量（务必遵守）：
 *   每个生产者「无条件」发出自己的完成事件——即使自身动作是空操作或抛错
 *   （destroy 路径用 try/finally 保证）。这样任何等待方都不会永久挂起。
 */
import { EventEmitter } from 'events'
import type { BrowserWindow } from 'electron'
import type * as osn from '@shen9401/obs-studio-node'
import type {
  OBSSignal,
  StreamState,
  SourceInfo,
  PreviewCursor,
  MediaStatus
} from '../../../shared/types'

/** `lifecycle:init` 负载：根初始化触发，携带宿主窗口。 */
export interface LifecycleInitPayload {
  window: BrowserWindow
}

/**
 * `core:initialized` 负载：core 初始化完成后，把下游（scene/preview）所需的
 * 共享资源随事件一起带出，避免模块间相互 import 或引入全局可变状态。
 */
export interface CoreInitializedPayload {
  window: BrowserWindow
  videoContext: osn.IVideo | null
}

/** OBS 事件名与负载的映射表 */
export interface OBSEventMap {
  // ── 生命周期根触发（由 api/lifecycle 发出）─────────────────────────
  /** 初始化根触发：core 监听并最先初始化 */
  'lifecycle:init': LifecycleInitPayload
  /** 销毁根触发：streaming/preview/media 监听并各自开始收尾 */
  'lifecycle:destroy': void
  /** 所有关键模块（core/scene/preview）初始化完成（lifecycle 发出） */
  'lifecycle:after-init': void
  /** core 已销毁且清理完成（lifecycle 发出） */
  'lifecycle:after-destroy': void

  // ── 各模块自身的初始化/销毁完成事件（按依赖顺序驱动）──────────────
  /** OBS 核心初始化完成，携带 window + videoContext 供 scene/preview 接力 */
  'core:initialized': CoreInitializedPayload
  /** OBS 核心销毁完成 */
  'core:destroyed': void
  /** 主场景创建完成 */
  'scene:initialized': void
  /** 主场景销毁完成 */
  'scene:destroyed': void
  /** 预览上下文就绪（真正的 Display 创建仍由渲染进程触发） */
  'preview:initialized': void
  /** 预览显示已销毁 */
  'preview:destroyed': void
  /** 推流已强制停止（销毁链使用） */
  'streaming:destroyed': void
  /** 媒体进度跟踪已就绪 */
  'media:initialized': void
  /** 媒体收尾完成（停定时器、释放 Fader），场景销毁需等待它 */
  'media:destroyed': void

  // ── api 层内部命令事件（editor → source，避免 api 间直接 import）────
  /**
   * editor 请求选中某个源（等同于调用 source.selectSource(id)）。
   * source.ts 监听并执行 scene.setSelectedById + 广播 selection:changed。
   */
  'cmd:select-source': number
  /**
   * editor 请求清空选中态（等同于调用 source.clearSourceSelection()）。
   * source.ts 监听并执行 scene.clearSelection + 广播 selection:changed。
   */
  'cmd:clear-source-selection': void
  /**
   * editor 通知 source 层重新广播源列表（mouseup 后位置/尺寸已变化）。
   * source.ts 监听并调用 emitSourcesChanged()。
   */
  'cmd:emit-sources-changed': void

  // ── 业务事件 ─────────────────────────────────────────────────────
  /** OBS 原生输出信号（推流/录制底层信号） */
  'output:signal': OBSSignal
  /** 推流状态变更 */
  'stream:state': StreamState
  /** 主场景源列表发生变化（增删/排序/可见性等），负载为最新列表 */
  'sources:changed': SourceInfo[]
  /** 选中项变化（轻量）：负载为选中的场景项 id，null 表示无选中 */
  'selection:changed': number | null
  /** 预览区光标样式变更（悬浮到缩放手柄等） */
  'preview:cursor': PreviewCursor
  /** 选中媒体源的播放进度推送（null 表示当前选中项非媒体源 / 无选中） */
  'media:progress': MediaStatus | null
}

type OBSEventName = keyof OBSEventMap

/** 负载为 void 的事件名（emit 时无需传 payload） */
type VoidEventName = {
  [E in OBSEventName]: OBSEventMap[E] extends void ? E : never
}[OBSEventName]

class OBSEventBus {
  private readonly emitter = new EventEmitter()

  constructor() {
    // 源数量可能较多，放宽监听器上限，避免误报内存泄漏警告
    this.emitter.setMaxListeners(50)
  }

  on<E extends OBSEventName>(event: E, listener: (payload: OBSEventMap[E]) => void): () => void {
    this.emitter.on(event, listener)
    // 返回取消订阅函数，便于外部清理
    return () => this.emitter.off(event, listener)
  }

  once<E extends OBSEventName>(event: E, listener: (payload: OBSEventMap[E]) => void): void {
    this.emitter.once(event, listener)
  }

  off<E extends OBSEventName>(event: E, listener: (payload: OBSEventMap[E]) => void): void {
    this.emitter.off(event, listener)
  }

  /**
   * 等待给定的一组事件「各至少触发一次」后执行 listener 一次，随后自动重置以支持
   * 下一轮 init/destroy 循环。用于一个模块需要等待「多个」前置/后继模块完成的场景
   * （如 core 销毁需等 streaming/preview/scene 都已销毁）。
   *
   * 订阅在调用时立即建立，故必须在相关事件被触发之前完成注册（模块加载期）。
   * 与「每个生产者无条件发出完成事件」的不变量配合，可保证不会互锁。
   *
   * @returns 取消全部内部订阅的函数
   */
  onAll(events: OBSEventName[], listener: () => void): () => void {
    const remaining = new Set<OBSEventName>(events)
    const unsubs = events.map((event) =>
      this.on(event, () => {
        remaining.delete(event)
        if (remaining.size === 0) {
          // 先执行 listener，再重置：若 listener 内同步 emit 了 events 中的某个事件，
          // 在重置前该事件不会被计入新一轮计数，避免提前消费下一轮的竞态。
          listener()
          for (const e of events) remaining.add(e)
        }
      })
    )
    return () => unsubs.forEach((u) => u())
  }

  /** 触发带负载的事件 */
  emit<E extends Exclude<OBSEventName, VoidEventName>>(event: E, payload: OBSEventMap[E]): void
  /** 触发 void 负载的事件（无需传 payload） */
  emit<E extends VoidEventName>(event: E): void
  emit(event: OBSEventName, payload?: unknown): void {
    this.emitter.emit(event, payload)
  }

  /** 移除所有监听器（销毁时调用） */
  removeAll(): void {
    this.emitter.removeAllListeners()
  }
}

/** 全局唯一的 OBS 事件总线实例 */
export const obsEvents = new OBSEventBus()
