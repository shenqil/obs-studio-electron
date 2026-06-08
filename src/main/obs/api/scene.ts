/**
 * [api] 场景生命周期编排
 *
 * scene 模块本身是纯能力（创建/销毁主场景、场景项增删排序等），不监听事件。
 * 本文件负责把 scene 接入事件驱动的生命周期链：
 *
 *   init：依赖 core。监听 core:initialized，用其携带的 videoContext 创建主场景（闸门 2/3），
 *         完成后发出 scene:initialized（供 media 接力）。
 *   destroy：场景持有所有源；释放源前必须先释放挂在源上的附属资源——
 *         source 释放 Fader/降噪滤镜（detach/removeFilter 需源存活）、media 停止进度轮询、
 *         preview 释放 Display。故等待 media:destroyed + preview:destroyed + source:destroyed
 *         三者都到齐再销毁，用 try/finally 保证 scene:destroyed 无条件发出（core 在等它）。
 */
import { scene } from '../module'
import { obsEvents } from '../common/events'

obsEvents.on('core:initialized', ({ videoContext }) => {
  scene.createMainScene(videoContext)
  obsEvents.emit('scene:initialized')
})

obsEvents.onAll(['media:destroyed', 'preview:destroyed', 'source:destroyed'], () => {
  try {
    scene.destroyMainScene()
  } finally {
    obsEvents.emit('scene:destroyed')
  }
})
