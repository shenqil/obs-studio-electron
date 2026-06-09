/**
 * [common] 通用工具
 *
 * 与 OBS 业务无关的纯函数 / 高阶函数，供各层复用。
 */
import * as path from 'path'
import { app } from 'electron'

/**
 * 获取预编译 Native 模块（.node 文件）的绝对路径。
 *
 * 目录约定：
 *   native-modules/
 *     darwin-arm64/<moduleName>/<binaryName>.node
 *     darwin-x64/<moduleName>/<binaryName>.node
 *
 * - 开发环境：相对项目根目录（app.getAppPath()）寻找。
 * - 生产环境：electron-builder 通过 extraResources 将对应平台/架构目录
 *   复制到 process.resourcesPath/native-modules/，直接从那里加载。
 *
 * @param moduleName 子目录名，例如 'node-window-rendering'
 * @param binaryName .node 文件名，例如 'node_window_rendering.node'
 * @returns 绝对路径字符串
 */
export function getNativeBinaryPath(moduleName: string, binaryName: string): string {
  if (!app.isPackaged) {
    // 开发环境：native-modules 在项目根目录下，需要按平台/架构选取
    const platformArch = `${process.platform}-${process.arch}`
    return path.join(app.getAppPath(), 'native-modules', platformArch, moduleName, binaryName)
  }
  // 生产环境：extraResources 将对应平台目录直接复制到 resources/native-modules/
  return path.join(process.resourcesPath, 'native-modules', moduleName, binaryName)
}

/**
 * 标准节流：在 `wait` 毫秒窗口内最多触发一次 `fn`。
 *
 * 语义（leading + trailing）：
 *   - 首次调用立即执行（leading）。
 *   - 窗口内的后续调用被合并；窗口结束时若期间有过调用，再补发一次（trailing），
 *     用最后一次调用的参数，保证「最终状态」不丢失。
 *
 * 适用于高频触发但只需最终一致的广播场景（如源列表 sources:changed）。
 *
 * @param fn   被节流的函数
 * @param wait 节流窗口（毫秒）
 * @returns 节流后的函数，附带 `cancel()` 清除待发的 trailing 调用
 */
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): ((...args: A) => void) & { cancel: () => void } {
  let lastInvoke = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: A | null = null

  const invoke = (args: A): void => {
    lastInvoke = Date.now()
    fn(...args)
  }

  const throttled = (...args: A): void => {
    const now = Date.now()
    const remaining = wait - (now - lastInvoke)

    if (remaining <= 0) {
      // 不在窗口内：立即执行（leading）
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      pendingArgs = null
      invoke(args)
      return
    }

    // 窗口内：记录最新参数，安排一次 trailing 补发
    pendingArgs = args
    if (!timer) {
      timer = setTimeout(() => {
        timer = null
        if (pendingArgs) {
          const args = pendingArgs
          pendingArgs = null
          invoke(args)
        }
      }, remaining)
    }
  }

  throttled.cancel = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
  }

  return throttled
}
