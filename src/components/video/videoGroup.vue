
<template>
  <div class="container videoGroup">
    <div v-if="col*row!==1" class="titleDiv">
      <marquee-title :marquee-title="queueName"></marquee-title>
    </div>
    <div class="videoDiv">
      <div v-for="item in list" :key="item.id" class="videoitem">
        <videoitem
          :lockstate="item.lockstate"
          :canlock="item.nolock"
          :msgbody="item.msgbody"
          :ref="'video'+item.id"
          @rightclick="rightclick"
        ></videoitem>
      </div>
    </div>
  </div>
</template>
<script>
import { Msgbody } from "./Msgbody";
import _ from "lodash";

import io from "socket.io-client";

import videoitem from "./videoItem.vue";
import marqueeTitle from "./marqueeTitle";

export default {
  name: "MediaComponents",
  components: { videoitem, marqueeTitle },
  props: {
    //组播，全部为1即为单播
    col: {
      type: Number,
      required: true
    },
    row: {
      type: Number,
      required: true
    },
    first: {
      type: Number,
      required: true
    },
    //区分单页
    sidename: String,

    //单播的播放源
    path: { type: String, required: false, defalut: null },
    attr: { type: Object, required: false, defalut: null },


    //组播时的api
    initVideo: {
      type: Function,
      required: false,
      defalut: null
    },
    lockVideo: {
      type: Function,
      required: false,
      defalut: null
    },
    getLockVideo: {
      type: Function,
      required: false,
      defalut: null
    }
  },
  data() {
    return {
      // path: "rtsp://admin:12345daoge@172.16.252.38:554/Streaming/Channels/0301",
      // attr: {},
      // col: 1, // 列
      // row: 1, // 行
      // first: 1, //起点
      //只有一个的video
      list: [],
      lockcams: [],
      queueName: "",
      videoTitle: "定时轮屏任务"
    };
  },

  methods: {
    rightclick(par) {
      let item = _.find(this.list, { id: Number(par.sessionid) });
      item.lockstate = !item.lockstate;

      if (_.find(this.lockcams, { sessionid: par.sessionid })) {
        _.remove(this.lockcams, function(item) {
          return item.sessionid === par.sessionid;
        });
      } else {
        this.lockcams.push(par);
      }

      this.lockVideo({ cams: this.lockcams });
    },
    async getlocklist() {
      await this.getLockVideo().then(res => {
        this.lockcams = res.data.cams;
        res.data.cams.forEach(element => {
          if (element.sessionid) {
            this.$refs["video" + element.sessionid][0].lockstate = true;
          }
        });
      });
    },

    async getList() {
      let videolist = localStorage.getItem("videolist" + this.sidename);
      if (videolist) {
        this.list = JSON.parse(videolist);
      } else {
        await this.initVideo({
          count: this.col * this.row,
          first: this.first
        }).then(async res => {
          let { list, first } = res.data;
          first = Number(first);

          for (let index = 0; index < list.length; index++) {
            const element = list[index];
            let it = {
              id: first,
              msgbody: new Msgbody(first, element.url, element.attr),
              lockstate: false
            };
            this.list.push(it);
            first++;
          }
        });
      }
    },

    async initAllvideo() {
      if (this.col * this.row <= 1) {
        let it = {
          id: 1,
          msgbody: new Msgbody(1, this.path, this.attr),
          lockstate: false,
          nolock: true
        };
        this.list.push(it);

        return;
      }

      await this.getList();
      await this.getlocklist();

      this.$nextTick(() => {
        const videodiv = document.querySelector(".videoDiv");
        videodiv.style.setProperty(
          "grid-template-columns",
          `repeat(${this.col}, ${this.col}fr)`
        );
        videodiv.style.setProperty(
          "grid-template-rows",
          `repeat(${this.row}, ${this.row}fr)`
        );
      });
    },
    /* eslint-disable */
    async changeQueue(arg, queueName) {
      console.log(queueName);
      this.queueName = queueName;

      if (_.isArray(arg)) {
        for (let index = 0; index < arg.length; index++) {
          const { sessionid, path, attr } = arg[index];
          let name = "video" + sessionid;

          await this.$refs[name][0].changeRTSPByid(
            new Msgbody(sessionid, path, attr)
          );
        }
      } else {
        let { sessionid, path, attr } = arg;
        let name = "video" + sessionid;

        await this.$refs[name][0].changeRTSPByid(
          new Msgbody(sessionid, path, attr)
        );
      }
    }
  },
  async created() {
    if (
      !(this.lockVideo && this.getLockVideo && this.initVideo) &&
      this.col * this.row !== 1
    ) {
      console.error("Fuction lockVideo or getLockVideo or initVideo not bind");
      return;
    }
    await this.initAllvideo();
    localStorage.setItem(this.sidename, true);

    if (this.col * this.row !== 1) {
      setTimeout(() => {
        let arr = [];
        for (let key in this.$refs) {
          let ele = this.$refs[key][0].videoitem;

          arr.push({
            id: ele.sessionid,
            msgbody: {
              attr: ele.attr,
              path: ele.rtsp,
              sessionid: ele.sessionid
            }
          });
        }
        localStorage.setItem("videolist" + this.sidename, JSON.stringify(arr));
        location.reload();
      }, 1800 * 1000);

      this.socket = io(`http://${location.hostname}:${location.port}`, {
        path: "/socket.io",
        transports: ["websocket"],
        query: {
          first: this.first,
          number: this.row * this.col
        }
      });
      this.socket.on("connect", async () => {
        // 初始化播放列表

        this.socket.emit("controlClient");
      });

      const throttle = _.throttle(this.changeQueue, 3000, {
        leading: true,
        trailing: false
      });
      this.socket.on("controlServer", throttle);
    } else {
      let videoDiv = document.querySelector(".videoDiv");
      videoDiv.style.setProperty("height", "100%");
      videoDiv.style.setProperty("display", "block");
      videoDiv.querySelector(".videoitem").style.setProperty("height", "100%");
    }
  },
  beforeDestroy() {
    localStorage.removeItem(this.sidename);
  }
};
</script>
<style lang="stylus" scoped>
$titleDivHeight = 40px;

* {
  padding: 0;
  margin: 0;
}

.container {
  height: 100%;
  width: 100vw;
  min-height: 0;
  min-width: 0;
}

.videoGroup {
  width: 100%;

  .titleDiv {
    height: $titleDivHeight;
    background-color: #cccccc;
    line-height: @height;
  }

  .videoDiv {
    height: 'calc(100% - %s)' % $titleDivHeight;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 2fr);
    grid-template-rows: repeat(6, 6fr);

    .videoitem {
      position: relative;
    }
  }
}
</style>
