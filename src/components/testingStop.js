   async function drawImg(src, {
       width,
       height,
       diffContext
   }) {
       const ctx = diffContext;

       const img = new Image();
       img.src = src;
       await new Promise(res => {
           let frame = img;
           if (src instanceof HTMLVideoElement) {
               frame = src;
           }
           ctx.drawImage(frame, 0, 0, width, height);

           setTimeout(() => {
               res();
           }, 300);
       });
   }
   //计算差异

   function calcDiff(diffFrame, cache) {
       if (!diffFrame) return 0;

       let pixel = 0;
       cache.total = cache.total || 0; //整个画布都是白色时所有像素的值的总和
       // 跳过第一个像素透明度为0的，透明度为0就是丢失帧（来不及处理的状态）
       if (diffFrame.data[3] === 0) {
          
           return 1;
       }
       for (
           var i = 0, l = diffFrame.width * diffFrame.height * 4; i < l; i += 4
       ) {


           pixel +=
               diffFrame.data[i] +
               diffFrame.data[i + 1] +
               diffFrame.data[i + 2];
           if (!cache.isLoopEver) {
               //只需在第一次循环里执行
               cache.total += 255 * 3; //单个白色像素值
           }
       }
       cache.isLoopEver = true;
       pixel *= 3; //亮度放大

       //返回“差异画布高亮部分像素总值”占“画布全亮情况像素总值”的比例
       return pixel / cache.total;
   }

   export {
       drawImg,
       calcDiff
   }