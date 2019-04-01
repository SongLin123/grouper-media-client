<template>
  <div id="app">
    <HelloWorld ref="videogroup" :path="'rtsp://admin:12345daoge@172.16.252.38:554/Streaming/Channels/0301'" :col="col" :row="row"/>
    <!-- <button class="start" @click="start">sdasdadsa</button> -->
    <!-- <button class="start" @click="stop">stop</button> -->
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import io from "socket.io-client";

import { Msgbody } from "./Msgbody.js";

import _ from "lodash";

import axios from "axios";

export default {
  name: "app",
  components: {
    HelloWorld
  },
  data() {
    return {
      col: 3,
      row: 1,
      socket: null,
      prop: []
    };
  },
  methods: {
    async initAllvideo() {
      if (this.col * this.row <= 1) throw "onevideo";
      await axios
        .get(`/api/video/initVideoList?count=${this.col * this.row}`)
        .then(async res => {
          const list = res.data.data.list;
          for (let index = 0; index < list.length; index++) {
            const element = list[index];
            await this.$refs["videogroup"].changeRTSPByid(
              new Msgbody(index, element.url, element)
            );
          }


          
        });
    }
  },
  async created() {
    try {
      await this.initAllvideo();
    } catch (e) {
      if (e === "onevideo") return;
    }

    this.socket = io(`http://${location.hostname}:8360`, {
      path: "/socket.io",
      transports: ["websocket"],
      query: {
        token: "left",
        number: this.row * this.col
      }
    });
    this.socket.on("connect", async () => {
      // 初始化播放列表

      this.socket.emit("controlClient");
    });

    this.socket.on("controlServer",async arg => {
      if (_.isArray(arg)) {
        for (let index = 0; index < arg.length; index++) {
          const { sessionid, path, attr } = arg[index];
          await this.$refs["videogroup"].changeRTSPByid(
            new Msgbody(sessionid, path, attr)
          );
        }
          
    
        
        
      } else {
        let { sessionid, path, attr } = arg;
        await this.$refs["videogroup"].changeRTSPByid(
          new Msgbody(sessionid, path, attr)
        );
      }
    });
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
