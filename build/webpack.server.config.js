/**
 * 服务端打包配置
 */
const { merge } = require('webpack-merge')  //合并webpack配置信息
const nodeExternals = require('webpack-node-externals') //不打包node_modules第三方包，保留require方式直接加载
const baseConfig = require('./webpack.base.config.js')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')//用于服务端渲染

module.exports = merge(baseConfig, {
  // 将 entry 指向应用程序的 server entry 文件
  entry: './src/entry-server.js',

  // 这允许webpack 以 node 使用方式处理模块加载
  // 并且还会在编译 vue 组件时 告知vue-loader 输送面向服务器代码（server-oriented code）
  target: 'node',

  output: {
    filename: 'server-bundle.js',
    // 此处告知server bundle 使用node风格导出模块(Node-style exports) commonJs
    libraryTarget: 'commonjs2'
  },

  // 不打包 node_modules 第三方包， 而是保留原生require方式直接加载
  externals: [nodeExternals({
    // 白名单中的资源依然正常打包
    allowlist: [/\.css$/]
  })],

  plugins: [
    // 这是将服务器的整个输出构建为单个 json文件的插件
    // 默认文件名为vue-server-bundle.js
    new VueSSRServerPlugin()
  ]
})