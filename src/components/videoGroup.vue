<template>
  <div v-if="list.length>0" class="container">
    <div v-for="item in list" :key="item.id"  class="item">
      <videoitem :msgbody="item.msgbody" :ref="'video'+item.id"></videoitem>
    </div>
  </div>
</template>
<script>
import { Msgbody } from "../Msgbody";
import _ from "lodash";

import axios from "axios";
import io from "socket.io-client";

import videoitem from "./videoItem.vue";

export default {
  components: { videoitem },
  props: {},
  data() {
    return {
      path: "rtsp://admin:12345daoge@172.16.252.38:554/Streaming/Channels/0301",
      attr: {},
      col: 1, // 列
      row: 3, // 行
      //只有一个的video
      list: [],
      queueName:""
    };
  },
  methods: {
    async initAllvideo() {
      if (this.col * this.row <= 1) {
        let it = {
          id: 1,
          msgbody: new Msgbody(1, this.path, this.attr)
        };
        this.list.push(it);

        return;
      }
      await axios
        .get(`/api/video/initVideoList?count=${this.col * this.row}`)
        .then(async res => {
          const list = res.data.data.list;
          for (let index = 0; index < list.length; index++) {
            const element = list[index];
            let it = {
              id: index+1,
              msgbody: new Msgbody(index+1, element.url, element)
            };
            this.list.push(it);
          }
        });
    },
    async changeQueue(arg,queueName){
      console.log(queueName)
      this.queueName=queueName;
    if (_.isArray(arg)) {
        for (let index = 0; index < arg.length; index++) {

          const { sessionid, path, attr } = arg[index];
          let name = "video" + sessionid;
          console.log( arg)
          await this.$refs[name][0].changeRTSPByid(
            new Msgbody(sessionid, path, attr)
          );
        }
      } else {
        let { sessionid, path, attr } = arg;
        let name = "video" +sessionid;
        await this.$refs[name][0].changeRTSPByid(
          new Msgbody(sessionid, path, attr)
        );
      }
    }
  },
  async created() {
    await this.initAllvideo();

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

    const throttle=_.throttle(this.changeQueue,3000,{"leading":true,"trailing":false});
    this.socket.on("controlServer", throttle);
  }
};
</script>
<style lang="stylus" scoped>

.container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-flow: column wrap;

  .item {
    flex: 0 0 calc((100vh / 6));
    position: relative;
    text-align: center;
    overflow: hidden;
  }
}
</style>
