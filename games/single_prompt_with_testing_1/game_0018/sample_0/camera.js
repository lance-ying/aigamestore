// camera.js - Camera setup and control
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    60,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  
  gameState.camera.position.set(0, 5, 10);
  gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
  if (!gameState.player) return;
  
  const aircraft = gameState.player;
  
  // Third-person camera following aircraft
  const targetPosition = new THREE.Vector3();
  const cameraOffset = gameState.cameraOffset.clone();
  
  // Rotate offset by aircraft rotation
  cameraOffset.applyQuaternion(aircraft.mesh.quaternion);
  
  // Calculate camera position
  targetPosition.copy(aircraft.mesh.position).add(cameraOffset);
  
  // Smooth camera movement
  gameState.camera.position.lerp(targetPosition, 0.1);
  
  // Look at aircraft position (slightly ahead)
  const lookAtPos = aircraft.mesh.position.clone();
  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(aircraft.mesh.quaternion);
  lookAtPos.add(forward.multiplyScalar(2));
  
  gameState.camera.lookAt(lookAtPos);
}