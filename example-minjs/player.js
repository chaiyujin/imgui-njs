let DEBUG = false;

class _MyVideoPlayer
{
  constructor(imgui) {
    this.imgui = imgui;
    this.fps = 30.0;
    this.curr_iframe = 0;
    this.playing = false;
    this.wanna_play_after_release = false;
    this.video_list = [];
  }

  setVideo(video_or_list, fps) {
    // guard null
    if (!video_or_list) { return; }
    // make into array
    if (!Array.isArray(video_or_list)) {
      video_or_list = [video_or_list];
    }
    this.video_list = video_or_list
    this.fps = (typeof fps !== 'number') ? Number(fps) : fps;
    console.log('fps is', this.fps);
    for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
      this._initVideoCallback(i_video, this.video_list[i_video]);
    }
  }

  clearVideo() {
    this.video_list = [];
  }

  _initVideoCallback(index, video) {
    const updateCanvas = (now, metadata) => {
      this.curr_iframe = Math.round(metadata.mediaTime  * this.fps);
      // console.log(metadata.mediaTime, 'frame', this.curr_iframe);
      // mediaTime = metadata.mediaTime
      // fpsInfo.innerText = currentFrame;
      // metadataInfo.innerText = JSON.stringify(metadata, null, 2);

      video.requestVideoFrameCallback(updateCanvas);
    };  
    video.currentTime = 0;
    if (index === 0) {
      video.requestVideoFrameCallback(updateCanvas);
      // video.addEventListener('timeupdate', (event) => {
      //   if (!this.video_list[0].paused) {
      //     for (var i = 1; i < this.video_list.length; ++i) {
      //       let delta = Math.abs(this.video_list[i].currentTime - this.video_list[0].currentTime);
      //       if (delta > 0.1/this.fps) {
      //         console.log("Force sync", i);
      //         this.video_list[i].currentTime = this.video_list[0].currentTime;
      //       }
      //     }
      //   }
      // })
    } else {
      video.muted = true;
    }
  }

  show(winname="imgui demo", isOpen=null) {
    if(isOpen != null && !isOpen.get()) return;
    let imgui = this.imgui;

    if (DEBUG) {
      if (imgui.Begin('debug')) {
        imgui.PushFont("monospace");
        let imgui_fps = imgui.GetIO().Framerate;
        let ms = (1000.0 / imgui_fps).toFixed(1);
        imgui.Text(`${imgui_fps.toFixed(0)} fps, ${ms} mspf`);
        let mouse = imgui.GetIO().MousePos;
        if(mouse.x != -Number.MAX_VALUE) {
          imgui.Text(`mouse: ${mouse.x}, ${mouse.y}`);
        }
        imgui.PopFont();
      }
      imgui.End();
    }

    let W = imgui.GetIO().DisplaySize.x;
    let H = imgui.GetIO().DisplaySize.y;
    imgui.SetNextWindowPos (new Vec2(0, 0), CondFlags.Always);
    imgui.SetNextWindowSize(new Vec2(W, H), CondFlags.Always);
    let winflags = WindowFlags.NoResize | WindowFlags.NoMove
                 | WindowFlags.NoScrollBar | WindowFlags.NoTitleBar
                 | WindowFlags.NoBackground;
    imgui.GetStyle().WindowPadding.x = 3;
    imgui.GetStyle().WindowPadding.y = 3;

    let done = false;
    if(imgui.Begin(winname, isOpen, winflags)) {
      // Images
      for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
        let video = this.video_list[i_video];
        if (i_video > 0) imgui.SameLine();
        imgui.Image(video, new Vec2(320, 240));
        // console.log('imgui - video', i_video, 'time:', video.currentTime);
      }

      // Controllers
      // - Play/Stop button
      let button_size = new Vec2(imgui.GetFontSize() * 5, 0);
      if (this.playing) {
        if (imgui.Button("Stop", button_size)) {
          this.pause();
        }
      } else {
        if (imgui.Button("Play", button_size)) {
          this.play();
        }
      }
      // - Frame slider
      imgui.SameLine();
      imgui.PushItemWidth(-1);
      imgui.SliderInt("##Player:slider", this.curr_iframe, 0, 100, null,
              (newval)=> { this.seek_frame(newval); });
      // > Auto pause when press slider.
      let hovered = imgui.IsItemHovered();
      let mouse_down = imgui.IsMouseDown(0);
      if (this.playing && hovered && mouse_down) {
        if (hovered && mouse_down) {
          this.wanna_play_after_release = true;
          this.pause();
        }
      } else if (!mouse_down && this.wanna_play_after_release) {
        this.wanna_play_after_release = false;
        this.play();
      }

      // Drawing is done!
      done = true;
    }
    imgui.End();
    return done;
  }

  play() {
    this.playing = true;
    this.video_list.forEach(video => video.play());
    if (this.video_list.length > 0)
      this.seek_time(this.video_list[0].currentTime);
  }
  
  pause() {
    this.playing = false;
    this.video_list.forEach(video => video.pause());
    if (this.video_list.length > 0)
      this.seek_time(this.video_list[0].currentTime);
  }

  seek_frame(new_iframe) {
    if (this.video_list.length > 0 && new_iframe !== undefined && new_iframe !== null) {
      // console.log("new value", this.curr_iframe, '->', new_iframe, newsec);
      let delta_sec = (new_iframe - this.curr_iframe) / this.fps;
      this.seek_time(this.video_list[0].currentTime + delta_sec);
    }
  }

  seek_time(new_sec) {
    if (new_sec !== undefined && new_sec !== null) {
      // console.log("seek time", new_sec);
      this.curr_iframe = Math.round(new_sec * this.fps);
      this.video_list.forEach(video => video.currentTime=new_sec);
    }
  }
}

// =====================================================================================================================

class ImGuiPlayer extends ImguiApp
{
  constructor(player_element) {
    // create cavnas
    let canvas = document.createElement('canvas');
    canvas.setAttribute('width', "768")
    canvas.setAttribute('height', "468")
    canvas.setAttribute('style', "background-color: #222;")
    player_element.appendChild(canvas)

    // get video information
    let group = player_element.getElementsByClassName('mediagroup')[0];
    let fps = group.getAttribute('fps');
    // get videos
    let videos = player_element.getElementsByTagName('video');
    var video_or_list = [];
    for (var i = 0; i < videos.length; ++i) {
      video_or_list.push(videos[i]);
    }

    // super
    super(canvas, "imgui-player", "v0.0.1");

    // members
    this.videos = video_or_list;
    this.player = null;
    this.fps = fps;
  }

  Begin(onReady) {
    super.Begin((err) => {
      if(!err) {
        this.player = new _MyVideoPlayer(this.imgui);
        this.player.setVideo(this.videos, this.fps);
      }
      if(onReady) {
        onReady(err);
      }
    });
  }

  OnFrame(imgui) {
    if(this.player) {
      this.player.show();
    }
  }
}

