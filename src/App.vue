<template>
  <div id="app">
    <!-- <videogroup ref="videogroup" :half="'left'"/> -->
    <div class="con">
      <media-components
        :sidename="sidename"
        :path="path"
        :attr="attr"
        :col="col"
        :row="row"
        :first="first"
        :initVideo="initVideo"
        :lockVideo="lockVideo"
        :getLockVideo="getLockVideo"
      ></media-components>
    </div>
  </div>
</template>

<script>
// import videogroup from "./components/video/videoGroup";
import { initVideo, lockVideo, getLockVideo } from "./api.js";

const Enum={
  SINGLE:"single",
  LEFT:"left",
  RIGHT:"right"
}
export default {
  name: "app",
  // components: {
  //   videogroup
  // },
  data() {
    return {
      sidename: Enum.SINGLE,
      path: "rtsp://admin:12345@10.2.0.64:554/Streaming/Channels/1301",
      attr: {},
      col: 1, // 列
      row: 5, // 行
      first: 1, //起点
      initVideo,
      lockVideo,
      getLockVideo
    };
  },
  methods: {},
  async created() {}
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
.con {
  width: 100vw;
  height: 100vh;
}
</style>
