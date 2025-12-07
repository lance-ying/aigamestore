import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const aspect = gameState.gameContainer.offsetWidth / gameState.gameContainer.offsetHeight;
    gameState.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    // Initial position
    gameState.camera.position.set(0, 5, 10);
}

export function updateCamera(dt) {
    if (!gameState.player) return;
    
    // Desired position: Behind player, elevated
    // We need to calculate "Behind" based on player's DIRECTION, not just Z axis
    // Because player turns 90 degrees.
    
    const pPos = gameState.player.mesh.position;
    const pDir = gameState.player.direction; // Normalized
    
    // Offset: -Dir * Distance + Up * Height
    const dist = 8;
    const height = 5;
    
    const targetPos = pPos.clone()
        .sub(pDir.clone().multiplyScalar(dist))
        .add(new THREE.Vector3(0, height, 0));
        
    // Look target
    const lookTarget = pPos.clone().add(pDir.clone().multiplyScalar(5));
    
    // Smooth Lerp
    const t = 5.0 * dt;
    gameState.camera.position.lerp(targetPos, t);
    
    // Smooth LookAt is harder with lerp, so we just lookAt for now or use quaternion slerp
    // Simple lookAt is usually fine for T-Run style if position is smoothed
    gameState.camera.lookAt(lookTarget);
}