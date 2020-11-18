/**
 * webpack公共配置文件
 */

const VueLoaderPlugin = require('vue-loader/lib/plugin') //处理.vue资源的插件
const path = require('path') //处理路径的node模块
const FriendlyErrorWebpackPlugin = require('friendly-errors-webpack-plugin') //webpack打包时的友好日志输出
const resolve = file => path.resolve(__dirname, file) //绝对安全的文件路径

const isProd = process.env.NODE_ENV === 'production' //拿到环境变量中的.NODE_ENV

// 导出的对象是客户端打包和服务端打包的公共配置内容
module.exports = {
  mode: isProd ? 'production' : 'development',
  output: {
    path: resolve('../dist/'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js' //通过打包计算出的hash值，文件一旦变化就会生成新的文件名，强制浏览器请求新的资源
  },
  resolve: {
    alias: {
      //  路径别名，@ 指向 src
      '@': resolve('../src/')
    },
    // 可以省略的扩展名
    // 当省略扩展名的时候，按照从前往后的顺序依次解析
    extensions: ['.js','.vue','.json']
  },
  devtool: isProd ? 'source-map' : 'cheap-module-eval-source-map',  //便于开发调试，错误信息能正确定位到源文件位置
  module: {
    rules: [
      // 处理图片资源
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      },
      //处理字体资源 
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader'
        ]
      },
      // 处理.vue资源
      {
        test: /\.vue$/,
        use: 'vue-loader'
      },
      // 处理css资源
      // 他会应用到普通的'.css'文件 以及'.vue'文件中的'<style>'块
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      // css 预处理器
      // {
      //   test: /\.less$/,
      //   use: [
      //     'vue-style-loader',
      //     'css-loader',
      //     'less-loader'
      //   ]
      // }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new FriendlyErrorWebpackPlugin()
  ]
}