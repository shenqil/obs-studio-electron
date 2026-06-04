/**
 * 源自定义元数据本地缓存（按 sourceName 索引）
 *
 * name/label/type 这三个自定义字段在创建源时确定，之后不再变化。
 * 每次 listSources 若回读 OBS settings 都是跨进程同步 IPC，源多时开销明显，
 * 故创建源时缓存，listSources 直接按 item.source.name 读缓存；
 * 删除源 / 销毁场景时清理，避免泄漏。
 */
import type { SourceType } from '../../../shared/types'

export interface SourceMeta {
  /** 自定义名称 */
  name: string
  /** 自定义标签（可选展示名） */
  label: string
  /** 源类型 */
  type: SourceType
}

/** key = OBS 内部源名（item.source.name） */
const store = new Map<string, SourceMeta>()

/** 写入/覆盖某源的元数据（创建源时调用）。 */
export function set(sourceName: string, meta: SourceMeta): void {
  store.set(sourceName, meta)
}

/** 读取某源的元数据，未命中返回 undefined。 */
export function get(sourceName: string): SourceMeta | undefined {
  return store.get(sourceName)
}

/** 删除某源的元数据（移除源时调用）。 */
export function remove(sourceName: string): void {
  store.delete(sourceName)
}

/** 清空全部（销毁场景时调用）。 */
export function clear(): void {
  store.clear()
}
