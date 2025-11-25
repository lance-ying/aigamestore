import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    600 / 400,
    0.1,
    1000
  );
  
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 2, 0);
  
  // Initialize camera rotation to face forward
  gameState.cameraRotation.yaw = 0;
  gameState.cameraRotation.pitch = 0;
  
  gameState.camera = camera;
}

export function updateCamera() {
  if (!gameState.player || !gameState.camera) return;
  
  // First-person camera - position at player's eye level
  const eyePosition = gameState.player.mesh.position.clone();
  eyePosition.y += gameState.cameraOffset.y;
  
  gameState.camera.position.copy(eyePosition);
  
  // Camera faces forward in a fixed direction
  // No auto-rotation based on velocity to prevent jittery movement
  
  // Apply camera rotation
  gameState.camera.rotation.order = 'YXZ';
  gameState.camera.rotation.y = gameState.cameraRotation.yaw;
  gameState.camera.rotation.x = gameState.cameraRotation.pitch;
  
  // Update weapon position to follow camera
  if (gameState.player.weapon) {
    gameState.player.weapon.position.set(0.3, -0.3, -0.5);
    gameState.player.weapon.rotation.copy(gameState.camera.rotation);
    
    // Attach weapon to camera for first-person view
    if (gameState.player.weapon.parent !== gameState.camera) {
      gameState.camera.add(gameState.player.weapon);
    }
  }
}

export function setCameraRotation(yaw, pitch) {
  gameState.cameraRotation.yaw = yaw;
  gameState.cameraRotation.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, pitch));
}

// Smooth camera rotation (for future mouse look or gradual turning)
export function rotateCameraSmooth(deltaYaw, deltaPitch, smoothing = 0.1) {
  gameState.cameraRotation.yaw += deltaYaw * smoothing;
  gameState.cameraRotation.pitch += deltaPitch * smoothing;
  gameState.cameraRotation.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, gameState.cameraRotation.pitch));
}