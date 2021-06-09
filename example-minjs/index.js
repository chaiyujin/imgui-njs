// self executing function here
(function() {
  // your page initialization code here
  // the DOM will be available here
  let HAS_VIDEO_FRAME_CALLBACK = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

  let App  = new ImGuiPlayer(document.getElementById('player-1'));
  // let App1 = new ImGuiPlayer(document.getElementById('imgui-canvas-2'));

  function onLoaded()
  {
    App.Begin();
    // App1.Begin();
    window.requestAnimationFrame(onLoop);
  }

  async function onLoop(time) {
    App.OnLoop(time);
    // App1.OnLoop(time);
    window.requestAnimationFrame(onLoop);
    // if(App.OnLoop(time)) { App1.OnLoop(time);
    // }
    // else
    // {
    //   console.log("render thread done");
    //   App.End();
    // }
  }

  document.addEventListener("DOMContentLoaded", onLoaded, false);

  // Tell user about lacking of API.
  if (!HAS_VIDEO_FRAME_CALLBACK) {
    return alert('Your browser does not support the `Video.requestVideoFrameCallback()` API.');
  }
})();
