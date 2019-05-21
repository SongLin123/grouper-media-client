
<template>
<div>
   <div>
    <input type="text" v-model="path">
    <input type="text" v-model.number="sessionid">
    <button @click="changePath">changepath</button>
  </div>
 
</div>
 
</template>

<script>
import {changeVideo} from "../api";
export default {
  data() {
    return {
      path: "",
      sessionid: 0,

      path1:"",
      sessionid1:0
    };
  },
  methods: {
    changePath() {
      
        changeVideo({
          sessionid: this.sessionid,
          path: this.path,
          attr: {}
        })
        .then(res => {
          console.log(res.data);
        });
    },
  },
  mounted() {
    window.open(location.origin + location.pathname + "#/left");
    window.open(location.origin + location.pathname + "#/right");
  }
};
</script>