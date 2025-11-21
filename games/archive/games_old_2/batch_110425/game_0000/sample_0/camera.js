// camera.js - Camera management

import { gameState, CANVAS_WIDTH } from './globals.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  // Center camera on player with some leading room
  let targetX = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.w / 2;
  
  // Smooth camera movement
  let lerpFactor = 0.1;
  gameState.cameraX += (targetX - gameState.cameraX) * lerpFactor;
  
  // Clamp camera to level bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.levelWidth - CANVAS_WIDTH));
}