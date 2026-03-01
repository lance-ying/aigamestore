import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const aspect = gameState.gameContainer.offsetWidth / gameState.gameContainer.offsetHeight; // Should be 600/400 = 1.5
    gameState.camera = new THREE.PerspectiveCamera(60, 1.5, 0.1, 1000);
    gameState.camera.position.set(0, 5, -10);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera(dt) {
    if (!gameState.player) return;

    // Follow player with offset
    const targetZ = gameState.player.position.z - 8;
    const targetY = gameState.player.position.y + 5;
    const targetX = 0; // Keep centered horizontally usually, or slightly follow player X

    // Smooth lerp
    gameState.camera.position.z += (targetZ - gameState.camera.position.z) * 5 * dt;
    gameState.camera.position.y += (targetY - gameState.camera.position.y) * 5 * dt;
    
    // Look at player slightly ahead
    const lookTarget = gameState.player.position.clone().add(new THREE.Vector3(0, 0, 10));
    gameState.camera.lookAt(lookTarget);
}