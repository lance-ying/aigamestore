import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 500);
    gameState.cameraOffset = new THREE.Vector3(0, 5, -8); // Behind and up
}

export function updateCamera(dt) {
    if (!gameState.player) return;
    
    const car = gameState.player.mesh;
    const speed = gameState.player.speed || 0;
    
    // Calculate desired position based on car rotation
    // We want the camera to be behind the car
    const relativeOffset = gameState.cameraOffset.clone();
    
    // Add dynamic pull-back based on speed
    const speedFactor = Math.abs(speed) / 20.0;
    relativeOffset.z -= speedFactor * 2.0; // Move further back
    relativeOffset.y += speedFactor * 1.0; // Move slightly up
    
    // Rotate offset to match car direction (smoothly)
    // We actually want the camera to trail, so we use a lerped rotation or position
    
    // Simple Chase Camera:
    // Target position is behind the car relative to its heading
    const carRotation = car.rotation.y;
    const backDir = new THREE.Vector3(Math.sin(carRotation), 0, Math.cos(carRotation)).negate();
    const upDir = new THREE.Vector3(0, 1, 0);
    
    // Ideal camera position: Car Pos + (Back * distance) + (Up * height)
    const distance = 8 + speedFactor * 5;
    const height = 4 + speedFactor * 2;
    
    const idealPos = car.position.clone()
        .add(backDir.multiplyScalar(distance))
        .add(upDir.multiplyScalar(height));
        
    // Look at target: Slightly ahead of the car
    const lookTarget = car.position.clone().add(new THREE.Vector3(0, 1, 0));
    
    // Smooth update
    gameState.camera.position.lerp(idealPos, 5.0 * dt);
    gameState.camera.lookAt(lookTarget);
}