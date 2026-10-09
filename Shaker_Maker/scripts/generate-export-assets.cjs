const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const sources = {};
const folders = [
  'background-preview',
  'machine-back',
  'machine-frame',
  'machine-front-glass',
  'deco',
  'hang',
  'colorchange_deco',
];
for (const folder of folders) {
  for (const name of fs.readdirSync(path.join(root, 'assets', folder)).sort()) {
    const extension = path.extname(name);
    if (!['.png', '.svg'].includes(extension)) continue;
    const key = `assets/${folder}/${name}`;
    const mime = extension === '.png' ? 'image/png' : 'image/svg+xml';
    sources[key] =
      `data:${mime};base64,${fs.readFileSync(path.join(root, key)).toString('base64')}`;
  }
}
const output =
  '// Generated from current assets. Loaded only for file:// PNG export.\nwindow.collectionExportSources = ' +
  JSON.stringify(sources) +
  ';\n';
const target = path.join(root, 'collection-export-assets.js');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8') !== output) {
    throw new Error('Export assets are outdated. Run npm run generate:assets.');
  }
  console.log('PASS: export images match all current PNG/SVG assets');
} else {
  fs.writeFileSync(target, output);
  console.log(`Generated ${Object.keys(sources).length} export assets.`);
}
