// physics.js - Physics engine setup and helpers
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let Engine, World, Bodies, Body, Constraint;

export function initMatter() {
  if (typeof Matter === 'undefined') {
    console.error('Matter.js not loaded');
    return null;
  }
  
  Engine = Matter.Engine;
  World = Matter.World;
  Bodies = Matter.Bodies;
  Body = Matter.Body;
  Constraint = Matter.Constraint;
  
  const engine = Engine.create();
  engine.gravity.y = 1.0;
  
  return engine;
}

export function createGround(engine) {
  const ground = Bodies.rectangle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - 25,
    CANVAS_WIDTH,
    50,
    { isStatic: true, label: 'ground' }
  );
  World.add(engine.world, ground);
  return ground;
}

export function createBird(x, y, type) {
  const birdData = {
    position: { x, y },
    restitution: 0.5,
    friction: 0.3,
    label: 'bird',
    birdType: type
  };
  
  let bird;
  if (type === 'YELLOW') {
    bird = Bodies.circle(x, y, 12, birdData);
  } else if (type === 'BLUE') {
    bird = Bodies.circle(x, y, 10, birdData);
  } else if (type === 'BLACK') {
    bird = Bodies.circle(x, y, 17, birdData);
  } else {
    bird = Bodies.circle(x, y, 15, birdData);
  }
  
  return bird;
}

export function createPig(x, y, isBoss = false) {
  const radius = isBoss ? 30 : 20;
  const pig = Bodies.circle(x, y, radius, {
    restitution: 0.4,
    friction: 0.5,
    density: 0.002,
    label: 'pig',
    isBoss,
    health: isBoss ? 3 : 1
  });
  return pig;
}

export function createBlock(x, y, w, h, material) {
  const materialProps = {
    WOOD: { density: 0.001, restitution: 0.3, threshold: 15, color: [139, 69, 19] },
    STONE: { density: 0.003, restitution: 0.2, threshold: 30, color: [128, 128, 128] },
    GLASS: { density: 0.0005, restitution: 0.1, threshold: 8, color: [173, 216, 230, 180] }
  };
  
  const props = materialProps[material] || materialProps.WOOD;
  
  const block = Bodies.rectangle(x, y, w, h, {
    restitution: props.restitution,
    friction: 0.8,
    density: props.density,
    label: 'block',
    material,
    threshold: props.threshold,
    blockColor: props.color
  });
  
  return block;
}

export function createConstraint(bodyA, bodyB, stiffness = 0.05) {
  return Constraint.create({
    bodyA,
    bodyB,
    stiffness,
    length: 0
  });
}

export function removeBodies(engine, bodies) {
  bodies.forEach(body => {
    World.remove(engine.world, body);
  });
}

export function applyForce(body, force) {
  Body.applyForce(body, body.position, force);
}

export function setVelocity(body, velocity) {
  Body.setVelocity(body, velocity);
}

export function getVelocityMagnitude(body) {
  const v = body.velocity;
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export { World, Bodies, Body, Constraint };