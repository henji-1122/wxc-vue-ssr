/**
 * 客户端入口  创建vue实例，将实例挂载到DOM中
 */
import { Store } from 'vuex'
import { createApp } from './app'

// 客户端特定引导逻辑……

// 通过服务端传递进来的window.__INITIAL_STATE__数据同步到客户端的store容器中
const { app, router, store } = createApp()  // 客户端store容器

// 如果有数据window.__INITIAL_STATE__
if(window.__INITIAL_STATE__){
  // store.replaceState方法替换容器的数据状态
  store.replaceState(window.__INITIAL_STATE__)
}

router.onReady(() => {
  app.$mount('#app')
})


