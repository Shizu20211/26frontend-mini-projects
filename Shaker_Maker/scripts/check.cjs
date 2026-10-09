const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
for (const name of fs.readdirSync(root).filter((name) => name.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', path.join(root, name)], { stdio: 'inherit' });
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) {
  if (!fs.existsSync(path.join(root, match[1]))) throw new Error(`Missing: ${match[1]}`);
}
if (!html.includes('lang="zh-Hant"')) throw new Error('Traditional Chinese language tag missing');
if (/persistence\.js|saveDesignButton|loadDesignButton/.test(html))
  throw new Error('Retired storage UI found');
console.log('PASS: JavaScript syntax, HTML IDs, entry assets and language');
