'use strict';

let collectionExportBusy = false;

async function exportImage(source) {
  const image = new Image();
  const path = new URL(source, location.href).pathname;
  const key = Object.keys(window.collectionExportSources || {}).find((key) =>
    path.endsWith('/' + key),
  );
  image.src = key ? window.collectionExportSources[key] : source;
  await image.decode();
  return image;
}

function drawContained(context, image, x, y, width, height) {
  const fit = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * fit;
  const h = image.naturalHeight * fit;
  context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

async function renderCollectionPNG(snapshot) {
  const size = 1600;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const background = await exportImage(snapshot.background);
  const fit = Math.max(
    snapshot.app.width / background.naturalWidth,
    snapshot.app.height / background.naturalHeight,
  );
  const width = background.naturalWidth * fit;
  const height = background.naturalHeight * fit;
  const scale = size / snapshot.machine.width;
  context.save();
  context.scale(scale, scale);
  context.drawImage(
    background,
    snapshot.app.left + (snapshot.app.width - width) / 2 - snapshot.machine.left,
    snapshot.app.top + (snapshot.app.height - height) / 2 - snapshot.machine.top,
    width,
    height,
  );
  context.restore();
  context.fillStyle = snapshot.tint;
  context.fillRect(0, 0, size, size);
  drawContained(context, await exportImage(snapshot.back), 0, 0, size, size);

  for (const item of snapshot.items) {
    if (item.motion.type !== 'hang') continue;
    const p = item.position;
    const dx = (p.x - p.anchorX) * size;
    const dy = (p.y - p.anchorY) * size;
    const length = Math.hypot(dx, dy);
    const rope = hangCatalog.find((asset) => asset.id === item.motion.hangStyle);
    context.save();
    context.translate(p.anchorX * size, p.anchorY * size);
    context.rotate(Math.atan2(dy, dx));
    if (rope?.src && length > 0) {
      const image = await exportImage(rope.src);
      const height = length * rope.aspect * 2;
      const strip = document.createElement('canvas');
      strip.width = Math.max(1, Math.ceil(length));
      strip.height = Math.max(1, Math.ceil(height));
      const brush = strip.getContext('2d');
      brush.drawImage(image, -length / 2, 0, length * 2, height);
      if (item.motion.hangColor) {
        brush.globalCompositeOperation = 'source-in';
        brush.fillStyle = item.motion.hangColor;
        brush.fillRect(0, 0, strip.width, strip.height);
      }
      context.drawImage(strip, 0, -height / 2, length, height);
    } else {
      context.strokeStyle = item.motion.hangColor || snapshot.ropeColor;
      context.lineWidth = 3 * scale;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(length, 0);
      context.stroke();
    }
    context.restore();
  }

  for (const item of snapshot.items.sort((a, b) => a.design.zIndex - b.design.zIndex)) {
    const image = await exportImage(item.source);
    const width = ITEM_SIZE * item.design.scale * size;
    context.save();
    context.translate(item.position.x * size, item.position.y * size);
    context.rotate((item.position.rotation * Math.PI) / 180);
    drawContained(context, image, -width / 2, -width / 2, width, width);
    context.restore();
  }
  drawContained(context, await exportImage(snapshot.frame), 0, 0, size, size);
  drawContained(context, await exportImage(snapshot.front), 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('圖片產生失敗。'))),
      'image/png',
    ),
  );
}

async function downloadCollectionPNG() {
  if (state.mode !== 'shake' || collectionExportBusy) return false;
  collectionExportBusy = true;
  state.exportBusy = true;
  const resume = shakeRuntime.frame !== null;
  stopPhysicsLoop();
  const buttons = [...ui.shakeActions.querySelectorAll('button')];
  const disabled = buttons.map((button) => button.disabled);
  buttons.forEach((button) => (button.disabled = true));
  ui.shakeArea.style.pointerEvents = 'none';
  ui.keepButton.setAttribute('aria-busy', 'true');
  const snapshot = {
    background: ui.background.currentSrc || ui.background.src,
    back: ui.machineBack.src,
    frame: ui.machineFrame.src,
    front: ui.machineFront.src,
    app: document.querySelector('.app').getBoundingClientRect(),
    machine: ui.machine.getBoundingClientRect(),
    tint: getComputedStyle(document.querySelector('.app'), '::before').backgroundColor,
    ropeColor: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
    items: state.items.map((item) => ({
      design: { ...item.design },
      motion: { ...item.motion },
      position: { ...(item.physics || item.design) },
      source: document.getElementById(item.id).querySelector('img').src,
    })),
  };
  try {
    if (location.protocol === 'file:' && !window.collectionExportSources) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './collection-export-assets.js';
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('無法載入收藏素材。'));
        };
        document.head.append(script);
      });
    }
    const blob = await renderCollectionPNG(snapshot);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `記憶萬花筒-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce('已下載目前容器畫面。可以繼續搖動。');
    return true;
  } catch (error) {
    announce('無法下載圖片，請稍後再試。');
    console.error('Collection PNG export failed:', error);
    return false;
  } finally {
    collectionExportBusy = false;
    state.exportBusy = false;
    buttons.forEach((button, index) => (button.disabled = disabled[index]));
    ui.shakeArea.style.pointerEvents = '';
    ui.keepButton.removeAttribute('aria-busy');
    if (resume && state.mode === 'shake') startPhysicsLoop(motionPreference.matches);
  }
}

ui.keepButton.addEventListener('click', downloadCollectionPNG);
