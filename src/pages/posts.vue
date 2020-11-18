<template>
  <div id="app">
    <h1>Post List</h1>
    <ul>
      <li v-for="(post, index) in posts" :key="index">{{post.comment}}</li>
    </ul>
  </div>
</template>

<script>
// import axios from 'axios'

// 将容器中的成员映射到组件当中
import { mapState, mapActions} from 'vuex'

export default {
  name: 'PostList',
  metaInfo: {
    title: 'Posts'
  },

  data () {
    return {
      // posts: []
    }
  },

  computed: {
    ...mapState(['posts'])
  },

  // Vue ssr 特殊为服务端渲染提供的一个生命周期钩子函数,在渲染之前调用，所以不能写在created中
  serverPrefetch () {
    // 发起action，返回Promise
    // 方式1：
    // this.$store.dispatch('getPosts')

    // 方式2：
    return this.getPosts() // !!! 需要return，因为this.getPosts()返回的是一个Promise
  },

  methods: {
    ...mapActions(['getPosts'])
  }

  // 服务端渲染
  //    只支持beforeCreated和created
  //    不会等到beforeCreated和created中的异步操作
  //    不支持响应式数据
  // 所有这一种做法在服务端渲染中是不会工作的！！！
  // async created () {
  //   console.log('Posts Created Start')
  //   const { data } = await axios({
  //     method: 'GET',
  //     url: 'https://cnodejs.org/api/v1/topics'
  //   })
  //   this.posts = data.data
  //   console.log('Posts Created End')
  // }

}
</script>

<style>

</style>