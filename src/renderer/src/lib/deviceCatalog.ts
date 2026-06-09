/**
 * 设备目录：把「摄像头 / 显示器 / 窗口」三类可添加源的差异集中到一处配置，
 * 供通用的 useDeviceList 与 DeviceList 组件复用，避免三套重复的 hook/列表组件。
 */
import { Video, Monitor, Square } from 'lucide-react'
import type { DeviceInfo, CreateSourceParams } from '@renderer/types/obs'

/** 可添加的设备类型（与 SourceInfo.sourceType 中的视频类对应） */
export type DeviceKind = 'camera' | 'monitor' | 'window'

export interface DeviceCatalogEntry {
  /** 列表标题 */
  title: string
  /** 空列表主提示 */
  emptyText: string
  /** 空列表副提示（可选） */
  emptyHint?: string
  /** 列表项图标 */
  icon: React.ComponentType<{ className?: string }>
  /** 枚举设备 */
  list: () => Promise<DeviceInfo[]>
  /** 添加为源，返回场景项 id（失败为 null） */
  add: (params: CreateSourceParams) => Promise<number | null>
}

export const DEVICE_CATALOG: Record<DeviceKind, DeviceCatalogEntry> = {
  camera: {
    title: '选择摄像头',
    emptyText: '未检测到摄像头设备',
    emptyHint: '请确保摄像头已连接',
    icon: Video,
    list: () => window.api.obs.getCameras(),
    add: (params) => window.api.obs.addCamera(params)
  },
  monitor: {
    title: '选择显示器',
    emptyText: '未检测到显示器',
    icon: Monitor,
    list: () => window.api.obs.getMonitors(),
    add: (params) => window.api.obs.addMonitor(params)
  },
  window: {
    title: '选择窗口',
    emptyText: '未检测到可捕获的窗口',
    icon: Square,
    list: () => window.api.obs.getWindows(),
    add: (params) => window.api.obs.addWindow(params)
  }
}
