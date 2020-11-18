import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex) // 插件的方式注册vuex

export const createStore = () => {
  return new Vuex.Store({
    state: () => ({  // 写成函数方式：避免交叉请求带来的数据污染
      posts: []
    }),

    mutations: {
      setPosts (state, data) {
        state.posts = data
      }
    },

    actions: {
      // 在服务端渲染期间务必让action返回一个promise
      // 因为在服务端渲染期间action要等待promise完成以后才执行真正的渲染字符串的工作
      async getPosts ({ commit }) {
        console.log('start')
        // 方式1：手动返回一个Promise
        // return new Promise()

        // 方式2：使用async，async默认返回的是Promise
        const { data } = await axios.get('https://api.apiopen.top/musicRankings')
        console.log(data.result)
        // 提交mutation 更新到state中
        commit('setPosts', data.result)
      }
    }
  })
}

