---
inclusion: fileMatch
fileMatchPattern: 'src/main/obs/**'
---

# OBS 模块架构（src/main/obs）

封装 `@shen9401/obs-studio-node`（osn）的主进程 OBS 能力：初始化、场景/源管理（含音频源）、预览、推流、预览内交互（选中/拖拽/缩放）。

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
    safe.ts            tryRun：包裹原生调用，吞异常并记日志
    utils.ts           通用工具：throttle（leading+trailing 节流，带 cancel）
  module/              独立能力模块，彼此不 import，且【不监听生命周期事件】
    core.ts            OBS API init/shutdown、videoContext、输出编码；init 内连接 output:signal；ensureReady 就绪守卫
    scene.ts           主场景 + transition、场景项增删/排序/可见/选中/静音、命中检测（仅视觉源）、
                       几何换算（含 fitItemToCanvas 等比适配、setItemScale）、删源时通过 source.filters 回收滤镜
    camera/screen/window.ts  视频设备枚举 + 创建/切换 IInput（createInput/switchDevice，只产出，不入场景）
    microphone.ts      音频输入设备枚举 + 创建/切换麦克风 IInput（纯净源，不附加滤镜）
    speaker.ts         扬声器单例（独立全局输出通道，非场景项）：枚举/创建/切设备/音量/静音/释放
    noiseFilter.ts     降噪滤镜 attach（无状态、不缓存、不销毁）
    fader.ts           音量推子（按场景项 id 持有 IFader，setVolume/getVolume/release）
    media.ts           媒体源播放控制（play/seek/切换文件/本地监听 setMonitoring/...）+ 状态读取
    preview.ts         OBS Display 的创建/移动/缩放/销毁、预览几何读取（带缓存）
    streaming.ts       RTMP 配置、推流状态机（监听 output:signal —— 业务数据事件，非生命周期）
  api/                 组装业务流程 + 生命周期编排，依赖 module 层
    lifecycle.ts       仅发根事件 lifecycle:init/destroy + 把业务事件转发到渲染进程
    core.ts            core 生命周期编排（lifecycle:init→init；scene+streaming+speaker:destroyed→shutdown）
    scene.ts           scene 生命周期编排（core:initialized→建场景；media+preview+source:destroyed→销毁）
    source.ts          设备枚举/加源/列表/排序/可见/静音/选中/删除/通用切设备 switchSourceDevice；
                       加源后 fitItemToCanvas 适配 + 延迟选中；编排 fader+noiseFilter；广播 sources:changed（节流 300ms）；
                       持有 source:destroyed 生命周期（释放全部 Fader）
    speaker.ts         扬声器枚举/设置(创建/切换)/音量/静音/移除；持有 speaker:destroyed 生命周期，独立于 source 通用流程
    editor.ts          预览鼠标事件 -> 坐标换算 -> 命中/拖拽/缩放/光标
    media.ts           媒体播放控制透传（含本地监听）+ 进度跟踪（监听 scene:initialized/lifecycle:destroy）
    preview.ts         预览能力透传 + 生命周期（core:initialized→缓存上下文；lifecycle:destroy→销毁）
    streaming.ts       推流能力透传 + 生命周期（lifecycle:destroy→forceStop）
    index.ts           api 层统一出口（副作用 import './core' './scene'，其余随函数 re-export 加载）
  index.ts             对外唯一入口（外部只从这里 import；并副作用 import './module' 确保模块加载）
```

依赖方向严格单向：`api → module → common`。**module 之间不互相 import，api 之间也不互相 import**；跨模块/跨 api 的编排一律走 common 事件总线（obsEvents），不通过直接函数调用。

### 模块 vs api 的职责边界（关键）

- **module = 纯能力**：只暴露函数、操作传入的 osn 对象。**不订阅生命周期事件**（`lifecycle:*` / `*:initialized` / `*:destroyed`）。
  - 例外：module 可订阅构成自身核心能力的**业务数据事件**——streaming 监听 `output:signal` 驱动状态机即属此类，与生命周期编排无关。
  - module 可以 emit 业务事件（如 core emit `output:signal`、streaming emit `stream:state`）。
- **api = 编排 + 生命周期**：所有 `lifecycle:* / *:initialized / *:destroyed` 的订阅都在 api 层，每个 domain 在自己的 api 文件末尾「事件驱动生命周期」段接线。
- **谁创建谁释放**：api/source 在 addMedia/addMicrophone 创建 Fader（与源解耦的独立控件，无法从 source.filters 反查），故由 source 在删源/销毁时释放 Fader；附着在源上的滤镜（如降噪）随源释放，由 scene 统一回收（见下）。

## 生命周期（事件驱动、依赖有序、无互锁）

各 domain 在 **api 层**监听依赖事件、完成后发出自己的完成事件接力下游。lifecycle 只做根触发 + 渲染进程转发。

- 根触发：`initialize()` emit `lifecycle:init`（带 window）；`destroy()` emit `lifecycle:destroy`。
- core 初始化后发 `core:initialized`，**负载携带 `{ window, videoContext }`**，供 scene/preview 接力（不 import core 的状态）。
- init 链（拓扑序）：
  `lifecycle:init → core:initialized →（scene:initialized → media:initialized）/（preview:initialized）`
- destroy 链（逆序，先扇出后汇合）：
  `lifecycle:destroy →（streaming / preview / media / source / speaker 各自收尾）→ scene（等 media+preview+source）→ core（等 scene+streaming+speaker）`
  - **source:destroyed**：api/source 在 destroy 时释放全部 Fader（detach 须在源存活时），发出 `source:destroyed`，scene 的销毁 onAll 在等它。
  - **speaker:destroyed**：扬声器是独立全局通道单例，持有 input；api/speaker 在 destroy 时 `release()` 后发出 `speaker:destroyed`，core 的 shutdown onAll 在等它（须先于 videoContext 销毁）。
- **防互锁不变量**：每个生产者用 `try/finally` **无条件**发出自己的 `*:destroyed` 事件，即便自身收尾抛错；等待多个前置用 `obsEvents.onAll([...], fn)`（到齐触发、自动重置）。
- 同步性：`EventEmitter.emit` 同步执行，故 `emit('lifecycle:init')` 返回时整条链已跑完，行为与顺序调用一致。
- **订阅必须被加载**：api 的生命周期订阅在模块加载期注册。`obs/index.ts` 顶部 `import './module'` 保证模块加载、`export * from './api'` 触发 api 加载；`api/index.ts` 对**无函数导出的纯编排文件（core/scene）显式 `import './core' './scene'`**，其余 api 随其函数 re-export 一并加载。新增带生命周期的 api 文件若无导出，务必在 `api/index.ts` 补副作用 import。

## 数据流

- 命令：渲染进程 → IPC（src/main/ipc.ts）→ obs/api → module → osn。
- 回灌：module/api emit `obsEvents` → api/lifecycle 转发到渲染进程（IPC_CHANNELS）。
- 推流状态是单一真相：由 streaming 模块依据 OBS 输出信号（`output:signal` 的 type=streaming + signal 名）驱动状态机，emit `stream:state`，lifecycle 转发为 `STREAM_STATE_CHANGED`。**start()/stop() 不乐观置状态**，一律等信号回灌。
- 源列表是单一真相：增删/排序/可见/移动/静音后 api 层调 `emitSourcesChanged()` 广播完整列表（`sources:changed`）；渲染端只接收回灌、不维护派生状态。`SourceInfo` 含 `muted`（读 `item.source.muted`）。
  - `emitSourcesChanged` 用 `utils.throttle` 节流 **300ms**（leading+trailing），合并高频变更，避免频繁全量 listSources + IPC；trailing 兜底保证最终一致（`listSources` 对未就绪场景返回 `[]`，延迟回调安全）。
- 选中走轻量通道：选中/取消只发 `selection:changed`（仅 selected id），渲染端 `setSelection` 本地翻 selected 标记，不重排列表、不触发全量 listSources。
- 源元数据（name/label/type）不写 OBS settings：创建源时写入内存 `sourceStore`（按 sourceName 索引），listSources 直接读缓存。删除源 / 销毁场景时清理。**不持久化，重载场景需另存盘并回填。**

## 加源 / 切换设备 的画布适配与选中

- **加源**（addCamera/addScreen/addWindow/addMedia）成功后：`scene.fitItemToCanvas(itemId)` 等比缩放适配画布 + `selectSourceDelayed(itemId)` 延迟选中。
  - `fitItemToCanvas`：`scale = min(画布/源宽, 画布/源高, 1)`——源比画布大则等比缩小装入，比画布小则保持原尺寸（**不放大**）；只改缩放不改位置；源尺寸未就绪（宽/高为 0，如摄像头首帧前）跳过。
  - `selectSourceDelayed`：延迟 ~500ms 选中（单选，清其它），新请求会取消未决的旧请求；用于等源尺寸/画面就绪后选择框贴合。
- **切换设备** `switchSourceDevice(id, params)`（通用，入参同 createX 的 `CreateSourceParams`）：按 sourceStore 的 type 分派到对应 module 的 `switchDevice(input, params)`（camera/screen/window/media/microphone），切换后更新 sourceStore 元数据；视觉源再 `fitItemToCanvas` + `selectSourceDelayed`；广播 `sources:changed`。

## 音频源（麦克风 / 扬声器）

### 麦克风（场景项，但不在源列表展示）

- 添加：`api/source.addMicrophone` 编排 `microphone.createInput`（纯净源）+ `noiseFilter.attach`（降噪）+ `fader.create`（音量），元数据 type=`microphone` 写入 sourceStore。
  - 平台输入类型见 constants：`MIC_INPUT_TYPE`（win=wasapi_input_capture / mac=coreaudio_input_capture）。
  - 设备列表：`microphone.listDevices()` -> `OBS_settings_getInputAudioDevices()`。
- 音量/静音：`setMicVolume/getMicVolume` 走 fader（deflection 0..1）；`setSourceMuted` 走 `scene.setMutedById`（设 `input.muted`）。
- 切换设备：通用 `switchSourceDevice(id, params)` -> `microphone.switchDevice(input, params)`（`input.update({ device_id: params.id })`）+ 同步更新 sourceStore。
- **降噪滤镜无状态**：noiseFilter 只 attach，不持引用。删源/销毁场景时由 **scene** 通过 `source.filters` 遍历 `removeFilter + release` 统一回收（见 scene.removeById / destroyMainScene 的 `releaseSourceFilters`）。
- **UI 归属**：麦克风是普通场景项（纯音频、无画面），但渲染层把它从源列表过滤掉，统一在底部 ControlBar 的音频控制条管理（音量/静音/切设备/删除）。

### 扬声器（独立全局输出通道单例，`module/speaker.ts` + `api/speaker.ts`）

- **单例架构**：扬声器**不是场景项**，不进源列表、不参与 scene 增删。它挂在独立全局输出通道（`SPEAKER_OUTPUT_CHANNEL = 1`），module 自持有单例（input/fader/设备信息），api 独立编排。状态经 `speaker:changed` 广播（→ SPEAKER_CHANGED），`SpeakerState` 含 deviceId/deviceName/volume/muted。
- 设备枚举与采集类型：
  - Windows：`OBS_settings_getOutputAudioDevices()` 枚举 wasapi 输出设备（`wasapi_output_capture`），纯音频。
  - macOS：系统不支持输出设备枚举，列表固定返回 `{ id:'default', name:'Default' }`；采集用免驱的 ScreenCaptureKit 纯音频源 `sck_audio_capture`（`MAC_DESKTOP_AUDIO_TYPE`）——**无视频轨道，天然有声无画，无需缩放规避**。
  - 设备正确性由业务层决定（module.set 直接用传入 device，不再覆写）。
- 能力：`set(device)`（未建则创建+挂通道+建 fader；已建切设备）/ `setVolume` / `setMuted`（`input.muted`）/ `getState` / `release`。
- **独立生命周期**：持有 input（须先于 core 销毁 videoContext 释放）。api/speaker 监听 `lifecycle:destroy` 调 `release()`（清空通道+销毁 fader+input）并无条件 emit `speaker:destroyed`，core 的 shutdown onAll 在等它。

### 媒体本地监听（声音回放）

- `media.setMonitoring(input, enabled)` 设 `input.monitoringType`：开=`MonitoringAndOutput`（本地有声+推流有声），关=`None`（仅推流）。值见 constants `MONITORING_TYPE`（const enum 数值拷贝）。`MediaStatus` 含 `monitoring`，随进度回灌。

### 预览交互只面向视觉源

- editor 命中检测调 `scene.hitTest`，其内部用私有 `isVisualItem`（读 sourceStore，仅 camera/monitor/window/media 通过）过滤掉麦克风等音频场景项——音频源无画面，不可选中/拖拽/缩放。扬声器不是场景项，editor 根本不会遇到。

## 选择框「四道闸门」（务必全部满足，缺一只是没框、不影响画面）

1. `OBS_content_setShouldDrawUI(DISPLAY_ID, true)`（module/preview.ts）
2. channel 0 放 **transition**（cut_transition 包裹 scene），不是 scene（module/scene.ts createMainScene）
3. 每个场景项 `item.video = previewVideoContext`，与预览 Display 同一 canvas（module/scene.ts alignItemCanvas）
4. `item.selected = true`（module/scene.ts setSelectedById）

详见各文件「闸门 N」注释。改动这几处前先理解闸门关系。

## 关键约定与坑（改代码前必读）

- **osn 是 const enum**：esbuild 无法跨模块内联。禁止 `import { EBoundsType }` 之类直接用枚举，constants.ts 里用数值并注释原枚举名；比较 osn 返回的枚举值时用 `Number(x) !== 0` 规避 TS 窄化误报。
- **module 不监听生命周期事件**：生命周期订阅一律放 api 层（见上「职责边界」）。给 module 加 `obsEvents.on('lifecycle:*')` 是反模式——改放对应的 `api/<domain>.ts`。
- **就绪守卫统一用 `core.ensureReady(op)`**：所有 api 原生操作前先 `if (!core.ensureReady('xxx')) return ...`，OBS 未初始化时拒绝并记 warn，避免裸调原生崩溃。
- **z-order 方向**：`scene.getItems()`（= obs_scene_enum_items）**下标 0 = 最底层**，末尾 = 最顶层；`orderItems(order)` 同向（order[0] 为底层）。命中检测取最上层，从数组**尾部往前**遍历。对外 `listSources()` 已 `.reverse()` 成「顶层在前」。
- **坐标系**：渲染层传 CSS 像素（相对预览容器，用容器 rect 自算）；editor.toCanvasPoint 换算到画布坐标 = `(css*factor - previewOffset)/previewSize * canvasBase`。几何来自 `preview.getPreviewGeometry()`。
- **交互全在主进程算**：贴着 OBS 状态做命中/换算/写回 transform，OBS 每帧自渲染选择框。渲染层只透传鼠标事件 + 接收 cursor。拖拽/缩放期间不广播（省 IPC），仅 mouseup 广播一次。
- **热路径缓存**：`preview.getPreviewGeometry()` 缓存 offset/size/factor，随 `resize`/`destroy` 失效；`scene.getSelectedItemRect()` 缓存选中包围盒，由 `invalidateSelectedRect()` 在选中/可见/位置/缩放/增删时失效。**新增会改变选中项几何的写操作时，必须补上 `invalidateSelectedRect()` 调用**，否则 rect 过期。
- **预览鼠标用 pointer capture**：渲染层 Preview.tsx 用 PointerEvent + setPointerCapture，按下后移出容器仍持续派发 move/up，保证「未松开则一直拖拽」；故主进程 `mouseleave` 不结束手势，只在空闲时复位光标。
- **销毁顺序由事件 join 保证**：streaming/preview/media/source/speaker 监听 `lifecycle:destroy` 各自收尾 → scene 等 `media:destroyed`+`preview:destroyed`+`source:destroyed` 才销毁 → core 等 `scene:destroyed`+`streaming:destroyed`+`speaker:destroyed` 才 shutdown。推流/预览持有 video canvas，必须先于 core 释放，否则销毁 videoContext 报 `[VIDEO_CANVAS] video is active`。core.shutdown 内须先 `OBS_API_destroyOBS_API` 再 `IPC.disconnect`。**新增进销毁链的 api 时，务必 try/finally 无条件 emit 自己的 `*:destroyed`，否则下游 onAll 永久挂起。**
- **附属资源释放时机**：Fader.detach / Filter.removeFilter 必须在源仍存活时进行。Fader 由 api/source 在 `source:destroyed` 前释放；滤镜由 scene 在释放源之前通过 `source.filters` 回收。
- **单实例假设**：整层是模块级单例（一个 OBS、一个主场景、一个预览 Display）。不支持多 canvas/多预览。
- **新增 IPC**：先在 shared/types.ts 的 IPC_CHANNELS 注册，再在 ipc.ts 接线、preload 暴露（index.ts + index.d.ts）、obs/api 实现。高频单向事件（如鼠标）用 `ipcMain.on`/`ipcRenderer.send`，请求-响应用 `handle`/`invoke`。

## 已知局限

- 命中检测与缩放按**未旋转**的轴对齐盒近似，旋转源会偏差。
- 缩放为等比（保持宽高比，对侧锚点固定），暂不支持自由比例/裁剪。
- 源元数据仅在内存，不持久化；做场景重载需另存盘并回填。
- 待办与改进项见 `obs-docs/obs-review.md`。
