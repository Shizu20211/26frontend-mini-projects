const fs = require('fs'),
  vm = require('vm');
const root = require('path').resolve(__dirname, '..') + '/';
const source = fs.readFileSync(root + 'main.js', 'utf8');
const setup = source.slice(0, source.indexOf('const state'));
const geometry = source.slice(
  source.indexOf('const GEOMETRY_EPSILON'),
  source.indexOf('function selectedItem'),
);
const hang = source.slice(
  source.indexOf('function createHangMotion'),
  source.indexOf('function setMotionType'),
);
const context = vm.createContext({ structuredClone });
vm.runInContext(
  setup +
    '\nconst state={machineId:"box"};\nfunction clamp(v,a,b){return Math.max(a,Math.min(b,v))}\n' +
    geometry +
    hang +
    fs.readFileSync(root + 'physics.js', 'utf8'),
  context,
);
const result = vm.runInContext(
  `
let checks = 0;
for (const machineId of Object.keys(machinePolygons)) {
  state.machineId = machineId;
  for (const asset of decoCatalog)
    for (const type of ['fall', 'float', 'hang'])
      for (const scale of [0.4, 1, 1.8]) {
        const center = polygonCenter(machinePolygons[machineId]);
        const item = {
          assetId: asset.id,
          design: { ...center, scale, rotation: 37, zIndex: 1 },
          motion: { type },
        };
        clampItem(item);
        const original = JSON.stringify(item.design);
        item.physics = makePhysicsState(item, 2);
        for (let frame = 0; frame < 240; frame++) {
          if (frame % 60 === 0) impulsePhysics([item], Math.sin(frame + 1) * 0.65, -0.65);
          stepPhysics([item], 1 / 60, frame / 60);
          const p = item.physics;
          if (!Number.isFinite(p.x + p.y + p.rotation + p.velocityX + p.velocityY))
            throw Error('non-finite physics');
          for (const offset of physicsFootprint(item)) {
            if (
              !pointInConvexPolygon(
                { x: p.x + offset.x, y: p.y + offset.y },
                machinePolygons[machineId],
              )
            )
              throw Error(
                machineId + '/' + asset.id + '/' + type + '/' + scale + ' escaped at ' + frame,
              );
            checks++;
          }
        }
        if (JSON.stringify(item.design) !== original) throw Error('physics changed design');
      }
}
state.machineId = 'box';
function simulate(hz, type) {
  const center = polygonCenter(machinePolygons.box);
  const item = {
    assetId: 'deco-4',
    design: { ...center, scale: 1, rotation: 0 },
    motion: { type },
  };
  clampItem(item);
  item.physics = makePhysicsState(item, 1);
  impulsePhysics([item], 0.3, -0.3);
  for (let i = 0; i < hz * 3; i++) stepPhysics([item], 1 / hz, i / hz);
  return item.physics;
}
for (const type of ['fall', 'float', 'hang']) {
  const a = simulate(30, type),
    b = simulate(120, type);
  if (Math.hypot(a.x - b.x, a.y - b.y) > 0.02) throw Error('frame-rate drift ' + type);
}
checks;
`,
  context,
);
console.log(
  'PASS: ' +
    result +
    ' physics-footprint vertex checks; finite motion; original designs preserved; 30/120Hz consistency',
);

const controller = fs.readFileSync(root + 'shake.js', 'utf8');
const pointerCode = controller.slice(
  controller.indexOf('const dt = Math.max(1 / 240'),
  controller.indexOf('Object.assign(pointer'),
);
vm.runInContext(
  'function samplePointer(pointer,event){' +
    pointerCode +
    'Object.assign(pointer,{x:event.clientX,y:event.clientY,time:event.timeStamp,velocityX,velocityY});}',
  context,
);
const consistency = vm.runInContext(
  `
const sums = [];
state.items = [];
for (const hz of [30, 60, 120]) {
  let totalX = 0,
    totalY = 0;
  impulsePhysics = (items, x, y) => {
    totalX += x;
    totalY += y;
  };
  const pointer = { x: 0, y: 0, time: 0, width: 500, velocityX: 0, velocityY: 0 };
  for (let i = 1; i <= hz; i++)
    samplePointer(pointer, {
      clientX: (250 * i) / hz,
      clientY: (100 * i) / hz,
      timeStamp: (1000 * i) / hz,
    });
  sums.push({ x: totalX, y: totalY });
}
if (sums.some((p) => Math.hypot(p.x - sums[0].x, p.y - sums[0].y) > 1e-9))
  throw Error('event-rate impulse drift');
true;
`,
  context,
);
console.log('PASS: identical integrated shake impulse at 30/60/120 pointer events per second');
