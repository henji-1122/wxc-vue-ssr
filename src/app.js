/**
 * 通用启动入口
 */
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router/index.js' //加载路由配置模块
import VueMeta from 'vue-meta'
import { createStore } from './store'
        
Vue.use(VueMeta)

Vue.mixin({
  metaInfo: {
    titleTemplate: '%s - 虫虫vue-ssr' 
  }
})

// 导出一个工厂函数，用于创建新的
// 应用程序、router和store实例
export function createApp () {
  // 创建路由实例
  const router = createRouter()
  // 创建store容器实例
  const store = createStore() 

  const app = new Vue({
    router, //把路由挂载到vue根实例中
    store, //把容器挂载到vue根实例中
    // 根实例简单的渲染应用程序组件
    render: h => h(App)
  })
  return { app, router, store }  
}
