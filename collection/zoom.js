(function () {
  var SCALE = 2.5;
  var container, img, zoomed, dragging, startX, startY, offsetX, offsetY, moved;

  function init() {
    container = document.querySelector('.gallery-main');
    img = document.getElementById('gallery-main-img');
    if (!container || !img) return;

    zoomed = false;
    dragging = false;
    offsetX = 0;
    offsetY = 0;

    container.classList.add('zoomable');
    container.addEventListener('click', handleClick);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
  }

  function handleClick(e) {
    if (moved) return;
    if (zoomed) {
      zoomOut();
    } else {
      zoomIn(e);
    }
  }

  function zoomIn(e) {
    zoomed = true;
    container.classList.add('zoomed');

    var rect = img.getBoundingClientRect();
    var clickX = (e.clientX - rect.left) / rect.width;
    var clickY = (e.clientY - rect.top) / rect.height;

    var maxOffsetX = (img.naturalWidth * SCALE - rect.width) / 2;
    var maxOffsetY = (img.naturalHeight * SCALE - rect.height) / 2;

    offsetX = (0.5 - clickX) * rect.width * (SCALE - 1);
    offsetY = (0.5 - clickY) * rect.height * (SCALE - 1);

    offsetX = clamp(offsetX, -maxOffsetX, maxOffsetX);
    offsetY = clamp(offsetY, -maxOffsetY, maxOffsetY);

    applyTransform();
  }

  function zoomOut() {
    zoomed = false;
    dragging = false;
    container.classList.remove('zoomed');
    img.style.transform = '';
    offsetX = 0;
    offsetY = 0;
  }

  function handleMouseDown(e) {
    if (!zoomed) return;
    e.preventDefault();
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    container.classList.add('dragging');
  }

  function handleMouseMove(e) {
    if (!dragging) return;
    e.preventDefault();
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    offsetX += dx;
    offsetY += dy;
    startX = e.clientX;
    startY = e.clientY;
    clampOffset();
    applyTransform();
  }

  function handleMouseUp() {
    if (!dragging) return;
    dragging = false;
    container.classList.remove('dragging');
  }

  function handleTouchStart(e) {
    if (!zoomed) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    dragging = true;
    moved = false;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    container.classList.add('dragging');
  }

  function handleTouchMove(e) {
    if (!dragging) return;
    e.preventDefault();
    var dx = e.touches[0].clientX - startX;
    var dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    offsetX += dx;
    offsetY += dy;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    clampOffset();
    applyTransform();
  }

  function handleTouchEnd() {
    if (!dragging) return;
    dragging = false;
    container.classList.remove('dragging');
    if (!moved && zoomed) zoomOut();
  }

  function clampOffset() {
    var rect = container.getBoundingClientRect();
    var scaledW = img.offsetWidth * SCALE;
    var scaledH = img.offsetHeight * SCALE;
    var maxX = Math.max(0, (scaledW - rect.width) / 2);
    var maxY = Math.max(0, (scaledH - rect.height) / 2);
    offsetX = clamp(offsetX, -maxX, maxX);
    offsetY = clamp(offsetY, -maxY, maxY);
  }

  function applyTransform() {
    img.style.transform = 'scale(' + SCALE + ') translate(' + (offsetX / SCALE) + 'px, ' + (offsetY / SCALE) + 'px)';
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  window.resetZoom = function () {
    if (zoomed) zoomOut();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
