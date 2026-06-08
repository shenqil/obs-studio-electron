/**
 * [module] 模块层统一出口
 *
 * 以命名空间方式导出各能力模块，模块之间互不依赖，
 * 由 api 层导入并组装业务流程。
 */
export * as core from './core'
export * as scene from './scene'
export * as camera from './camera'
export * as screen from './screen'
export * as windowSource from './window'
export * as media from './media'
export * as microphone from './microphone'
export * as fader from './fader'
export * as streaming from './streaming'
export * as preview from './preview'
