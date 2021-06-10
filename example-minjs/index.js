// self executing function here
(function() {
  // your page initialization code here
  // the DOM will be available here
  let HAS_VIDEO_FRAME_CALLBACK = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

  let App  = new ImGuiPlayer(document.getElementById('player-1'), 720, 360);

  function onLoaded()
  {
    App.Begin();
    window.requestAnimationFrame(onLoop);
  }

  async function onLoop(time) {
    if (App.OnLoop(time)) {
      window.requestAnimationFrame(onLoop);
    } else {
      console.log("render thread done");
      App.End();
    }
  }

  document.addEventListener("DOMContentLoaded", onLoaded, false);

  // Tell user about lacking of API.
  // if (!HAS_VIDEO_FRAME_CALLBACK) {
  //   return alert('Your browser does not support the `Video.requestVideoFrameCallback()` API.\nPlease use Chrome for better video synchronization!');
  // }
})();
