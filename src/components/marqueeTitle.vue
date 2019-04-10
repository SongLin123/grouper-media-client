<template>
    <div class="marqueeContainer">
        <div class="marqueeTitleDiv">
            <p class="marqueeTitleContent">{{marqueeTitle}}</p>
        </div>
    </div>
</template>

<script>
    export default {
        name: "marqueeTitle",
        props: {
            marqueeTitle: {},
            duration: {
                default: 2
            },
            speed: {
                default: 20
            }
        },
        data() {
            return {
                timer: null,
            }
        },
        mounted() {
            this.toScrollFunc();
        },
        methods: {
            toScrollFunc: function () {
                if (this.timer) {
                    clearInterval(this.timer);
                }
                let text = document.querySelector(".marqueeTitleContent");
                const offsetWidth = text.offsetWidth;
                text.style.width= offsetWidth + "px";
                const offsetLeft = text.offsetLeft;
                const left = offsetWidth + offsetLeft;
                this.timer = setInterval(() => {
                    let marginLeftMax = text.offsetParent.clientWidth;
                    let num = text.style.marginLeft.split("px")[0];
                    const sum = parseInt(left) + parseInt(num);
                    if (sum < 0) {
                        text.style.marginLeft = marginLeftMax + "px";
                        num = text.style.marginLeft.split("px")[0];
                        console.log(text.style.marginLeft)
                    }
                    num -= this.duration;
                    text.style.marginLeft = num + "px";
                }, this.speed);
            },
        },
        watch: {
            marqueeTitle: function () {
                this.toScrollFunc();
            },
            duration: function () {
                this.toScrollFunc();
            },
            speed: function () {
                this.toScrollFunc();
            }
        },
        destroyed() {
            if (this.timer) {
                clearInterval(this.timer);
            }
        }
    }
</script>

<style scoped lang="stylus">
*
    padding 0
    margin 0

.marqueeContainer
    width 100%
    height 100%

.marqueeTitleDiv
    width 100%
    height 100%
    overflow hidden
    position relative
    p
        display inline-block
        white-space nowrap
        overflow hidden
        position absolute
        left 0
</style>
