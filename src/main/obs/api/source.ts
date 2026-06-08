/**
 * [api] 源管理
 *
 * 组装“枚举设备 / 创建输入源 / 加入主场景 / 列表查询 / 排序/可见/选中/删除”等流程。
 * 设备模块只产出 IInput；加入场景、读取自定义属性、广播事件由本层完成。
 *
 * 顺序维护：以 scene.getItems 的真实顺序为准（下标 0 = 底层），对外列表反转后顶层在前。
 * moveSource 基于当前真实顺序重排后用 mainScene.orderItems 同步到 OBS。
 * 任何导致 scene.getItems 内容变化的操作，都会重新广播最新列表（sources:changed）。
 */
import * as osn from '@shen9401/obs-studio-node'
import { core, camera, screen, windowSource, media, microphone, fader, scene } from '../module'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import * as sourceStore from '../common/sourceStore'
import { SourceMoveDirection } from '../common/constants'
import type {
  CameraDevice,
  MonitorDevice,
  WindowDevice,
  MicrophoneDevice,
  SourceInfo,
  SourceType,
  CreateSourceParams
} from '../../../shared/types'

const log = createLogger('api')

/** 原生调用前的就绪守卫：OBS 未初始化（或已销毁）时拒绝，避免裸调原生崩溃。 */
function ensureReady(op: string): boolean {
  if (!core.isInitialized()) {
    log.warn(`${op}: OBS not initialized, ignored`)
    return false
  }
  return true
}

// ============================================================================
// 设备枚举
// ============================================================================

export function listCameras(): CameraDevice[] {
  if (!ensureReady('listCameras')) return []
  return camera.listDevices()
}

export function listScreens(): MonitorDevice[] {
  if (!ensureReady('listScreens')) return []
  return screen.listDevices()
}

export function listWindows(): WindowDevice[] {
  if (!ensureReady('listWindows')) return []
  return windowSource.listDevices()
}

export function listMicrophones(): MicrophoneDevice[] {
  if (!ensureReady('listMicrophones')) return []
  return microphone.listDevices()
}

// ============================================================================
// 列表读取 / 事件广播
// ============================================================================

/** 将单个场景项映射为对外的 SourceInfo。 */
function toSourceInfo(item: osn.ISceneItem): SourceInfo {
  const position = item.position
  const scale = item.scale
  const sourceId = item.source?.name ?? ''
  // name/label/type 直接读本地缓存（创建源时写入），避免回读 OBS settings 的跨进程 IPC
  const meta = sourceStore.get(sourceId)
  if (!meta) {
    // 理论上不应发生（addSource 先写缓存再入场景），若触发说明时序或清理有问题
    log.warn('toSourceInfo: sourceStore miss for source:', sourceId)
  }

  return {
    id: item.id,
    visible: item.visible,
    selected: item.selected,
    muted: item.source?.muted ?? false,
    position: { x: position.x, y: position.y },
    scale: { x: scale.x, y: scale.y },
    sourceLabel: meta?.label ?? '',
    sourceType: meta?.type ?? 'camera',
    sourceName: meta?.name ?? '',
    sourceId
  }
}

/**
 * 获取当前主场景的源列表，顶层在前。
 */
export function listSources(): SourceInfo[] {
  log.debug('Listing sources in main scene')
  return scene.getItems().map(toSourceInfo).reverse()
}

/** 重新对账并广播最新源列表。 */
export function emitSourcesChanged(): void {
  obsEvents.emit('sources:changed', listSources())
}

/** 广播轻量的选中变化：只发选中 id，渲染端本地更新 selected 标记。 */
function emitSelectionChanged(): void {
  obsEvents.emit('selection:changed', scene.getSelectedItemId())
}

// ============================================================================
// 添加源（创建输入 -> 写元数据缓存 -> 加入场景 -> 广播）
// ============================================================================

/**
 * 将输入源加入主场景，失败时释放输入并清理缓存；成功返回场景项 id。
 * 缓存在 attach 前由调用方写入，attach 失败需回滚。
 */
function attachToScene(input: osn.IInput): number | null {
  const item = scene.addInput(input)
  if (!item) {
    log.error('Failed to attach input to scene, releasing:', input.name)
    sourceStore.remove(input.name) // 回滚缓存
    input.release()
    return null
  }

  emitSourcesChanged()
  log.info('Source added to scene, item id:', item.id)
  return item.id
}

/** 创建源后写入元数据缓存，再加入场景。 */
function addSource(
  input: osn.IInput | null,
  params: CreateSourceParams,
  type: SourceType
): number | null {
  if (!input) {
    return null
  }
  // name/label/type 只进本地缓存，不写 OBS settings
  sourceStore.set(input.name, {
    name: params.name,
    label: params.label ?? '',
    type
  })
  const itemId = attachToScene(input)
  // 目前仅媒体源需要音量控制：按场景项 id 创建 Fader（删源时释放）
  if (itemId !== null && type === 'media') {
    fader.create(itemId, input)
  }
  return itemId
}

/** 添加摄像头源 */
export function addCamera(params: CreateSourceParams): number | null {
  if (!ensureReady('addCamera')) return null
  log.info('Add camera source:', params.id)
  return addSource(camera.createInput(params), params, 'camera')
}

/** 添加屏幕源 */
export function addScreen(params: CreateSourceParams): number | null {
  if (!ensureReady('addScreen')) return null
  log.info('Add screen source:', params.id)
  return addSource(screen.createInput(params), params, 'monitor')
}

/** 添加窗口源 */
export function addWindow(params: CreateSourceParams): number | null {
  if (!ensureReady('addWindow')) return null
  log.info('Add window source:', params.id)
  const input = windowSource.createInput(params)
  if (!input) {
    log.error('Window input creation failed:', params.id)
    return null
  }
  return addSource(input, params, 'window')
}

/** 添加本地视频（媒体）源 */
export function addMedia(params: CreateSourceParams): number | null {
  if (!ensureReady('addMedia')) return null
  log.info('Add media source:', params.id)
  return addSource(media.createInput(params), params, 'media')
}

/** 添加麦克风（音频输入）源，自动附加推子和降噪滤镜 */
export function addMicrophone(params: CreateSourceParams): number | null {
  if (!ensureReady('addMicrophone')) return null
  log.info('Add microphone source:', params.id)
  const input = microphone.createInput(params)
  if (!input) {
    log.error('Microphone input creation failed:', params.id)
    return null
  }
  // name/label/type 只进本地缓存
  sourceStore.set(input.name, {
    name: params.name,
    label: params.label ?? '',
    type: 'microphone'
  })
  const itemId = attachToScene(input)
  // 麦克风需要音量推子
  if (itemId !== null) {
    fader.create(itemId, input)
  }
  return itemId
}

/** 设置麦克风音量（0..1 的 deflection） */
export function setMicVolume(id: number, volume: number): boolean {
  if (!ensureReady('setMicVolume')) return false
  return fader.setVolume(id, volume)
}

/** 获取麦克风音量（0..1 的 deflection） */
export function getMicVolume(id: number): number {
  if (!ensureReady('getMicVolume')) return 1
  return fader.getVolume(id)
}

/** 切换麦克风设备 */
export function switchMicDevice(id: number, deviceId: string): boolean {
  if (!ensureReady('switchMicDevice')) return false
  const input = scene.findInputById(id)
  if (!input) {
    log.warn('switchMicDevice: item not found:', id)
    return false
  }
  microphone.switchDevice(input, deviceId)
  log.info(`Switched mic device for item ${id} to ${deviceId}`)
  return true
}

// ============================================================================
// 源操作（统一以场景项 id 为键）
// ============================================================================

/**
 * 移动指定源在场景中的层级，基于当前真实顺序重排后整体下发。
 */
export function moveSource(id: number, direction: SourceMoveDirection): boolean {
  const orderedIds = scene
    .getItems()
    .map((item) => item.id)
    .reverse()

  const index = orderedIds.indexOf(id)
  if (index === -1) {
    log.warn('moveSource: id not found in order list:', id)
    return false
  }

  const next = [...orderedIds]
  next.splice(index, 1)
  switch (direction) {
    case SourceMoveDirection.Up:
      next.splice(Math.max(0, index - 1), 0, id)
      break
    case SourceMoveDirection.Down:
      next.splice(Math.min(next.length, index + 1), 0, id)
      break
    case SourceMoveDirection.Top:
      next.unshift(id)
      break
    case SourceMoveDirection.Bottom:
      next.push(id)
      break
  }

  scene.orderItems(next)
  emitSourcesChanged()
  log.info(`Move source ${direction}:`, id)
  return true
}

/**
 * 设置源可见性（显示/隐藏）。
 */
export function setSourceVisible(id: number, visible: boolean): boolean {
  log.info(`Set source visible=${visible}:`, id)
  const ok = scene.setVisibleById(id, visible)
  if (ok) {
    emitSourcesChanged()
  }
  return ok
}

/**
 * 设置源静音状态。
 */
export function setSourceMuted(id: number, muted: boolean): boolean {
  log.info(`Set source muted=${muted}:`, id)
  const input = scene.findInputById(id)
  if (!input) {
    log.warn('setSourceMuted: source not found:', id)
    return false
  }
  input.muted = muted
  emitSourcesChanged()
  return true
}

/**
 * 选中指定源（显示 OBS 选择框）。
 * 默认单选：会清除其它源的选中态。
 */
export function selectSource(id: number): boolean {
  log.info('Select source:', id)
  const ok = scene.setSelectedById(id, true)
  if (ok) {
    emitSelectionChanged()
  }
  return ok
}

/**
 * 清空选中态（隐藏选择框）。
 */
export function clearSourceSelection(): void {
  log.info('Clear source selection')
  scene.clearSelection()
  emitSelectionChanged()
}

/**
 * 删除指定源。
 */
export function removeSource(id: number): boolean {
  log.info('Remove source:', id)
  // 先释放该源的音量 Fader（detach 需在源仍存活时进行）
  fader.release(id)
  // removeById 返回被删源的 OBS 内部名，省去额外的 findItem 查询
  const sourceName = scene.removeById(id)
  if (!sourceName) {
    return false
  }
  sourceStore.remove(sourceName) // 清理元数据缓存
  emitSourcesChanged()
  return true
}

// ============================================================================
// api 层内部命令事件订阅（接收 editor 发来的请求，解除 api 间直接 import）
// ============================================================================
//
// editor.ts 通过 obsEvents.emit('cmd:*') 发出命令，由此处统一处理，
// 保持「源管理」逻辑内聚在 source.ts，同时满足 api 层不互相 import 的架构约定。

obsEvents.on('cmd:select-source', (id) => {
  selectSource(id)
})

obsEvents.on('cmd:clear-source-selection', () => {
  clearSourceSelection()
})

obsEvents.on('cmd:emit-sources-changed', () => {
  emitSourcesChanged()
})
