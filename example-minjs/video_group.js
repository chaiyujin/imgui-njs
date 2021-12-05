class VideoGroup {
  constructor(group_selector) {
    this.init(group_selector);
  }

  init(group_selector) {
    // * select group
    this.group = document.querySelector(group_selector);
    if (this.group === null) {
      console.error(`Failed to find group: ${group_selector}`);
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
    for (let r = 0; r < this.n_rows; ++r) {
      var divRow = document.createElement("div");
      divRow.style.display = "flex";
      divRow.style.textAlign = "center";
      for (let c = 0; c < this.n_cols; ++c) {
        var divCell = document.createElement("div");
        this.grid[r][c] = divCell;
        divCell.style.display = "block";
        divCell.style.overflow = "auto";
        divCell.style.overflowWrap = "anywhere";
        divCell.style.margin = "0 0";
        divCell.style.padding = "0 0";
        if (this.sources[r][c] !== null) {
          var video = document.createElement("video");
          // var tag = document.createElement("p");
          // tag.innerHTML = this.sources[r][c].getAttribute("tag") || "";
          var tag = document.createTextNode(this.sources[r][c].getAttribute("tag") || "");
          video.src = this.sources[r][c].src;
          video.height = rowHeight;
          video.preload = "auto"
          video.controls = "controls"
          video.style.display = "block";
          video.onloadedmetadata = (event) => {
            const W = event.target.videoWidth;
            const H = event.target.videoHeight;
            const h = event.target.height;
            let w = event.target.width;
            if (w === 0) {
              w = h * W / H;
            }
            console.log(event.target.parentElement);
            event.target.parentElement.style.width = `${Math.ceil(w)}px`;
          };
          divCell.appendChild(video);
          divCell.appendChild(tag);
          this.videoList.push(video);
        }
        divRow.appendChild(divCell);
      }
      this.group.appendChild(divRow);
    }

    // * create VideoSync
    this.video_sync = new VideoSync(this.videoList, this.videoList[0]);
  }
};
