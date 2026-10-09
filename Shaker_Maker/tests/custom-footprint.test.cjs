const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const uploads = fs.readFileSync(path.join(root, 'uploads.js'), 'utf8');
const size = 256;
let pixels;
let drawArguments;
const context = vm.createContext({
  structuredClone,
  document: {
    createElement() {
      return {
        getContext() {
          return {
            drawImage(...args) {
              drawArguments = args;
            },
            getImageData() {
              return { data: pixels };
            },
          };
        },
      };
    },
  },
});
vm.runInContext(
  main.slice(0, main.indexOf('const state')) +
    '\nconst state={machineId:"box"};\n' +
    'function clamp(value,min,max){return Math.max(min,Math.min(max,value));}\n' +
    main.slice(main.indexOf('const GEOMETRY_EPSILON'), main.indexOf('function selectedItem')) +
    main.slice(main.indexOf('function createHangMotion'), main.indexOf('function setMotionType')) +
    '\nconst FOOTPRINT_SAMPLE_SIZE=256;\n' +
    uploads.slice(
      uploads.indexOf('function customFootprint'),
      uploads.indexOf('function appendCustomCollection'),
    ) +
    fs.readFileSync(path.join(root, 'physics.js'), 'utf8'),
  context,
);

const fixtures = [
  {
    name: 'rectangle with padding',
    alpha: (x, y) => (x >= 71 && x <= 180 && y >= 95 && y <= 155 ? 255 : 0),
  },
  { name: 'circle', alpha: (x, y) => ((x - 128) ** 2 + (y - 128) ** 2 < 70 ** 2 ? 255 : 0) },
  {
    name: 'concave cross',
    alpha: (x, y) =>
      (x > 110 && x < 140 && y > 30 && y < 220) || (x > 40 && x < 210 && y > 112 && y < 142)
        ? 255
        : 0,
  },
  {
    name: 'translucent edge',
    alpha: (x, y) => (x >= 35 && x <= 115 && y >= 150 && y <= 210 ? 16 : 0),
  },
];
let checks = 0;
for (const fixture of fixtures) {
  pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) pixels[(y * size + x) * 4 + 3] = fixture.alpha(x, y);
  const polygon = vm.runInContext('customFootprint({naturalWidth:240,naturalHeight:120})', context);
  context.testPolygon = polygon;
  assert(polygon.length >= 3 && polygon.length <= 20, fixture.name);
  assert.deepEqual(drawArguments.slice(1), [0, 64, 256, 128]);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      if (fixture.alpha(x, y) < 16) continue;
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        context.testPoint = { x: (x + dx) / size, y: (y + dy) / size };
        assert(
          vm.runInContext('pointInConvexPolygon(testPoint,testPolygon)', context),
          fixture.name + ' excluded a visible pixel',
        );
        checks++;
      }
    }
  vm.runInContext(
    `
    decoCatalog.push({id:'test-custom',label:'test-custom',footprint:testPolygon});
    for(const machineId of Object.keys(machinePolygons)){
      state.machineId=machineId;
      for(const type of ['fall','float','hang']){
        const item={assetId:'test-custom',design:{...polygonCenter(machinePolygons[machineId]),scale:1.8,rotation:37,zIndex:1},motion:{type}};
        clampItem(item);item.physics=makePhysicsState(item,0);
        for(let frame=0;frame<180;frame++){
          if(frame%30===0)impulsePhysics([item],.5,-.5);
          stepPhysics([item],1/60,frame/60);
          for(const p of physicsFootprint(item)){
            if(!pointInConvexPolygon({x:item.physics.x+p.x,y:item.physics.y+p.y},machinePolygons[machineId]))throw Error('custom asset escaped '+machineId+'/'+type);
          }
        }
      }
    }
    decoCatalog.pop();
  `,
    context,
  );
}
pixels = new Uint8ClampedArray(size * size * 4);
assert.throws(
  () => vm.runInContext('customFootprint({naturalWidth:32,naturalHeight:32})', context),
  /透明/,
);
console.log(
  `PASS: ${checks} visible-pixel corner checks, contained custom physics, aspect-fit sampling and transparent rejection`,
);
