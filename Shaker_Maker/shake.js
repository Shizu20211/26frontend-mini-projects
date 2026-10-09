// This controller owns one animation frame and one captured pointer at a time.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const shakeRuntime = {
  frame: null,
  timer: null,
  lastTime: null,
  elapsed: 0,
  pointer: null,
  deadline: Infinity,
  offsetX: 0,
  offsetY: 0,
  pulses: 0,
  ropes: new Map(),
};
function renderMode() {
  const shaking = state.mode === 'shake';
  document.querySelector('.app').classList.toggle('is-shaking', shaking);
  ui.doneButton.hidden = shaking;
  ui.shakeActions.hidden = !shaking;
  ui.ropeLayer.toggleAttribute('hidden', !shaking);
  ui.modeLabel.textContent = shaking ? '02 / SHAKE MODE' : '01 / DESIGN MODE';
  ui.stageInstruction.textContent = shaking
    ? '← 在容器周圍拖曳，搖一搖 →'
    : '把喜歡的小物打包回家◡̎';
  ui.machine.setAttribute('role', 'group');
  ui.machine.setAttribute('aria-label', shaking ? '搖搖容器，拖曳或用搖一搖按鈕' : '容器編輯區');
  ui.shakeArea.hidden = !shaking;
  if (shaking) ui.shakeArea.tabIndex = 0;
  else ui.shakeArea.removeAttribute('tabindex');
}
function initializePhysics() {
  shakeRuntime.elapsed = 0;
  shakeRuntime.ropes.clear();
  ui.ropeLayer.replaceChildren();
  state.items.forEach((item, index) => {
    item.physics = makePhysicsState(item, index);
    if (item.motion.type === 'hang') {
      const asset = hangCatalog.find((asset) => asset.id === item.motion.hangStyle);
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        asset?.src ? 'g' : 'line',
      );
      if (asset?.src) {
        // Keep transforms on SVG 1.1 <g>; nested <svg> transforms vary in Safari.
        const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        viewport.setAttribute('overflow', 'hidden');
        line.append(viewport);
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', asset.src);
        image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', asset.src);
        if (item.motion.hangColor) {
          const ns = 'http://www.w3.org/2000/svg';
          const defs = document.createElementNS(ns, 'defs');
          const filter = document.createElementNS(ns, 'filter');
          filter.id = `hang-color-${item.id}`;
          filter.setAttribute('color-interpolation-filters', 'sRGB');
          const flood = document.createElementNS(ns, 'feFlood');
          flood.setAttribute('flood-color', item.motion.hangColor);
          const composite = document.createElementNS(ns, 'feComposite');
          composite.setAttribute('in2', 'SourceAlpha');
          composite.setAttribute('operator', 'in');
          filter.append(flood, composite);
          defs.append(filter);
          line.append(defs);
          image.setAttribute('filter', `url(#${filter.id})`);
        }
        viewport.append(image);
        line.dataset.aspect = asset.aspect;
      }
      if (!asset?.src && item.motion.hangColor) line.style.stroke = item.motion.hangColor;
      ui.ropeLayer.append(line);
      shakeRuntime.ropes.set(item.id, line);
    }
  });
  renderRopes();
}
function renderRopes() {
  for (const item of state.items) {
    const line = shakeRuntime.ropes.get(item.id);
    if (!line || !item.physics) continue;
    const p = item.physics;
    if (line.localName === 'g') {
      const dx = (p.x - p.anchorX) * 1000,
        dy = (p.y - p.anchorY) * 1000;
      const length = Math.hypot(dx, dy),
        height = length * Number(line.dataset.aspect) * 2;
      const viewport = line.querySelector('svg');
      viewport.setAttribute('x', 0);
      viewport.setAttribute('y', -height / 2);
      viewport.setAttribute('width', length);
      viewport.setAttribute('height', height);
      // Enlarge both axes equally, then crop to the anchor-to-item span.
      const image = line.querySelector('image');
      image.setAttribute('x', -length / 2);
      image.setAttribute('y', 0);
      image.setAttribute('width', length * 2);
      image.setAttribute('height', height);
      line.setAttribute(
        'transform',
        `translate(${p.anchorX * 1000} ${p.anchorY * 1000}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`,
      );
      continue;
    }
    line.setAttribute('x1', p.anchorX * 1000);
    line.setAttribute('y1', p.anchorY * 1000);
    line.setAttribute('x2', p.x * 1000);
    line.setAttribute('y2', p.y * 1000);
  }
}
function stopPhysicsLoop() {
  if (shakeRuntime.timer !== null) clearTimeout(shakeRuntime.timer);
  shakeRuntime.timer = null;
  if (shakeRuntime.frame !== null) cancelAnimationFrame(shakeRuntime.frame);
  shakeRuntime.frame = null;
  shakeRuntime.lastTime = null;
}
function startPhysicsLoop(explicit = false) {
  if (state.mode !== 'shake' || state.exportBusy || document.hidden) return;
  if (motionPreference.matches) {
    if (!explicit) return;
    shakeRuntime.deadline = performance.now() + 1250;
    if (shakeRuntime.timer !== null) clearTimeout(shakeRuntime.timer);
    shakeRuntime.timer = setTimeout(() => {
      shakeRuntime.timer = null;
      stopPhysicsLoop();
    }, 1250);
  } else shakeRuntime.deadline = Infinity;
  if (shakeRuntime.frame === null) shakeRuntime.frame = requestAnimationFrame(physicsFrame);
}
function physicsFrame(timestamp) {
  shakeRuntime.frame = null;
  // Stop a continuous loop immediately if the motion preference changes.
  if (motionPreference.matches && shakeRuntime.deadline === Infinity) {
    stopPhysicsLoop();
    return;
  }
  if (state.mode !== 'shake' || state.exportBusy || document.hidden) {
    shakeRuntime.lastTime = null;
    return;
  }
  const dt =
    shakeRuntime.lastTime === null ? 0 : Math.min(0.05, (timestamp - shakeRuntime.lastTime) / 1000);
  shakeRuntime.lastTime = timestamp;
  shakeRuntime.elapsed += dt;
  stepPhysics(state.items, dt, shakeRuntime.elapsed, motionPreference.matches);
  if (!shakeRuntime.pointer) {
    shakeRuntime.offsetX *= Math.exp(-12 * dt);
    shakeRuntime.offsetY *= Math.exp(-12 * dt);
  }
  renderContainerOffset();
  renderPositions(false);
  renderRopes();
  if (timestamp < shakeRuntime.deadline) shakeRuntime.frame = requestAnimationFrame(physicsFrame);
  else stopPhysicsLoop();
}
function renderContainerOffset() {
  const strength = motionPreference.matches ? 0 : 1;
  ui.machine.style.transform = `translate(${shakeRuntime.offsetX * strength}px, ${shakeRuntime.offsetY * strength}px)`;
}
function enterShakeMode() {
  if (state.mode !== 'design' || !state.items.length) return false;
  stopDrag();
  if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
  pendingFrame = null;
  state.mode = 'shake';
  initializePhysics();
  renderMode();
  renderPositions();
  announce(
    motionPreference.matches
      ? '減少動態模式：按「搖一搖」或拖曳容器，播放短暫動態。'
      : '拖曳容器搖動，或按「搖一搖」。原本構圖已保留。',
  );
  ui.shakeArea.focus({ preventScroll: true });
  startPhysicsLoop();
  return true;
}
function stopShakePointer(event) {
  const pointer = shakeRuntime.pointer;
  if (!pointer || (event && event.pointerId !== pointer.id)) return;
  shakeRuntime.pointer = null;
  if (ui.shakeArea.hasPointerCapture(pointer.id)) ui.shakeArea.releasePointerCapture(pointer.id);
  impulsePhysics(state.items, pointer.velocityX * 0.18, pointer.velocityY * 0.18);
}
function leaveShakeMode() {
  if (state.mode !== 'shake' || state.exportBusy) return;
  stopShakePointer();
  stopPhysicsLoop();
  for (const item of state.items) delete item.physics;
  state.mode = 'design';
  shakeRuntime.offsetX = shakeRuntime.offsetY = 0;
  ui.machine.style.transform = '';
  ui.ropeLayer.replaceChildren();
  shakeRuntime.ropes.clear();
  renderMode();
  renderPositions();
  ui.doneButton.focus({ preventScroll: true });
  announce('已返回編輯，原本排列保持不變。');
}
function restoreArrangement() {
  if (state.mode !== 'shake' || state.exportBusy) return;
  stopShakePointer();
  stopPhysicsLoop();
  initializePhysics();
  shakeRuntime.offsetX = shakeRuntime.offsetY = 0;
  renderContainerOffset();
  renderPositions(false);
  startPhysicsLoop();
  announce('已回到原本排列，仍在搖動模式。');
}
function shakeOnce() {
  if (state.mode !== 'shake' || state.exportBusy) return;
  const direction = shakeRuntime.pulses++ % 2 ? -1 : 1;
  impulsePhysics(state.items, direction * 0.42, -0.28);
  shakeRuntime.offsetX = motionPreference.matches ? 0 : direction * 12;
  renderContainerOffset();
  startPhysicsLoop(true);
}
ui.doneButton.addEventListener('click', enterShakeMode);
ui.shakeButton.addEventListener('click', shakeOnce);
// The collection action downloads a PNG via collection-export.js.
ui.restoreButton.addEventListener('click', restoreArrangement);
ui.editButton.addEventListener('click', () => leaveShakeMode());
ui.shakeArea.addEventListener('pointerdown', (event) => {
  if (
    state.mode !== 'shake' ||
    state.exportBusy ||
    !event.isPrimary ||
    event.button !== 0 ||
    shakeRuntime.pointer
  )
    return;
  const rect = ui.machine.getBoundingClientRect();
  shakeRuntime.pointer = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    width: rect.width,
    time: event.timeStamp,
    velocityX: 0,
    velocityY: 0,
  };
  ui.shakeArea.setPointerCapture(event.pointerId);
  startPhysicsLoop(true);
});
ui.shakeArea.addEventListener('pointermove', (event) => {
  const pointer = shakeRuntime.pointer;
  if (state.mode !== 'shake' || state.exportBusy || !pointer || event.pointerId !== pointer.id)
    return;
  const dt = Math.max(1 / 240, (event.timeStamp - pointer.time) / 1000);
  const rawX = clamp((event.clientX - pointer.x) / pointer.width / dt, -2.5, 2.5);
  const rawY = clamp((event.clientY - pointer.y) / pointer.width / dt, -2.5, 2.5);
  const blend = 1 - Math.exp(-18 * dt);
  const velocityX = pointer.velocityX + (rawX - pointer.velocityX) * blend;
  const velocityY = pointer.velocityY + (rawY - pointer.velocityY) * blend;
  // Impulse comes from the CHANGE in time-normalized, filtered pointer velocity.
  // Moving at constant speed does not repeatedly add velocity every event.
  impulsePhysics(
    state.items,
    -(velocityX - pointer.velocityX) * 0.18,
    -(velocityY - pointer.velocityY) * 0.18,
  );
  Object.assign(pointer, {
    x: event.clientX,
    y: event.clientY,
    time: event.timeStamp,
    velocityX,
    velocityY,
  });
  // A 2:1 movement area leaves half a container width of travel on each side.
  shakeRuntime.offsetX = clamp(
    event.clientX - pointer.startX,
    -pointer.width * 0.5,
    pointer.width * 0.5,
  );
  shakeRuntime.offsetY = clamp(
    event.clientY - pointer.startY,
    -pointer.width * 0.06,
    pointer.width * 0.06,
  );
  renderContainerOffset();
  if (motionPreference.matches) startPhysicsLoop(true);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  ui.shakeArea.addEventListener(type, stopShakePointer);
ui.shakeArea.addEventListener('keydown', (event) => {
  if (state.mode !== 'shake' || state.exportBusy) return;
  const vector = {
    ArrowLeft: [-0.4, 0],
    ArrowRight: [0.4, 0],
    ArrowUp: [0, -0.4],
    ArrowDown: [0, 0.4],
  }[event.key];
  if (vector) {
    event.preventDefault();
    impulsePhysics(state.items, ...vector);
    startPhysicsLoop(true);
  } else if (event.code === 'Space') {
    event.preventDefault();
    shakeOnce();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopShakePointer();
    stopPhysicsLoop();
  } else startPhysicsLoop();
});
window.addEventListener('pagehide', stopPhysicsLoop);
motionPreference.addEventListener('change', () => {
  stopPhysicsLoop();
  shakeRuntime.offsetX = shakeRuntime.offsetY = 0;
  ui.machine.style.transform = '';
  startPhysicsLoop();
});
renderMode();
