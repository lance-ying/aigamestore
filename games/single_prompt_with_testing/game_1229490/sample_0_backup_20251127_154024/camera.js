import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Setup camera
export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    75,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  
  gameState.camera.position.set(0, 5, 10);
  gameState.camera.lookAt(0, 0, 0);
}

// Update camera position and rotation (FIRST PERSON)
export function updateCamera() {
  if (!gameState.player) return;
  
  // Position camera at player's eye level (first person)
  const eyeHeight = 0.6; // Eye height offset from player center
  gameState.camera.position.set(
    gameState.player.mesh.position.x,
    gameState.player.mesh.position.y + eyeHeight,
    gameState.player.mesh.position.z
  );
  
  // Calculate look direction based on camera angles
  const lookDistance = 10; // Distance to look ahead
  const lookTarget = new THREE.Vector3(
    gameState.camera.position.x + Math.sin(gameState.cameraAngleX) * Math.cos(gameState.cameraAngleY) * lookDistance,
    gameState.camera.position.y + Math.sin(gameState.cameraAngleY) * lookDistance,
    gameState.camera.position.z - Math.cos(gameState.cameraAngleX) * Math.cos(gameState.cameraAngleY) * lookDistance
  );
  
  gameState.camera.lookAt(lookTarget);
}

// Handle camera rotation input
export function rotateCameraHorizontal(direction) {
  gameState.cameraAngleX += direction * 0.05;
}

export function rotateCameraVertical(direction) {
  gameState.cameraAngleY += direction * 0.03;
  gameState.cameraAngleY = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, gameState.cameraAngleY));
}