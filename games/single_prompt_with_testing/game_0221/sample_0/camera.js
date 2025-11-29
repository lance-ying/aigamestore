// camera.js - Camera system for following player

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

export function updateCamera(p) {
  if (!gameState.player) return;
  
  // Calculate target camera position (center player on screen)
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  // Smooth camera following with lerp
  const lerpAmount = 0.1;
  gameState.cameraX = p.lerp(gameState.cameraX, targetX, lerpAmount);
  gameState.cameraY = p.lerp(gameState.cameraY, targetY, lerpAmount);
  
  // Clamp camera to world bounds
  gameState.cameraX = p.constrain(
    gameState.cameraX,
    0,
    Math.max(0, WORLD_WIDTH - CANVAS_WIDTH)
  );
  gameState.cameraY = p.constrain(
    gameState.cameraY,
    0,
    Math.max(0, WORLD_HEIGHT - CANVAS_HEIGHT)
  );
}