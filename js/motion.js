// js/motion.js
const MotionModule = (function(){
  let running = false;
  let interval = null;
  let canvas, ctx, lastData;
  let threshold = 0.02; // porcentaje de pixeles cambiados para disparar
  let onMotionCb = null;
  let onNoMotionCb = null;

  function analyze(video) {
    if (!canvas) {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) return;

    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const img = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    if (!lastData) { lastData = new Uint8ClampedArray(img); return; }

    let diff = 0;
    // muestreo cada 4 bytes (rgba), comprobamos solo luminancia simple
    for (let i=0;i<img.length;i+=4*8) { // espaçamento para ser más ligero
      const d = Math.abs(img[i] - lastData[i]);
      if (d>30) diff++;
    }
    // guarda una copia ligera
    lastData.set(img);

    const pixelsChecked = Math.floor(img.length/(4*8));
    const changed = diff / pixelsChecked;
    if (changed > threshold) {
      onMotionCb && onMotionCb();
    } else {
      onNoMotionCb && onNoMotionCb();
    }
  }

  return {
    toggle: (videoEl, onMotion, onNoMotion, ms=400) => {
      if (!running) {
        onMotionCb = onMotion; onNoMotionCb = onNoMotion;
        interval = setInterval(()=>analyze(videoEl), ms);
        running = true;
      } else {
        clearInterval(interval);
        running = false;
      }
    }
  };
})();
