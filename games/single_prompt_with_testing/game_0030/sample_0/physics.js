// physics.js - Physics and collision handling (minimal for this grid-based game)

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState } from './globals.js';

export function initPhysics() {
  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 0; // No gravity for top-down grid game
  
  gameState.engine = engine;
  gameState.world = world;
  
  return { engine, world };
}

export function updatePhysics() {
  if (gameState.engine) {
    Engine.update(gameState.engine, 1000 / 60);
  }
}

// No collision detection needed for grid-based game
// Physics engine is minimal here, mainly for consistency with requirements