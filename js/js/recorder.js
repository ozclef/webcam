// js/recorder.js
// RecorderModule(previewElement, {onNewClip: fn})
function RecorderModule(previewEl, opts = {}) {
  this.previewEl = previewEl;
  this.onNewClip = opts.onNewClip || (()=>{});
  this.mediaRecorder = null;
  this.currentStream = null;
  this.chunks = [];
  this.intervalTimer = null;
  this.intervalSeconds = 0;
  this.isRecording = false;

  this.startCamera = async () => {
    await this._startStream({video:true, audio:true});
  };

  this.startScreen = async () => {
    await this._startStream(await navigator.mediaDevices.getDisplayMedia({video:true, audio:true}));
  };

  this._startStream = async (constraintsOrStream) => {
    if (this.isRecording) this.stopCurrent();

    // support passing a MediaStream object directly (from getDisplayMedia)
    let stream;
    if (constraintsOrStream instanceof MediaStream) {
      stream = constraintsOrStream;
    } else {
      stream = await navigator.mediaDevices.getUserMedia(constraintsOrStream);
    }

    this.currentStream = stream;
    this.previewEl.srcObject = stream;
    this._startRecorder(stream);
  };

  this._startRecorder = (stream) => {
    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    const recorder = new MediaRecorder(stream, options);
    this.chunks = [];
    recorder.ondataavailable = e => {
      if (e.data && e.data.size) this.chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(this.chunks, {type:'video/webm'});
      const url = URL.createObjectURL(blob);
      const clip = { blob, url, name: `clip-${new Date().toISOString().replace(/[:.]/g,'-')}.webm` };
      this.onNewClip(clip);
      // libera la URL cuando quieras: URL.revokeObjectURL(url);
    };
    recorder.start();
    this.mediaRecorder = recorder;
    this.isRecording = true;
    document.getElementById('stopBtn').disabled = false;
  };

  this.stopCurrent = () => {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t=>t.stop());
      this.currentStream = null;
      this.previewEl.srcObject = null;
    }
    this.isRecording = false;
    document.getElementById('stopBtn').disabled = true;
  };

  // Interval recording: graba segmentos de 'seconds' segundos de forma continua
  this.startInterval = (seconds=60) => {
    this.intervalSeconds = seconds;
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    // inicia una vez y luego repite
    const makeSegment = async () => {
      await this._startStream({video:true, audio:true});
      setTimeout(()=> this.stopCurrent(), seconds*1000);
    };
    makeSegment();
    this.intervalTimer = setInterval(makeSegment, seconds*1000 + 1000);
  };

  this.stopInterval = () => {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  };

  return this;
}
