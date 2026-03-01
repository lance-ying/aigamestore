import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, 600/400, 0.1, 200);
    gameState.camera.position.set(0, 5, 8);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
    if (!gameState.player) return;

    const pPos = gameState.player.mesh.position;
    
    // Target position: Behind and above player
    const targetX = pPos.x * 0.5; // Mild horizontal follow
    const targetY = pPos.y + 4.0;
    const targetZ = pPos.z + 7.0;

    // Smooth lerp
    gameState.camera.position.x += (targetX - gameState.camera.position.x) * 0.1;
    gameState.camera.position.y += (targetY - gameState.camera.position.y) * 0.1;
    gameState.camera.position.z += (targetZ - gameState.camera.position.z) * 0.15; // Faster Z tracking

    gameState.camera.lookAt(
        pPos.x * 0.3, 
        pPos.y + 1.0, 
        pPos.z - 5.0
    );
}