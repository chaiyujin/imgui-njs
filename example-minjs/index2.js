// self executing function here
(function() {

  let group = new VideoGroup("div#video-group");

  var dropZone = document.getElementById('dropzone');
  function showDropZone() {
    dropZone.style.display = "block";
  }
  function hideDropZone() {
    dropZone.style.display = "none";
  }
  function allowDrag(e) {
    if (true) {  // Test that the item being dragged is a valid one
        e.dataTransfer.dropEffect = 'copy';
        e.preventDefault();
    }
  }
  function handleDrop(ev) {
    ev.preventDefault();
    hideDropZone();

    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
    }
  }
  // 1
  window.addEventListener('dragenter', function(e) {
    showDropZone();
  });
  // 2
  dropZone.addEventListener('dragenter', allowDrag);
  dropZone.addEventListener('dragover', allowDrag);
  // 3
  dropZone.addEventListener('dragleave', function(e) {
    console.log('dragleave');
    hideDropZone();
  });
  // 4
  dropZone.addEventListener('drop', handleDrop);

})();
