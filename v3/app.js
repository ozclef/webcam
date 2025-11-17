let recorder = null;
let stream = null;
let chunks = [];
let intervalId = null;
let timerSec = 0;
let timerInt = null;

const preview = document.getElementById("preview");
const list = document.getElementById("list");
const timer = document.getElementById("timer");

document.getElementById("btnCam").onclick = startCamera;
document.getElementById("btnScreen").onclick = startScreen;
document.getElementById("btnStop").onclick = stopRecording;
document.getElementById("btnInterval").onclick = startInterval;
document.getElementById("btnHide").onclick = hideMode;



// ----------------------------------------------------
// TIMER
// ----------------------------------------------------
function startTimer(){
    timerSec = 0;
    timerInt = setInterval(()=>{
        timerSec++;
        timer.textContent = formatTime(timerSec);
    },1000);
}

function stopTimer(){
    clearInterval(timerInt);
}

function formatTime(s){
    let m = Math.floor(s/60);
    let sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}



// ----------------------------------------------------
// GRABAR CÁMARA
// ----------------------------------------------------
async function startCamera(){
    stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    startRecord(stream);
}



// ----------------------------------------------------
// GRABAR PANTALLA
// ----------------------------------------------------
async function startScreen(){
    stream = await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
    startRecord(stream);
}



// ----------------------------------------------------
// INICIAR RECORDER
// ----------------------------------------------------
function startRecord(s){
    preview.srcObject = s;
    chunks = [];

    recorder = new MediaRecorder(s);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = saveClip;

    recorder.start();
    startTimer();

    document.getElementById("btnStop").disabled = false;
}



// ----------------------------------------------------
// DETENER Y GUARDAR
// ----------------------------------------------------
function stopRecording(){
    if(!recorder) return;
    recorder.stop();
    stopTimer();
    document.getElementById("btnStop").disabled = true;

    if(intervalId){
        clearInterval(intervalId);
        intervalId = null;
    }
}



// ----------------------------------------------------
// GUARDAR CLIP AL PARAR
// ----------------------------------------------------
function saveClip(){
    const blob = new Blob(chunks, {type:"video/webm"});
    const url = URL.createObjectURL(blob);

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url;
    a.download = "clip-"+Date.now()+".webm";
    a.textContent = a.download;

    li.appendChild(a);

    const btn = document.createElement("button");
    btn.textContent = "▶ Ver";
    btn.onclick = ()=>{
        const w = window.open("", "_blank");
        w.document.write(`<video controls autoplay src="${url}" style="width:100%"></video>`);
    };
    
    li.appendChild(btn);
    list.prepend(li);
}



// ----------------------------------------------------
// GRABACIÓN POR INTERVALOS
// ----------------------------------------------------
function startInterval(){
    const secs = parseInt(document.getElementById("interval").value);

    if(!secs || secs < 5){
        alert("Intervalo mínimo 5 segundos.");
        return;
    }

    if(intervalId){
        clearInterval(intervalId);
    }

    startCamera();

    intervalId = setInterval(()=>{
        stopRecording();
        startCamera();
    }, secs * 1000);
}



// ----------------------------------------------------
// MODO OCULTO
// ----------------------------------------------------
function hideMode(){
    document.body.style.background = "#000";
    preview.style.opacity = 0;
}
