class VideoGroup {
  // * Name for serveral main nodes, id and className are same
  static NAME_VIDEO_CONTAINER = "__yuki-video-container";
  static NAME_VIDEO_CONTROLS = "__yuki-video-controls";
  static NAME_SVG = "__yuki-video-group-svg";

  constructor(selector) {
    // * select the main node to put our videos
    this.main = document.querySelector(selector);
    if (this.main === null) {
      console.error(`Failed to find group: ${selector}`);
      return;
    }
    // * load first time
    this.load();
    // * resize listener
    window.addEventListener("resize", (event) => {
      if (this.videoList === null || this.videoList.length === 0) {
        return;
      }
      let metaReady = true;
      this.videoList.forEach((video) => {
        if (!video.error && video.readyState < 1) {
          metaReady = false;
        }
      })
      if (!metaReady) { console.log("meta is not ready!"); return; }

      let div = this.divContainer;
      this.rowHeight = Math.ceil(div.offsetHeight / this.nRows) - 16 * 3;
      this.videoList.forEach((video) => { this.resizeVideo(video); });
      window.requestAnimationFrame(() => this.waitAllResized());
    });
  }

  reset() {
    if (this.videoSync !== undefined && this.videoSync !== null) {
      this.videoSync.reset();
    }
    this.maxSeek = 0;
    this.sources = null;
    this.grid = null;
    this.videoList = null;
    this.videoSync = null;
  }

  load(source) {
    source = source || this.main;
    // * Reset
    this.reset();
    // * CASE 1: Load <source> tags in element
    if (source instanceof HTMLElement) {
      this._loadFromSourceTags(source);
    }
    this.init();
    this.initPlayer();
  }

  _loadFromSourceTags(element) {
    // * There videos in group already
    const videos = element.getElementsByTagName("video");
    if (videos.length > 0) {
      this.videoList = videos;
      return;
    }

    // * Fetch sources
    const sources = element.getElementsByTagName("source");
    this.nRows = element.getAttribute("n-rows");
    this.nCols = element.getAttribute("n-cols");
    if (this.nRows === null && this.nCols === null) {
      this.nRows = 1;
      this.nCols = sources.length;
    } else if (this.nCols === null) {
      this.nCols = Math.ceil(sources.length / this.nRows);
    } else if (this.nRows === null) {
      this.nRows = Math.ceil(sources.length / this.nCols);
    }
    // * auto layout
    this.sources = [];
    for (let i = 0; i < this.nRows; ++i) {
      let row = [];
      for (let j = 0; j < this.nCols; ++j) {
        row.push(null);
      }
      this.sources.push(row);
    } 
    for (let i = 0; i < sources.length; i += 1) {
      const r = Math.floor(i / this.nCols);
      const c = i - r * this.nCols;
      this.sources[r][c] = {
        src: sources[i].src,
        tag: sources[i].getAttribute("tag") || "",
      };
    }
  }

  initPlayer() {
    // * create VideoSync
    this.videoSync = new VideoSync(this.videoList, this.videoList[0]);
    this.videoSync.onended = () => {
      this.iconPlay.setAttribute("class", "");
      this.iconPause.setAttribute("class", "hidden");
      this.prgs.value = "1";
      this.seek.value = `${this.maxSeek}`;
    };
    // * seeking
    this.dragging_seek = false;
    this.should_play_after_dragging = false;
    this.videoSync.ontimeupdate = (time, duration) => {
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
      if (this.videoSync.primVideo === null) { return; }
      if (this.maxSeek <= 0) { return; }
      let duration = this.videoSync.primVideo.duration;
      if (Number.isNaN(duration)) { return ;}
      let percent = event.target.value / this.maxSeek;
      let time = duration * percent;
      this.prgs.value = `${percent}`;
      this.dragging_seek = true;
      if (!this.videoSync.primVideo.paused) {
        this.should_play_after_dragging = true;
      }
      this.videoSync.primVideo.pause();
      this.videoSync.primVideo.currentTime = time;
    }
    this.seek.onmouseup = (event) => {
      if (this.dragging_seek) {
        this.dragging_seek = false;
        if (this.should_play_after_dragging) {
          this.should_play_after_dragging = false;
          this.videoSync.primVideo.play();
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

  init() {
    // * Guard
    if (this.sources === undefined || this.sources === null || this.sources.length === 0) {
      console.error("No sources!");
      return;
    }
    // * init grid
    this.grid = [];
    for (let i = 0; i < this.nRows; ++i) {
      let cells = []
      for (let j = 0; j < this.nCols; ++j) { cells.push(null); }
      this.grid.push(cells);
    } 

    // * create nodes
    const _createNodeContainer = () => {
      let div = document.createElement("div");
      div.className = VideoGroup.NAME_VIDEO_CONTAINER;
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
      div.style.margin = '0 auto';
      div.style.textAlign = 'center';
      this.main.appendChild(div);
      return div;
    };

    const _createNodeRow = (div) => {
      let divRow = document.createElement("div");
      divRow.style.display = "inline-flex";
      divRow.style.textAlign = "center";
      div.appendChild(divRow);
      div.appendChild(document.createElement("div"));
      return divRow;
    };

    const _createNodeCell = (divRow, r, c) => {
      let divCell = document.createElement("div");
      divCell.className = "video-cell";
      divCell.style.display = "block";
      divCell.style.overflow = "auto";
      divCell.style.overflowWrap = "anywhere";
      divCell.style.margin = "0 1px";
      divCell.style.padding = "0 0";
      divCell.style.width = "1";
      divCell.style.fontSize = "16px";
      divRow.appendChild(divCell);
      this.grid[r][c] = divCell;
      return divCell;
    };

    const _createVideo = (source) => {
      let video = document.createElement("video");
      video.src = source.src;
      video.width = 0;
      video.height = 0;
      video.preload = "auto"
      // video.controls = "controls"
      video.style.display = "block";
      video.onloadedmetadata = (event) => {
        const video = event.target;
        this.resizeVideo(video);
      };
      return video;
    }

    this.videoList = [];
    let div = _createNodeContainer();
    this.divContainer = div;
    this.divRowList = [];
    this.rowHeight = Math.ceil(div.offsetHeight / this.nRows) - 16 * 3;
    // * each row
    for (let r = 0; r < this.nRows; ++r) {
      let divRow = _createNodeRow(div);
      this.divRowList.push(divRow);
      // * each col
      for (let c = 0; c < this.nCols; ++c) {
        let divCell = _createNodeCell(divRow, r, c);
        // * check this video source
        if (this.sources[r][c] !== null) {
          let vid = _createVideo(this.sources[r][c]);
          let tag = document.createTextNode(this.sources[r][c].tag);
          divCell.appendChild(vid);
          divCell.appendChild(tag);
          this.videoList.push(vid);
        }
      }
    }
    window.requestAnimationFrame(() => this.waitAllResized());

    // * define control
    this.appendControls();
    // * define svg
    this.defSvg();
  }

  appendControls() {
    let ctrl = this.main.querySelector(`div#${VideoGroup.NAME_VIDEO_CONTROLS}`);
    if (ctrl !== null) { return; }
    console.log("append controls!");

    // * outter wrapper
    ctrl = document.createElement("div");
    ctrl.id = VideoGroup.NAME_VIDEO_CONTROLS;
    ctrl.className = VideoGroup.NAME_VIDEO_CONTROLS;
    this.main.appendChild(ctrl);

    // * progress bar
    let pbar = document.createElement("div");
    pbar.className = "video-progress";
    let prgs = document.createElement("progress");
    prgs.id = "progress-bar";
    prgs.value = "0";
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

  defSvg() {
    let svg = document.querySelector(`svg#${VideoGroup.NAME_SVG}`);
    if (svg !== null) { return; }
    console.log("def SVG!")
    let defs = null, sym = null, pathdef = null;

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = VideoGroup.NAME_SVG;
    svg.style.display = "none";
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

    // * append svg
    this.main.appendChild(svg);
  }

  togglePlayPause() {
    if (this.videoSync.state === VideoSync.STATE_PAUSED && this.videoSync.allReady()) {
      this.videoSync.play();
      this.iconPlay.setAttribute("class", "hidden");
      this.iconPause.setAttribute("class", "");
    } else if (this.videoSync.state === VideoSync.STATE_PLAYING) {
      this.videoSync.pause();
      this.iconPlay.setAttribute("class", "");
      this.iconPause.setAttribute("class", "hidden");
    }
  }

  // * ------------------------------------------------------------------------------------------------------------ * //
  // *                                                    Resize                                                    * //
  // * ------------------------------------------------------------------------------------------------------------ * //

  resizeVideo(video) {
    if (video.error) {
      video.height = this.rowHeight;
      return;
    }
    const W = video.videoWidth;
    const H = video.videoHeight;
    const h = this.rowHeight;
    const w = h * W / H;
    video.width = w;
    video.height = h;
    video.parentElement.style.width = `${Math.ceil(w+2)}px`;
    // console.log(video.parentElement.offsetWidth);
  }

  waitAllResized() {
    console.log("waitAllResized")
    let ready = true;
    this.videoList.forEach((video) => {
      if (video.error) return;
      ready &= (video.height == this.rowHeight);
    });
    // * Check div
    if (ready) {
      let W = 0;
      this.divRowList.forEach((divRow) => {
        W = Math.max(W, divRow.offsetWidth);
      });
      // * too wide
      if (W > window.innerWidth) {
        console.log("too wide!", W, window.innerWidth);
        const factor = window.innerWidth / W;
        this.rowHeight = Math.ceil(this.rowHeight * factor) - 2;
        this.videoList.forEach((video) => { this.resizeVideo(video); });
        ready = false;
      }
    }
    // * refresh state each frame
    if (!ready) {
      window.requestAnimationFrame(() => this.waitAllResized());
    }
  }
};
