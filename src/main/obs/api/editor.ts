/**
 * [api] 预览编辑器
 *
 * 接收渲染进程从预览容器捕获并透传过来的鼠标事件，把容器坐标换算到画布坐标，
 * 在原生预览里实现交互。
 *
 * 已实现：
 *   - 点击选中：mousedown 命中 z 轴最上层源即选中；空白处取消选中。
 *   - 拖动移动：在已命中源上按下并拖动，实时改 item.position。
 *   - 缩放：按住选中源的 8 个手柄拖动，对侧（角/边）固定、被拖边跟随鼠标。
 *
 * 交互模型（全部在主进程算，贴着 OBS 状态）：
 *   - mousedown：先判手柄→缩放；否则命中源→选中+拖动；空白→取消选中。
 *   - mousemove：拖动改 position / 缩放改 scale+position；交互期间不广播（省 IPC），靠 OBS 自渲染反馈。
 *   - mouseup / mouseleave：发生过变化则广播一次同步渲染端；清空交互态。
 */
import { scene, preview } from '../module'
import { obsEvents } from '../common/events'
import { createLogger } from '../common/logger'
import { DEFAULT_VIDEO_CONFIG } from '../common/constants'
import type { PreviewMouseEvent, PreviewCursor } from '../../../shared/types'

const log = createLogger('editor')

/** 手柄命中半径（设备像素），换算到画布坐标后用于判定是否悬浮在手柄上 */
const HANDLE_HIT_RADIUS_PX = 8

/** 缩放时的最小尺寸下限（画布像素），避免把源缩到 0 或负尺寸 */
const MIN_SIZE = 1

/** 手柄方向标识：4 角 + 4 边中点 */
type HandleDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'

/** 手柄方向 -> 光标样式 */
const HANDLE_CURSOR: Record<HandleDir, PreviewCursor> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  w: 'ew-resize',
  e: 'ew-resize'
}

/** 拖拽态：按下命中源后建立，记录抓取点与源起始位置（均为画布坐标） */
interface DragState {
  itemId: number
  grab: { x: number; y: number }
  startPos: { x: number; y: number }
  moved: boolean
}

/** 缩放态：按下手柄后建立，记录被拖项与起始包围盒、手柄方向 */
interface ResizeState {
  itemId: number
  dir: HandleDir
  startRect: { left: number; top: number; right: number; bottom: number }
  moved: boolean
}

let drag: DragState | null = null
let resize: ResizeState | null = null

/** 上一次推送给渲染层的光标，避免重复发送 */
let lastCursor: PreviewCursor = 'default'

/**
 * 把预览容器内的 CSS 像素坐标换算到画布坐标。
 *
 *   设备坐标 = css * factor
 *   画布坐标 = (设备坐标 - previewOffset) / previewSize * canvasBase
 *
 * 预览几何由 preview 模块按 resize 缓存（hover/拖拽热路径无额外 IPC）。
 *
 * @param clampToCanvas 为 true 时，落在 letterbox 黑边外（画布范围外）返回 null；
 *   拖拽过程传 false，允许把源拖到画布外、保证跟手。
 */
function toCanvasPoint(
  offsetX: number,
  offsetY: number,
  clampToCanvas = true
): { x: number; y: number } | null {
  const geo = preview.getPreviewGeometry()
  if (!geo || geo.size.width <= 0 || geo.size.height <= 0) {
    return null
  }

  const relX = (offsetX * geo.factor - geo.offset.x) / geo.size.width
  const relY = (offsetY * geo.factor - geo.offset.y) / geo.size.height
  if (clampToCanvas && (relX < 0 || relX > 1 || relY < 0 || relY > 1)) {
    return null
  }

  return {
    x: relX * DEFAULT_VIDEO_CONFIG.baseWidth,
    y: relY * DEFAULT_VIDEO_CONFIG.baseHeight
  }
}

/** 判断画布坐标是否落在画布范围内（不含 letterbox 黑边）。 */
function isInsideCanvas(point: { x: number; y: number }): boolean {
  return (
    point.x >= 0 &&
    point.x <= DEFAULT_VIDEO_CONFIG.baseWidth &&
    point.y >= 0 &&
    point.y <= DEFAULT_VIDEO_CONFIG.baseHeight
  )
}

/** 结束当前交互（拖动/缩放）：发生过变化则广播一次同步渲染端，并清空交互态。 */
function endInteraction(): void {
  if (drag?.moved || resize?.moved) {
    // 通过命令事件通知 source 层广播，不直接调用 source.ts
    obsEvents.emit('cmd:emit-sources-changed')
  }
  drag = null
  resize = null
}

function onMouseDown(point: { x: number; y: number } | null): void {
  // 换算失败（预览未就绪）：什么都不做
  if (!point) {
    return
  }

  // 1) 若按在当前选中源的某个手柄上：进入缩放。
  //    手柄优先级最高，且可能略超画布边缘，所以在 clamp 判断之前先检测。
  const dir = hitHandle(point)
  if (dir) {
    const itemId = scene.getSelectedItemId()
    const startRect = scene.getSelectedItemRect()
    if (itemId !== null && startRect) {
      resize = { itemId, dir, startRect, moved: false }
      log.debug('mousedown grab handle:', dir)
    }
    drag = null
    return
  }

  // 2) 落在画布外（letterbox 黑边）：取消选中
  if (!isInsideCanvas(point)) {
    obsEvents.emit('cmd:clear-source-selection')
    drag = null
    return
  }

  // 3) 命中源：选中并进入拖动态（hitTest 内部已过滤掉音频源，仅命中视觉源）
  const hitId = scene.hitTest(point.x, point.y)
  if (hitId === null) {
    log.debug('mousedown hit nothing, clearing selection')
    obsEvents.emit('cmd:clear-source-selection')
    drag = null
    return
  }

  obsEvents.emit('cmd:select-source', hitId)
  const startPos = scene.getItemPosition(hitId)
  if (!startPos) {
    drag = null
    return
  }
  drag = { itemId: hitId, grab: point, startPos, moved: false }
  log.debug('mousedown grab item:', hitId)
}

function onMouseMove(point: { x: number; y: number } | null): void {
  if (!drag || !point) {
    return
  }
  const dx = point.x - drag.grab.x
  const dy = point.y - drag.grab.y
  drag.moved = true
  // 直接写回 position，OBS 每帧自渲染，选择框跟随；拖拽期间不广播
  scene.setItemPosition(drag.itemId, drag.startPos.x + dx, drag.startPos.y + dy)
}

/**
 * 等比缩放：8 个手柄都保持源的宽高比，对侧锚点固定。
 *
 * - 角点：锚点为对角。用鼠标相对锚点的位移在宽/高两个方向各算一个比例，取较大者（max）
 *   作为统一比例，保证跟手且不变形；新尺寸 = 起始尺寸 * 比例，从锚角展开。
 * - 边点：锚点为对边中点。只有一个轴有位移信息，用该轴算比例，另一轴等比联动，
 *   并让另一轴围绕该边中点对称扩展（视觉上从该边向外等比放大）。
 */
function onResizeMove(point: { x: number; y: number } | null): void {
  if (!resize || !point) {
    return
  }
  const s = resize.startRect
  const startW = s.right - s.left
  const startH = s.bottom - s.top
  if (startW <= 0 || startH <= 0) {
    return
  }
  const { dir } = resize

  const isCorner = dir.length === 2
  let ratio: number

  if (isCorner) {
    // 对角锚点：水平/垂直方向固定的那条边
    const anchorX = dir.includes('w') ? s.right : s.left
    const anchorY = dir.includes('n') ? s.bottom : s.top
    const wantW = Math.abs(point.x - anchorX)
    const wantH = Math.abs(point.y - anchorY)
    // 取需求更大的方向决定比例，另一方向按比例联动
    ratio = Math.max(wantW / startW, wantH / startH)
  } else if (dir === 'w' || dir === 'e') {
    const anchorX = dir === 'w' ? s.right : s.left
    ratio = Math.abs(point.x - anchorX) / startW
  } else {
    const anchorY = dir === 'n' ? s.bottom : s.top
    ratio = Math.abs(point.y - anchorY) / startH
  }

  const newW = Math.max(MIN_SIZE, startW * ratio)
  const newH = Math.max(MIN_SIZE, startH * ratio)

  // 按锚点展开新矩形
  const r = { left: s.left, top: s.top, right: s.right, bottom: s.bottom }

  // 水平：含 'w' 锚右边、含 'e' 锚左边、纯垂直边手柄围绕水平中点对称
  if (dir.includes('w')) {
    r.left = r.right - newW
  } else if (dir.includes('e')) {
    r.right = r.left + newW
  } else {
    const cx = (s.left + s.right) / 2
    r.left = cx - newW / 2
    r.right = cx + newW / 2
  }

  // 垂直：含 'n' 锚下边、含 's' 锚上边、纯水平边手柄围绕垂直中点对称
  if (dir.includes('n')) {
    r.top = r.bottom - newH
  } else if (dir.includes('s')) {
    r.bottom = r.top + newH
  } else {
    const cy = (s.top + s.bottom) / 2
    r.top = cy - newH / 2
    r.bottom = cy + newH / 2
  }

  resize.moved = true
  scene.setItemRect(resize.itemId, r)
}

/** 把光标推送到渲染层（与上次相同则跳过）。 */
function setCursor(cursor: PreviewCursor): void {
  if (cursor === lastCursor) {
    return
  }
  lastCursor = cursor
  obsEvents.emit('preview:cursor', cursor)
}

/**
 * 命中选中源的 8 个缩放手柄，返回命中的手柄方向；未命中返回 null。
 *
 * 手柄位于选中项包围盒的 4 角 + 4 边中点。命中半径以设备像素定义，
 * 换算到画布坐标（乘以 画布尺寸/预览渲染尺寸 的缩放比）后做判定。
 */
function hitHandle(point: { x: number; y: number }): HandleDir | null {
  const rect = scene.getSelectedItemRect()
  if (!rect) {
    return null
  }

  const geo = preview.getPreviewGeometry()
  if (!geo || geo.size.width <= 0 || geo.size.height <= 0) {
    return null
  }
  // 画布像素 / 预览设备像素 的比值（预览等比，取 x 方向即可）
  const canvasPerDevice = DEFAULT_VIDEO_CONFIG.baseWidth / geo.size.width
  const tol = HANDLE_HIT_RADIUS_PX * canvasPerDevice

  const midX = (rect.left + rect.right) / 2
  const midY = (rect.top + rect.bottom) / 2

  // 8 个手柄：位置 -> 方向
  const handles: { x: number; y: number; dir: HandleDir }[] = [
    { x: rect.left, y: rect.top, dir: 'nw' },
    { x: rect.right, y: rect.bottom, dir: 'se' },
    { x: rect.right, y: rect.top, dir: 'ne' },
    { x: rect.left, y: rect.bottom, dir: 'sw' },
    { x: midX, y: rect.top, dir: 'n' },
    { x: midX, y: rect.bottom, dir: 's' },
    { x: rect.left, y: midY, dir: 'w' },
    { x: rect.right, y: midY, dir: 'e' }
  ]

  for (const h of handles) {
    if (Math.abs(point.x - h.x) <= tol && Math.abs(point.y - h.y) <= tol) {
      return h.dir
    }
  }
  return null
}

/** 悬浮（非拖拽）时根据是否在手柄上更新光标。 */
function updateHoverCursor(point: { x: number; y: number } | null): void {
  if (!point) {
    setCursor('default')
    return
  }
  const dir = hitHandle(point)
  setCursor(dir ? HANDLE_CURSOR[dir] : 'default')
}

/**
 * 处理预览区鼠标事件。
 */
export function handlePreviewMouseEvent(event: PreviewMouseEvent): void {
  switch (event.type) {
    case 'mousedown':
      // 用未夹取坐标，使手柄命中与悬浮光标判定一致（手柄可能略超画布边缘）
      onMouseDown(toCanvasPoint(event.offsetX, event.offsetY, false))
      break

    case 'mousemove':
      if (resize) {
        // 缩放中：不夹取，允许拖到画布外
        onResizeMove(toCanvasPoint(event.offsetX, event.offsetY, false))
      } else if (drag) {
        // 拖拽中坐标可能越界（落到黑边），不夹取以保证跟手
        onMouseMove(toCanvasPoint(event.offsetX, event.offsetY, false))
      } else {
        // 空闲：悬浮手柄改光标
        updateHoverCursor(toCanvasPoint(event.offsetX, event.offsetY, false))
      }
      break

    case 'mouseup':
      endInteraction()
      break

    case 'mouseleave':
      // 交互（拖拽/缩放）进行中不结束——靠渲染层 pointer capture 保证移出容器仍能收到事件，
      // 只在空闲时复位光标。
      if (!drag && !resize) {
        setCursor('default')
      }
      break

    default:
      // dblclick / wheel / enter 暂不处理
      break
  }
}
