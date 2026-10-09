'use strict';

// All original asset paths are kept here, separate from editable instances.
const machineCatalog = Object.fromEntries(
  [
    ['box', '老家的禮物'],
    ['green', '綠油精'],
    ['plastic', '帶走的晚餐'],
  ].map(([id, label]) => [
    id,
    {
      id,
      label,
      back: `./assets/machine-back/${id}_bg.png`,
      frame: `./assets/machine-frame/${id}_line.png`,
      front: `./assets/machine-front-glass/${id}_front.png`,
    },
  ]),
);
const backgroundCatalog = [
  {
    id: 'bg-1',
    label: '夏日早晨',
    src: './assets/full_bg.png',
    previewSrc: './assets/background-preview/full_bg.png',
  },
  {
    id: 'bg-2',
    label: '秋日午後',
    src: './assets/full_bg2.png',
    previewSrc: './assets/background-preview/full_bg2.png',
  },
];
// PNG footprints: original 1–2 sampling; renamed 3–4 use alpha >= 16 at 256px.
// Detect visible edges conservatively; original PNGs remain unchanged.
const decoFootprints = {
  deco_1: [
    {
      x: 0.0825,
      y: 0.2825,
    },
    {
      x: 0.0925,
      y: 0.0775,
    },
    {
      x: 0.1075,
      y: 0.0675,
    },
    {
      x: 0.5375,
      y: 0.0675,
    },
    {
      x: 0.9125,
      y: 0.0775,
    },
    {
      x: 0.9175,
      y: 0.6175,
    },
    {
      x: 0.9075,
      y: 0.8975,
    },
    {
      x: 0.8925,
      y: 0.9275,
    },
    {
      x: 0.0925,
      y: 0.9225,
    },
    {
      x: 0.0875,
      y: 0.9125,
    },
  ],
  deco_2: [
    {
      x: 0.1225,
      y: 0.1475,
    },
    {
      x: 0.2075,
      y: 0.1125,
    },
    {
      x: 0.8525,
      y: 0.1175,
    },
    {
      x: 0.8575,
      y: 0.4625,
    },
    {
      x: 0.8475,
      y: 0.8175,
    },
    {
      x: 0.8175,
      y: 0.8475,
    },
    {
      x: 0.6175,
      y: 0.8525,
    },
    {
      x: 0.1625,
      y: 0.8525,
    },
    {
      x: 0.1275,
      y: 0.8275,
    },
    {
      x: 0.1225,
      y: 0.6775,
    },
  ],
  deco_3: [
    {
      x: 0.8359375,
      y: 0.17901729345603984,
    },
    {
      x: 0.8359375,
      y: 0.8242187500000002,
    },
    {
      x: 0.83317536413599,
      y: 0.8308871358640102,
    },
    {
      x: 0.8269808858640102,
      y: 0.83708161413599,
    },
    {
      x: 0.7731598913599007,
      y: 0.859375,
    },
    {
      x: 0.19140625,
      y: 0.859375,
    },
    {
      x: 0.16796875,
      y: 0.8359375,
    },
    {
      x: 0.16796874999999992,
      y: 0.2291283369120798,
    },
    {
      x: 0.19464229345603978,
      y: 0.16473270654396022,
    },
    {
      x: 0.203125,
      y: 0.15624999999999997,
    },
    {
      x: 0.2408470869120793,
      y: 0.14062500000000008,
    },
    {
      x: 0.7952569782719798,
      y: 0.14062499999999994,
    },
    {
      x: 0.8180242717280198,
      y: 0.1500555217280199,
    },
    {
      x: 0.828125,
      y: 0.16015625000000003,
    },
  ],
  deco_4: [
    {
      x: 0.953125,
      y: 0.3501070976483182,
    },
    {
      x: 0.953125,
      y: 0.625,
    },
    {
      x: 0.9144550979038606,
      y: 0.7183574020961394,
    },
    {
      x: 0.7812500000000002,
      y: 0.8515624999999998,
    },
    {
      x: 0.658653217535741,
      y: 0.90234375,
    },
    {
      x: 0.2619963586400994,
      y: 0.90234375,
    },
    {
      x: 0.21484375000000017,
      y: 0.8828125000000001,
    },
    {
      x: 0.1544019997444578,
      y: 0.8223707497444578,
    },
    {
      x: 0.015625,
      y: 0.4873334348159403,
    },
    {
      x: 0.01562499999999999,
      y: 0.4010033369120797,
    },
    {
      x: 0.05334708691207961,
      y: 0.3099341630879204,
    },
    {
      x: 0.23409739135990032,
      y: 0.12918385864009962,
    },
    {
      x: 0.31964229345603973,
      y: 0.09375000000000001,
    },
    {
      x: 0.6820907175357414,
      y: 0.09374999999999994,
    },
    {
      x: 0.8647029727760898,
      y: 0.16939047277608962,
    },
    {
      x: 0.8878628641359898,
      y: 0.1925503641359897,
    },
  ],
};
const decoCatalog = [1, 2, 3, 4].map((number) => ({
  id: `deco-${number}`,
  label: `外婆家的磚${number}`,
  src: `./assets/deco/deco_${number}.png`,
}));
// Fixed container regions supplied by the user from their adjusted browser session.
// Preserve full coordinate precision. Range editing is not exposed in the app.
const defaultMachinePolygons = {
  box: [
    {
      x: 0.1075,
      y: 0.2575,
    },
    {
      x: 0.6575,
      y: 0.1675,
    },
    {
      x: 0.8975,
      y: 0.2775,
    },
    {
      x: 0.9125,
      y: 0.2975,
    },
    {
      x: 0.9025,
      y: 0.5525,
    },
    {
      x: 0.8675,
      y: 0.7325,
    },
    {
      x: 0.5025,
      y: 0.8425,
    },
    {
      x: 0.2975,
      y: 0.8925,
    },
    {
      x: 0.2725,
      y: 0.8775,
    },
    {
      x: 0.1425,
      y: 0.6625,
    },
  ],
  green: [
    {
      x: 0.3059317869863823,
      y: 0.3228059567852644,
    },
    {
      x: 0.5073909792191436,
      y: 0.2771546517091074,
    },
    {
      x: 0.6165408102270938,
      y: 0.29795826179254564,
    },
    {
      x: 0.6862260656092568,
      y: 0.38105595125059033,
    },
    {
      x: 0.8009954910854848,
      y: 0.8341465716998583,
    },
    {
      x: 0.6925,
      y: 0.9075,
    },
    {
      x: 0.5406781082729848,
      y: 0.9491740421323992,
    },
    {
      x: 0.4075,
      y: 0.9675,
    },
    {
      x: 0.3467225689251417,
      y: 0.9569562613153337,
    },
    {
      x: 0.2101336931281486,
      y: 0.4416588340778495,
    },
  ],
  plastic: [
    {
      x: 0.21025290385902076,
      y: 0.5017803755214892,
    },
    {
      x: 0.33956857215247166,
      y: 0.2869994071749055,
    },
    {
      x: 0.8586658176066593,
      y: 0.4771998669218356,
    },
    {
      x: 0.7925,
      y: 0.6475,
    },
    {
      x: 0.7475,
      y: 0.7475,
    },
    {
      x: 0.6875,
      y: 0.8375,
    },
    {
      x: 0.6175,
      y: 0.9225,
    },
    {
      x: 0.4475,
      y: 0.9125,
    },
    {
      x: 0.2975,
      y: 0.8775,
    },
    {
      x: 0.1175,
      y: 0.7075,
    },
  ],
};
const machinePolygons = Object.freeze(
  Object.fromEntries(
    Object.entries(defaultMachinePolygons).map(([id, points]) => [
      id,
      Object.freeze(points.map((point) => Object.freeze({ ...point }))),
    ]),
  ),
);
const ITEM_SIZE = 0.15;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.8;
const ROTATION_STEP = 15;
const state = {
  backgroundId: 'bg-1',
  machineId: 'box',
  items: [],
  selectedId: null,
  mode: 'design',
  exportBusy: false,
  drag: { active: false, pointerId: null, itemId: null, offsetX: 0, offsetY: 0 },
};
const ui = Object.fromEntries(
  [
    'background',
    'backgroundOptions',
    'machineOptions',
    'collection',
    'machine',
    'machineBack',
    'machineFrame',
    'machineFront',
    'items',
    'selection',
    'emptySelection',
    'selectedItem',
    'itemPreview',
    'itemName',
    'itemCount',
    'deleteButton',
    'resetButton',
    'status',
    'selectionShape',
    'transformControls',
    'sizeInput',
    'sizeValue',
    'sizeDown',
    'sizeUp',
    'rotationInput',
    'rotationValue',
    'rotateLeft',
    'rotateRight',
    'layerBack',
    'layerForward',
    'layerValue',
    'motionControls',
    'doneButton',
    'shakeActions',
    'shakeButton',
    'keepButton',
    'restoreButton',
    'editButton',
    'ropeLayer',
    'modeLabel',
    'stageInstruction',
    'hangSettings',
    'hangOptions',
    'hangColor',
    'hangOriginal',
    'hangColorValue',
    'shakeArea',
  ].map((id) => [id, document.getElementById(id)]),
);
let nextId = 1;
let pendingFrame = null;
let lastCollectionUsage = '';

function announce(message) {
  ui.status.textContent = message;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
// Convex polygon geometry in normalized machine coordinates.
// The PNG alpha is used offline to establish defaults, never in the drag loop.
const GEOMETRY_EPSILON = 1e-8;
const EDGE_MARGIN = 0.004;
function cross(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}
function polygonIsConvex(polygon) {
  return (
    polygon.length >= 3 &&
    polygon.every(
      (point, index) =>
        cross(point, polygon[(index + 1) % polygon.length], polygon[(index + 2) % polygon.length]) >
        GEOMETRY_EPSILON,
    )
  );
}
function itemFootprint(item) {
  const asset = decoCatalog.find((asset) => asset.id === item.assetId);
  return footprintForAsset(item, asset);
}
function footprintForAsset(item, asset) {
  const polygon = asset.footprint || decoFootprints[asset.id.replace('deco-', 'deco_')];
  const size = ITEM_SIZE * item.design.scale;
  const angle = (item.design.rotation * Math.PI) / 180;
  return polygon.map((point) => {
    const x = (point.x - 0.5) * size,
      y = (point.y - 0.5) * size;
    return {
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle),
    };
  });
}
function centerRegion(polygon, footprint) {
  // Each edge moves inward by the support distance of the visible footprint.
  // This includes asymmetric PNG padding; no alpha pixels are read during drag.
  if (typeof footprint === 'number') {
    const halfSize = footprint;
    footprint = [
      { x: -halfSize, y: -halfSize },
      { x: halfSize, y: -halfSize },
      { x: halfSize, y: halfSize },
      { x: -halfSize, y: halfSize },
    ];
  }
  let region = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  for (let index = 0; index < polygon.length && region.length; index++) {
    const a = polygon[index],
      b = polygon[(index + 1) % polygon.length];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const support = Math.max(...footprint.map((point) => dy * point.x - dx * point.y));
    const inset = support + EDGE_MARGIN * Math.hypot(dx, dy);
    const distance = (point) => cross(a, b, point) - inset;
    const clipped = [];
    for (let j = 0; j < region.length; j++) {
      const start = region[j],
        end = region[(j + 1) % region.length];
      const startDistance = distance(start),
        endDistance = distance(end);
      const startInside = startDistance >= -GEOMETRY_EPSILON;
      const endInside = endDistance >= -GEOMETRY_EPSILON;
      if (startInside) clipped.push(start);
      if (startInside !== endInside) {
        const t = startDistance / (startDistance - endDistance);
        clipped.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t });
      }
    }
    region = clipped;
  }
  return region;
}
function pointInConvexPolygon(point, polygon) {
  return (
    polygon.length >= 3 &&
    polygon.every(
      (a, index) => cross(a, polygon[(index + 1) % polygon.length], point) >= -GEOMETRY_EPSILON,
    )
  );
}
function closestAllowedPoint(point, region) {
  if (pointInConvexPolygon(point, region)) return point;
  let best = null,
    bestDistance = Infinity;
  for (let index = 0; index < region.length; index++) {
    const a = region[index],
      b = region[(index + 1) % region.length];
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t =
      lengthSquared > GEOMETRY_EPSILON
        ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1)
        : 0;
    const candidate = { x: a.x + dx * t, y: a.y + dy * t };
    const distance = (point.x - candidate.x) ** 2 + (point.y - candidate.y) ** 2;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
function polygonCenter(polygon) {
  return {
    x: polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length,
    y: polygon.reduce((sum, point) => sum + point.y, 0) / polygon.length,
  };
}

function clampItem(item) {
  const region = centerRegion(machinePolygons[state.machineId], itemFootprint(item));
  const position = closestAllowedPoint(item.design, region);
  if (position) {
    item.design.x = position.x;
    item.design.y = position.y;
  }
}
function selectedItem() {
  return state.items.find((item) => item.id === state.selectedId);
}
function renderCollectionUsage() {
  const signature = `${state.selectedId}:${ui.collection.children.length}:${state.items.map((item) => item.assetId).join('|')}`;
  if (signature === lastCollectionUsage) return;
  lastCollectionUsage = signature;
  const counts = new Map();
  state.items.forEach((item) => counts.set(item.assetId, (counts.get(item.assetId) || 0) + 1));
  const selectedAssetId = selectedItem()?.assetId;
  for (const button of ui.collection.children) {
    const asset = decoCatalog.find((asset) => asset.id === button.dataset.assetId);
    if (!asset) continue;
    const count = counts.get(asset.id) || 0;
    button.dataset.count = count;
    button.classList.toggle('is-used', count > 0);
    button.classList.toggle('is-selected', asset.id === selectedAssetId);
    button.title = asset.label;
    button.setAttribute('aria-label', `加入 ${asset.label}${count ? `，已放入 ${count} 件` : ''}`);
  }
}
function renderSelection() {
  renderCollectionUsage();
  const item = selectedItem();
  ui.selection.toggleAttribute('hidden', !item || state.mode === 'shake');
  ui.doneButton.disabled = state.items.length === 0;
  ui.emptySelection.hidden = Boolean(item);
  ui.selectedItem.hidden = !item;
  if (item) {
    const asset = decoCatalog.find((asset) => asset.id === item.assetId);
    ui.selection.style.left = `${item.design.x * 100}%`;
    ui.selection.style.top = `${item.design.y * 100}%`;
    ui.selection.style.width =
      ui.selection.style.height = `${ITEM_SIZE * item.design.scale * 100}%`;
    ui.selection.style.transform = `translate(-50%, -50%) rotate(${item.design.rotation}deg)`;
    renderTransformControls(item);
    renderMotionControls(item);
    ui.selectionShape.setAttribute(
      'points',
      (asset.footprint || decoFootprints[asset.id.replace('deco-', 'deco_')])
        .map((point) => `${point.x * 1000},${point.y * 1000}`)
        .join(' '),
    );
    ui.itemPreview.src =
      typeof coloredItemSource === 'function' ? coloredItemSource(item, asset) : asset.src;
    ui.itemName.textContent = asset.label;
  }
  ui.hangSettings.hidden = !item || item.motion.type !== 'hang';
  if (item) {
    renderOptions(ui.hangOptions, item.motion.hangStyle || 'plain');
    renderHangColor(item);
  }
  ui.itemCount.textContent = state.items.length;
  for (const button of ui.items.children) {
    button.setAttribute('aria-pressed', String(button.dataset.itemId === state.selectedId));
  }
}
function renderPositions(updateInspector = true) {
  for (const item of state.items) {
    const button = document.getElementById(item.id);
    const position = state.mode === 'shake' ? item.physics : item.design;
    button.style.left = `${position.x * 100}%`;
    button.style.top = `${position.y * 100}%`;
    button.style.zIndex = item.design.zIndex;
    button.style.width = `${ITEM_SIZE * item.design.scale * 100}%`;
    button.style.transform = `translate(-50%, -50%) rotate(${position.rotation}deg)`;
  }
  if (updateInspector) renderSelection();
}
function scheduleRender() {
  if (pendingFrame !== null) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    renderPositions();
  });
}
function createItem(assetId) {
  if (state.mode !== 'design') return null;
  const center = polygonCenter(machinePolygons[state.machineId]);
  const offset = ((state.items.length % 5) - 2) * 0.025;
  const item = {
    id: `item-${nextId++}`,
    assetId,
    design: {
      x: center.x + offset,
      y: center.y + offset,
      scale: 1,
      rotation: 0,
      zIndex: state.items.length + 1,
    },
    appearance: { colorMode: 'original', color: null },
    motion: { type: 'fall' },
  };
  clampItem(item);
  state.items.push(item);
  state.selectedId = item.id;
  const asset = decoCatalog.find((asset) => asset.id === assetId);
  const button = document.createElement('button');
  button.type = 'button';
  button.id = item.id;
  button.className = 'deco-item';
  button.dataset.itemId = item.id;
  button.setAttribute('aria-label', `${asset.label}，點選並拖曳以移動`);
  const image = document.createElement('img');
  image.src = asset.src;
  image.alt = '';
  image.draggable = false;
  button.append(image);
  ui.items.append(button);
  renderPositions();
  announce(`已加入 ${asset.label}。拖曳小物以調整位置。`);
}
function optionButton(label, id, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.dataset.optionId = id;
  button.addEventListener('click', onClick);
  return button;
}
function renderOptions(parent, selectedId) {
  for (const button of parent.children) {
    button.setAttribute('aria-pressed', String(button.dataset.optionId === selectedId));
  }
}
// Cache decoded backgrounds at screen resolution; preserve original assets.
const backgroundCache = new Map();
let backgroundRevision = 0;
function prepareBackground(background) {
  if (backgroundCache.has(background.id)) return backgroundCache.get(background.id);
  const prepared = (async () => {
    const image = new Image();
    image.decoding = 'async';
    image.src = background.previewSrc;
    await image.decode();
    return image;
  })();
  backgroundCache.set(background.id, prepared);
  return prepared;
}
function renderBackground() {
  const revision = ++backgroundRevision;
  const id = state.backgroundId;
  const background = backgroundCatalog.find((background) => background.id === id);
  renderOptions(ui.backgroundOptions, id);
  prepareBackground(background)
    .then(async (image) => {
      // Let the pill complete before invalidating every glass backdrop.
      if (revision !== backgroundRevision) return;
      const animations = [...ui.backgroundOptions.querySelectorAll('.button-fill')].flatMap(
        (fill) => fill.getAnimations(),
      );
      await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
      if (
        revision === backgroundRevision &&
        state.backgroundId === id &&
        ui.background.src !== image.src
      ) {
        ui.background.src = image.src;
      }
    })
    .catch(() => {
      if (revision === backgroundRevision && state.backgroundId === id) {
        ui.background.src = background.src;
        announce('背景快取無法建立，已使用原始圖片。');
      }
    });
}
function renderScene() {
  renderBackground();
  const machine = machineCatalog[state.machineId];
  ui.machineBack.src = machine.back;
  ui.machineFrame.src = machine.frame;
  ui.machineFront.src = machine.front;
  ui.machine.setAttribute('aria-label', `${machine.label}，可拖曳裝飾`);
  renderOptions(ui.backgroundOptions, state.backgroundId);
  renderOptions(ui.machineOptions, state.machineId);
  renderPositions();
}
function pointerPosition(event) {
  const rect = ui.machine.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}
function stopDrag(event) {
  if (!state.drag.active || (event && event.pointerId !== state.drag.pointerId)) return;
  const button = document.getElementById(state.drag.itemId);
  const pointerId = state.drag.pointerId;
  state.drag = { active: false, pointerId: null, itemId: null, offsetX: 0, offsetY: 0 };
  if (button?.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
  renderPositions();
}
ui.items.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'design' || !event.isPrimary || event.button !== 0 || state.drag.active)
    return;
  const button = event.target.closest('.deco-item');
  if (!button) return;
  const item = state.items.find((item) => item.id === button.dataset.itemId);
  state.selectedId = item.id;
  const pointer = pointerPosition(event);
  state.drag = {
    active: true,
    pointerId: event.pointerId,
    itemId: item.id,
    offsetX: pointer.x - item.design.x,
    offsetY: pointer.y - item.design.y,
  };
  button.setPointerCapture(event.pointerId);
  renderSelection();
});
ui.items.addEventListener('pointermove', (event) => {
  if (state.mode !== 'design' || !state.drag.active || event.pointerId !== state.drag.pointerId)
    return;
  const item = selectedItem();
  const pointer = pointerPosition(event);
  item.design.x = pointer.x - state.drag.offsetX;
  item.design.y = pointer.y - state.drag.offsetY;
  clampItem(item);
  scheduleRender();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  ui.items.addEventListener(type, stopDrag);
}
ui.items.addEventListener('click', (event) => {
  if (state.mode !== 'design') return;
  const button = event.target.closest('.deco-item');
  if (!button) return;
  state.selectedId = button.dataset.itemId;
  renderSelection();
});
ui.machine.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'design') return;
  if (event.target !== ui.items && event.target !== ui.machine) return;
  state.selectedId = null;
  renderSelection();
});
ui.deleteButton.addEventListener('click', () => {
  if (state.mode !== 'design') return;
  const item = selectedItem();
  if (!item) return;
  stopDrag();
  document.getElementById(item.id).remove();
  state.items = state.items.filter((candidate) => candidate.id !== item.id);
  state.selectedId = null;
  normalizeLayers();
  renderPositions();
  releaseUnusedCustomAssets();
  announce('已移除選取的小物。');
});
ui.resetButton.addEventListener('click', () => {
  if (state.mode !== 'design') return;
  stopDrag();
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  pendingFrame = null;
  cancelCustomUpload();
  state.items = [];
  state.selectedId = null;
  releaseUnusedCustomAssets();
  state.backgroundId = 'bg-1';
  state.machineId = 'box';
  ui.items.replaceChildren();
  renderScene();
  announce('已重置。從左側選一件素材，開始收藏。');
});
for (const bg of backgroundCatalog) {
  ui.backgroundOptions.append(
    optionButton(bg.label, bg.id, () => {
      if (state.mode !== 'design' || state.backgroundId === bg.id) return;
      state.backgroundId = bg.id;
      renderBackground();
      announce(`已切換${bg.label}。`);
    }),
  );
}
for (const machine of Object.values(machineCatalog)) {
  ui.machineOptions.append(
    optionButton(machine.label, machine.id, () => {
      if (state.mode !== 'design') return;
      stopDrag();
      if (
        state.items.some(
          (item) => centerRegion(machinePolygons[machine.id], itemFootprint(item)).length < 3,
        )
      ) {
        announce('此容器的範圍放不下目前的小物，請先縮小小物。');
        return;
      }
      state.machineId = machine.id;
      state.items.forEach(clampItem);
      renderScene();
      announce(`已切換為${machine.label}，小物已調整至安全區。`);
    }),
  );
}
for (const asset of decoCatalog) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'collection-item';
  button.dataset.assetId = asset.id;
  button.setAttribute('aria-label', `加入 ${asset.label}`);
  const image = document.createElement('img');
  image.src = asset.src;
  image.alt = '';
  image.draggable = false;
  const label = document.createElement('span');
  label.textContent = asset.label;
  const hint = document.createElement('small');
  hint.textContent = '＋ 加入收藏';
  label.append(hint);
  button.append(image, label);
  button.addEventListener('click', () => createItem(asset.id));
  ui.collection.append(button);
}

function orderedItems() {
  return [...state.items].sort((a, b) => a.design.zIndex - b.design.zIndex);
}
function normalizeLayers() {
  orderedItems().forEach((item, index) => {
    item.design.zIndex = index + 1;
  });
}
function renderTransformControls(item) {
  ui.sizeInput.value = Math.round(item.design.scale * 100);
  ui.sizeValue.textContent = `${Math.round(item.design.scale * 100)}%`;
  ui.rotationInput.value = item.design.rotation;
  ui.rotationValue.textContent = `${Number(item.design.rotation.toFixed(1))}°`;
  ui.sizeDown.disabled = item.design.scale <= MIN_SCALE;
  ui.sizeUp.disabled = item.design.scale >= MAX_SCALE;
  ui.rotateLeft.disabled = item.design.rotation <= -180;
  ui.rotateRight.disabled = item.design.rotation >= 180;
  const index = orderedItems().findIndex((candidate) => candidate.id === item.id);
  ui.layerValue.textContent = `${index + 1} / ${state.items.length}`;
  ui.layerBack.disabled = index === 0;
  ui.layerForward.disabled = index === state.items.length - 1;
}
function setTransform(property, value) {
  const item = selectedItem();
  if (state.mode !== 'design' || !item || !Number.isFinite(value)) return false;
  stopDrag();
  const previous = item.design[property];
  item.design[property] =
    property === 'scale'
      ? clamp(Math.round(value * 100) / 100, MIN_SCALE, MAX_SCALE)
      : clamp(Math.round(value), -180, 180);
  if (centerRegion(machinePolygons[state.machineId], itemFootprint(item)).length < 3) {
    item.design[property] = previous;
    renderSelection();
    announce('目前範圍放不下這個大小或角度，請縮小小物。');
    return false;
  }
  clampItem(item);
  renderPositions();
  announce(
    property === 'scale'
      ? `大小已調整為 ${Math.round(item.design.scale * 100)}%。`
      : `已旋轉至 ${item.design.rotation} 度。`,
  );
  return true;
}
function moveLayer(direction) {
  const item = selectedItem();
  if (state.mode !== 'design' || !item) return;
  const ordered = orderedItems(),
    index = ordered.findIndex((candidate) => candidate.id === item.id);
  const neighbor = ordered[index + direction];
  if (!neighbor) return;
  [item.design.zIndex, neighbor.design.zIndex] = [neighbor.design.zIndex, item.design.zIndex];
  normalizeLayers();
  renderPositions();
  announce(direction > 0 ? '小物已前移一層。' : '小物已後移一層。');
}
ui.sizeInput.addEventListener('input', () =>
  setTransform('scale', Number(ui.sizeInput.value) / 100),
);
ui.rotationInput.addEventListener('input', () =>
  setTransform('rotation', Number(ui.rotationInput.value)),
);
ui.sizeDown.addEventListener('click', () =>
  setTransform('scale', (selectedItem()?.design.scale ?? 1) - 0.1),
);
ui.sizeUp.addEventListener('click', () =>
  setTransform('scale', (selectedItem()?.design.scale ?? 1) + 0.1),
);
ui.rotateLeft.addEventListener('click', () =>
  setTransform('rotation', (selectedItem()?.design.rotation ?? 0) - ROTATION_STEP),
);
ui.rotateRight.addEventListener('click', () =>
  setTransform('rotation', (selectedItem()?.design.rotation ?? 0) + ROTATION_STEP),
);
ui.layerBack.addEventListener('click', () => moveLayer(-1));
ui.layerForward.addEventListener('click', () => moveLayer(1));

// Motion controls configure the design; the separate shake controller plays it.
const motionLabels = { fall: 'Fall／落下', float: 'Float／漂浮', hang: 'Hang／懸掛' };
function renderMotionControls(item) {
  for (const input of ui.motionControls.querySelectorAll('input[name="motionType"]')) {
    input.checked = input.value === item.motion.type;
  }
}
function createHangMotion(item) {
  const polygon = machinePolygons[state.machineId];
  const top = Math.min(...polygon.map((point) => point.y));
  const desired = { x: item.design.x, y: Math.max(top + 0.03, item.design.y - 0.25) };
  const anchor = closestAllowedPoint(desired, centerRegion(polygon, 0));
  return {
    type: 'hang',
    anchorX: anchor.x,
    anchorY: anchor.y,
    ropeLength: Math.max(0.04, Math.hypot(item.design.x - anchor.x, item.design.y - anchor.y)),
  };
}
function setMotionType(type) {
  const item = selectedItem();
  if (state.mode !== 'design' || !item || !Object.hasOwn(motionLabels, type)) return false;
  if (item.motion.type === type) return true;
  // Keep previously chosen hang metadata when switching away and back.
  if (type === 'hang' && !Number.isFinite(item.motion.anchorX)) {
    item.motion = {
      ...createHangMotion(item),
      hangStyle: item.motion.hangStyle || 'plain',
      hangColor: item.motion.hangColor || null,
    };
  } else {
    item.motion.type = type;
  }
  renderSelection();
  announce(`已設定 ${motionLabels[type]}；製作時小物保持靜止。`);
  return true;
}
ui.motionControls.addEventListener('change', (event) => {
  if (event.target.matches('input[name="motionType"]')) setMotionType(event.target.value);
});

document.addEventListener(
  'error',
  (event) => {
    if (event.target instanceof HTMLImageElement)
      announce('圖片載入失敗，請確認 assets 素材資料夾完整。');
  },
  true,
);
renderScene();

// Each item keeps its chosen original SVG separately from the motion type.
const hangCatalog = [
  { id: 'plain', label: '細線', src: null },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `Hang${i + 1}`,
    label: ['春芽', '小葉', '波紋', '小波點', '朝露與葉', '滿天星'][i],
    src: `./assets/hang/Hang${i + 1}.svg`,
    aspect: [
      22.7 / 595.44,
      13.93 / 585.61,
      11.85 / 589.2,
      13.24 / 592.66,
      22.2 / 586.32,
      48.11 / 588.45,
    ][i],
  })),
];
for (const asset of hangCatalog) {
  const button = optionButton(asset.label, asset.id, () => {
    const item = selectedItem();
    if (state.mode !== 'design' || !item || item.motion.type !== 'hang') return;
    item.motion.hangStyle = asset.id;
    renderSelection();
    announce(`懸吊線條已設為${asset.label}。`);
  });
  if (asset.src) {
    const image = document.createElement('img');
    image.src = asset.src;
    image.alt = '';
    image.draggable = false;
    const preview = document.createElement('span');
    preview.className = 'hang-preview';
    const tint = document.createElement('span');
    tint.className = 'hang-tint';
    tint.style.maskImage = `url("${asset.src}")`;
    tint.style.webkitMaskImage = `url("${asset.src}")`;
    preview.append(image, tint);
    button.prepend(preview);
  }
  ui.hangOptions.append(button);
}

function renderHangColor(item) {
  const color = item.motion.hangColor;
  ui.hangColor.value = color || '#756f7c';
  ui.hangColorValue.textContent = color || '原色';
  ui.hangOriginal.setAttribute('aria-pressed', String(!color));
  ui.hangOptions.style.setProperty('--hang-color', color || 'var(--muted)');
  ui.hangOptions.classList.toggle('has-hang-color', Boolean(color));
}
function setHangColor(color) {
  const item = selectedItem();
  if (state.mode !== 'design' || !item || item.motion.type !== 'hang') return;
  if (color !== null && !/^#[0-9a-f]{6}$/i.test(color)) return;
  item.motion.hangColor = color;
  renderHangColor(item);
  announce(color ? `懸吊線顏色已設為 ${color}。` : '懸吊線已恢復原色。');
}
ui.hangColor.addEventListener('input', () => setHangColor(ui.hangColor.value));
ui.hangOriginal.addEventListener('click', () => setHangColor(null));

const warmBackgrounds = () => {
  backgroundCatalog.forEach((background) => prepareBackground(background).catch(() => {}));
};
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(warmBackgrounds, { timeout: 2000 });
} else {
  setTimeout(warmBackgrounds, 150);
}
