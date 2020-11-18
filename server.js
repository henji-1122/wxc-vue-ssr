// 把渲染得到的结果发送给用户端浏览器
// 结合web端服务器处理（使用基于node平台web开发框架express为例）
const express = require('express')
const fs = require('fs')
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')

const server = express()

// 将dist中的文件开放出来，以便访问加载
// express.static 处理的是物理磁盘中的资源文件
// 当请求以dist开头的文件时，使用express.static方法在dist目录中查找
server.use('/dist', express.static('./dist'))  

const isProd = process.env.NODE_ENV === 'production'
let renderer
let onReady
// 如果是生产模式，就直接基于打包后的结果，去创建renderer就可以了
if (isProd) {
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const template = fs.readFileSync('./index.template.html', 'utf-8')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest
  })
} else {
// 开发模式 --> 监视打包构建 --> 重新生成renderer渲染器
onReady = setupDevServer(server, (serverBundle, template, clientManifest) => { // 传入实例本身server(express的web实例) 是因为在开发模式下给web实例(web服务)上挂载中间件
    // 基于重新打包的结果 生成renderer
    renderer = createBundleRenderer(serverBundle, {
      template,
      clientManifest
    })
  }) 
}

/**
 * 例：在express 的路由处理函数当中，渲染一个vue实例发送给客户端
 */

const render = async (req, res) => { // 路由处理函数
  try {
    const html = await renderer.renderToString({  // renderer是vue-ssr的渲染器
      title: '虫虫vue-ssr',
      meta: `<meta name="description" content="虫虫vue-ssr"></meta>`,
      url: req.url
    })
    // console.log(html)
    res.setHeader('Content-Type', 'text/html; charset=utf8')
    res.end(html)
  } catch (err) {
    //console.log(err)
    res.status(500).end('Internal Server Error.')
  }
}
// 当路由匹配到时，也需要对其进行判定
server.get('*', isProd 
  ? render  // 如果是生产模式，直接调用render，因为在生产模式下基于打包好的结果直接运行出来，不需要等待，render已经有了
  // 而且这里的render不需要传参，首先她没用调用，而是以函数本身的方式直接传递给了get方法的第二个参数，render会作为他的一个处理函数
  // 当路由匹配到调用这个方法，就会把req, res传递进去

  // 开发模式下需要等待打包成功后才能拿到render，进行渲染
  : async (req, res) => {
    // 等待有了render渲染器后，再调用render进行渲染
    await onReady
    render(req, res) // 此处的参数必须原样传入，否则render内部找不到请求对象和响应对象
    // 这里的render在外部包了一层函数，在内部手动调用时，要把请求对象和响应对象req, res手动传入
  }
)

// 启动web服务
server.listen(3000, () => {
  console.log('Server running at port 3000')
})