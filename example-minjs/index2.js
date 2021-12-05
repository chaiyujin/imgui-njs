// self executing function here
(function() {
  // your page initialization code here
  // the DOM will be available here

  let VS = new VideoSync(["video#video0", "video#video1"])

  function onLoaded()
  {
    window.requestAnimationFrame(onLoop);
  }

  async function onLoop(time) {
    window.requestAnimationFrame(onLoop);
  }

  document.addEventListener("DOMContentLoaded", onLoaded, false);

  // Tell user about lacking of API.
  // let HAS_VIDEO_FRAME_CALLBACK = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  // if (!HAS_VIDEO_FRAME_CALLBACK) {
  //   return alert('Your browser does not support the `Video.requestVideoFrameCallback()` API.\nPlease use Chrome for better video synchronization!');
  // }
})();
