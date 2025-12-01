import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupCamera() {
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    gameState.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    gameState.camera.position.set(0, 5, 15);
}

export function updateCamera() {
    if (!gameState.player) return;

    // Target position: Follow player X, keep Y relatively stable but responsive
    const targetX = gameState.player.mesh.position.x + 5; // Look ahead
    const targetY = Math.max(0, gameState.player.mesh.position.y); // Don't go below ground
    
    // Desired camera position
    const desiredPos = new THREE.Vector3(
        gameState.player.mesh.position.x + gameState.cameraOffset.x,
        gameState.player.mesh.position.y + gameState.cameraOffset.y,
        gameState.player.mesh.position.z + gameState.cameraOffset.z
    );

    // Smoothly interpolate camera position
    gameState.camera.position.lerp(desiredPos, 0.05);

    // Look at player (with offset)
    const lookTarget = new THREE.Vector3(
        gameState.player.mesh.position.x + 2, // Look slightly ahead
        gameState.player.mesh.position.y,
        0
    );
    gameState.camera.lookAt(lookTarget);
}