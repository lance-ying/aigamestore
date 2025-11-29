// camera.js - Camera and viewport management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { lerp } from './physics.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  // Target camera position (centered on player)
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  
  // Smooth follow
  gameState.cameraX = lerp(gameState.cameraX, targetX, 0.1);
  
  // Clamp camera to world bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth - CANVAS_WIDTH));
}