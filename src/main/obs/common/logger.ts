/**
 * OBS 统一日志
 *
 * 为每个模块提供带作用域前缀的 logger，保证每一步日志清晰、可追踪。
 * 形如：[OBS:core] Initializing OBS core...
 *
 * ## Log Level 控制
 *
 * 通过环境变量 `OBS_LOG_LEVEL` 设置全局级别（debug / info / warn / error / silent）。
 * 未设置时按运行环境决定默认值：
 *   - 生产包（app.isPackaged = true）：info（屏蔽 debug 日志，避免敏感信息泄漏）
 *   - 开发模式：debug（完整输出）
 */
import { app } from 'electron'

type LogArg = unknown

/** 日志级别枚举（数值越大越严格） */
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
}

/**
 * 解析当前生效的日志级别。
 * 优先读环境变量 OBS_LOG_LEVEL；未设置时生产包默认 info，开发默认 debug。
 */
function resolveLevel(): LogLevel {
  const env = process.env.OBS_LOG_LEVEL as LogLevel | undefined
  if (env && env in LEVEL_ORDER) {
    return env
  }
  return app.isPackaged ? 'info' : 'debug'
}

let currentLevel = resolveLevel()

/** 运行时变更日志级别（测试 / 动态调试用）。 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level
}

/** 读取当前日志级别。 */
export function getLogLevel(): LogLevel {
  return currentLevel
}

function format(scope: string, message: string): string {
  return `[OBS:${scope}] ${message}`
}

function isEnabled(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel]
}

export interface Logger {
  debug(message: string, ...args: LogArg[]): void
  info(message: string, ...args: LogArg[]): void
  warn(message: string, ...args: LogArg[]): void
  error(message: string, ...args: LogArg[]): void
}

/**
 * 创建一个带作用域的 logger。
 * @param scope 作用域名称，例如 'core' / 'scene' / 'streaming'
 */
export function createLogger(scope: string): Logger {
  return {
    debug(message, ...args) {
      if (isEnabled('debug')) console.debug(format(scope, message), ...args)
    },
    info(message, ...args) {
      if (isEnabled('info')) console.info(format(scope, message), ...args)
    },
    warn(message, ...args) {
      if (isEnabled('warn')) console.warn(format(scope, message), ...args)
    },
    error(message, ...args) {
      if (isEnabled('error')) console.error(format(scope, message), ...args)
    }
  }
}
