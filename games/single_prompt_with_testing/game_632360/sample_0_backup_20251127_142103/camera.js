/**
 * Camera setup and control
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Setup camera
 */
export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    60,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  
  // Start with closer camera position
  gameState.camera.position.set(0, 4, 6);
  gameState.camera.lookAt(0, 0, 0);
}

/**
 * Update camera to follow player with mouse control
 */
export function updateCamera() {
  if (!gameState.player) return;
  
  // Calculate camera angle from mouse position
  // mouseX ranges from -1 (left) to 1 (right)
  // mouseY ranges from -1 (top) to 1 (bottom)
  // Negate both to fix inverted controls
  const horizontalAngle = -gameState.mouseX * Math.PI; // -PI to PI (full rotation)
  const verticalOffset = -gameState.mouseY * 2; // -2 to 2 for height variation
  
  // Calculate camera position relative to player
  const distance = gameState.cameraDistance;
  const height = gameState.cameraHeight + verticalOffset;
  
  const targetPosition = new THREE.Vector3(
    gameState.player.mesh.position.x + Math.sin(horizontalAngle) * distance,
    gameState.player.mesh.position.y + height,
    gameState.player.mesh.position.z + Math.cos(horizontalAngle) * distance
  );
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at player
  const lookAtTarget = gameState.player.mesh.position.clone();
  lookAtTarget.y += 1;
  gameState.camera.lookAt(lookAtTarget);
  
  // Calculate camera forward direction (for movement and shooting)
  gameState.cameraForward.set(
    -Math.sin(horizontalAngle),
    0,
    -Math.cos(horizontalAngle)
  ).normalize();
}

/**
 * Apply camera shake effect
 */
export function applyCameraShake(intensity, duration) {
  let elapsed = 0;
  const originalPosition = gameState.camera.position.clone();
  
  const shake = () => {
    if (elapsed < duration) {
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      
      gameState.camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
      gameState.camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
      gameState.camera.position.z = originalPosition.z + (Math.random() - 0.5) * currentIntensity;
      
      elapsed += 0.016; // ~60fps
      requestAnimationFrame(shake);
    }
  };
  
  shake();
}