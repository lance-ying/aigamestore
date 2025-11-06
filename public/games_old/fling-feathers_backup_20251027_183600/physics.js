// physics.js - Comprehensive Matter.js physics engine
import { CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_TYPES, MATERIAL_TYPES } from './globals.js';

let Engine, World, Bodies, Body, Constraint, Events, Composite;

export function initMatter() {
  console.log('[PHYSICS] Initializing Matter.js');
  
  if (typeof Matter === 'undefined') {
    console.error('[PHYSICS] Matter.js not loaded');
    return null;
  }
  
  // Get Matter.js modules
  Engine = Matter.Engine;
  World = Matter.World;
  Bodies = Matter.Bodies;
  Body = Matter.Body;
  Constraint = Matter.Constraint;
  Events = Matter.Events;
  Composite = Matter.Composite;
  
  console.log('[PHYSICS] Matter.js modules loaded:', {
    Engine: !!Engine,
    World: !!World,
    Bodies: !!Bodies,
    Body: !!Body
  });
  
  // Create physics engine
  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 10,
    velocityIterations: 8
  });
  
  // Configure gravity
  engine.gravity.y = 1.0;
  engine.gravity.x = 0;
  
  // Timing
  engine.timing.timeScale = 1;
  
  console.log('[PHYSICS] Engine created successfully:', {
    gravity: engine.gravity,
    world: !!engine.world
  });
  
  return engine;
}

export function setupCollisionEvents(engine, collisionHandler) {
  console.log('[PHYSICS] Setting up collision events');
  
  // Set up collision event listeners
  Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    pairs.forEach(pair => {
      collisionHandler(pair.bodyA, pair.bodyB, 'start');
    });
  });
  
  Events.on(engine, 'collisionActive', function(event) {
    const pairs = event.pairs;
    pairs.forEach(pair => {
      collisionHandler(pair.bodyA, pair.bodyB, 'active');
    });
  });
  
  console.log('[PHYSICS] Collision events configured');
}

export function createGround(engine) {
  console.log('[PHYSICS] Creating ground');
  const groundHeight = 50;
  const ground = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - groundHeight / 2,
    CANVAS_WIDTH,
    groundHeight,
    { 
      isStatic: true, 
      label: 'ground',
      friction: 0.9,
      restitution: 0.1
    }
  );
  World.add(engine.world, ground);
  return ground;
}

export function createBird(x, y, type) {
  console.log(`[PHYSICS] Creating ${type} bird at (${x}, ${y})`);
  
  let radius, density, restitution;
  
  switch(type) {
    case BIRD_TYPES.YELLOW:
      radius = 12;
      density = 0.0015;
      restitution = 0.5;
      break;
    case BIRD_TYPES.BLUE:
      radius = 10;
      density = 0.001;
      restitution = 0.4;
      break;
    case BIRD_TYPES.BLACK:
      radius = 17;
      density = 0.003;
      restitution = 0.3;
      break;
    case BIRD_TYPES.RED:
    default:
      radius = 15;
      density = 0.002;
      restitution = 0.4;
      break;
  }
  
  const bird = Bodies.circle(x, y, radius, {
    density: density,
    restitution: restitution,
    friction: 0.3,
    frictionAir: 0.01,
    label: 'bird',
    birdType: type,
    sleepThreshold: 30,
    collisionFilter: {
      category: 0x0001,
      mask: 0xFFFF
    }
  });
  
  console.log('[PHYSICS] Bird created:', {
    type,
    radius,
    position: bird.position,
    isStatic: bird.isStatic
  });
  
  return bird;
}

export function createPig(x, y, isBoss = false) {
  const radius = isBoss ? 30 : 20;
  const pig = Bodies.circle(x, y, radius, {
    density: 0.0025,
    restitution: 0.2,
    friction: 0.7,
    frictionAir: 0.02,
    label: 'pig',
    isBoss: isBoss,
    health: isBoss ? 3 : 1,
    destroyed: false,
    isStatic: true,
    sleepThreshold: 20,
    collisionFilter: {
      category: 0x0002,
      mask: 0xFFFF
    }
  });
  
  return pig;
}

export function createBlock(x, y, w, h, material) {
  const materialProps = {
    [MATERIAL_TYPES.WOOD]: { 
      density: 0.0012, 
      restitution: 0.2, 
      friction: 0.8,
      threshold: 15, 
      color: [139, 69, 19] 
    },
    [MATERIAL_TYPES.STONE]: { 
      density: 0.004, 
      restitution: 0.1, 
      friction: 0.95,
      threshold: 30, 
      color: [128, 128, 128] 
    },
    [MATERIAL_TYPES.GLASS]: { 
      density: 0.0008, 
      restitution: 0.05, 
      friction: 0.4,
      threshold: 8, 
      color: [173, 216, 230, 180] 
    }
  };
  
  const props = materialProps[material] || materialProps[MATERIAL_TYPES.WOOD];
  
  const block = Bodies.rectangle(x, y, w, h, {
    density: props.density,
    restitution: props.restitution,
    friction: props.friction,
    frictionAir: 0.02,
    label: 'block',
    material: material,
    threshold: props.threshold,
    blockColor: props.color,
    destroyed: false,
    isStatic: true,
    sleepThreshold: 20,
    collisionFilter: {
      category: 0x0004,
      mask: 0xFFFF
    }
  });
  
  return block;
}

export function createConstraint(bodyA, bodyB, options = {}) {
  return Constraint.create({
    bodyA: bodyA,
    bodyB: bodyB,
    stiffness: options.stiffness || 0.05,
    length: options.length || 0,
    pointA: options.pointA || { x: 0, y: 0 },
    pointB: options.pointB || { x: 0, y: 0 }
  });
}

export function addBody(engine, body) {
  console.log(`[PHYSICS] Adding body to world: ${body.label}`);
  World.add(engine.world, body);
}

export function addBodies(engine, bodies) {
  console.log(`[PHYSICS] Adding ${bodies.length} bodies to world`);
  World.add(engine.world, bodies);
}

export function removeBody(engine, body) {
  if (body && engine && engine.world) {
    console.log(`[PHYSICS] Removing body from world: ${body.label}`);
    World.remove(engine.world, body);
  }
}

export function removeBodies(engine, bodies) {
  if (!engine || !engine.world) return;
  console.log(`[PHYSICS] Removing ${bodies.length} bodies from world`);
  bodies.forEach(body => {
    if (body) {
      World.remove(engine.world, body);
    }
  });
}

export function applyForce(body, force, position = null) {
  if (!body) return;
  const pos = position || body.position;
  console.log(`[PHYSICS] Applying force to ${body.label}:`, force);
  Body.applyForce(body, pos, force);
}

export function setVelocity(body, velocity) {
  if (!body) {
    console.error('[PHYSICS] Cannot set velocity - body is null');
    return;
  }
  console.log(`[PHYSICS] Setting velocity for ${body.label}:`, velocity);
  Body.setVelocity(body, velocity);
  console.log(`[PHYSICS] Velocity after set:`, body.velocity);
}

export function setPosition(body, position) {
  if (!body) {
    console.error('[PHYSICS] Cannot set position - body is null');
    return;
  }
  console.log(`[PHYSICS] Setting position for ${body.label}:`, position);
  Body.setPosition(body, position);
  console.log(`[PHYSICS] Position after set:`, body.position);
}

export function setAngle(body, angle) {
  if (!body) return;
  Body.setAngle(body, angle);
}

export function setStatic(body, isStatic) {
  if (!body) {
    console.error('[PHYSICS] Cannot set static - body is null');
    return;
  }
  console.log(`[PHYSICS] Setting ${body.label} to ${isStatic ? 'STATIC' : 'DYNAMIC'}`);
  Body.setStatic(body, isStatic);
  console.log(`[PHYSICS] Body isStatic after set:`, body.isStatic);
}

export function getVelocityMagnitude(body) {
  if (!body || !body.velocity) return 0;
  const v = body.velocity;
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function getSpeed(body) {
  return getVelocityMagnitude(body);
}

export function clearWorld(engine) {
  if (!engine || !engine.world) return;
  World.clear(engine.world, false);
  Engine.clear(engine);
}

export { World, Bodies, Body, Constraint, Events, Engine, Composite };