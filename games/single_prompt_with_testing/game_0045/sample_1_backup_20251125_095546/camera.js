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
  
  gameState.camera = camera;
}

export function updateCamera() {
  if (!gameState.player || !gameState.camera) return;
  
  // First-person camera - position at player's eye level
  const eyePosition = gameState.player.mesh.position.clone();
  eyePosition.y += gameState.cameraOffset.y;
  
  gameState.camera.position.copy(eyePosition);
  
  // Camera rotation is controlled by mouse-like yaw/pitch
  // (In this keyboard-only version, we keep camera facing forward based on movement)
  
  // Optional: Make camera look in movement direction
  if (gameState.player.velocity.lengthSq() > 0.01) {
    const lookDirection = new THREE.Vector3(
      gameState.player.velocity.x,
      0,
      gameState.player.velocity.z
    ).normalize();
    
    if (lookDirection.lengthSq() > 0) {
      const targetAngle = Math.atan2(lookDirection.x, lookDirection.z);
      gameState.cameraRotation.yaw = targetAngle;
    }
  }
  
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