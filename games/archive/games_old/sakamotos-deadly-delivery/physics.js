// physics.js - Matter.js physics setup and utilities
import { gameState } from './globals.js';

let Matter = null;
let engine = null;
let world = null;

export function initPhysics() {
  if (typeof window !== 'undefined' && window.Matter) {
    Matter = window.Matter;
    engine = Matter.Engine.create();
    world = engine.world;
    engine.gravity.y = 1;
    return { Matter, engine, world };
  }
  return null;
}

export function getPhysics() {
  return { Matter, engine, world };
}

export function updatePhysics() {
  if (engine && gameState.simulationRunning) {
    Matter.Engine.update(engine, 1000 / 60);
  }
}

export function resetPhysics() {
  if (Matter && world) {
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
  }
}

export function createBody(x, y, width, height, options = {}) {
  if (!Matter) return null;
  return Matter.Bodies.rectangle(x, y, width, height, options);
}

export function createCircleBody(x, y, radius, options = {}) {
  if (!Matter) return null;
  return Matter.Bodies.circle(x, y, radius, options);
}

export function addBody(body) {
  if (Matter && world && body) {
    Matter.World.add(world, body);
  }
}

export function removeBody(body) {
  if (Matter && world && body) {
    Matter.World.remove(world, body);
  }
}