'use strict';

const decoColorUi = {
  controls: document.getElementById('decoColorControls'),
  inputs: document.getElementById('decoColorInputs'),
  original: document.getElementById('decoOriginalButton'),
};
const coloredSources = new WeakMap();
let colorControlItemId = null;

function normalizeSvgColor(color) {
  const value = color.toLowerCase();
  return value.length === 4
    ? '#' + [...value.slice(1)].map((letter) => letter + letter).join('')
    : value;
}

function coloredItemSource(item, asset) {
  if (!asset.recolorable || item.appearance.colorMode === 'original') return asset.src;
  const colors = item.appearance.colors;
  const signature = colors.join(':');
  const cached = coloredSources.get(item);
  if (cached?.signature === signature) return cached.src;
  let source = asset.svgSource;
  const replaceColor = (original) => {
    const index = asset.colorChannels.findIndex(
      (channel) => channel.original === normalizeSvgColor(original),
    );
    return index < 0 ? original : colors[index];
  };
  if (asset.implicitFill) {
    source = source.replace('<svg ', `<svg fill="${colors[0]}" `);
  } else if (asset.fillOnly) {
    // Keep the white dividing strokes; only change the three fill regions.
    source = source.replace(
      /(\bfill:\s*)(#[\da-f]+)/gi,
      (_, declaration, color) => declaration + replaceColor(color),
    );
  } else {
    source = source.replace(/#[\da-f]{3,6}\b/gi, replaceColor);
  }
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  coloredSources.set(item, { signature, src });
  return src;
}

function renderDecoColors(item) {
  const asset = item && decoCatalog.find((asset) => asset.id === item.assetId);
  decoColorUi.controls.hidden = !asset?.recolorable;
  if (!asset?.recolorable) {
    colorControlItemId = null;
    return;
  }
  if (colorControlItemId !== item.id) {
    decoColorUi.inputs.replaceChildren();
    asset.colorChannels.forEach((channel, index) => {
      const label = document.createElement('label');
      label.className = 'deco-color-row';
      const name = document.createElement('span');
      name.textContent = channel.label;
      const input = document.createElement('input');
      input.type = 'color';
      input.dataset.channel = index;
      input.setAttribute('aria-label', `${channel.label}顏色`);
      const output = document.createElement('output');
      label.append(name, input, output);
      decoColorUi.inputs.append(label);
    });
    colorControlItemId = item.id;
  }
  const colors = item.appearance.colors || asset.colorChannels.map((channel) => channel.original);
  for (const input of decoColorUi.inputs.querySelectorAll('input')) {
    const color = colors[Number(input.dataset.channel)];
    if (input.value !== color) input.value = color;
    input.nextElementSibling.textContent = color;
  }
  decoColorUi.original.disabled = item.appearance.colorMode === 'original';
}

function setDecoColor(channel, color) {
  const item = selectedItem();
  const asset = item && decoCatalog.find((asset) => asset.id === item.assetId);
  if (state.mode !== 'design' || !asset?.recolorable || !/^#[\da-f]{6}$/i.test(color)) return false;
  if (!Number.isInteger(channel) || !asset.colorChannels[channel]) return false;
  const colors = [
    ...(item.appearance.colors || asset.colorChannels.map((channel) => channel.original)),
  ];
  colors[channel] = color.toLowerCase();
  item.appearance = { colorMode: 'custom', color: colors[0], colors };
  const src = coloredItemSource(item, asset);
  document.getElementById(item.id).querySelector('img').src = src;
  ui.itemPreview.src = src;
  renderDecoColors(item);
  announce(`${asset.label}的${asset.colorChannels[channel].label}顏色已更新。`);
  return true;
}

function restoreDecoColor() {
  const item = selectedItem();
  const asset = item && decoCatalog.find((asset) => asset.id === item.assetId);
  if (state.mode !== 'design' || !asset?.recolorable) return;
  item.appearance = { colorMode: 'original', color: null };
  coloredSources.delete(item);
  document.getElementById(item.id).querySelector('img').src = asset.src;
  ui.itemPreview.src = asset.src;
  renderDecoColors(item);
  announce(`${asset.label}已恢復原色。`);
}

const baseRenderSelection = renderSelection;
renderSelection = function () {
  baseRenderSelection();
  renderDecoColors(selectedItem());
};
decoColorUi.inputs.addEventListener('input', (event) => {
  if (event.target.matches('input[type="color"]')) {
    setDecoColor(Number(event.target.dataset.channel), event.target.value);
  }
});
decoColorUi.original.addEventListener('click', restoreDecoColor);

const recolorReady = Promise.all(
  recolorCatalog.map(async (asset) => {
    try {
      const image = new Image();
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(asset.svgSource);
      await image.decode();
      asset.footprint = customFootprint(image);
      asset.recolorable = true;
      return asset;
    } catch {
      announce(`${asset.label}載入失敗，請確認 colorchange_deco 資料夾。`);
      return null;
    }
  }),
).then((assets) => {
  for (const asset of assets.filter(Boolean)) {
    decoCatalog.push(asset);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'collection-item';
    button.dataset.assetId = asset.id;
    button.dataset.recolorAsset = asset.id;
    button.setAttribute('aria-label', `加入 ${asset.label}`);
    const image = document.createElement('img');
    image.src = asset.src;
    image.alt = '';
    image.draggable = false;
    const label = document.createElement('span');
    label.textContent = asset.label;
    const hint = document.createElement('small');
    hint.textContent = '＋ 加入 · 可調色';
    label.append(hint);
    button.append(image, label);
    button.addEventListener('click', () => createItem(asset.id));
    ui.collection.append(button);
  }
  const footer = document.querySelector('.collection footer');
  const updateCount = () => {
    footer.textContent = `COLLECTION · ${String(ui.collection.children.length).padStart(2, '0')}`;
  };
  new MutationObserver(updateCount).observe(ui.collection, { childList: true });
  updateCount();
  renderSelection();
  return assets.filter(Boolean);
});
