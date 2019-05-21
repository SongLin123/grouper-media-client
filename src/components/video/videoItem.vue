

<template>
  <div class="containerVideoItem">
    <div
      :class="'item'"
      :ref="`videoBox`"
      @contextmenu="rightclick"
      @mouseover="showTitle=true"
      @mouseleave="showTitle=false"
    >
      <div class="border" @dblclick="fullscreen" :class="lockstate?'locked':''"></div>
      <div class="pathTitle" v-show="showTitle">{{path}}</div>
      <video class="video" autoplay muted></video>
      <canvas v-show="false" ref="dif"></canvas>
      <canvas v-show="false" ref="cur"></canvas>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import _ from "lodash";
import { drawImg, calcDiff } from "./testingStop.js";

import kurentoUtils from "kurento-utils";
import { EventEmitter } from "events";

const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

function onError(msg) {
  console.warn(msg);
}
class VideoItem {
  constructor({ sessionid, path, attr }) {
    let stopEvent = new EventEmitter();
    return {
      sessionid,
      rtsp: path,
      video: null,
      webRtcPeer: null,
      state: null,
      isSeekable: false,
      attr,
      stopEvent
    };
  }
}

export default {
  name:"videoItem",
  props: {
    msgbody: {},
    lockstate: Boolean,
    nolock:Boolean
  },
  data() {
    return {
      test: "",
      videoitem: {},
      socket: null,
      socketPath: "signal",
      showTitle: false,
      path: "",

      preCanvas: null, //前一帧
      curCanvas: null, //当前帧
      diffCanvas: null, //差异帧
      preFrame: null, //前一帧
      curFrame: null, //当前帧
      diffFrame: null //差异帧
    };
  },
  
  methods: {
    rightclick(e) {
      e.preventDefault();
      if(this.nolock) return;
      
      const video = this.videoitem;
      this.$emit("rightclick", {
        sessionid: video.sessionid,
        attr: video.attr,
        path: video.rtsp
      });
    },

    setState(item, state) {
      switch (state) {
        case I_CAN_START:
          item.video.style.setProperty(
            "background",
            "center/10% url('/static/warn.png') no-repeat",
            "important"
          );
          break;

        case I_CAN_STOP:
          break;

        case I_AM_STARTING:
          item.video.style.setProperty(
            "background",
            "center / 20% #fff url('/static/spinner.gif') no-repeat",
            "important"
          );
          break;

        default:
          onError("Unknown state " + state);
          return;
      }
      item.state = state;
    },

    async sendMessage(msg) {
      const jsonmsg = JSON.stringify(msg);
      await new Promise(res => {
        this.socket.emit(this.socketPath, jsonmsg);

        res();
      });
    },

    fullscreen(e){
      e.target.parentNode.querySelector("video").requestFullscreen();
    },
    init(videoItem) {
      const elem = (videoItem.video = this.$refs["videoBox"].querySelector(
        "video"
      ));
      elem.addEventListener("dblclick", function(e) {
        if (elem.requestFullscreen && !document.fullscreenElement) {
          elem.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        e.preventDefault();
      });

      this.changeRTSPByid(this.msgbody);
    },

    start(videoItem) {
      if (videoItem.state !== I_CAN_START) {
        this.stop(videoItem);
      }

      this.setState(videoItem, I_AM_STARTING);
      let options = {
        remoteVideo: videoItem.video,
        mediaConstraints: {
          audio: false,
          video: {
            width: 1280,
            height: 720,
            frameRate: 25,
            aspectRatio: 1.77
          }
        },
        onicecandidate: onIceCandidate
      };

      const that = this;

      async function onOffer(error, offerSdp) {
        if (error) return console.error("Error generating the offer");

        var message = {
          id: "start",
          sdpOffer: offerSdp,
          videourl: videoItem.rtsp,
          sessionid: videoItem.sessionid
        };
        await that.sendMessage(message);
      }

      async function onIceCandidate(candidate) {
        var message = {
          id: "onIceCandidate",
          candidate: candidate,
          videourl: videoItem.rtsp,
          sessionid: videoItem.sessionid
        };
        await that.sendMessage(message);
      }

      videoItem.webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
        options,
        function(error) {
          if (error) return console.error(error);

          this.generateOffer(onOffer);
        }
      );
    },
    startResponse(message, videoItem) {
      this.setState(videoItem, I_CAN_STOP);

      videoItem.webRtcPeer.processAnswer(message.sdpAnswer, async error => {
        if (error) return console.error(error);

        const message = {
          id: "readyplay",
          videourl: videoItem.rtsp,
          sessionid: videoItem.sessionid
        };
        await this.sendMessage(message);
      });
    },

    async stop(videoItem) {
      if (videoItem.state === I_CAN_START) return;

      if (videoItem.webRtcPeer) {
        await new Promise(res => {
          videoItem.stopEvent.once("stoped", function() {
            this.removeAllListeners();
            res();
          });
          setTimeout(() => {
            videoItem.stopEvent.removeAllListeners();
            res();
          }, 500);

          videoItem.webRtcPeer.dispose();

          var message = {
            id: "stop",
            sessionid: videoItem.sessionid
          };
          this.sendMessage(message);
        });
      }
      this.playEnd(videoItem);
    },
    playEnd(videoItem) {
      this.setState(videoItem, I_CAN_START);
    },

    async isLiveVideo(id) {
      let item;
      if (id === this.videoitem.sessionid) item = this.videoitem;
      if (!item) return false;
      return !!(item.webRtcPeer.getReceivers || false).active;
    },

    // 响应式生成video

    async makeVideo() {
      this.videoitem = new VideoItem(this.msgbody);
      let count = 0;
      let cache = {};
      let height, width;
      //每分钟的5s检查有没有图像，没有的重连
      setInterval(async () => {
        let now = new Date().getUTCSeconds();
        // 5s间隔
        if (now % 5 !== 0) return;

        try {
          this.curCanvas = this.$refs["cur"];
          (height = height || this.curCanvas.height),
            (width = width || this.curCanvas.width);
          count++;
          if (count === 1) {
            this.curFrame = this.curCanvas.toDataURL();
            this.diffCanvas = this.$refs["dif"];

            this.diffCanvas.height = height;
            this.diffCanvas.width = width;

            this.diffCanvas.getContext("2d").globalCompositeOperation =
              "difference";

            return;
          }
        } catch (e) {
          if (e instanceof TypeError) {
            await this.start(this.videoitem);

            return;
          }
        }

        try {
          const diffContext = this.diffCanvas.getContext("2d");

          //清空画布
          diffContext.clearRect(0, 0, width, height);

          let curctx = this.curCanvas.getContext("2d");
          curctx.drawImage(this.videoitem.video, 0, 0, width, height);

          this.preFrame = null;
          this.preFrame = this.curFrame;

          let opt = { width, height, diffContext };

          this.curFrame = null;
          this.curFrame = this.curCanvas.toDataURL();

          //画上两帧
          await drawImg(this.preFrame, opt);
          await drawImg(this.curFrame, opt);

          let diffFrame = diffContext.getImageData(0, 0, width, height);

          let index = calcDiff(diffFrame, cache);

          if (!index) throw index;
        } catch (e) {
          count = 0;
          console.log("stoped", this.videoitem.sessionid);
          await this.start(this.videoitem);
        }
      }, 1000);
    },

    async changeRTSPByid({ sessionid, path, attr }) {
      await new Promise(async res => {
        setImmediate(() => {
          res();
        });

        if (!_.isNumber(sessionid)) return;
        const item = this.videoitem;

        await this.stop(item);
        item.rtsp = path;
        item.attr = attr;
        await this.start(item);

        this.path = item.rtsp;

      });
    }
  },

  async created() {
    //prod
    // this.socket = io("http://192.168.63.46:8080", {
    //   path: "/ws",
    //   transports: ["websocket"]
    // });
    await this.makeVideo();

    //dev
    this.socket = io(`http://${location.hostname}:${location.port}`, {
      // path: "/",
      transports: ["websocket"],
      query: {
        sessionid: this.msgbody.sessionid
      }
    });

    this.socket.on("connect", async () => {
      // 初始化播放列表

      this.init(this.videoitem);
    });

    this.socket.on("RTCmsg", async message => {
      const parsedMessage = message;
      const videoItem = this.videoitem;

      switch (parsedMessage.id) {
        case "viewerResponse":
          this.startResponse(parsedMessage, videoItem);
          break;
        case "error":
          if (videoItem.state == I_AM_STARTING) {
            this.stop(videoItem);
          }
          onError("Error message from server: " + parsedMessage.message);
          break;
        case "stopCommunication":
          videoItem.stopEvent.emit("stoped");
          break;
        case "videoInfo":
          onError(parsedMessage);
          break;
        case "iceCandidate":
          videoItem.webRtcPeer.addIceCandidate(
            parsedMessage.candidate,
            error => {
              if (error)
                return console.error("Error adding candidate: " + error);
            }
          );
          break;
        case "ping":
          if (this.isLiveVideo(parsedMessage.sessionid)) {
            await this.sendMessage({
              id: "pong",
              sessionid: this.videoitem.sessionid
            });
          } else {
            const it = Promise.resolve(
              this.getVideoItem(parsedMessage.sessionid)
            );
            await this.stop(it);
          }
          break;
        default:
          if (videoItem.state == I_AM_STARTING) {
            this.setState(videoItem, I_CAN_START);
          }
          onError("Unrecognized message", parsedMessage);
      }
    });

    this.socket.on("disconnect", () => {
      // eslint-disable-next-line
      this.socket.open();
    });
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>
* {
  padding: 0;
  margin: 0;
}

.containerVideoItem {
  width: 100%;
  height: 100%;
}

.item {
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;

  .pathTitle {
    width: 100%;
    height: 20px;
    opacity: 0.5;
    background: rgb(0, 0, 0);
    color: rgb(255, 255, 255);
    position: absolute;
    bottom: 0px;
    left: 0;
    z-index: 1000;
    line-height: 20px;
    text-align: center;
    font-size: 14px;
  }

  .border{
    width:100%;
    height 100%
    position absolute
    top 0
    left 0
    z-index 100
  }
  .locked {
    box-shadow: inset 0px 0px 0px 5px rgba(0, 0, 255, 0.5);
  }
}

.video {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  z-index: 2;
  object-fit: fill;
  background: center / 20% #fff url('/static/spinner.gif') no-repeat !important;
}

.video:-webkit-full-screen {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: center / 20% #fff url('/static/spinner.gif') no-repeat !important;
}

.video::-webkit-media-controls {
  display: none !important;
}
</style>


