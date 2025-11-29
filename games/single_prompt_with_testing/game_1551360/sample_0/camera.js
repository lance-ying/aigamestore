// camera.js - Camera setup and control
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    500
  );
  
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);
  
  gameState.camera = camera;
  gameState.cameraTarget = new THREE.Vector3(0, 0, 0);
  
  return camera;
}

export function updateCamera() {
  if (!gameState.player || !gameState.camera) return;
  
  const player = gameState.player;
  const camera = gameState.camera;
  
  // Calculate target position based on vehicle direction
  const vehicleDirection = new THREE.Vector3(0, 0, -1);
  vehicleDirection.applyQuaternion(player.mesh.quaternion);
  
  // Calculate camera offset based on vehicle speed and direction
  const speedFactor = Math.min(player.currentSpeed / player.maxSpeed, 1);
  const dynamicOffset = gameState.cameraOffset.clone();
  dynamicOffset.z += speedFactor * 3; // Pull back more at high speed
  dynamicOffset.y += speedFactor * 1; // Raise camera slightly at high speed
  
  // Transform offset by vehicle rotation
  const rotatedOffset = dynamicOffset.clone();
  rotatedOffset.applyQuaternion(player.mesh.quaternion);
  
  // Calculate target camera position
  const targetPosition = player.mesh.position.clone().add(rotatedOffset);
  
  // Smooth camera movement
  camera.position.lerp(targetPosition, 0.1);
  
  // Calculate look-at point (ahead of vehicle)
  const lookOffset = gameState.cameraLookOffset.clone();
  lookOffset.applyQuaternion(player.mesh.quaternion);
  const lookAtPoint = player.mesh.position.clone().add(lookOffset);
  
  // Smooth camera look-at
  gameState.cameraTarget.lerp(lookAtPoint, 0.15);
  camera.lookAt(gameState.cameraTarget);
}