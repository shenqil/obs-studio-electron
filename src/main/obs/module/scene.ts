/**
 * [module] 场景
 *
 * 职责：主场景的创建/销毁，以及场景项（item）的增删、可见性、层级排序、查询、选中。
 * 该模块自持有主场景状态，操作的是外部传入的 IInput，不感知源是摄像头/窗口/屏幕。
 * 对外操作统一以「场景项 id（number）」为键，由 api 层维护顺序与广播事件。
 *
 * 选择框相关（详见 constants 中 MAIN_TRANSITION_* 注释）：
 *   - 闸门 2：channel 0 放 transition（包裹 scene），而非直接放 scene。
 *   - 闸门 3：每个场景项创建后 `item.video = previewVideoContext`，对齐预览 Display 的 canvas。
 *   - 闸门 4：`item.selected = true` 才会绘制选择框。
 */
import * as osn from '@shen9401/obs-studio-node'
import { createLogger } from '../common/logger'
import { tryRun } from '../common/safe'
import * as sourceStore from '../common/sourceStore'
import {
  MAIN_SCENE_NAME,
  MAIN_SCENE_OUTPUT_CHANNEL,
  MAIN_TRANSITION_NAME,
  MAIN_TRANSITION_TYPE
} from '../common/constants'
import type { SourceType } from '../../../shared/types'

const log = createLogger('scene')

/**
 * 可在预览里交互（选中/拖拽/缩放）的源类型——仅视觉源。
 * 麦克风/扬声器等音频源没有画面，不参与预览交互。
 */
const VISUAL_SOURCE_TYPES: ReadonlySet<SourceType> = new Set<SourceType>([
  'camera',
  'monitor',
  'window',
  'media'
])

let mainScene: osn.IScene | null = null
let mainTransition: osn.ITransition | null = null

/**
 * 选中项包围盒缓存。
 * hover 找手柄每帧都要选中项的 rect，但 hover 期间该 rect 不变；
 * 故惰性计算后缓存，任何可能改变它的场景变更（选中/可见/位置/缩放/增删）都置 null 失效。
 */
type Rect = { left: number; top: number; right: number; bottom: number }
let selectedRectCache: Rect | null | undefined // undefined = 未计算；null = 无选中

/** 选中项几何可能变化时调用，使缓存失效。 */
function invalidateSelectedRect(): void {
  selectedRectCache = undefined
}

/**
 * 预览用的视频上下文（闸门 3）。
 * 由 createMainScene 传入，与预览 Display 使用同一个 context，
 * 使 item 的 canvas 与 Display 的 canvas 指针一致，DrawSelectedSource 才不会跳过。
 */
let previewVideoContext: osn.IVideo | null = null

/** 获取主场景（未初始化返回 null） */
export function getMainScene(): osn.IScene | null {
  return mainScene
}

/**
 * 按场景项 id 查找场景项（ISceneItem）。
 * obs-studio-node 对不存在的 id 抛 "Source not found." 而非返回 null，
 * 此方法统一 try/catch 处理，未找到返回 null。
 */
export function findItemById(id: number): osn.ISceneItem | null {
  try {
    const item = mainScene?.findItem(id)
    return item ?? null
  } catch {
    // obs-studio-node throws "Source not found." when the item no longer
    // exists in the scene instead of returning null. Treat that as not found.
    return null
  }
}

/**
 * 按场景项 id 取底层输入源（IInput）。
 * 场景项的 source 对输入源而言即 IInput，这里统一向上转型，供需要调用
 * 输入源专有方法（如媒体的 play/seek）的 api 层使用。未找到返回 null。
 */
export function findInputById(id: number): osn.IInput | null {
  const item = findItemById(id)
  const source = item?.source
  if (!source) {
    return null
  }
  return source as osn.IInput
}

/**
 * 判断场景项是否为可交互的视觉源（camera/monitor/window/media）。
 * 读源元数据缓存（零跨进程 IPC），音频源（麦克风/扬声器）返回 false。
 * 供 hitTest 内部过滤掉不可交互的音频源。
 */
function isVisualItem(id: number): boolean {
  const input = findInputById(id)
  if (!input) {
    return false
  }
  const type = sourceStore.get(input.name)?.type
  return type !== undefined && VISUAL_SOURCE_TYPES.has(type)
}

/**
 * 把场景项对齐到预览 canvas（闸门 3）。
 * 经验证此赋值不会把源从推流 mix 剔除，仅作为「画框」用的 canvas 标记。
 */
function alignItemCanvas(item: osn.ISceneItem): void {
  if (!previewVideoContext) {
    return
  }
  item.video = previewVideoContext
}

/**
 * 创建主场景，并通过 cut_transition 设置为输出源。
 *
 * 闸门 2：channel 0 放 transition（active source = scene），而非直接放 scene。
 * 闸门 3：传入预览 Display 用的 videoContext，使后续 addInput 的 item 对齐同一 canvas。
 *
 * @param videoContext 预览视频上下文（与预览 Display 同一个）
 */
export function createMainScene(videoContext: osn.IVideo | null = null): osn.IScene {
  previewVideoContext = videoContext
  selectedRectCache = undefined
  log.info('Creating main scene:', MAIN_SCENE_NAME)
  mainScene = osn.SceneFactory.create(MAIN_SCENE_NAME)

  // 闸门 2：用 cut_transition 包裹场景挂到 channel 0
  log.debug('Creating main transition:', MAIN_TRANSITION_TYPE)
  mainTransition = osn.TransitionFactory.create(MAIN_TRANSITION_TYPE, MAIN_TRANSITION_NAME)
  mainTransition.set(mainScene)
  osn.Global.setOutputSource(MAIN_SCENE_OUTPUT_CHANNEL, mainTransition)
  log.debug('Main transition set as output channel', MAIN_SCENE_OUTPUT_CHANNEL)

  return mainScene
}

/** 获取主场景内的所有场景项（按 z-order，顶层在前） */
export function getItems(): osn.ISceneItem[] {
  if (!mainScene) {
    log.warn('getItems called before scene created')
    return []
  }
  return mainScene.getItems()
}

/**
 * 按给定顺序重排场景项（order[0] 为最底层，与 obs_scene_enum_items 同向）。
 * @returns 是否成功
 */
export function orderItems(order: number[]): boolean {
  if (!mainScene) {
    log.warn('orderItems called before scene created')
    return false
  }
  const ok = tryRun('orderItems', () => mainScene!.orderItems(order))
  invalidateSelectedRect()
  return ok
}

/**
 * 计算场景项在画布坐标系下的轴对齐包围盒。
 *
 * 说明：当前不处理旋转（rot），按未旋转的矩形近似——满足「点击选中」的小目标；
 * 旋转命中后续做拖拽/缩放时再补。
 *
 * - boundsType 非 None 时，尺寸取 bounds，定位用 boundsAlignment；
 * - 否则尺寸 = (源尺寸 - 裁剪) * scale，定位用 alignment。
 * alignment 位：Left=1 / Right=2 / Top=4 / Bottom=8 / Center=0。
 */
function getItemRect(
  item: osn.ISceneItem
): { left: number; top: number; right: number; bottom: number } | null {
  const ti = item.transformInfo
  if (!ti) {
    return null
  }

  let width: number
  let height: number
  let align: number

  // EBoundsType.None = 0；obs 的 const enum 无法被 esbuild 跨模块内联，这里直接用数值。
  // 用 Number() 取值后比较，避免 TS 对 const enum 字面量的窄化误报。
  const boundsType = Number(ti.boundsType)
  if (boundsType !== 0) {
    width = ti.bounds.x
    height = ti.bounds.y
    align = ti.boundsAlignment
  } else {
    const src = item.source
    const crop = item.crop
    const cropW = (src?.width ?? 0) - (crop?.left ?? 0) - (crop?.right ?? 0)
    const cropH = (src?.height ?? 0) - (crop?.top ?? 0) - (crop?.bottom ?? 0)
    width = cropW * ti.scale.x
    height = cropH * ti.scale.y
    align = ti.alignment
  }

  if (width <= 0 || height <= 0) {
    return null
  }

  // 按 alignment 把锚点 pos 解析成左上角
  let left: number
  if (align & 1)
    left = ti.pos.x // Left
  else if (align & 2)
    left = ti.pos.x - width // Right
  else left = ti.pos.x - width / 2 // Center

  let top: number
  if (align & 4)
    top = ti.pos.y // Top
  else if (align & 8)
    top = ti.pos.y - height // Bottom
  else top = ti.pos.y - height / 2 // Center

  return { left, top, right: left + width, bottom: top + height }
}

/**
 * 命中检测：返回画布坐标 (x, y) 处 z 轴最上层、可见且命中的场景项 id。
 * 没有命中返回 null。
 *
 * 注意：getItems()（= obs_scene_enum_items，从 first_item 起遍历）是「底层在前」的倒序，
 * first_item 为 z 轴最底层、数组末尾才是最顶层。因此从尾部往前遍历，第一个命中即最上层。
 */
/**
 * 命中检测：返回画布坐标 (x, y) 处 z 轴最上层、可见且命中的场景项 id。
 * 没有命中返回 null。
 *
 * 注意：getItems()（= obs_scene_enum_items，从 first_item 起遍历）是「底层在前」的倒序，
 * first_item 为 z 轴最底层、数组末尾才是最顶层。因此从尾部往前遍历，第一个命中即最上层。
 *
 * 仅命中可交互的视觉源（camera/monitor/window/media）；音频源（麦克风/扬声器）无画面，跳过。
 */
export function hitTest(x: number, y: number): number | null {
  if (!mainScene) {
    return null
  }
  const items = mainScene.getItems()
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (!item.visible) {
      continue
    }
    if (!isVisualItem(item.id)) {
      continue
    }
    const rect = getItemRect(item)
    if (!rect) {
      continue
    }
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return item.id
    }
  }
  return null
}

/**
 * 返回当前选中且可见的场景项的画布轴对齐包围盒（用于绘制/命中 8 个缩放手柄）。
 * 没有选中项返回 null。结果缓存，由 invalidateSelectedRect 失效。
 */
export function getSelectedItemRect(): Rect | null {
  if (selectedRectCache !== undefined) {
    return selectedRectCache
  }
  selectedRectCache = computeSelectedItemRect()
  return selectedRectCache
}

/** 实际计算选中项包围盒（无缓存）。 */
function computeSelectedItemRect(): Rect | null {
  if (!mainScene) {
    return null
  }
  for (const item of mainScene.getItems()) {
    if (item.selected && item.visible) {
      return getItemRect(item)
    }
  }
  return null
}

/** 返回当前选中且可见的场景项 id，没有返回 null。 */
export function getSelectedItemId(): number | null {
  if (!mainScene) {
    return null
  }
  for (const item of mainScene.getItems()) {
    if (item.selected && item.visible) {
      return item.id
    }
  }
  return null
}

/**
 * 由目标包围盒反推锚点位置（getItemRect 的逆运算）。
 * align 位：Left=1 / Right=2 / Top=4 / Bottom=8 / Center=0。
 */
function rectToPos(
  rect: { left: number; top: number; right: number; bottom: number },
  align: number
): { x: number; y: number } {
  const width = rect.right - rect.left
  const height = rect.bottom - rect.top

  let x: number
  if (align & 1)
    x = rect.left // Left
  else if (align & 2)
    x = rect.right // Right
  else x = rect.left + width / 2 // Center

  let y: number
  if (align & 4)
    y = rect.top // Top
  else if (align & 8)
    y = rect.bottom // Bottom
  else y = rect.top + height / 2 // Center

  return { x, y }
}

/**
 * 把选中项设置为指定画布包围盒：换算成 scale（或 bounds）+ position 后写回。
 * 用于缩放：editor 算出目标矩形，这里负责贴合 OBS 的 transform 语义落地。
 */
export function setItemRect(
  id: number,
  rect: { left: number; top: number; right: number; bottom: number }
): boolean {
  const item = findItemById(id)
  if (!item) {
    return false
  }
  const ti = item.transformInfo
  if (!ti) {
    return false
  }

  const width = rect.right - rect.left
  const height = rect.bottom - rect.top
  if (width <= 0 || height <= 0) {
    return false
  }

  const boundsType = Number(ti.boundsType)
  if (boundsType !== 0) {
    // bounds 模式：直接设 bounds 尺寸，position 由 boundsAlignment 反推
    const pos = rectToPos(rect, ti.boundsAlignment)
    const ok = tryRun('setItemRect(bounds)', () => {
      item.bounds = { x: width, y: height }
      item.position = pos
    })
    invalidateSelectedRect()
    return ok
  }

  // 普通模式：scale = 目标尺寸 / 裁剪后源像素尺寸
  const src = item.source
  const crop = item.crop
  const cropW = (src?.width ?? 0) - (crop?.left ?? 0) - (crop?.right ?? 0)
  const cropH = (src?.height ?? 0) - (crop?.top ?? 0) - (crop?.bottom ?? 0)
  if (cropW <= 0 || cropH <= 0) {
    return false
  }

  const pos = rectToPos(rect, ti.alignment)
  const ok = tryRun('setItemRect(scale)', () => {
    item.scale = { x: width / cropW, y: height / cropH }
    item.position = pos
  })
  invalidateSelectedRect()
  return ok
}

/**
 * 把一个输入源添加到主场景。
 * @returns 创建的场景项，场景不存在时返回 null
 */
export function addInput(source: osn.IInput): osn.ISceneItem | null {
  if (!mainScene) {
    log.error('Cannot add input: main scene not created')
    return null
  }
  log.debug('Adding input to scene:', source.name)
  const item = mainScene.add(source)
  // 闸门 3：对齐到预览 canvas
  alignItemCanvas(item)
  invalidateSelectedRect()
  return item
}

/**
 * 释放挂在源上的所有滤镜（removeFilter + release）。
 * 通过 source.filters 拿到当前全部滤镜，调用方负责随后释放源本身。
 */
function releaseSourceFilters(source: osn.IInput): void {
  const filters = source.filters
  if (!filters || filters.length === 0) {
    return
  }
  log.debug(`Releasing ${filters.length} filter(s) of source:`, source.name)
  for (const filter of filters) {
    tryRun('removeFilter', () => source.removeFilter(filter))
    tryRun('filter.release', () => filter.release())
  }
}

/**
 * 移除指定场景项：先释放源上的所有滤镜，再从场景移除并释放底层 source。
 * @returns 被移除源的 OBS 内部名（用于 api 层清理元数据缓存）；未找到/失败返回 null
 */
export function removeById(id: number): string | null {
  const item = findItemById(id)
  if (!item) {
    log.warn('removeById: item not found:', id)
    return null
  }
  log.debug('Removing item:', id)
  const source = item.source
  const sourceName = source?.name ?? null
  const ok = tryRun('removeById', () => {
    // 释放挂在该源上的所有滤镜（如麦克风的降噪滤镜）：
    // 从 source.filters 取当前全部滤镜，逐个 removeFilter + release，再释放源本身。
    releaseSourceFilters(source)
    item.remove()
    source.release()
  })
  invalidateSelectedRect()
  if (!ok) {
    return null
  }
  log.info('Item removed:', id)
  return sourceName
}

/**
 * 设置指定场景项的可见性。
 */
export function setVisibleById(id: number, visible: boolean): boolean {
  const item = findItemById(id)
  if (!item) {
    log.warn('setVisibleById: item not found:', id)
    return false
  }
  log.debug(`Set item visible=${visible}:`, id)
  const ok = tryRun('setVisibleById', () => {
    item.visible = visible
  })
  invalidateSelectedRect()
  return ok
}

/**
 * 设置指定场景项底层源的静音状态。
 */
export function setMutedById(id: number, muted: boolean): boolean {
  const input = findInputById(id)
  if (!input) {
    log.warn('setMutedById: source not found:', id)
    return false
  }
  log.debug(`Set source muted=${muted}:`, id)
  return tryRun('setMutedById', () => {
    input.muted = muted
  })
}

/**
 * 选中指定场景项（闸门 4）：只有 selected 的 item 才会绘制选择框。
 * 默认 exclusive=true，先清空其它 item 的选中态，保证单选。
 */
export function setSelectedById(id: number, exclusive = true): boolean {
  const target = findItemById(id)
  if (!target) {
    log.warn('setSelectedById: item not found:', id)
    return false
  }

  if (exclusive) {
    clearSelection()
  }
  const ok = tryRun('setSelectedById', () => {
    target.selected = true
  })
  invalidateSelectedRect()
  log.debug('Item selected:', id)
  return ok
}

/**
 * 清空所有场景项的选中态（隐藏选择框）。
 */
export function clearSelection(): void {
  if (!mainScene) {
    return
  }
  for (const item of mainScene.getItems()) {
    tryRun('clearSelection.item', () => {
      item.selected = false
    })
  }
  invalidateSelectedRect()
  log.debug('Selection cleared')
}

/**
 * 读取场景项的位置（锚点，画布坐标）。
 */
export function getItemPosition(id: number): { x: number; y: number } | null {
  const item = findItemById(id)
  if (!item) {
    return null
  }
  const p = item.position
  return { x: p.x, y: p.y }
}

/**
 * 设置场景项的位置（锚点，画布坐标）。
 */
export function setItemPosition(id: number, x: number, y: number): boolean {
  const item = findItemById(id)
  if (!item) {
    return false
  }
  const ok = tryRun('setItemPosition', () => {
    item.position = { x, y }
  })
  invalidateSelectedRect()
  return ok
}

/**
 * 设置场景项的缩放比例。
 * 用于把纯音频源（如 macOS 桌面音频的 mac_screen_capture）的画面缩为 0 隐藏，
 * 只保留其音频混入输出。
 */
export function setItemScale(id: number, x: number, y: number): boolean {
  const item = findItemById(id)
  if (!item) {
    return false
  }
  const ok = tryRun('setItemScale', () => {
    item.scale = { x, y }
  })
  invalidateSelectedRect()
  return ok
}

/**
 * 销毁主场景：移除并释放所有场景项，释放过渡，清空主场景引用。
 */
export function destroyMainScene(): void {
  if (!mainScene) {
    return
  }

  log.info('Destroying main scene')
  for (const item of mainScene.getItems()) {
    try {
      const source = item.source
      releaseSourceFilters(source) // 先释放源上的滤镜（如降噪），再释放源
      item.remove()
      source.release()
    } catch (error) {
      log.error('Failed to release scene item:', error)
    }
  }

  if (mainTransition) {
    try {
      mainTransition.clear()
      mainTransition.release()
    } catch (error) {
      log.error('Failed to release main transition:', error)
    }
    mainTransition = null
  }

  mainScene = null
  selectedRectCache = undefined
  sourceStore.clear() // 清空源元数据缓存
  log.debug('Main scene destroyed')
}
