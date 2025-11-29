import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function initPhysics() {
  // Set up collision detection if needed
  Events.on(gameState.engine, 'collisionStart', handleCollisions);
}

export function handleCollisions(event) {
  // Handle any physics-based collisions here if needed
  // For this game, collision detection is handled manually in the claw
}