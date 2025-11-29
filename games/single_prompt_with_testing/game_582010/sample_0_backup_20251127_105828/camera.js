/**
 * Camera setup and control systems
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
  
  gameState.camera.position.set(0, 10, 15);
  gameState.camera.lookAt(0, 0, 0);
}

/**
 * Update camera to follow player
 */
export function updateCamera() {
  if (!gameState.player) return;
  
  // Calculate target position behind and above player
  const playerPos = gameState.player.mesh.position.clone();
  const playerRotation = gameState.player.mesh.rotation.y;
  
  // Offset based on player rotation
  const offsetDistance = 12;
  const offsetHeight = 8;
  
  const targetPosition = new THREE.Vector3(
    playerPos.x + Math.sin(playerRotation) * offsetDistance,
    playerPos.y + offsetHeight,
    playerPos.z + Math.cos(playerRotation) * offsetDistance
  );
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at player
  const lookAtTarget = playerPos.clone();
  lookAtTarget.y += 1;
  gameState.camera.lookAt(lookAtTarget);
}

/**
 * Camera shake effect (for impact moments)
 */
let cameraShakeIntensity = 0;
let cameraShakeDuration = 0;

export function applyCameraShake(intensity, duration) {
  cameraShakeIntensity = intensity;
  cameraShakeDuration = duration;
}

export function updateCameraShake(deltaTime) {
  if (cameraShakeDuration > 0) {
    const shakeX = (Math.random() - 0.5) * cameraShakeIntensity;
    const shakeY = (Math.random() - 0.5) * cameraShakeIntensity;
    const shakeZ = (Math.random() - 0.5) * cameraShakeIntensity;
    
    gameState.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
    
    cameraShakeDuration -= deltaTime;
    cameraShakeIntensity *= 0.9;
  }
}