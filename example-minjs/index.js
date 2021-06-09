var App = new Application('AppCanvas', 'ImGuiPlayer');
var App1 = new Application('AppCanvas1', 'ImGuiPlayer1');

function onLoaded()
{
    App1.Begin((err) => { window.requestAnimationFrame(onLoop); });
}

async function onLoop(time)
{
    if(App1.OnLoop(time)) {
      window.requestAnimationFrame(onLoop);
    }
    else
    {
        console.log("render thread done");
        App1.End();
    }
}

document.addEventListener("DOMContentLoaded", onLoaded, false);

// =====================================================================================================================
// Video Player
// =====================================================================================================================

const startDrawing = () => { 
  const button = document.querySelector("button");
  const forwardButton = document.getElementById("forward");
  const backwardButton = document.getElementById("backward");

  const video = document.querySelector("video");
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const fpsInfo = document.querySelector("#fps-info");
  const metadataInfo =  document.querySelector("#metadata-info");
  let currentFrame = 0
  let mediaTime;
  let width = canvas.width;
  let height = canvas.height;
  
  let paintCount = 0;
  let startTime = 0.0;
  let fps = 23.976
  
  button.addEventListener('click', () => video.paused ? video.play() : video.pause());
  forwardButton.addEventListener('click', () => {video.currentTime = video.currentTime + 1/fps});
  backwardButton.addEventListener('click', () => {video.currentTime = video.currentTime - 1/fps});

  video.addEventListener('play', () => {
    if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
      return alert('Your browser does not support the `Video.requestVideoFrameCallback()` API.');
    }    
  });

  const updateCanvas = (now, metadata) => {
    if (startTime === 0.0) {
      startTime = now;
    }
    
    // ctx.drawImage(video, 0, 0, width, height);
    App.player.frame_image = video
    
    let frameOffset = 2
    currentFrame = Math.round(metadata.mediaTime  * fps) - frameOffset // +1 is added if you count frame 0 as frame 1... Semantics
    mediaTime = metadata.mediaTime
    fpsInfo.innerText = currentFrame;
    metadataInfo.innerText = JSON.stringify(metadata, null, 2);

    video.requestVideoFrameCallback(updateCanvas);
  };  
  video.src =
    "./test.mp4";
  video.requestVideoFrameCallback(updateCanvas);  
};

window.addEventListener('load', startDrawing);
