/**
 * OBS 原生调用兜底
 *
 * `osn.NodeObs` / IInput / ISceneItem 等都是跨进程原生绑定，偶发会抛。
 * 交互热路径（拖拽/缩放/排序）上单次原生异常不应中断手势或冒泡成 UncaughtException。
 * 这里提供统一的兜底封装：捕获异常、按作用域记录日志、返回是否成功 / 兜底值。
 */
import { createLogger, type Logger } from './logger'

const defaultLog = createLogger('osn')

/**
 * 执行一个原生写操作，失败时记录日志并返回 false（不抛出）。
 * @param label 操作描述，用于日志定位
 * @param fn 实际的原生调用
 * @param log 可选的作用域 logger（默认 [OBS:osn]）
 */
export function tryRun(label: string, fn: () => void, log: Logger = defaultLog): boolean {
  try {
    fn()
    return true
  } catch (error) {
    log.error(`${label} failed:`, error)
    return false
  }
}

/**
 * 执行一个原生读操作，失败时记录日志并返回兜底值（不抛出）。
 * @param label 操作描述，用于日志定位
 * @param fn 实际的原生调用
 * @param fallback 异常时返回的兜底值
 * @param log 可选的作用域 logger（默认 [OBS:osn]）
 */
export function tryGet<T>(label: string, fn: () => T, fallback: T, log: Logger = defaultLog): T {
  try {
    return fn()
  } catch (error) {
    log.error(`${label} failed:`, error)
    return fallback
  }
}
