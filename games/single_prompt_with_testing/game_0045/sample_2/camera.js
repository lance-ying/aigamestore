// camera.js - Camera setup and control
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Setup camera
export function setupCamera() {
  gameState.camera = new THREE.PerspectiveCamera(
    75, // FOV
    CANVAS_WIDTH / CANVAS_HEIGHT, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
  );
  
  gameState.camera.position.set(0, 5, 10);
  gameState.camera.lookAt(0, 0, 0);
}

// Update camera based on mode
export function updateCamera() {
  // In first-person mode, camera is updated by player
  // Additional camera effects can be added here
  
  // Camera shake effect could be added here
  if (gameState.cameraShake && gameState.cameraShake.duration > 0) {
    applyCameraShake();
  }
}

// Apply camera shake effect
export function applyCameraShake() {
  if (!gameState.cameraShake) return;
  
  const shake = gameState.cameraShake;
  if (shake.duration > 0) {
    const shakeX = (Math.random() - 0.5) * shake.intensity;
    const shakeY = (Math.random() - 0.5) * shake.intensity;
    const shakeZ = (Math.random() - 0.5) * shake.intensity;
    
    gameState.camera.position.add(new THREE.Vector3(shakeX, shakeY, shakeZ));
    
    shake.duration -= gameState.deltaTime;
    shake.intensity *= 0.9;
  }
}

// Trigger camera shake
export function triggerCameraShake(intensity, duration) {
  gameState.cameraShake = { intensity, duration };
}