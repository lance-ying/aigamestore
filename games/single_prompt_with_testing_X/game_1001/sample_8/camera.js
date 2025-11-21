import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  // Follow player with smooth camera
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
  gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
  
  // Constrain camera to level bounds
  gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, gameState.levelWidth - CANVAS_WIDTH));
  gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, gameState.levelHeight - CANVAS_HEIGHT));
  
  // Apply screen shake
  if (gameState.camera.shakeAmount > 0) {
    gameState.camera.shakeX = (Math.random() - 0.5) * gameState.camera.shakeAmount;
    gameState.camera.shakeY = (Math.random() - 0.5) * gameState.camera.shakeAmount;
    gameState.camera.shakeAmount *= 0.85;
    
    if (gameState.camera.shakeAmount < 0.5) {
      gameState.camera.shakeAmount = 0;
      gameState.camera.shakeX = 0;
      gameState.camera.shakeY = 0;
    }
  }
}