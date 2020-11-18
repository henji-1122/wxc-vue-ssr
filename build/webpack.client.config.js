/**
 * 客户端打包配置
 */
const { merge } = require('webpack-merge')  //合并webpack配置信息
const baseConfig = require('./webpack.base.config.js')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')//用于客户端渲染

module.exports = merge(baseConfig, {
  entry: {
    app: './src/entry-client.js'  // 客户端打包入口，路径相对于执行打包的路径vue-ssr
  },

  module: {
    rules: [
     {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          cacheDirectory: true,
          plugins: ['@babel/plugin-transform-runtime']
        }
      }
     }
    ]
  },

  // 重要信息：这将webpack 运行时分离到一个引导 chunk 中
  // 以便可以在之后正确注入异步chunk
  optimization: {
    splitChunks: {
      name: 'manifest',
      minChunks: Infinity
    }
  },

  plugins: [
    // 此插件在输出目录中生成vue-ssr-client-manifest.json 描述客户端打包结果中的依赖包括需要加载的一些模块信息
    // 客户端打包构建的资源清单
    new VueSSRClientPlugin()
  ]
})