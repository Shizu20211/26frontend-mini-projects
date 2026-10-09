const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(name) {
    this.localName = name;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.style = {};
  }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
  }
  setAttributeNS(ns, key, value) {
    this.setAttribute(key, value);
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren() {
    this.children = [];
  }
  querySelector(name) {
    for (const child of this.children) {
      if (child.localName === name) return child;
      const nested = child.querySelector(name);
      if (nested) return nested;
    }
    return null;
  }
}
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'shake.js'), 'utf8');
const code = source.slice(
  source.indexOf('function initializePhysics()'),
  source.indexOf('function stopPhysicsLoop()'),
);
for (let index = 0; index <= 6; index++) {
  for (const color of [null, '#123456']) {
    const item = {
      id: 'item-1',
      motion: { type: 'hang', hangStyle: index ? `Hang${index}` : 'plain', hangColor: color },
    };
    const layer = new Element('svg');
    const context = {
      document: { createElementNS: (ns, name) => new Element(name) },
      state: { items: [item] },
      ui: { ropeLayer: layer },
      shakeRuntime: { ropes: new Map() },
      hangCatalog: [{ id: `Hang${index}`, src: index ? `Hang${index}.svg` : null, aspect: 0.2 }],
      makePhysicsState: () => ({ x: 0.7, y: 0.8, anchorX: 0.3, anchorY: 0.2 }),
    };
    vm.runInNewContext(code + '\ninitializePhysics();', context);
    const rope = layer.children[0];
    if (index) {
      assert.equal(rope.localName, 'g');
      assert.match(rope.attributes.transform, /^translate\(300 200\) rotate\(/);
      const viewport = rope.querySelector('svg');
      assert.equal(viewport.attributes.transform, undefined);
      assert.equal(viewport.attributes.overflow, 'hidden');
      assert(Number(viewport.attributes.width) > 0);
      const image = rope.querySelector('image');
      assert.equal(image.attributes['xlink:href'], image.attributes.href);
      assert.equal(image.attributes.preserveAspectRatio, 'xMidYMid meet');
      assert.equal(Number(image.attributes.width), 2 * Number(viewport.attributes.width));
      assert.equal(Boolean(image.attributes.filter), Boolean(color));
    } else {
      assert.equal(rope.localName, 'line');
      assert.equal(rope.attributes.x1, '300');
      assert.equal(rope.attributes.y2, '800');
    }
  }
}
console.log(
  'PASS: plain and six SVG ropes, group positioning, clipping, aspect ratio and recoloring',
);
