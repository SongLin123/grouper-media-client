import Vue from 'vue'
import App from './App.vue'
import MediaComponents from "./index";

Vue.use(MediaComponents);
Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
