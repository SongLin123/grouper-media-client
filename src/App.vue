<template>
  <div id="app">
    <!-- <videogroup ref="videogroup" :half="'left'"/> -->
    <div>
      <router-view></router-view>
    </div>
    
    <!-- <button class="start" @click="start">sdasdadsa</button> -->
    <!-- <button class="start" @click="stop">stop</button> -->
  </div>
</template>

<script>
// import videogroup from "./components/videoGroup";



export default {
  name: "app",
  components: {
    // videogroup
  },
  data() {
    return {
    };
  },
  methods: {

  },
  async created() {
    if(!this.$route.name){
       this.$router.push("/open")
    }
   
    
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.start {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 1000;
}
</style>
