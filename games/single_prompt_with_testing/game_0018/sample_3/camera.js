import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    60,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  
  gameState.camera.position.set(0, 4, 8);
  gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
  if (!gameState.player) return;
  
  // Follow player with slight offset
  const targetPosition = new THREE.Vector3(
    gameState.player.mesh.position.x * 0.3, // Slight lateral follow
    gameState.cameraOffset.y,
    gameState.player.mesh.position.z + gameState.cameraOffset.z
  );
  
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look slightly ahead of player
  const lookTarget = new THREE.Vector3(
    gameState.player.mesh.position.x * 0.5,
    1,
    gameState.player.mesh.position.z - 5
  );
  
  gameState.camera.lookAt(lookTarget);
}