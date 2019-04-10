<template>
    <div class="container videoGroup">
        <div class="titleDiv">
            <marquee-title :marquee-title="queueName"></marquee-title>
        </div>
        <div class="videoDiv">
            <div v-for="item in list" :key="item.id" class="videoItem">
                <videoitem :msgbody="item.msgbody" :ref="'video'+item.id"></videoitem>
            </div>
        </div>
    </div>
</template>
<script>
    import {Msgbody} from "../Msgbody";
    import _ from "lodash";

    import axios from "axios";
    import io from "socket.io-client";

    import videoitem from "./videoItem.vue";
    import marqueeTitle from "./marqueeTitle"

    export default {
        components: {videoitem, marqueeTitle},
        props: {},
        data() {
            return {
                path: "rtsp://admin:12345daoge@172.16.252.38:554/Streaming/Channels/0301",
                attr: {},
                col: 2, // 列
                row: 6, // 行
                //只有一个的video
                list: [],
                queueName: "",
                videoTitle: "定时轮屏任务",
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
                                id: index + 1,
                                msgbody: new Msgbody(index + 1, element.url, element)
                            };
                            this.list.push(it);
                        }
                    });
            },
            async changeQueue(arg, queueName) {
                console.log(queueName)
                this.queueName = queueName;
                if (_.isArray(arg)) {
                    for (let index = 0; index < arg.length; index++) {

                        const {sessionid, path, attr} = arg[index];
                        let name = "video" + sessionid;
                        console.log(arg)
                        await this.$refs[name][0].changeRTSPByid(
                            new Msgbody(sessionid, path, attr)
                        );
                    }
                } else {
                    let {sessionid, path, attr} = arg;
                    let name = "video" + sessionid;
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

            const throttle = _.throttle(this.changeQueue, 3000, {"leading": true, "trailing": false});
            this.socket.on("controlServer", throttle);
        }
    };
</script>
<style lang="stylus" scoped>
    $titleDivHeight = 40px

    *
        padding 0
        margin 0

    .container {
        height: 100vh;
        width: 100vw;
        min-height 0
        min-width 0
    }

    .videoGroup
        width 100vw
        .titleDiv
            height $titleDivHeight
            background-color #cccccc
            line-height @height
        .videoDiv
            height "calc(100vh - %s)" % $titleDivHeight
            width 100vw
            display: flex;
            flex-flow: column wrap;
            .videoItem {
                flex 1 1 calc(100% / 6)
                position: relative;
                text-align: center;
                overflow: hidden;
                box-sizing border-box
                width 50%
                collapse collapse
            }

</style>
