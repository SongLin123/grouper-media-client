

<template>
  <div class="container">
    <div class="item" :ref="`videoBox`">
      <video class="video" autoplay muted></video>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
import _ from "lodash";


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
  props: {
    msgbody:{}
  },
  data() {
    return {
      test: "",
      videoitem: {},
      socket: null,
      socketPath: "signal"
    };
  },
  // beforeDestroy() {
  //   this.stopAll();
  // },
  methods: {
    // stopAll() {
    //   this.list.forEach(it => {
    //     this.stop(it);
    //   });
    // },
    // startAll() {
    //   this.list.forEach(item => {
    //     this.start(item);
    //   });
    // },

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
    init(videoItem) {
      const elem = (videoItem.video = this.$refs[
        'videoBox'
      ].querySelector("video"));
      elem.addEventListener("dblclick", function(e) {
        if (elem.requestFullscreen && !document.fullscreenElement) {
          elem.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        e.preventDefault();
      });
      console.log(this.msgbody)
      this.changeRTSPByid(this.msgbody);
    },

    start(videoItem) {
      // if (videoItem.state !== I_CAN_START) {
      //   this.stop(videoItem);
      // }

      this.setState(videoItem, I_AM_STARTING);
      let options = {
        remoteVideo: videoItem.video,
        mediaConstraints: {
          audio: false,
          video: true
        },
        onicecandidate: onIceCandidate
      };

      const that = this;
      async function onOffer(error, offerSdp) {
        if (error) return console.error("Error generating the offer");
        console.info("Invoking SDP offer callback function " + location.host);

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
      

      videoItem.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(
        options,
        function(error) {
          if (error) return console.error(error);
          const webRtcPeer = videoItem.webRtcPeer;

          webRtcPeer.generateOffer(onOffer);
          webRtcPeer.peerConnection.addEventListener(
            "iceconnectionstatechange",
            function() {
              console.log(videoItem);
              if (webRtcPeer && webRtcPeer.peerConnection) {
                const time = new Date();
                console.log(
                  videoItem.id + webRtcPeer.peerConnection.iceConnectionState
                );
                // console.log(
                //   "icegatheringstate -> " +
                //     webRtcPeer.peerConnection.iceGatheringState
                // );
                console.log(time, time.getTime());
                if (
                  webRtcPeer.peerConnection.iceConnectionState === "connected"
                ) {
                  setTimeout(async () => {
                    try {
                      videoItem.webRtcPeer.currentFrame;
                    } catch (e) {
                      await that.stop(videoItem);
                    }
                  }, 5000);
                  that.setState(videoItem, I_CAN_STOP);
                }
                if (
                  webRtcPeer.peerConnection.iceConnectionState === "failed" ||
                  webRtcPeer.peerConnection.iceConnectionState ===
                    "disconnected"
                ) {
                  setTimeout(() => {
                    that.start(videoItem);
                  }, 1000);
                }
              }
            }
          );
        }
      );
    },
    startResponse(message, videoItem) {
      this.setState(videoItem, I_CAN_STOP);
      console.log("SDP answer received from server. Processing ...");

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
      console.log("Stopping video ...");

      if (videoItem.webRtcPeer) {
        await new Promise(res => {
          videoItem.stopEvent.once("stoped", function() {
            videoItem.stopEvent.removeAllListeners();
            res();
          });
          setTimeout(() => {
            videoItem.stopEvent.removeAllListeners();
            res();
          }, 5000);

          videoItem.webRtcPeer.dispose();
          // videoItem.webRtcPeer = null;

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

    // getVideoItem(id) {
    //   return _.find(this.list, ["id", id]);
    // },
    async isLiveVideo(id) {
      let item;
      if (id === this.videoitem.sessionid) item = this.videoitem;
      if (!item) return false;
      return !!(item.webRtcPeer.getReceivers || false).active;
    },

    // 响应式生成video

    async makeVideo() {
      this.videoitem = new VideoItem(this.msgbody);
    },

    async changeRTSPByid({ sessionid, path, attr }) {
      await new Promise(async res => {
        setTimeout(() => {
          res();
        }, 600);

        if (!_.isNumber(sessionid)) return;
        const item = await this.videoitem;
        
        await this.stop(item);
        item.rtsp = path;
        item.attr = attr;
        await this.start(item);
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

    // this.$nextTick(() => {
    //   document.querySelectorAll(".item").forEach(item => {
    //     item.style.setProperty("flex", `0 0 calc((100vh / ${this.col}))`);
    //     const videoitem = item.querySelector(".video");
    //     videoitem.style.setProperty("width", `calc((100vw / ${this.row}))`);
    //     videoitem.style.setProperty("height", `calc((100vh / ${this.col}))`);
    //   });
    // });

    //dev
    this.socket = io(`http://${location.hostname}:8360`, {
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

      // eslint-disable-next-line

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



    .video {
      width: calc((100vw / 2));
      height: calc((100vh / 6));
      position: relative;
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


