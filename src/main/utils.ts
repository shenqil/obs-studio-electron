import { app } from 'electron';
import * as path from 'path';

/**
 * 获取指定原生 Node 模块在当前环境下的绝对物理路径
 * 完美适配：开发环境、打包环境（ASAR Unpacked）、macOS (darwin)、Windows (win32)
 * 
 * @param moduleName 模块名称，例如 '@shen9401/obs-studio-node' 或 'sharp'
 * @returns 模块的绝对物理路径
 */
export function getNativeModulePath(moduleName: string): string {
  const isDev = !app.isPackaged;
  const appPath = app.getAppPath();

  if (isDev) {
    // 1. 开发环境：直接基于项目根目录寻找 node_modules
    return path.join(appPath, 'node_modules', moduleName);
  }

  // 2. 生产环境：处理 ASAR 打包情况
  // 现代 electron-builder 会将 unpacked 资源统一放置在 app.asar.unpacked 文件夹内
  if (appPath.endsWith('.asar')) {
    // 如果 appPath 已经是 .../app.asar，则替换为 .../app.asar.unpacked
    const unpackedAppPath = appPath + '.unpacked';
    return path.join(unpackedAppPath, 'node_modules', moduleName);
  } else {
    // 某些极端打包配置下 appPath 可能未包含 .asar 后缀，但实际同级存在 .unpacked 目录
    // 比如标准的 macOS Contents/Resources/app.asar 以外的特殊情况
    return path.join(appPath + '.unpacked', 'node_modules', moduleName);
  }
}

/**
 * 获取应用数据目录路径
 * 开发环境：项目根目录 + 目录名称
 * 生产环境：系统应用数据目录 (appData) + 应用名称 + 目录名称
 * 
 * @param dirName 目录名称，例如 'obs-data', 'logs', 'config'
 * @returns 数据目录的绝对路径
 */
export function getAppDataPath(dirName: string): string {
  const isDev = !app.isPackaged;

  if (isDev) {
    // 开发环境：使用项目根目录
    const appPath = app.getAppPath();
    return path.join(appPath, dirName);
  } else {
    // 生产环境：使用系统应用数据目录
    // Windows: %APPDATA%\\{appName}\\{dirName}
    // macOS: ~/Library/Application Support/{appName}/{dirName}
    // Linux: ~/.config/{appName}/{dirName}
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, dirName);
  }
}