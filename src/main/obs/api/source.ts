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
import {
  core,
  camera,
  screen,
  windowSource,
  media,
  microphone,
  noiseFilter,
  fader,
  scene
} from '../module'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import * as sourceStore from '../common/sourceStore'
import { throttle } from '../common/utils'
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

// ============================================================================
// 设备枚举
// ============================================================================

export function listCameras(): CameraDevice[] {
  if (!core.ensureReady('listCameras')) return []
  return camera.listDevices()
}

export function listScreens(): MonitorDevice[] {
  if (!core.ensureReady('listScreens')) return []
  return screen.listDevices()
}

export function listWindows(): WindowDevice[] {
  if (!core.ensureReady('listWindows')) return []
  return windowSource.listDevices()
}

export function listMicrophones(): MicrophoneDevice[] {
  if (!core.ensureReady('listMicrophones')) return []
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

/**
 * 重新对账并广播最新源列表。
 *
 * 增删/可见/移动/静音等操作可能在短时间内密集触发，故节流到 300ms：
 * 窗口内立即发一次（leading），其余合并到窗口末尾补发一次（trailing），
 * 保证渲染端最终拿到最新列表，同时避免高频全量 listSources + IPC。
 */
export const emitSourcesChanged = throttle((): void => {
  obsEvents.emit('sources:changed', listSources())
}, 300)

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

/** 创建源后写入元数据缓存，再加入场景；返回场景项 id（失败为 null）。 */
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
  return attachToScene(input)
}

/** 添加摄像头源 */
export function addCamera(params: CreateSourceParams): number | null {
  if (!core.ensureReady('addCamera')) return null
  log.info('Add camera source:', params.id)
  const itemId = addSource(camera.createInput(params), params, 'camera')
  if (itemId !== null) {
    scene.fitItemToCanvas(itemId)
    selectSourceDelayed(itemId)
  }
  return itemId
}

/** 添加屏幕源 */
export function addScreen(params: CreateSourceParams): number | null {
  if (!core.ensureReady('addScreen')) return null
  log.info('Add screen source:', params.id)
  const itemId = addSource(screen.createInput(params), params, 'monitor')
  if (itemId !== null) {
    scene.fitItemToCanvas(itemId)
    selectSourceDelayed(itemId)
  }
  return itemId
}

/** 添加窗口源 */
export function addWindow(params: CreateSourceParams): number | null {
  if (!core.ensureReady('addWindow')) return null
  log.info('Add window source:', params.id)
  const input = windowSource.createInput(params)
  if (!input) {
    log.error('Window input creation failed:', params.id)
    return null
  }
  const itemId = addSource(input, params, 'window')
  if (itemId !== null) {
    scene.fitItemToCanvas(itemId)
    selectSourceDelayed(itemId)
  }
  return itemId
}

/** 添加本地视频（媒体）源，附加音量推子 */
export function addMedia(params: CreateSourceParams): number | null {
  if (!core.ensureReady('addMedia')) return null
  log.info('Add media source:', params.id)
  const input = media.createInput(params)
  const itemId = addSource(input, params, 'media')
  // 编排：媒体源需要音量推子（按场景项 id，删源时释放）
  if (itemId !== null && input) {
    fader.create(itemId, input)
    scene.fitItemToCanvas(itemId)
    selectSourceDelayed(itemId)
  }
  return itemId
}

/** 添加麦克风（音频输入）源，附加降噪滤镜与音量推子 */
export function addMicrophone(params: CreateSourceParams): number | null {
  if (!core.ensureReady('addMicrophone')) return null
  log.info('Add microphone source:', params.id)
  const input = microphone.createInput(params)
  if (!input) {
    log.error('Microphone input creation failed:', params.id)
    return null
  }
  const itemId = addSource(input, params, 'microphone')
  // 编排：api 聚合 module 能力（避免 module 间互相依赖）
  if (itemId !== null) {
    // 降噪滤镜附着在源上，删源时由 scene.removeById 通过 source.filters 统一回收，无需缓存
    noiseFilter.attach(input)
    // 音量推子以场景项 id 为键，删源时按 id 释放
    fader.create(itemId, input)
  }
  return itemId
}

/** 设置麦克风音量（0..1 的 deflection） */
export function setMicVolume(id: number, volume: number): boolean {
  if (!core.ensureReady('setMicVolume')) return false
  return fader.setVolume(id, volume)
}

/** 获取麦克风音量（0..1 的 deflection） */
export function getMicVolume(id: number): number {
  if (!core.ensureReady('getMicVolume')) return 1
  return fader.getVolume(id)
}

/**
 * 切换源设备：按源类型分派到对应 module 的 switchDevice，并同步更新 sourceStore 元数据。
 * 视觉源（camera/monitor/window/media）切换后重新适配画布缩放。入参与各 createX 一致。
 */
export function switchSourceDevice(id: number, params: CreateSourceParams): boolean {
  if (!core.ensureReady('switchSourceDevice')) return false
  const input = scene.findInputById(id)
  if (!input) {
    log.warn('switchSourceDevice: item not found:', id)
    return false
  }
  const type = sourceStore.get(input.name)?.type
  switch (type) {
    case 'camera':
      camera.switchDevice(input, params)
      break
    case 'monitor':
      screen.switchDevice(input, params)
      break
    case 'window':
      windowSource.switchDevice(input, params)
      break
    case 'media':
      media.switchDevice(input, params)
      break
    case 'microphone':
      microphone.switchDevice(input, params)
      break
    default:
      log.warn('switchSourceDevice: unsupported source type:', type)
      return false
  }
  // 设备切换后名称/标签可能变化，同步更新元数据缓存（按 OBS 内部源名索引）
  sourceStore.set(input.name, {
    name: params.name,
    label: params.label ?? '',
    type
  })
  // 视觉源重新适配画布并选中（音频源无画面，跳过）。
  // 切换设备后源尺寸/画面可能需要片刻才就绪，故延迟选中，确保选择框贴合新画面。
  if (type === 'camera' || type === 'monitor' || type === 'window' || type === 'media') {
    selectSourceDelayed(id)
  }
  emitSourcesChanged()
  log.info(`Switched device for item ${id} (${type}) to ${params.id}`)
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
  const ok = scene.setMutedById(id, muted)
  if (ok) {
    emitSourcesChanged()
  }
  return ok
}

let pendingSelectionTimeout: NodeJS.Timeout | null = null

/**
 * 取消待处理的延迟选中。
 */
export function cancelPendingSelection(): void {
  if (pendingSelectionTimeout) {
    clearTimeout(pendingSelectionTimeout)
    pendingSelectionTimeout = null
    log.info('Pending delayed selection cancelled')
  }
}

/**
 * 延迟 500ms 执行选中，任何新的选中请求都会取消先前的未决请求。
 */
export function selectSourceDelayed(id: number): void {
  cancelPendingSelection()
  pendingSelectionTimeout = setTimeout(() => {
    selectSource(id)
    pendingSelectionTimeout = null
  }, 500)
  log.info(`Scheduled delayed selection for source ${id} in 500ms`)
}

/**
 * 选中指定源（显示 OBS 选择框）。
 * 默认单选：会清除其它源的选中态。
 */
export function selectSource(id: number): boolean {
  cancelPendingSelection()
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
  cancelPendingSelection()
  log.info('Clear source selection')
  scene.clearSelection()
  emitSelectionChanged()
}

/**
 * 删除指定源。
 */
export function removeSource(id: number): boolean {
  cancelPendingSelection()
  log.info('Remove source:', id)
  // 先释放该源的音量推子（detach 须在源仍存活时进行）
  fader.release(id)
  // 滤镜（如降噪）随 scene.removeById 通过 source.filters 统一回收，无需在此处理
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

// ============================================================================
// 事件驱动生命周期（源附属资源的统一销毁）
// ============================================================================
//
// source 是「所有源逻辑的编排者」：在 addMedia/addMicrophone 中创建了源的音量推子（Fader），
// 因此也由本层负责销毁，保持「谁创建谁释放」的内聚。
// 滤镜（如降噪）附着在源上，由 scene 销毁场景时随源一并释放，不在此处处理。
//
// 时序约束：Fader.detach 必须在源仍存活时进行，即必须早于 scene 释放源。
// scene 的销毁要等 media:destroyed + preview:destroyed + source:destroyed 三者到齐才执行
// （见 api/scene.ts 的 onAll），故此处释放完 Fader 后无条件 emit source:destroyed，
// 用 try/finally 保证即便释放抛错也不会让 scene 的 onAll 永久挂起。

function onLifecycleDestroy(): void {
  try {
    cancelPendingSelection()
    log.debug('source: releasing all faders on lifecycle:destroy')
    fader.releaseAll()
  } finally {
    obsEvents.emit('source:destroyed')
  }
}

obsEvents.on('lifecycle:destroy', onLifecycleDestroy)
