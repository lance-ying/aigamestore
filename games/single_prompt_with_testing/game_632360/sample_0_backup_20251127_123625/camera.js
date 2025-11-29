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
  
  gameState.camera.position.set(0, 12, 18);
  gameState.camera.lookAt(0, 0, 0);
}

/**
 * Update camera to follow player
 */
export function updateCamera() {
  if (!gameState.player) return;
  
  // Third-person camera with smooth following
  const targetPosition = new THREE.Vector3()
    .copy(gameState.player.mesh.position)
    .add(gameState.cameraOffset);
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at player
  const lookAtTarget = gameState.player.mesh.position.clone();
  lookAtTarget.y += 1;
  gameState.camera.lookAt(lookAtTarget);
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