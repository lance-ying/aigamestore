import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    60,
    600 / 400,
    0.1,
    1000
  );
  
  gameState.camera.position.set(0, 8, 12);
  gameState.camera.lookAt(0, 0, -10);
}

export function updateCamera() {
  if (!gameState.player) return;
  
  // Follow player with smooth interpolation
  const targetPosition = new THREE.Vector3(
    gameState.player.mesh.position.x * 0.3,
    8,
    12
  );
  
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look slightly ahead of player
  const lookTarget = new THREE.Vector3(
    gameState.player.mesh.position.x * 0.5,
    2,
    -10
  );
  
  gameState.camera.lookAt(lookTarget);
}