// camera.js - Camera management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera(p) {
  if (!gameState.player) return;
  
  // Target camera position (center on player)
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  // Smooth camera movement
  const smoothing = 0.1;
  gameState.cameraX += (targetX - gameState.cameraX) * smoothing;
  gameState.cameraY += (targetY - gameState.cameraY) * smoothing;
  
  // Clamp camera to world bounds
  gameState.cameraX = p.constrain(
    gameState.cameraX,
    0,
    gameState.worldWidth - CANVAS_WIDTH
  );
  
  gameState.cameraY = p.constrain(
    gameState.cameraY,
    0,
    gameState.worldHeight - CANVAS_HEIGHT
  );
}