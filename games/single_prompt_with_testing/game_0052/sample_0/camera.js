// camera.js - Camera and viewport management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  // Target camera position (centered on player)
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
  
  // Smooth camera following with lerp
  const smoothing = 0.1;
  gameState.cameraX += (targetX - gameState.cameraX) * smoothing;
  gameState.cameraY += (targetY - gameState.cameraY) * smoothing;
  
  // Clamp camera to room bounds
  const room = gameState.rooms[gameState.currentRoom];
  if (room) {
    gameState.cameraX = Math.max(0, Math.min(room.width - CANVAS_WIDTH, gameState.cameraX));
    gameState.cameraY = Math.max(0, Math.min(room.height - CANVAS_HEIGHT, gameState.cameraY));
  }
}

export function isOnScreen(x, y, width, height) {
  const screenX = x - gameState.cameraX;
  const screenY = y - gameState.cameraY;
  
  return (
    screenX + width > 0 &&
    screenX < CANVAS_WIDTH &&
    screenY + height > 0 &&
    screenY < CANVAS_HEIGHT
  );
}