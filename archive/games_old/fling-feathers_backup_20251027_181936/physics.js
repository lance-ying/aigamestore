// physics.js - Comprehensive Matter.js physics engine
import { CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_TYPES, MATERIAL_TYPES } from './globals.js';

let Engine, World, Bodies, Body, Constraint, Events, Composite;

export function initMatter() {
  if (typeof Matter === 'undefined') {
    console.error('Matter.js not loaded');
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
  
  // Create physics engine
  const engine = Engine.create({
    enableSleeping: false,
    positionIterations: 6,
    velocityIterations: 4
  });
  
  // Configure gravity
  engine.gravity.y = 1.0;
  engine.gravity.x = 0;
  
  // Timing
  engine.timing.timeScale = 1;
  
  return engine;
}

export function setupCollisionEvents(engine, collisionHandler) {
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
}

export function createGround(engine) {
  const groundHeight = 50;
  const ground = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - groundHeight / 2,
    CANVAS_WIDTH,
    groundHeight,
    { 
      isStatic: true, 
      label: 'ground',
      friction: 0.8,
      restitution: 0.2
    }
  );
  World.add(engine.world, ground);
  return ground;
}

export function createBird(x, y, type) {
  let radius, density, restitution;
  
  switch(type) {
    case BIRD_TYPES.YELLOW:
      radius = 12;
      density = 0.0015;
      restitution = 0.6;
      break;
    case BIRD_TYPES.BLUE:
      radius = 10;
      density = 0.001;
      restitution = 0.5;
      break;
    case BIRD_TYPES.BLACK:
      radius = 17;
      density = 0.003;
      restitution = 0.4;
      break;
    case BIRD_TYPES.RED:
    default:
      radius = 15;
      density = 0.002;
      restitution = 0.5;
      break;
  }
  
  const bird = Bodies.circle(x, y, radius, {
    density: density,
    restitution: restitution,
    friction: 0.3,
    frictionAir: 0.01,
    label: 'bird',
    birdType: type,
    collisionFilter: {
      category: 0x0001,
      mask: 0xFFFF
    }
  });
  
  return bird;
}

export function createPig(x, y, isBoss = false) {
  const radius = isBoss ? 30 : 20;
  const pig = Bodies.circle(x, y, radius, {
    density: 0.002,
    restitution: 0.4,
    friction: 0.5,
    frictionAir: 0.01,
    label: 'pig',
    isBoss: isBoss,
    health: isBoss ? 3 : 1,
    destroyed: false,
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
      density: 0.001, 
      restitution: 0.3, 
      friction: 0.8,
      threshold: 15, 
      color: [139, 69, 19] 
    },
    [MATERIAL_TYPES.STONE]: { 
      density: 0.003, 
      restitution: 0.2, 
      friction: 0.9,
      threshold: 30, 
      color: [128, 128, 128] 
    },
    [MATERIAL_TYPES.GLASS]: { 
      density: 0.0005, 
      restitution: 0.1, 
      friction: 0.3,
      threshold: 8, 
      color: [173, 216, 230, 180] 
    }
  };
  
  const props = materialProps[material] || materialProps[MATERIAL_TYPES.WOOD];
  
  const block = Bodies.rectangle(x, y, w, h, {
    density: props.density,
    restitution: props.restitution,
    friction: props.friction,
    frictionAir: 0.01,
    label: 'block',
    material: material,
    threshold: props.threshold,
    blockColor: props.color,
    destroyed: false,
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
  World.add(engine.world, body);
}

export function addBodies(engine, bodies) {
  World.add(engine.world, bodies);
}

export function removeBody(engine, body) {
  if (body && engine && engine.world) {
    World.remove(engine.world, body);
  }
}

export function removeBodies(engine, bodies) {
  if (!engine || !engine.world) return;
  bodies.forEach(body => {
    if (body) {
      World.remove(engine.world, body);
    }
  });
}

export function applyForce(body, force, position = null) {
  if (!body) return;
  const pos = position || body.position;
  Body.applyForce(body, pos, force);
}

export function setVelocity(body, velocity) {
  if (!body) return;
  Body.setVelocity(body, velocity);
}

export function setPosition(body, position) {
  if (!body) return;
  Body.setPosition(body, position);
}

export function setAngle(body, angle) {
  if (!body) return;
  Body.setAngle(body, angle);
}

export function setStatic(body, isStatic) {
  if (!body) return;
  Body.setStatic(body, isStatic);
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