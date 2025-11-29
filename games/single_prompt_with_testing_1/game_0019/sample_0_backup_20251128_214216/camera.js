// camera.js - Camera setup and control
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  
  camera.position.set(0, 10, 18);
  camera.lookAt(0, 0, 0);
  
  gameState.camera = camera;
}

export function updateCamera() {
  if (!gameState.player || !gameState.camera) return;
  
  // Update camera offset to follow player in 3D space
  const targetPosition = new THREE.Vector3()
    .copy(gameState.player.mesh.position)
    .add(new THREE.Vector3(0, 10, 18));
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at player with slight upward offset
  const lookAtTarget = gameState.player.mesh.position.clone();
  lookAtTarget.y += 1;
  gameState.camera.lookAt(lookAtTarget);
}