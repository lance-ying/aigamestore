import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const aspect = 600 / 400;
    gameState.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
    gameState.camera.position.set(0, 5, 10);
}

export function updateCamera(dt) {
    if (!gameState.player) return;

    // Target position is behind and above the player
    const targetPos = gameState.player.mesh.position.clone().add(gameState.cameraOffset);
    
    // Smooth follow
    gameState.camera.position.lerp(targetPos, 5.0 * dt);
    
    // Look ahead of the player
    const lookTarget = gameState.player.mesh.position.clone();
    lookTarget.z -= 10; // Look 10 units ahead
    lookTarget.y = 0; // Look at ground level roughly
    
    gameState.camera.lookAt(lookTarget);
}

export function shakeCamera(amount) {
    // Simple instant shake offset
    gameState.camera.position.x += (Math.random() - 0.5) * amount;
    gameState.camera.position.y += (Math.random() - 0.5) * amount;
}