/**
 * 服务端入口
 */

import { createApp } from './app'

export default async context => {  //async返回的就是promise
  // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
    // 以便服务器能够等待所有的内容在渲染前，
    // 就已经准备就绪。
    const { app, router, store } = createApp()

    const meta = app.$meta() // here 通过vue实例得到$meta信息

    // 设置服务器端 router 的位置
    router.push(context.url) 

    // 在路由导航后就拿到对应的页面，页面拿到就拿到自己的meta信息，mate信息就和他合并到一起
    // 把最终的结果放在context上下文当中，目的就是在页面模板当中访问context中的数据
    context.meta = meta // and here 将meta设置到context.meta上下文当中

    // 等到 router 将可能的异步组件和钩子函数解析完
    // 将onReady转换成Promise，因为onReady其本身不支持Promise
    await new Promise(router.onReady.bind(router))  //onReady内部this指向问题

    // 把服务端渲染期间获取填充到容器中的数据，同步到客户端容器中，从而避免2个端状态不一致导致客户端重新渲染的问题
    context.rendered = () => {
      // Renderer回吧context.state数据对象内联到页面模板中
      // 最终发送给客户端的页面中会包含一段脚本：window.__INITIAL_STATE__ = context.state
      // 客户端就要把页面中的window.__INITIAL_STATE__拿出来填充到客户端store容器中
      context.state = store.state
    }

    return app  //async函数对于非promise数据，会将其包装到一个Promise，成功后返回对应的数据
}

// 以上是把官方服务端路由入口纯Promise方式修改为async await方式，更直观


// 官网代码：
// export default context => {
//   // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
//     // 以便服务器能够等待所有的内容在渲染前，
//     // 就已经准备就绪。
//   return new Promise((resolve, reject) => {
//     const { app, router } = createApp()

//     // 设置服务器端 router 的位置
//     router.push(context.url)

//     // 等到 router 将可能的异步组件和钩子函数解析完
//     router.onReady(() => {
//       const matchedComponents = router.getMatchedComponents()
//       // 匹配不到的路由，执行 reject 函数，并返回 404
//       if (!matchedComponents.length) {
//         return reject({ code: 404 })
//       }

//       // Promise 应该 resolve 应用程序实例，以便它可以渲染
//       resolve(app)
//     }, reject)
//   })
// }