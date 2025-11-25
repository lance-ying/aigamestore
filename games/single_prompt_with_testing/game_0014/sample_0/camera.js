// camera.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, gameState } from './globals.js';

export function updateCamera() {
  const player = gameState.player;
  const camera = gameState.camera;

  // Center camera on player
  camera.x = player.x - CANVAS_WIDTH / 2;
  camera.y = player.y - CANVAS_HEIGHT / 2;

  // Clamp camera to world bounds
  camera.x = Math.max(0, Math.min(WORLD_WIDTH - CANVAS_WIDTH, camera.x));
  camera.y = Math.max(0, Math.min(WORLD_HEIGHT - CANVAS_HEIGHT, camera.y));
}