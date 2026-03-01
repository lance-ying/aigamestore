// camera.js - Camera system for following the creature

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, lerp } from './globals.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  // Camera follows player
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  // Smooth camera movement
  gameState.cameraX = lerp(gameState.cameraX, targetX, 0.1);
  gameState.cameraY = lerp(gameState.cameraY, targetY, 0.1);
  
  // Constrain camera to level bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.levelWidth - CANVAS_WIDTH));
  gameState.cameraY = Math.max(0, Math.min(gameState.cameraY, gameState.levelHeight - CANVAS_HEIGHT));
  
  // Apply screen shake
  if (gameState.shakeAmount > 0) {
    gameState.cameraX += (Math.random() - 0.5) * gameState.shakeAmount;
    gameState.cameraY += (Math.random() - 0.5) * gameState.shakeAmount;
    gameState.shakeAmount *= 0.9;
    
    if (gameState.shakeAmount < 0.1) {
      gameState.shakeAmount = 0;
    }
  }
}