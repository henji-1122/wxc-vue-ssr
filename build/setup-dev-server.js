const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar') // 监视文件的变化
const webpack = require('webpack')
const devMiddleware = require('webpack-dev-middleware') // 将打包构建的文件输出到内存
const hotMiddleware = require('webpack-hot-middleware') // 热更新工具

// 封装读取文件方法
const resolve = file => path.resolve(__dirname, file)


module.exports = (server, callback) => {
  let ready // 用来获取Promise的resolve
  const onReady = new Promise(r => ready = r)

  // 监视构建 --> 更新renderer

  let template
  let serverBundle
  let clientManifest

  // 在update中调用callback更新server renderer
  const update = () => {
    if (template && serverBundle && clientManifest) { // 当这些资源都构建好后调用callback
      ready()
      // callback一调用就会执行server.js中的createBundleRenderer重新创建render渲染器
      callback(serverBundle, template, clientManifest)  // callback一调用就意味着开发模式下的打包构建已经完成了，此时的promise就是resolve状态
    }
  }

  /*** 监视构建template --> 调用update --> 更新renderer渲染器***/
  const templatePath = path.resolve(__dirname, '../index.template.html')
  template = fs.readFileSync(templatePath, 'utf-8')
  update()
  // console.log(template)
  // 监视模板文件的变化：可以使用 fs.watch 或者 fs.watchFile 但是这两个不是很好用
  // 推荐一个第三方包：chokidar 从功能和性能上都很好，也是封装了原生的监视模块(https://github.com/paulmillr/chokidar/tree/3.4.0)
  chokidar.watch(templatePath).on('change', () => {
    // console.log('template change')
    // 监视变化后重新读取模板文件 赋值
    template = fs.readFileSync(templatePath, 'utf-8')
    update()
  })
  
  /*** 监视构建serverBundle --> 调用update --> 更新renderer渲染器***/
  // 调用webpack编译构建
  const serverConfig = require('./webpack.server.config') // 服务端的打包配置对象
  // 使用webpack创建编译器
  const serverCompiler = webpack(serverConfig) //调用webpack，传入打包的配置对象， serverCompiler接收其返回值
  const serverDevMiddleware = devMiddleware(serverCompiler, { // devMiddleware会自动打包构建,也是监视的方式
    logLevel: 'silent' // 关闭日志输出，由FriendlyErrorWebpackPlugin统一处理
  })
  // 每当构建完，就读出文件，update更新
  serverCompiler.hooks.done.tap('server', () => {
    serverBundle = JSON.parse(
      // fs读取的是物理磁盘中的文件,fileSystem操作内存中的文件
      serverDevMiddleware.fileSystem.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8') // 这里是字符串
    )
    // console.log(serverBundle) // 服务端打包结果
    update()
  })

  // 下面的监视就不需要了
  /***
    serverCompiler.watch({}, (err, stats) => { // 调用watch会直接监视资源改变执行打包构建，第一个选项对象不能省略，空也不能省
    if(err) throw err // 这里错误是webpack本身的错误，如配置文件写错了等
    // stats是构建出的结果模块相关的一些信息对象
    if(stats.hasErrors()) return // 判读打包的结果中是否有错误(指自己源代码中的错误)
    // 构建成功 -- 会在dist中生成vue-ssr-server-bundle.json文件，说明打包成功
    console.log('success')
    // 把最新构建的vue-ssr-server-bundle.json读出来，调用update更新，生成render渲染器
    // 读取文件也可以使用require，但是require有缓存，读到的不一定是最新的文件
    serverBundle = JSON.parse(
      fs.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8') // 这里是字符串
    )
    console.log(serverBundle)
    update()
  })
   */
 

  /*** 监视构建clientManifest --> 调用update --> 更新renderer渲染器 ***/ 
  // 调用webpack编译构建
  const clientConfig = require('./webpack.client.config') // 服务端的打包配置对象
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  // 修改入口配置
  clientConfig.entry.app = [
    // 和服务端交互处理热更新的一个客户端脚本
    // 参数quiet=true是取消热更新日志输出，reload=true作用是当webpack热更新时卡住了，就会强制刷新整个页面，避免无法更新的问题
    'webpack-hot-middleware/client?quiet=true&reload=true', 
    clientConfig.entry.app // 原本的客户端打包入口(webpack.client.config.js)
  ]
  clientConfig.output.filename ='[name].js' // 热更新模式下确保一致的hash(这里采取不设置),否则报错
  // 使用webpack创建编译器
  const clientCompiler = webpack(clientConfig) //调用webpack，传入打包的配置对象， clientCompiler接收其返回值
  const clientDevMiddleware = devMiddleware(clientCompiler, { // devMiddleware会自动打包构建,也是监视的方式
    // 用于构建输出当中请求前缀路径 
    // 方式1：可以硬编码写死，不推荐
    // publicPath: './dist', // 打包输出的output的publicPath一致
    // 方式2：动态获取
    publicPath: clientConfig.output.publicPath,
    logLevel: 'silent' 
  })
  // 每当构建完，就读出文件，update更新
  clientCompiler.hooks.done.tap('client', () => {
    clientManifest = JSON.parse(
      // fs读取的是物理磁盘中的文件,fileSystem操作内存中的文件
      clientDevMiddleware.fileSystem.readFileSync(resolve('../dist/vue-ssr-client-manifest.json'), 'utf-8') // 这里是字符串
    )
    // console.log(clientManifest) // 客户端打包结果
    update()
  })

  // 将中间件挂载到express的实例server上(在Network中就会额外加载一个_webpack_hmr的脚本，就是用来和服务端交互热更新的客户端库)
  server.use(hotMiddleware(clientCompiler, {  // 传入webpack打包的编译器clientCompiler
    log: false // 关闭他本身的日志输出
  }))

  // express.static 处理的是物理磁盘中的资源文件，而devMiddleware是将打包的输出结果保存到了内存中，所以在物理磁盘中就找不到打包结果
  // 重要！！！将clientDevMiddleware 挂载到express服务中，提供对其内存中数据的访问
  // 服务端是不需要的,因为服务端在本地通过内存去操作数据就可以,而客户端需要通过web通过http服务请求服务器上的资源,所以需要单独处理
  server.use(clientDevMiddleware)


  return onReady
}