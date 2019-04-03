<template>
  <div id="app">
    <videogroup ref="videogroup" />
    <!-- <button class="start" @click="start">sdasdadsa</button> -->
    <!-- <button class="start" @click="stop">stop</button> -->
  </div>
</template>

<script>
import videogroup from "./components/videoGroup";

// import { Msgbody } from "./Msgbody.js";

// import _ from "lodash";

// import axios from "axios";

export default {
  name: "app",
  components: {
    videogroup
  },
  data() {
    return {
      col: 1,
      row: 1,
      socket: null,
      prop: []
    };
  },
  methods: {

  },
  async created() {
    // try {
    //   await this.initAllvideo();
    // } catch (e) {
    //   if (e === "onevideo") return;
    // }

    
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
