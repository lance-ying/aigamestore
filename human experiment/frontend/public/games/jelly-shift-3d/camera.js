import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { lerp } from './utils.js';

export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 1000);
    camera.position.set(0, 5, -8); // Behind and above
    camera.lookAt(0, 0, 10);
    gameState.camera = camera;
}

export function updateCamera(dt) {
    if (!gameState.player) return;
    
    const targetZ = gameState.player.mesh.position.z;
    const offsetZ = -10;
    const offsetY = 6;
    const offsetX = 5; // Slight angle for better depth perception
    
    const idealPos = new THREE.Vector3(offsetX, offsetY, targetZ + offsetZ);
    
    // Smooth follow
    gameState.camera.position.lerp(idealPos, 5.0 * dt);
    
    // Look ahead of player
    const lookTarget = new THREE.Vector3(0, 1, targetZ + 10);
    gameState.camera.lookAt(lookTarget);

    // Dynamic FOV based on speed, only when playing
    if (gameState.gamePhase === "PLAYING") {
        const baseFov = 60;
        const speedFactor = Math.max(0, gameState.speed - gameState.baseSpeed);
        const targetFov = baseFov + speedFactor * 1.5;
        
        gameState.camera.fov = lerp(gameState.camera.fov, targetFov, dt * 2.0);
        gameState.camera.updateProjectionMatrix();
    }
}