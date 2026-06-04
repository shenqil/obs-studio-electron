# `src/main/obs` 代码审查报告

> 审查者：Antigravity（10年架构师视角）  
> 日期：2026-06-04  
> 代码基：`shenqil/obs-studio-electron` — `src/main/obs/`  
> 架构文档：`.kiro/steering/obs-architecture.md`

---

## 一、总体评价

这套代码**架构设计质量属于较高水准**。分层清晰（common → module → api），事件总线驱动生命周期，依赖单向，常量集中管理，注释质量远超平均水平。但在若干关键细节上存在**真实的 Bug、设计脆弱点和可维护性隐患**，逐条列出如下。

---

## 二、按分层审查

### 2.1 common 层

| 文件 | 评分 | 说明 |
|---|---|---|
| `constants.ts` | ★★★★★ | 结构清晰，枚举数值都有注释，`as const` 保证类型推断正确 |
| `events.ts` | ★★★★★ | 类型安全的 OBSEventBus 是全局亮点；`onAll` 自动重置支持多轮循环，设计精良 |
| `logger.ts` | ★★★★☆ | 轻量实用；缺少 log level 控制（生产包 debug 日志会泄漏到控制台）|
| `safe.ts` | ★★★★☆ | `tryRun`/`tryGet` 思路对；但所有失败都 `.error()` 记录，部分场景会造成日志噪音 |
| `sourceStore.ts` | ★★★★☆ | 职责清晰；架构文档已说明「不持久化」，但没有防重复写入检查（addSource 可能覆盖旧条目而不告警）|

#### 🐛 Bug / 风险

**[common/events] `onAll` 重置时机有竞态**

```typescript
// events.ts 关键逻辑
if (remaining.size === 0) {
  for (const e of events) remaining.add(e)  // ← 在 listener 执行前就重置
  listener()
}
```

如果 `listener()` 内部同步再次 emit 了某个 `events` 中的事件，该事件会被计入新一轮 remaining，导致下一轮计数提前消费。目前的 destroy 链不会触发，但是隐患存在。

**建议**：先调用 `listener()`，再重置 `remaining`：
```typescript
listener()
for (const e of events) remaining.add(e)
```

---

### 2.2 module 层

| 文件 | 评分 | 说明 |
|---|---|---|
| `core.ts` | ★★★★★ | 初始化步骤有序，错误处理合理，销毁顺序注释详尽 |
| `scene.ts` | ★★★★☆ | 逻辑完整；`findInputById` 已于 2026-06-04 修复（见下）|
| `preview.ts` | ★★★★☆ | macOS/Windows 双路径写得清楚；`getPreviewGeometry` 缓存策略正确 |
| `streaming.ts` | ★★★★★ | 状态机驱动、单一真相、`forceStop` 销毁路径考虑充分 |
| `fader.ts` | ★★★★☆ | 接口设计干净；detach/destroy 有 try/catch 保护 |
| `media.ts` | ★★★★☆ | `safeDuration/safeSeek/safeLooping` 防御完备 |
| `camera.ts` / `screen.ts` / `window.ts` | ★★★★☆ | 职责单一；screen 枚举的「Auto 跳过」逻辑隐含约定，可加常量 |

#### 🐛 Bug — 已修复：`scene.findInputById` native throw

**现象**：`obs-studio-node` native 的 `mainScene.findItem(id)` 在场景项不存在时，抛出 `Error: Source not found.` 而非返回 null，导致媒体进度轮询定时器触发时产生 `Uncaught Exception`，整个 Electron 主进程崩溃。

**根因**：`api/media.ts` 的 `setInterval` 回调在场景项被删除后仍持有 `trackingItemId`。

**修复**（已提交）：
```typescript
export function findInputById(id: number): osn.IInput | null {
  let item: osn.ISceneItem | null | undefined
  try {
    item = mainScene?.findItem(id)
  } catch {
    // obs-studio-node 对不存在的 id 抛 "Source not found." 而非返回 null
    return null
  }
  const source = item?.source
  if (!source) return null
  return source as osn.IInput
}
```

#### 🐛 Bug：`preview.ts` — resize 时 macOS HiDPI 潜在问题

```typescript
const contentHeight = cachedWindow.getContentSize()[1]  // CSS 逻辑像素
const yCoord = IS_MACOS ? contentHeight - bounds.y - bounds.height : bounds.y
```

macOS 上 factor=1 所以目前正确；若未来支持 HiDPI macOS（factor>1），`contentHeight` 也需乘以 factor。建议加注释说明。

#### ⚠️ 风险：`core.ts` — `shutdown` 无论成功失败均置 `initialized=false`

`tryRun` 失败记录错误后返回 false，但 `initialized` 仍被置 false，若未来支持「重载 OBS」会留下残影。建议在注释中明确「shutdown 是尽力而为，不保证全部成功」。

---

### 2.3 api 层

| 文件 | 评分 | 说明 |
|---|---|---|
| `lifecycle.ts` | ★★★★★ | 根触发 + 转发分离干净，`forwardingUnsubs` 管理到位 |
| `source.ts` | ★★★★☆ | `ensureReady` 守卫一致；`toSourceInfo` 有 fallback 类型误导问题（见下）|
| `editor.ts` | ★★★★☆ | 等比缩放逻辑清晰；违反 api 间隔离约定（见下）|
| `media.ts` | ★★★★☆ | 进度跟踪生命周期设计合理 |
| `preview.ts` / `streaming.ts` | ★★★★★ | 纯透传，职责单一 |

#### ⚠️ 风险：`source.ts` — `toSourceInfo` 的 fallback 类型错误

```typescript
sourceType: meta?.type ?? 'camera',  // ← 未命中时默认 'camera' 会误导渲染层
```

若 `sourceStore` 未命中（逻辑上不应发生，但防御性编程需要），渲染层拿到错误的 `sourceType` 会影响 UI 图标、媒体控制栏显示。

**建议**：加 `log.warn` 提示缓存未命中，fallback 改为更显眼的值。

---

## 三、架构合规性检查

| 约定 | 是否合规 | 说明 |
|---|---|---|
| module 之间不互相 import | ✅ | 已核验，全部通过 obsEvents 通信 |
| api 之间不互相 import | ❌ | `editor.ts` import 了 `./source`，违反约定 |
| 依赖方向 api→module→common | ✅ | 整体合规 |
| 新增模块须在 import 路径上 | ✅ | `obs/index.ts` 有显式副作用 import |
| `invalidateSelectedRect` 在写操作后调用 | ✅ | 所有写路径均已调用 |
| `try/finally` 无条件 emit *:destroyed | ✅ | streaming/preview/media/scene/core 均合规 |

#### ❌ 违反约定：`api/editor.ts` 直接 import `api/source.ts`

```typescript
// editor.ts
import { selectSource, clearSourceSelection, emitSourcesChanged } from './source'
```

架构文档明确：**api 之间不互相 import**。

**建议修复路径**：将 `selectSource`/`clearSourceSelection` 的调用改为 emit 内部事件（如 `editor:select` / `editor:clearSelection`），由 `source.ts` 监听执行。`emitSourcesChanged` 可在 mouseup 后通过 `sources:dirty` 事件通知 source 层广播。

---

## 四、P0 Bug 详细分析：`moveSource` z-order 方向错误

> [!CAUTION]
> 这是功能级 Bug，用户操作 Up/Down/Top/Bottom 会得到完全相反的结果。

**位置**：`api/source.ts` `moveSource` 函数

**问题**：

```typescript
// source.ts
const orderedIds = scene
  .getItems()
  .map((item) => item.id)
  .reverse()   // ← 变成「顶层在前」

// ...做移动操作（以顶层在前视图计算）...

scene.orderItems(next)  // ← 传入「顶层在前」的数组
```

但 `scene.orderItems` 调用的是：
```typescript
// scene.ts
export function orderItems(order: number[]): boolean {
  // ...
  tryRun('orderItems', () => mainScene!.orderItems(order))
```

而架构文档明确：
> `orderItems(order)` order[0] 为底层

所以 `moveSource` 传给 `scene.orderItems` 的是「顶层在前」，但 `mainScene.orderItems` 期望「底层在前」，**方向完全相反**，导致 Up = 实际向下，Top = 实际移到底层。

**修复**：
```typescript
// 传入前再次反转，恢复「底层在前」的顺序
scene.orderItems([...next].reverse())
```

---

## 五、缺失的测试覆盖

| 风险点 | 建议 |
|---|---|
| `scene.findInputById` native throw 兼容 | 加单元测试 mock native throw |
| `moveSource` Up/Down 方向（P0 Bug） | 加集成测试验证 z-order 变化方向 |
| `onAll` 重置时机 | 加单元测试验证多轮 init/destroy |
| `media.ts` 定时器 + 删源竞态 | 加单元测试（fake timer + remove） |
| `sourceStore` 未命中 fallback | 加单元测试 toSourceInfo 异常路径 |

---

## 六、改进优先级汇总

| 优先级 | 问题 | 文件 |
|---|---|---|
| ✅ **已修复** | `moveSource` z-order 方向 Bug | 误判，实际无问题 |
| ✅ **已修复** | `findInputById` native throw | `module/scene.ts` |
| ✅ **已修复** | `api/editor.ts` 违反 api 隔离约定 | `api/editor.ts` |
| ✅ **已修复** | `toSourceInfo` 缓存未命中无告警 | `api/source.ts` |
| ✅ **已修复** | `onAll` 重置时机竞态 | `common/events.ts` |
| ✅ **已修复** | logger 缺少 level 控制 | `common/logger.ts` |
| 🟢 **P3** | `shutdown` 失败后状态语义注释 | `module/core.ts` |
| 🟢 **P3** | `preview.ts` HiDPI contentHeight 注释 | `module/preview.ts` |
| 🟢 **P3** | 缺少单元/集成测试 | 全局 |
