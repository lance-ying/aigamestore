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
  
  gameState.camera.position.set(0, 3, 8);
  gameState.camera.lookAt(0, 0, 0);
}

/**
 * Update camera to follow player from behind
 */
export function updateCamera() {
  if (!gameState.player) return;
  
  // Calculate target position behind player
  const playerPos = gameState.player.mesh.position.clone();
  const playerRotation = gameState.player.mesh.rotation.y;
  
  // Combine player rotation with camera rotation offset (controlled by arrow keys)
  const totalRotation = playerRotation + gameState.cameraRotationOffset;
  
  // Position camera behind and slightly above player for third-person view
  const offsetDistance = 6; // Closer to player
  const offsetHeight = 2.5; // Lower height for behind-the-player view
  
  const targetPosition = new THREE.Vector3(
    playerPos.x + Math.sin(totalRotation) * offsetDistance,
    playerPos.y + offsetHeight,
    playerPos.z + Math.cos(totalRotation) * offsetDistance
  );
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.15);
  
  // Look at player (slightly above their feet)
  const lookAtTarget = playerPos.clone();
  lookAtTarget.y += 1.2;
  gameState.camera.lookAt(lookAtTarget);
}

/**
 * Rotate camera left (arrow key control)
 */
export function rotateCameraLeft(deltaTime) {
  gameState.cameraRotationOffset += 2.0 * deltaTime;
}

/**
 * Rotate camera right (arrow key control)
 */
export function rotateCameraRight(deltaTime) {
  gameState.cameraRotationOffset -= 2.0 * deltaTime;
}

/**
 * Move camera closer (arrow key control)
 */
export function moveCameraCloser(deltaTime) {
  // Optional: implement zoom in/out if desired
}

/**
 * Move camera farther (arrow key control)
 */
export function moveCameraFarther(deltaTime) {
  // Optional: implement zoom in/out if desired
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