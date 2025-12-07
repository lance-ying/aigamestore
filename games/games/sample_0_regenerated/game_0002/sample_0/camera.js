import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 500);
    gameState.camera.position.set(0, 5, 8);
    gameState.camera.lookAt(0, 0, -10);
}

export function updateCamera() {
    if (!gameState.player) return;

    // Camera follows player
    const targetPos = new THREE.Vector3(
        gameState.player.mesh.position.x * 0.7, // Slight horizontal follow
        gameState.player.mesh.position.y + 4,
        gameState.player.mesh.position.z + 8
    );
    
    // Smooth Lerp
    gameState.camera.position.lerp(targetPos, 0.1);
    
    // Look ahead of player
    const lookTarget = new THREE.Vector3(
        0,
        0, // Look slightly down/straight
        gameState.player.mesh.position.z - 10
    );
    gameState.camera.lookAt(lookTarget);
}