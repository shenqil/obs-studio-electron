/**
 * OBS 统一日志
 *
 * 为每个模块提供带作用域前缀的 logger，保证每一步日志清晰、可追踪。
 * 形如：[OBS:core] Initializing OBS core...
 */

type LogArg = unknown

function format(scope: string, message: string): string {
  return `[OBS:${scope}] ${message}`
}

export interface Logger {
  debug(message: string, ...args: LogArg[]): void
  info(message: string, ...args: LogArg[]): void
  warn(message: string, ...args: LogArg[]): void
  error(message: string, ...args: LogArg[]): void
}

/**
 * 创建一个带作用域的 logger
 * @param scope 作用域名称，例如 'core' / 'scene' / 'streaming'
 */
export function createLogger(scope: string): Logger {
  return {
    debug(message, ...args) {
      console.debug(format(scope, message), ...args)
    },
    info(message, ...args) {
      console.info(format(scope, message), ...args)
    },
    warn(message, ...args) {
      console.warn(format(scope, message), ...args)
    },
    error(message, ...args) {
      console.error(format(scope, message), ...args)
    }
  }
}
