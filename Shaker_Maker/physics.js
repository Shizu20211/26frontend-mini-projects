'use strict';

// Normalized coordinates; time is measured in seconds, never in frame counts.
const PHYSICS = Object.freeze({
  gravity: 0.8,
  bounce: 0.28,
  maxSpeed: 1.8,
  floatSpring: 4,
  floatDamping: 2.2,
  pendulumDamping: 0.8,
  maxAngularSpeed: 5,
});
function makePhysicsState(item, index) {
  const hang = item.motion.type === 'hang' ? createHangMotion(item) : null;
  const dx = hang ? item.design.x - hang.anchorX : 0;
  const dy = hang ? item.design.y - hang.anchorY : 0;
  return {
    x: item.design.x,
    y: item.design.y,
    rotation: item.design.rotation,
    velocityX: 0,
    velocityY: 0,
    angularVelocity: 0,
    angle: Math.atan2(dx, dy),
    anchorX: hang?.anchorX,
    anchorY: hang?.anchorY,
    ropeLength: hang ? Math.max(0.04, Math.hypot(dx, dy)) : null,
    restX: item.design.x,
    restY: item.design.y,
    phase: index * 1.7,
  };
}
function physicsFootprint(item) {
  return itemFootprint({
    assetId: item.assetId,
    design: { ...item.design, rotation: item.physics.rotation },
  });
}
function constrainPhysics(item) {
  const p = item.physics;
  const region = centerRegion(machinePolygons[state.machineId], physicsFootprint(item));
  const corrected = closestAllowedPoint(p, region);
  if (!corrected) return false;
  const dx = corrected.x - p.x,
    dy = corrected.y - p.y,
    distance = Math.hypot(dx, dy);
  if (distance > 1e-8) {
    const nx = dx / distance,
      ny = dy / distance;
    const outgoing = p.velocityX * nx + p.velocityY * ny;
    if (outgoing < 0) {
      p.velocityX -= (1 + PHYSICS.bounce) * outgoing * nx;
      p.velocityY -= (1 + PHYSICS.bounce) * outgoing * ny;
    }
    p.x = corrected.x;
    p.y = corrected.y;
    return true;
  }
  return false;
}
function stepPhysics(items, deltaTime, elapsed, reducedMotion = false) {
  // A bounded timestep and substeps avoid huge jumps after pauses or slow frames.
  const duration = clamp(deltaTime, 0, 0.05);
  const steps = Math.max(1, Math.ceil(duration / (1 / 120))),
    dt = duration / steps;
  for (let step = 0; step < steps; step++) {
    for (const item of items) {
      const p = item.physics;
      if (!p) continue;
      if (item.motion.type === 'hang') {
        p.angularVelocity +=
          ((-PHYSICS.gravity / p.ropeLength) * Math.sin(p.angle) -
            PHYSICS.pendulumDamping * p.angularVelocity) *
          dt;
        p.angularVelocity = clamp(
          p.angularVelocity,
          -PHYSICS.maxAngularSpeed,
          PHYSICS.maxAngularSpeed,
        );
        p.angle = clamp(p.angle + p.angularVelocity * dt, -1.25, 1.25);
        const previousRotation = p.rotation;
        p.rotation = item.design.rotation + ((p.angle * 180) / Math.PI) * 0.25;
        if (centerRegion(machinePolygons[state.machineId], physicsFootprint(item)).length < 3)
          p.rotation = previousRotation;
        p.x = p.anchorX + Math.sin(p.angle) * p.ropeLength;
        p.y = p.anchorY + Math.cos(p.angle) * p.ropeLength;
        if (constrainPhysics(item)) {
          // Wall contact damps the pendulum; the simplified rope may shorten.
          p.angle = Math.atan2(p.x - p.anchorX, p.y - p.anchorY);
          p.ropeLength = Math.max(0.04, Math.hypot(p.x - p.anchorX, p.y - p.anchorY));
          p.angularVelocity *= 0.3;
        }
      } else {
        let ax = 0,
          ay = PHYSICS.gravity,
          damping = 0.4;
        if (item.motion.type === 'float') {
          const amplitude = reducedMotion ? 0 : 0.025;
          const targetX = p.restX + Math.sin(elapsed * 1.4 + p.phase) * amplitude;
          const targetY = p.restY + Math.cos(elapsed * 1.1 + p.phase) * amplitude;
          ax = (targetX - p.x) * PHYSICS.floatSpring;
          ay = (targetY - p.y) * PHYSICS.floatSpring;
          damping = PHYSICS.floatDamping;
        }
        p.velocityX = clamp(
          (p.velocityX + ax * dt) * Math.exp(-damping * dt),
          -PHYSICS.maxSpeed,
          PHYSICS.maxSpeed,
        );
        p.velocityY = clamp(
          (p.velocityY + ay * dt) * Math.exp(-damping * dt),
          -PHYSICS.maxSpeed,
          PHYSICS.maxSpeed,
        );
        p.x += p.velocityX * dt;
        p.y += p.velocityY * dt;
        constrainPhysics(item);
      }
    }
  }
}
function impulsePhysics(items, x, y) {
  x = clamp(x, -0.65, 0.65);
  y = clamp(y, -0.65, 0.65);
  for (const item of items) {
    const p = item.physics;
    if (!p) continue;
    if (item.motion.type === 'hang') {
      p.angularVelocity = clamp(
        p.angularVelocity + (x * Math.cos(p.angle) - y * Math.sin(p.angle)) / p.ropeLength,
        -PHYSICS.maxAngularSpeed,
        PHYSICS.maxAngularSpeed,
      );
    } else {
      p.velocityX = clamp(p.velocityX + x, -PHYSICS.maxSpeed, PHYSICS.maxSpeed);
      p.velocityY = clamp(p.velocityY + y, -PHYSICS.maxSpeed, PHYSICS.maxSpeed);
    }
  }
}
