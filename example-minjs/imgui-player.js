let DEBUG = false;

class _MyVideoPlayer
{
  constructor(imgui, message_node) {
    this.imgui = imgui;
    this.message_node = message_node
    this.fps = 30.0;
    this.num_frames = null;
    this.curr_iframe = 0;
    this.playing = false;
    this.wanna_play_after_release = false;
    this.video_list = [];
    this.rect_list = [];
    this.tag_list = [];
    this.groups = null;
    this.selected_group = null;
    this.enabled_syncTime = false;
    this.imgui_demo = new DemoWidgets(imgui)
  }

  setGroups(groups) {
    this.groups = groups;
  }

  useGroup(group) {
    let fps = group.fps
    let video_or_list = group.videos
    let tags = group.tags
    // guard null
    if (!video_or_list) { return; }
    // make into array
    if (!Array.isArray(video_or_list)) {
      video_or_list = [video_or_list];
    }
    this.clearVideos();
    this.video_list = video_or_list
    this.tag_list = tags
    this.rect_list = []
    this.fps = (typeof fps !== 'number') ? Number(fps) : fps;
    console.log('fps is', this.fps);
    for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
      this.rect_list.push({x:0, y:0, w:0, h:0});
      // should always register
      this._initVideoCallback(i_video, this.video_list[i_video]);
    }
    this.playing = false;
    this.curr_iframe = 0;
  }

  clearVideos() {
    this.playing = false;
    this.video_list.forEach(video => {
      video.pause();
      video.currentTime = 0;
    })
    this.video_list = [];
    this.num_frames = null;
  }

  syncTime() {
    if (this.video_list.length > 0) {
      this.curr_iframe = Math.floor(this.video_list[0].currentTime * this.fps);
    }
    requestAnimationFrame(this.syncTime.bind(this));
  }

  _initVideoCallback(index, video) {
    video.currentTime = 0;
    if (index === 0) {
      // without 'requestVideoFrameCallback'
      // sync time as soon as possible with requestAnimationFrame
      if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype) && !this.enabled_syncTime) {
        this.enabled_syncTime = true;
        this.syncTime();
      }

      const updateCanvasVFCb = (now, metadata) => {
        this.curr_iframe = Math.round(metadata.mediaTime  * this.fps);
        if (this.video_list.length > 0) {
          this.video_list[0].requestVideoFrameCallback(updateCanvasVFCb);
        }
      }
      // master video
      if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
        video.requestVideoFrameCallback(updateCanvasVFCb);
      }
      // listeners
      // video.addEventListener('ended', (event) => {
      //   this.playing = false;
      // });
      // video.addEventListener('timeupdate', (event) => {
      //   if (this.playing) {
      //     for (var i = 1; i < this.video_list.length; ++i) {
      //       let delta = Math.abs(this.video_list[i].currentTime - this.video_list[0].currentTime);
      //       if (delta > 1.0/this.fps) {
      //         console.log("Force sync", i);
      //         this.video_list[i].currentTime = this.video_list[0].currentTime;
      //       }
      //     }
      //   }
      // })
    } else {
      // other videos should be muted
      video.muted = true;
    }
  }

  Show(winname="imgui demo", isOpen=null) {
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
    imgui.GetStyle().WindowPadding.x = 4;
    imgui.GetStyle().WindowPadding.y = 4;
    imgui.GetStyle().SetFontSize('Std', 12);

    let done = false;
    if(imgui.Begin(winname, isOpen, winflags)) {
      // Group selector
      this.gui_groupSelector()
      imgui.SameLine();
      imgui.Text(`FPS: ${this.fps.toFixed(2)}`);

      // Images
      if (this.video_list.length > 0) {
        // Draw videos
        this.gui_drawVideos();

        // Controllers
        this.gui_drawControllers();
      }

      // Drawing is done!
      done = true;
    }
    imgui.End();
    return done;
  }

  gui_groupSelector() {
    let imgui = this.imgui;
    if(this.selected_group === null) {
      this.selected_group = this.groups[0].name;
      this.useGroup(this.groups[0]);
    }
    if (this.comboflags === undefined) {
      this.comboflags = ComboFlags.PopupAlignLeft;
    }
    imgui.PushItemWidth(150);
    if (imgui.BeginCombo("##Player:combo-select-group", this.selected_group, this.comboflags)) {
      for (let n = 0; n < this.groups.length; n++) {
        let is_selected = (this.selected_group == this.groups[n].name);
        if (imgui.Selectable(this.groups[n].name, is_selected)) {
          this.selected_group = this.groups[n].name;
          this.useGroup(this.groups[n]);
        }
        if (is_selected) {
          imgui.SetItemDefaultFocus();
        }
      }
      imgui.EndCombo();
    }
  }

  gui_drawVideos() {
    let imgui = this.imgui;
    let io = imgui.GetIO();
    let style = imgui.GetStyle();
    let font_height = imgui.CalcTextSize("").y;
    let txt_spacing_x = 5;

    // calculate rects
    // - remain header and footer
    let img_start_cursor = imgui.GetCursorPos();
    let header_height = img_start_cursor.y;
    let footer_height = img_start_cursor.y;
    // - (W, H) is the size of part for drawing video.
    let W = io.DisplaySize.x - style.WindowPadding.x * 2;
    let H = io.DisplaySize.y - header_height - footer_height;

    // - 1. Remain height for tags, also check if every video is valid
    let good = true;
    let txt_rows = 1;
    for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
      let video = this.video_list[i_video];
      let tag = this.tag_list[i_video];
      let w = video.videoWidth;
      let h = video.videoHeight;
      if (w === 0 || h === 0) { good = false; break; }
      // fit height in H
      while (txt_rows < 3) {  // ! max_height is 3
        let new_h = (H - txt_rows * font_height)
        let new_w = Math.floor(new_h * w / h) - txt_spacing_x * 2;
        let tag_height = imgui.CalcTextSize(tag, true, new_w).y;
        // console.log(new_w, tag_height, tag)
        if (tag_height > font_height * txt_rows) {
          txt_rows += 1;
        } else {
          break;
        }
      }
    }
    if (!good) {
      return;
    }
    // console.log('txt_rows', txt_rows);

    // Smaller item spacing x
    let old_item_spacing_x = style.ItemSpacing.x;
    style.ItemSpacing.x = 2;
   
    // - 2. FULL canvas
    let normalized_h = 0;
    let normalized_w = 0;
    let VIDEO_H = H - txt_rows * font_height;
    let VIDEO_W = W;
    for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
      let video = this.video_list[i_video];
      let w = video.videoWidth;
      let h = video.videoHeight;
      this.rect_list[i_video].h = VIDEO_H;
      this.rect_list[i_video].w = VIDEO_H * w / h;
      normalized_h  = 1.0;
      normalized_w += w / h;
    }
    normalized_w += (this.video_list.length - 1) * style.ItemSpacing.x / VIDEO_W;
   
    // - 3. Determine scale factor and padding
    let factor = 1.0;
    let padding_x = 0;
    let padding_y = 0;
    if (normalized_w / normalized_h > VIDEO_W / VIDEO_H) {
      // too wide: make width fit and pad height
      let new_w = VIDEO_W / VIDEO_H * normalized_h;
      let new_h = new_w / normalized_w * normalized_h;
      factor = new_w / normalized_w;
      // pad height
      padding_y = (normalized_h - new_h) * VIDEO_H / 2;
      // console.log('pad y', padding_y)
    } else {
      // too high: make height fit and pad width
      let unorm_w = normalized_w * VIDEO_H / normalized_h;
      factor = 1.0
      // pad width
      padding_x += (VIDEO_W - unorm_w) / 2;
      // console.log('pad x', padding_x)
    }

    // - get rects
    let acc_x = img_start_cursor.x + padding_x;
    let acc_y = img_start_cursor.y + padding_y;
    for (var i_video = 0; i_video < this.video_list.length; ++ i_video) {
      this.rect_list[i_video].x = acc_x;
      this.rect_list[i_video].y = acc_y;
      this.rect_list[i_video].w = Math.floor(this.rect_list[i_video].w * factor);
      this.rect_list[i_video].h = Math.floor(this.rect_list[i_video].h * factor);
      acc_x += this.rect_list[i_video].w + style.ItemSpacing.x;
    }

    // - draw
    for (var i_video = 0; i_video < this.video_list.length; ++i_video) {
      let video = this.video_list[i_video];
      if (i_video > 0) imgui.SameLine();
      if (good) {
        imgui.SetCursorPosX(this.rect_list[i_video].x)
        imgui.SetCursorPosY(this.rect_list[i_video].y)
        imgui.Image(video, new Vec2(this.rect_list[i_video].w, this.rect_list[i_video].h));
        // tag at bottom
        imgui.SetCursorPosX(this.rect_list[i_video].x + txt_spacing_x)
        imgui.SetCursorPosY(this.rect_list[i_video].y + this.rect_list[i_video].h);
        // TODO: cannot break word so far
        imgui.PushTextWrapPos(this.rect_list[i_video].x + this.rect_list[i_video].w - txt_spacing_x)
        imgui.TextWrapped(`${this.tag_list[i_video]}`);
        imgui.PopTextWrapPos();
      }
    }

    style.ItemSpacing.x = old_item_spacing_x;

    let img_end_cursor = new Vec2(style.WindowPadding.x, header_height + H + style.ItemSpacing.y);
    imgui.SetCursorPos(img_end_cursor);
  }

  gui_drawControllers() {
    let imgui = this.imgui;

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
    if (this.num_frames === null && this.video_list.length > 0) {
      let master_video = this.video_list[0];
      if (master_video.readyState === 4) {
        // console.log(master_video.duration)
        this.num_frames = parseInt(Math.round(master_video.duration * this.fps));
      }
    }
    imgui.SameLine();
    imgui.PushItemWidth(-1);
    imgui.SliderInt(
      "##Player:slider", this.curr_iframe,
      0, (this.num_frames === null) ? 0 : (this.num_frames-1),
      null, (newval)=> { this.seek_frame(newval); }
    );
    // > Auto pause when press slider.
    let hovered = imgui.IsItemHovered();
    let mouse_down = imgui.IsMouseDown(0);
    if (this.video_list.length > 0 && this.video_list[0].paused) {
      this.playing = false;
    }
    if (this.playing && hovered && mouse_down) {
      if (hovered && mouse_down) {
        this.wanna_play_after_release = true;
        this.pause();
      }
    } else if (!mouse_down && this.wanna_play_after_release) {
      this.wanna_play_after_release = false;
      this.play();
    }
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
      this.curr_iframe = Math.floor(new_sec * this.fps);
      this.video_list.forEach(video => video.currentTime=new_sec);
    }
  }
}

// =====================================================================================================================

class ImGuiPlayer extends ImguiApp
{
  constructor(player_element, width=720, height=360) {
    // create cavnas
    let div = document.createElement('div');
    div.setAttribute('style', `width: ${width}px; text-align: center; margin: 0 auto;`)
    let canvas = document.createElement('canvas');
    canvas.setAttribute('width', width)
    canvas.setAttribute('height', height)
    canvas.setAttribute('style', "background-color: #222;")
    div.appendChild(canvas)

    let message_node = document.createElement('p');
    if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
      message_node.setAttribute('style', "margin: 0 0; opacity: 0.5; font-size: small;")
      message_node.innerHTML = ("Your browser does not support the `Video.requestVideoFrameCallback()` API.<br/>"
        + "Please use Chrome for better video synchronization!");
    }
    div.appendChild(message_node)
    player_element.appendChild(div);

    // get groups
    let node_groups = player_element.getElementsByClassName('mediagroup');
    var groups = [];
    for (var i_group = 0; i_group < node_groups.length; ++i_group) {
      let group = node_groups[i_group];
      let fps   = group.getAttribute('fps');
      let node_videos = group.getElementsByTagName('video');
      var videos = [];
      var tags = [];
      for (var i_video = 0; i_video < node_videos.length; ++i_video) {
        let video = node_videos[i_video];
        let tag = video.getAttribute('tag');
        if (!tag) {
          tag = video.getAttribute('src');
        }
        videos.push(video);
        tags.push(tag);
      }
      groups.push({
        name: group.getAttribute('id'),
        videos: videos,
        tags: tags,
        fps: fps,
      })
    }

    // super
    super(canvas, "imgui-player", "v0.0.1");

    // members
    this.groups = groups;
    this.player = null;
    this.message_node = message_node
  }

  Begin(onReady) {
    super.Begin((err) => {
      if(!err) {
        this.player = new _MyVideoPlayer(this.imgui, this.message_node);
        this.player.setGroups(this.groups);
      }
      if(onReady) {
        onReady(err);
      }
    });
  }

  OnFrame(imgui) {
    if(this.player) {
      this.player.Show();
    }
  }
}

