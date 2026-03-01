import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 500);
    gameState.camera.position.copy(gameState.cameraOffset);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera(dt) {
    if (!gameState.player) return;

    const playerPos = gameState.player.mesh.position;
    
    // Desired position based on offset relative to player
    // For a simple platformer cam, we keep fixed offset but follow smoothed position
    
    const idealPos = new THREE.Vector3(
        playerPos.x + gameState.cameraOffset.x,
        playerPos.y + gameState.cameraOffset.y,
        playerPos.z + gameState.cameraOffset.z
    );

    // Smoothly interpolate camera position
    // Lerp factor
    const alpha = 5.0 * dt;
    gameState.camera.position.lerp(idealPos, alpha);

    // Look at target (slightly above player to see ahead)
    const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 2, 0));
    
    // Smooth lookAt is harder with the built-in function, so we just set it
    // Or we can interpolate the target vector
    if (!gameState.cameraTarget) gameState.cameraTarget = lookTarget;
    gameState.cameraTarget.lerp(lookTarget, alpha * 2);
    
    gameState.camera.lookAt(gameState.cameraTarget);
}