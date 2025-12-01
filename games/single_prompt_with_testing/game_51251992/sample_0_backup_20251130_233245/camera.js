// Camera Logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera() {
  if (!gameState.player) return;
  
  const targetX = gameState.player.body.position.x - CANVAS_WIDTH / 2;
  const targetY = gameState.player.body.position.y - CANVAS_HEIGHT / 2;
  
  // Smooth follow
  gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
  gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
  
  // Clamp X so we don't see outside walls too much
  // Assuming walls are at 0 and CANVAS_WIDTH
  // Actually, let the camera float freely for smoother feel, borders are handled by visual walls.
}