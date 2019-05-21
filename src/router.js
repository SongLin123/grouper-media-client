import Vue from 'vue'
import Router from 'vue-router'
import videoGroup from './components/videoGroup.vue'
import Home from './components/home.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/open',
      name: 'open',
      component: Home
    },
    {
      path: '/left',
      name: 'left',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: videoGroup
    },
    {
      path: '/right',
      name: 'right',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: videoGroup
    }
  ]
})
