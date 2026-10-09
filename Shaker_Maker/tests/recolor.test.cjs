const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'recolor.js'), 'utf8');
const context = vm.createContext({ encodeURIComponent });
vm.runInContext(
  fs.readFileSync(path.join(root, 'recolor-assets.js'), 'utf8') +
    '\nconst coloredSources = new WeakMap();\n' +
    code.slice(
      code.indexOf('function normalizeSvgColor'),
      code.indexOf('function renderDecoColors'),
    ),
  context,
);
const assets = vm.runInContext('recolorCatalog', context);
for (const asset of assets) {
  assert.equal(asset.svgSource, fs.readFileSync(path.join(root, asset.src), 'utf8'));
  asset.recolorable = true;
  const colors = asset.colorChannels.map((_, i) => ['#8d7db5', '#9fb7a5', '#e7bbc8'][i]);
  const item = { appearance: { colorMode: 'custom', colors } };
  context.asset = asset;
  context.item = item;
  const url = vm.runInContext('coloredItemSource(item,asset)', context);
  const source = decodeURIComponent(url.slice(url.indexOf(',') + 1));
  assert.equal(source.match(/viewBox="[^"]+"/)[0], asset.svgSource.match(/viewBox="[^"]+"/)[0]);
  assert(source.includes(colors[0]), asset.id);
  // Colors may change, but shape geometry and styles such as fill:none must survive.
  const normalize = (source) =>
    source.replace(/<svg fill="[^"]+" /, '<svg ').replace(/#[\da-f]{3,6}\b/gi, '#COLOR');
  assert.equal(normalize(source), normalize(asset.svgSource), asset.id + ' changed geometry');
  if (asset.fillOnly) {
    assert(source.includes('stroke: #fff;'));
    assert(source.includes('fill: #9fb7a5;') && source.includes('fill: #e7bbc8;'));
  }
  const second = { appearance: { colorMode: 'original', color: null } };
  context.item = second;
  assert.equal(vm.runInContext('coloredItemSource(item,asset)', context), asset.src);
  context.item = item;
  assert.equal(vm.runInContext('coloredItemSource(item,asset)', context), url);
  item.appearance.colors = item.appearance.colors.map(() => '#756f7c');
  assert.notEqual(vm.runInContext('coloredItemSource(item,asset)', context), url);
}
console.log(
  'PASS: seven original SVG snapshots, geometry preservation, independent colors, white dividers and color-cache refresh',
);
