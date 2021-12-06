class VideoGroup {
  static CSS_NAME_VIDEO_CONTAINER = "video-group-container";

  constructor(selector) {
    this.init(selector);
    // * create VideoSync
    this.video_sync = new VideoSync(this.videoList, this.videoList[0]);
    this.video_sync.onended = () => {
      this.iconPlay.setAttribute("class", "");
      this.iconPause.setAttribute("class", "hidden");
      this.prgs.value = "1";
      this.seek.value = `${this.maxSeek}`;
    };
    // * seeking
    this.dragging_seek = false;
    this.should_play_after_dragging = false;
    this.video_sync.ontimeupdate = (time, duration) => {
      if (this.prgs === undefined || this.prgs === null) { return; }
      if (this.seek === undefined || this.seek === null) { return; }
      if (Number.isNaN(time)) { return ;}
      if (Number.isNaN(duration)) { return ;}
      // console.log("on update", time, duration);
      if (this.maxSeek <= 0) {
        this.changeMaxSeek(duration * 60);  // !HACK: assume 60fps, larger fps video will lose frames when seeking.
      }
      if (!this.dragging_seek) {
        let percent = time / duration;
        this.prgs.value = `${percent}`;
        this.seek.value = `${percent*this.maxSeek}`;
      }
      this.time_elapsed.innerHTML = this.formatTimeString(time);
      this.time_duration.innerHTML = this.formatTimeString(duration);
    };
    this.seek.oninput = (event) => {
      if (this.video_sync.primVideo === null) { return; }
      if (this.maxSeek <= 0) { return; }
      let duration = this.video_sync.primVideo.duration;
      if (Number.isNaN(duration)) { return ;}
      let percent = event.target.value / this.maxSeek;
      let time = duration * percent;
      this.prgs.value = `${percent}`;
      this.dragging_seek = true;
      if (!this.video_sync.primVideo.paused) {
        this.should_play_after_dragging = true;
      }
      this.video_sync.primVideo.pause();
      this.video_sync.primVideo.currentTime = time;
    }
    this.seek.onmouseup = (event) => {
      if (this.dragging_seek) {
        this.dragging_seek = false;
        if (this.should_play_after_dragging) {
          this.should_play_after_dragging = false;
          this.video_sync.primVideo.play();
        }
      }
    }
  }

  changeMaxSeek(value) {
    this.maxSeek = Math.floor(value);
    if (this.seek !== undefined && this.seek !== null) {
      this.seek.max = `${this.maxSeek}`;
    }
  }

  formatTimeString(sec) {
    const zeroPad = (num, places) => String(num).padStart(places, '0')
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec - h * 3600) / 60);
    const s = Math.floor(sec - h * 3600 - m * 60);
    const ms = (sec - h * 3600 - m * 60 - s);
    return `${zeroPad(h, 2)}:${zeroPad(m, 2)}:${zeroPad(s, 2)}.${ms.toFixed(3).substr(2)}`
  }

  init(selector) {
    this.maxSeek = 0;
    // * select group
    this.group = document.querySelector(selector);
    if (this.group === null) {
      console.error(`Failed to find group: ${selector}`);
      return;
    }
    // * there videos in group already
    const videos = this.group.getElementsByTagName("video");
    if (videos.length > 0) {
      this.videoList = videos;
      return;
    }

    // * fetch sources
    const sources = this.group.getElementsByTagName("source");
    this.n_rows = this.group.getAttribute("n_rows");
    this.n_cols = this.group.getAttribute("n_cols");
    const rowHeight = this.group.getAttribute("row_height");
    if (this.n_rows === null && this.n_cols === null) {
      this.n_rows = 1;
      this.n_cols = sources.length;
    } else if (this.n_cols === null) {
      this.n_cols = Math.ceil(sources.length / this.n_rows);
    } else if (this.n_rows === null) {
      this.n_rows = Math.ceil(sources.length / this.n_cols);
    }
    // * auto layout
    this.sources = [];
    this.grid = []
    for (let i = 0; i < this.n_rows; ++i) {
      let row = [];
      let cells = []
      for (let j = 0; j < this.n_cols; ++j) {
        row.push(null);
        cells.push(null);
      }
      this.sources.push(row);
      this.grid.push(cells);
    } 
    for (let i = 0; i < sources.length; i += 1) {
      const r = Math.floor(i / this.n_cols);
      const c = i - r * this.n_cols;
      this.sources[r][c] = sources[i];
    }
    // * create nodes
    this.videoList = [];
    var div = document.createElement("div");
    div.className = VideoGroup.CSS_NAME_VIDEO_CONTAINER;
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    for (let r = 0; r < this.n_rows; ++r) {
      var divRow = document.createElement("div");
      divRow.style.display = "inline-flex";
      divRow.style.textAlign = "center";
      for (let c = 0; c < this.n_cols; ++c) {
        var divCell = document.createElement("div");
        this.grid[r][c] = divCell;
        divCell.className = "video-cell";
        divCell.style.display = "block";
        divCell.style.overflow = "auto";
        divCell.style.overflowWrap = "anywhere";
        divCell.style.margin = "0 1px";
        divCell.style.padding = "0 0";
        if (this.sources[r][c] !== null) {
          var video = document.createElement("video");
          var tag = document.createTextNode(this.sources[r][c].getAttribute("tag") || "");
          video.src = this.sources[r][c].src;
          video.height = rowHeight;
          video.preload = "auto"
          // video.controls = "controls"
          video.style.display = "block";
          video.onloadedmetadata = (event) => {
            const W = event.target.videoWidth;
            const H = event.target.videoHeight;
            const h = event.target.height;
            let w = event.target.width;
            if (w === 0) {
              w = h * W / H;
            }
            event.target.parentElement.style.width = `${Math.ceil(w+2)}px`;
            console.log(event.target.parentElement.offsetWidth);
          };
          divCell.appendChild(video);
          divCell.appendChild(tag);
          this.videoList.push(video);
        }
        divRow.appendChild(divCell);
      }
      div.appendChild(divRow);
      div.appendChild(document.createElement("div"));
    }
    div.style.margin = '0 auto';
    div.style.textAlign = 'center';
    this.group.appendChild(div);

    // * define svg
    this.defSvg();
    
    // * define control
    this.appendControls();
  }

  defSvg() {
    let svg = document.querySelector("svg#video-group-svg");
    if (svg !== null) { return; }
    console.log("def SVG!")
    let defs = null, sym = null, pathdef = null;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = "video-group-svg";
    svg.style.display = "none";
    this.group.appendChild(svg)
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);
  
    // * symbol play
    sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    sym.id = "play-icon";
    // sym.viewBox = "0 0 24 24";
    pathdef = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathdef.setAttributeNS(null, "d", "M8.016 5.016l10.969 6.984-10.969 6.984v-13.969z");
    sym.appendChild(pathdef);
    defs.appendChild(sym);

    // * symbol pause
    sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    sym.id = "pause-icon";
    // sym.viewBox = "0 0 24 24";
    pathdef = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathdef.setAttributeNS(null, "d", "M14.016 5.016h3.984v13.969h-3.984v-13.969zM6 18.984v-13.969h3.984v13.969h-3.984z");
    sym.appendChild(pathdef);
    defs.appendChild(sym);
  }

  appendControls() {
    let ctrl = this.group.querySelector("div#video-controls");
    if (ctrl !== null) { return; }
    console.log("append controls!");

    // * outter wrapper
    ctrl = document.createElement("div");
    ctrl.id = "video-controls";
    ctrl.className = "video-controls";
    this.group.appendChild(ctrl);

    // * progress bar
    let pbar = document.createElement("div");
    pbar.className = "video-progress";
    let prgs = document.createElement("progress");
    prgs.id = "progress-bar";
    prgs.value = "0.1";
    prgs.min = "0";
    pbar.appendChild(prgs);
    let seek = document.createElement("input");
    seek.id = "seek";
    seek.className = "slider seek";
    seek.value = "10";
    seek.min = "0";
    seek.max = `${this.maxSeek}`;
    seek.type = "range";
    seek.step = "1";
    pbar.appendChild(seek);
    ctrl.appendChild(pbar);
    this.prgs = prgs;
    this.seek = seek;

    // * bottom controls
    let bottom = document.createElement("div");
    bottom.className = "bottom-controls";
    ctrl.appendChild(bottom);
    // * bottom left
    let left = document.createElement("div");
    left.className = "left-controls";
    bottom.appendChild(left);
    // * play | pause button
    let plyBtn = document.createElement("button");
    plyBtn.id = "play";
    plyBtn.className = "button-controls";
    plyBtn.setAttribute("data-title", "Play");
    left.appendChild(plyBtn);
    let plyBtnSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    plyBtn.appendChild(plyBtnSvg);
    let plyBtnSvgPath0 = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    plyBtnSvgPath0.id = "path-play";
    plyBtnSvgPath0.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", "#play-icon");
    plyBtnSvg.appendChild(plyBtnSvgPath0);
    let plyBtnSvgPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    plyBtnSvgPath1.id = "path-pause";
    plyBtnSvgPath1.setAttribute("class", "hidden");
    plyBtnSvgPath1.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", "#pause-icon");
    plyBtnSvg.appendChild(plyBtnSvgPath1);
    this.iconPlay = plyBtnSvgPath0;
    this.iconPause = plyBtnSvgPath1;
    // * play | pause
    plyBtn.onclick = (event) => {
      this.togglePlayPause();
    };
    // * time info
    let timeTxt = document.createElement("div");
    timeTxt.className = "time";
    left.appendChild(timeTxt);
    let time0 = document.createElement("time");
    let time1 = document.createElement("time");
    let split = document.createTextNode(" / ");
    time0.appendChild(document.createTextNode("00:00:00.000"));
    time1.appendChild(document.createTextNode("00:00:00.000"));
    timeTxt.appendChild(time0);
    timeTxt.appendChild(split);
    timeTxt.appendChild(time1);
    this.time_elapsed = time0;
    this.time_duration = time1;
  }

  togglePlayPause() {
    if (this.video_sync.state === VideoSync.STATE_PAUSED && this.video_sync.allReady()) {
      this.video_sync.play();
      this.iconPlay.setAttribute("class", "hidden");
      this.iconPause.setAttribute("class", "");
    } else if (this.video_sync.state === VideoSync.STATE_PLAYING) {
      this.video_sync.pause();
      this.iconPlay.setAttribute("class", "");
      this.iconPause.setAttribute("class", "hidden");
    }
  }
};
