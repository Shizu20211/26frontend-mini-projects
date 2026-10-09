'use strict';

// Uploaded images remain local, original-color assets for the current session.
const UPLOAD_LIMIT = 5 * 1024 * 1024;
const UPLOAD_PIXEL_LIMIT = 16 * 1024 * 1024;
const FOOTPRINT_SAMPLE_SIZE = 256;
const customAssets = new Map();
const uploadUi = {
  button: document.getElementById('uploadButton'),
  input: document.getElementById('uploadInput'),
};
let nextCustomAssetId = 1;
let uploadRevision = 0;
let uploadBusy = false;

function setUploadBusy(busy) {
  uploadBusy = busy;
  uploadUi.button.disabled = busy;
  uploadUi.input.disabled = busy;
  uploadUi.button.textContent = busy ? '正在準備小物…' : '＋ 匯入自己的小物';
  uploadUi.button.setAttribute('aria-busy', String(busy));
}

function cancelCustomUpload() {
  uploadRevision++;
  uploadUi.input.value = '';
  setUploadBusy(false);
}

function releaseUnusedCustomAssets() {
  for (const [id, asset] of customAssets) {
    if (state.items.some((item) => item.assetId === id)) continue;
    URL.revokeObjectURL(asset.src);
    customAssets.delete(id);
    const index = decoCatalog.findIndex((asset) => asset.id === id);
    if (index >= 0) decoCatalog.splice(index, 1);
    ui.collection.querySelector(`[data-custom-asset="${id}"]`)?.remove();
  }
}

async function validateCustomFile(file) {
  if (!file || file.size === 0) throw new Error('請選擇有效的 PNG 或 WebP 圖片。');
  if (file.size > UPLOAD_LIMIT) throw new Error('圖片超過 5MB，請縮小檔案後再匯入。');
  const bytes = new Uint8Array(await file.slice(0, 24).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const webp = text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP';
  if (!png && !webp) throw new Error('僅支援 PNG 或 WebP 圖片。');
  if (png) {
    if (bytes.length < 24) throw new Error('圖片檔案不完整，請重新選擇。');
    const header = new DataView(bytes.buffer);
    if (header.getUint32(16) * header.getUint32(20) > UPLOAD_PIXEL_LIMIT) {
      throw new Error('圖片尺寸過大，請縮小至 1600 萬像素以內。');
    }
  }
}

function customFootprint(image) {
  // Sample once at import. Never read alpha pixels in the drag/physics loop.
  const size = FOOTPRINT_SAMPLE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const fit = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * fit;
  const height = image.naturalHeight * fit;
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  const pixels = context.getImageData(0, 0, size, size).data;
  const opaque = (x, y) =>
    x >= 0 && y >= 0 && x < size && y < size && pixels[(y * size + x) * 4 + 3] >= 16;
  const normals = Array.from({ length: 16 }, (_, index) => ({
    x: Math.cos((index * Math.PI) / 8),
    y: Math.sin((index * Math.PI) / 8),
    support: -Infinity,
  }));
  let visible = false;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!opaque(x, y)) continue;
      visible = true;
      if (opaque(x - 1, y) && opaque(x + 1, y) && opaque(x, y - 1) && opaque(x, y + 1)) continue;
      for (const normal of normals) {
        // Enclose the entire sampled pixel, rather than only its center.
        const px = (x + (normal.x >= 0 ? 1 : 0)) / size;
        const py = (y + (normal.y >= 0 ? 1 : 0)) / size;
        normal.support = Math.max(normal.support, px * normal.x + py * normal.y);
      }
    }
  }
  if (!visible) throw new Error('圖片沒有可辨識的內容，請選擇非全透明的圖片。');
  let polygon = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  for (const normal of normals) {
    const distance = (point) => normal.support - point.x * normal.x - point.y * normal.y;
    const clipped = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i],
        b = polygon[(i + 1) % polygon.length];
      const da = distance(a),
        db = distance(b);
      if (da >= -GEOMETRY_EPSILON) clipped.push(a);
      if (da >= -GEOMETRY_EPSILON !== db >= -GEOMETRY_EPSILON) {
        const t = da / (da - db);
        clipped.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    polygon = clipped;
  }
  // Collapse numerical duplicate vertices at shared support-plane corners.
  return polygon.filter((point, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    return Math.hypot(point.x - previous.x, point.y - previous.y) > GEOMETRY_EPSILON;
  });
}

function appendCustomCollection(asset) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'collection-item';
  button.dataset.assetId = asset.id;
  button.dataset.customAsset = asset.id;
  button.setAttribute('aria-label', `再加入 ${asset.label}`);
  const image = document.createElement('img');
  image.src = asset.src;
  image.alt = '';
  image.draggable = false;
  const label = document.createElement('span');
  label.textContent = asset.label;
  const hint = document.createElement('small');
  hint.textContent = '＋ 再加入自己的小物';
  label.append(hint);
  button.append(image, label);
  button.addEventListener('click', () => createItem(asset.id));
  ui.collection.append(button);
}

async function importCustomFile(file) {
  if (state.mode !== 'design' || uploadBusy) return false;
  const revision = ++uploadRevision;
  let url = null;
  let retained = false;
  setUploadBusy(true);
  try {
    await validateCustomFile(file);
    if (revision !== uploadRevision) return false;
    url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error('無法讀取這張圖片，請確認檔案完整。');
    }
    if (revision !== uploadRevision || state.mode !== 'design') return false;
    if (image.naturalWidth * image.naturalHeight > UPLOAD_PIXEL_LIMIT) {
      throw new Error('圖片尺寸過大，請縮小至 1600 萬像素以內。');
    }
    const asset = {
      id: `custom-${nextCustomAssetId++}`,
      label: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || '自己的小物',
      src: url,
      custom: true,
      blob: file,
      footprint: customFootprint(image),
    };
    const probe = { assetId: asset.id, design: { scale: 1, rotation: 0 } };
    decoCatalog.push(asset);
    if (centerRegion(machinePolygons[state.machineId], itemFootprint(probe)).length < 3) {
      decoCatalog.pop();
      throw new Error('目前容器放不下這張圖片，請改用較小的素材。');
    }
    customAssets.set(asset.id, asset);
    retained = true;
    appendCustomCollection(asset);
    createItem(asset.id);
    announce(`已匯入 ${asset.label}。僅在本機使用，保留原色。`);
    return true;
  } catch (error) {
    if (revision === uploadRevision) announce(error.message);
    return false;
  } finally {
    if (url && !retained) URL.revokeObjectURL(url);
    if (revision === uploadRevision) {
      uploadUi.input.value = '';
      setUploadBusy(false);
    }
  }
}

uploadUi.button.addEventListener('click', () => {
  if (state.mode === 'design' && !uploadBusy) uploadUi.input.click();
});
uploadUi.input.addEventListener('change', () => {
  const file = uploadUi.input.files[0];
  if (file) importCustomFile(file);
});
window.addEventListener('pagehide', (event) => {
  // Preserve live URLs for a page retained in the browser's back/forward cache.
  if (event.persisted) return;
  cancelCustomUpload();
  for (const asset of customAssets.values()) URL.revokeObjectURL(asset.src);
});
