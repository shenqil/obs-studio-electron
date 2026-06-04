---
inclusion: fileMatch
fileMatchPattern: 'src/main/obs/**'
---

# OBS 模块架构（src/main/obs）

封装 `@shen9401/obs-studio-node`（osn）的主进程 OBS 能力：初始化、场景/源管理、预览、推流、预览内交互（选中/拖拽/缩放）。

## 分层

```
shared/types.ts        ← 前后端共享类型 + IPC 通道名（唯一真相）
        ▲
src/main/obs/
  common/              基础设施，互不依赖业务
    constants.ts       常量（含 osn const enum 的数值拷贝，见下）
    logger.ts          createLogger(scope) -> [OBS:scope] 前缀
    events.ts          类型安全事件总线 obsEvents（OBSEventMap）
    settings.ts        OBS 嵌套 settings 的读写封装
    sourceStore.ts     源自定义元数据本地缓存（name/label/type，按 sourceName 索引）
  module/              独立能力模块，彼此不 import
    core.ts            OBS API init/shutdown、videoContext、输出编码
    scene.ts           主场景 + transition、场景项增删/排序/可见/选中、命中检测、几何换算
    camera/screen/window.ts  设备枚举 + 创建 IInput（只产出，不入场景）
    preview.ts         OBS Display 的创建/移动/缩放/销毁、预览几何读取（带缓存）
    streaming.ts       RTMP 配置、推流状态机
  api/                 组装业务流程，依赖 module 层
    lifecycle.ts       仅发根事件 lifecycle:init/destroy + 把业务事件转发到渲染进程
    source.ts          设备枚举/加源/列表/排序/可见/选中/删除，广播 sources:changed
    editor.ts          预览鼠标事件 -> 坐标换算 -> 命中/拖拽/缩放/光标
    media.ts           媒体播放控制 + 进度跟踪（监听 scene:initialized/lifecycle:destroy）
    preview.ts         预览生命周期透传
    streaming.ts       推流能力透传
    index.ts           api 层统一出口
  index.ts             对外唯一入口（外部只从这里 import；并副作用 import './module' 确保全部订阅注册）
```

依赖方向严格单向：`api → module → common`。module 之间不互相 import，**api 之间也不互相 import**；跨模块/跨 api 的编排一律走 common 事件总线（obsEvents），不通过直接函数调用。

## 生命周期（事件驱动、依赖有序、无互锁）

不再由 lifecycle 集中编排，而是各模块在文件末尾「事件驱动生命周期」段自行监听依赖事件、
完成后发出自己的完成事件接力下游。lifecycle 只做根触发 + 渲染进程转发。

- 根触发：`initialize()` emit `lifecycle:init`（带 window）；`destroy()` emit `lifecycle:destroy`。
- core 初始化后发 `core:initialized`，**负载携带 `{ window, videoContext }`**，供 scene/preview 接力（不 import core）。
- init 链（拓扑序）：
  `lifecycle:init → core:initialized →（scene:initialized → media:initialized）/（preview:initialized）`
- destroy 链（逆序，先扇出后汇合）：
  `lifecycle:destroy →（streaming/preview/media 各自销毁）→ scene（等 media+preview）→ core（等 scene+streaming）`
- **防互锁不变量**：每个模块用 `try/finally` **无条件**发出自己的 `*:destroyed` 事件，即便自身收尾抛错；等待多个前置用 `obsEvents.onAll([...], fn)`（到齐触发、自动重置）。
- 同步性：`EventEmitter.emit` 同步执行，故 `emit('lifecycle:init')` 返回时整条链已跑完，行为与旧的顺序调用一致。
- **模块必须被加载**：订阅在模块加载期注册，`obs/index.ts` 顶部 `import './module'` 保证全部注册；新增带生命周期的模块务必确保它在某条 import 路径上。

## 数据流

- 命令：渲染进程 → IPC（src/main/ipc.ts）→ obs/api → module → osn。
- 回灌：module emit `obsEvents` → lifecycle 转发到渲染进程（IPC_CHANNELS）。
- 推流状态是单一真相：由 streaming 模块依据 OBS 输出信号（`output:signal` 的 type=streaming + signal 名）驱动状态机，emit `stream:state`，lifecycle 转发为 `STREAM_STATE_CHANGED`。**start()/stop() 不乐观置状态**，一律等信号回灌。
- 源列表是单一真相：增删/排序/可见/移动后 api 层调 `emitSourcesChanged()` 广播完整列表（`sources:changed`）；渲染端只接收回灌、不维护派生状态。
- 选中走轻量通道：选中/取消只发 `selection:changed`（仅 selected id），渲染端 `setSelection` 本地翻 selected 标记，不重排列表、不触发全量 listSources。
- 源元数据（name/label/type）不写 OBS settings：创建源时写入内存 `sourceStore`（按 sourceName 索引），listSources 直接读缓存。删除源 / 销毁场景时清理。**不持久化，重载场景需另存盘并回填。**

## 选择框「四道闸门」（务必全部满足，缺一只是没框、不影响画面）

1. `OBS_content_setShouldDrawUI(DISPLAY_ID, true)`（preview.ts）
2. channel 0 放 **transition**（cut_transition 包裹 scene），不是 scene（scene.ts createMainScene）
3. 每个场景项 `item.video = previewVideoContext`，与预览 Display 同一 canvas（scene.ts alignItemCanvas）
4. `item.selected = true`（scene.ts setSelectedById）

详见各文件「闸门 N」注释。改动这几处前先理解闸门关系。

## 关键约定与坑（改代码前必读）

- **osn 是 const enum**：esbuild 无法跨模块内联。禁止 `import { EBoundsType }` 之类直接用枚举，constants.ts 里用数值并注释原枚举名；比较 osn 返回的枚举值时用 `Number(x) !== 0` 规避 TS 窄化误报。
- **z-order 方向**：`scene.getItems()`（= obs_scene_enum_items）**下标 0 = 最底层**，末尾 = 最顶层；`orderItems(order)` 同向（order[0] 为底层）。命中检测取最上层，从数组**尾部往前**遍历。对外 `listSources()` 已 `.reverse()` 成「顶层在前」。
- **坐标系**：渲染层传 CSS 像素（相对预览容器，用容器 rect 自算）；editor.toCanvasPoint 换算到画布坐标 = `(css*factor - previewOffset)/previewSize * canvasBase`。几何来自 `preview.getPreviewGeometry()`。
- **交互全在主进程算**：贴着 OBS 状态做命中/换算/写回 transform，OBS 每帧自渲染选择框。渲染层只透传鼠标事件 + 接收 cursor。拖拽/缩放期间不广播（省 IPC），仅 mouseup 广播一次。
- **热路径缓存**：`preview.getPreviewGeometry()` 缓存 offset/size/factor，随 `resize`/`destroy` 失效；`scene.getSelectedItemRect()` 缓存选中包围盒，由 `invalidateSelectedRect()` 在选中/可见/位置/缩放/增删时失效。**新增会改变选中项几何的写操作时，必须补上 `invalidateSelectedRect()` 调用**，否则 rect 过期。
- **预览鼠标用 pointer capture**：渲染层 Preview.tsx 用 PointerEvent + setPointerCapture，按下后移出容器仍持续派发 move/up，保证「未松开则一直拖拽」；故主进程 `mouseleave` 不结束手势，只在空闲时复位光标。
- **销毁顺序由事件 join 保证**：streaming/preview/media 监听 `lifecycle:destroy` 各自收尾 → scene 等 `media:destroyed`+`preview:destroyed` 才销毁 → core 等 `scene:destroyed`+`streaming:destroyed` 才 shutdown。推流/预览持有 video canvas，必须先于 core 释放，否则销毁 videoContext 报 `[VIDEO_CANVAS] video is active`。core.shutdown 内须先 `OBS_API_destroyOBS_API` 再 `IPC.disconnect`。**新增模块进销毁链时，务必 try/finally 无条件 emit 自己的 `*:destroyed`，否则下游 onAll 永久挂起。**
- **单实例假设**：整层是模块级单例（一个 OBS、一个主场景、一个预览 Display）。不支持多 canvas/多预览。
- **新增 IPC**：先在 shared/types.ts 的 IPC_CHANNELS 注册，再在 ipc.ts 接线、preload 暴露、obs/api 实现。高频单向事件（如鼠标）用 `ipcMain.on`/`ipcRenderer.send`，请求-响应用 `handle`/`invoke`。

## 已知局限

- 命中检测与缩放按**未旋转**的轴对齐盒近似，旋转源会偏差。
- 缩放为等比（保持宽高比，对侧锚点固定），暂不支持自由比例/裁剪。
- 源元数据仅在内存，不持久化；做场景重载需另存盘并回填。
- 待办与改进项见 `obs-docs/obs-review.md`。
