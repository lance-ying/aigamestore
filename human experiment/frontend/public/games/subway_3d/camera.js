import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    75,
    600 / 400,
    0.1,
    1000
  );
  
  gameState.camera.position.set(0, 8, 12);
  gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
  if (!gameState.player) return;
  
  // Follow player with smooth camera
  const targetPosition = new THREE.Vector3()
    .copy(gameState.player.mesh.position)
    .add(gameState.cameraOffset);
  
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look slightly ahead of player
  const lookTarget = new THREE.Vector3(
    gameState.player.mesh.position.x,
    gameState.player.mesh.position.y + 1,
    gameState.player.mesh.position.z - 5
  );
  
  const currentLookAt = new THREE.Vector3();
  gameState.camera.getWorldDirection(currentLookAt);
  currentLookAt.multiplyScalar(20).add(gameState.camera.position);
  
  currentLookAt.lerp(lookTarget, 0.1);
  gameState.camera.lookAt(currentLookAt);
}