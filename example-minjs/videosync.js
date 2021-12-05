
class VideoSync {
  static STATE_PAUSED = 0;
  static STATE_PLAYING = 1;
  static STATE_SYNCING = 2;
  static STATE_UNKNOWN = 99;

  constructor(video_selectors, prim_selector) {
    this.videoList = [];
    this.primIndex = null;
    this.state = VideoSync.STATE_UNKNOWN;
    this.next_state = VideoSync.STATE_UNKNOWN;
    this.selectVideos(video_selectors, prim_selector);
  }

  reset() {
    // * reset videos and primary index
    this.pause(0);
    this.videoList = [];
    this.primIndex = null;
    // * reset player state
    this.state = VideoSync.STATE_PAUSED;
    this.next_state = VideoSync.STATE_UNKNOWN;
  }

  selectVideos(selectors, prim_sel) {
    this.reset();
    // * wrong selectors or no video given
    if (!Array.isArray(selectors) || selectors.length === 0) {
      console.error("Wrong selectors!");
      return;
    }
    // * set default prim_id as first video
    if (prim_sel === undefined) {
      prim_sel = selectors[0];
    }
    // * iter each selector
    let prim = document.querySelector(prim_sel);
    if (prim === null) {
      console.error(`Wrong primary selector: ${prim_sel}`);
      return;
    }
    selectors.forEach(selector => {
      let vid = document.querySelector(selector);
      if (vid === null) { return; }
      if (vid === prim) {
        this.primIndex = this.videoList.length;
      }
      this.videoList.push(vid);
    });
    console.debug(this.videoList, this.primIndex);
    // * failed to find primary index
    if (this.primIndex === null) {
      console.error(`Primary selector ${prim_sel} not in selectors: ${selectors}`);
      this.videoList = [];
      this.primIndex = null;
    }
    // * sync callbacks
    prim.onplay  = (event) => { this.play()  };
    prim.onpause = (event) => { this.pause() };
    prim.onended = (event) => { this.pause() };
    prim.onseeking = (event) => { this.seekTime(this.videoList[this.primIndex].currentTime, true); };
    this.videoList.forEach((video) => {
      if (video !== prim) { video.muted = true; }
      // video.onplaying = (event) => { console.log("playing", video.id) };
      // video.onwaiting = (event) => { console.log("waiting", video.id) };
      // video.oncanplaythrough = (event) => {console.log("canplaythrough", video.id)}
    }); 
  }

  // * ------------------------------------------------------------------------------------------------------------ * //
  // *                                                Sync Play/Pause                                               * //
  // * ------------------------------------------------------------------------------------------------------------ * //

  allReady() {
    let seeked = true;
    this.videoList.forEach((video) => { seeked &= !video.seeking; });
    let ready = true;
    this.videoList.forEach((video) => { 
      ready &= (video.readyState === 4);
      if (video.readyState !== 4) {
        // console.warn(video.id, "is not ready!")
      }
    });
    return seeked && ready;
  }

  waitAllReady() {
    // console.log("waitAllReady")
    let ready = false;
    if (this.state === VideoSync.STATE_SYNCING) {
      ready = this.allReady();
      // * Play videos when all ready!
      if (ready && this.next_state === VideoSync.STATE_PLAYING) {
        console.log("PLAY");
        this.videoList.forEach(video => video.play());
        this.state = VideoSync.STATE_PLAYING;
      }
    }
    // * refresh state each frame
    if (!ready) {
      window.requestAnimationFrame(() => this.waitAllReady());
    }
  }

  play(timestamp) {
    // * guard
    if (this.videoList.length == 0) { return; }
    const prim = this.videoList[this.primIndex];
    if (timestamp === undefined) {
      timestamp = prim.currentTime;
    }
    // * Sync timestamp
    this.state = VideoSync.STATE_SYNCING;
    this.next_state = VideoSync.STATE_PLAYING;
    prim.currentTime = timestamp;
    // * Poll ready state
    window.requestAnimationFrame(() => this.waitAllReady());
  }

  pause(timestamp) {
    // * guard
    if (this.videoList.length == 0) { return; }
    const prim = this.videoList[this.primIndex];
    if (timestamp === undefined) {
      timestamp = prim.currentTime;
    }
    // * Pause videos at same timestamp
    console.log("PAUSED")
    this.state = VideoSync.STATE_PAUSED;
    this.videoList.forEach(video => { video.pause(); });
    prim.currentTime = timestamp;
  }

  seekTime(timestamp, noprim) {
    // guard
    if (this.videoList.length == 0) { return ; }
    if (timestamp === undefined || timestamp === null) { return; }

    // console.log("seek time", timestamp);
    const prim = this.videoList[this.primIndex];
    this.videoList.forEach((video) => {
      // * ignore primary
      if (noprim && video == prim) {
        return;
      }
      video.currentTime = timestamp;
    });
  }
};
