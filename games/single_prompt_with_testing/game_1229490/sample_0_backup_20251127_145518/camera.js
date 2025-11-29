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

// Update camera position and rotation
export function updateCamera() {
  if (!gameState.player) return;
  
  // Calculate camera position based on player position and angles
  const distance = gameState.cameraDistance;
  const height = gameState.cameraHeight;
  
  const offsetX = Math.sin(gameState.cameraAngleX) * distance * Math.cos(gameState.cameraAngleY);
  const offsetZ = Math.cos(gameState.cameraAngleX) * distance * Math.cos(gameState.cameraAngleY);
  const offsetY = height + Math.sin(gameState.cameraAngleY) * distance;
  
  const targetPosition = new THREE.Vector3(
    gameState.player.mesh.position.x + offsetX,
    gameState.player.mesh.position.y + offsetY,
    gameState.player.mesh.position.z + offsetZ
  );
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at player
  const lookAtTarget = gameState.player.mesh.position.clone();
  lookAtTarget.y += 0.5;
  gameState.camera.lookAt(lookAtTarget);
}

// Handle camera rotation input
export function rotateCameraHorizontal(direction) {
  gameState.cameraAngleX += direction * 0.05;
}

export function rotateCameraVertical(direction) {
  gameState.cameraAngleY += direction * 0.03;
  gameState.cameraAngleY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, gameState.cameraAngleY));
}