import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { lerp } from './utils.js';

export function setupCamera() {
    const aspect = gameState.gameContainer.offsetWidth / gameState.gameContainer.offsetHeight;
    gameState.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
    gameState.camera.position.set(0, 5, 10);
    gameState.camera.lookAt(0, 0, -20);
}

export function updateCamera(deltaTime) {
    if (!gameState.player) return;

    // Camera follow target
    const targetZ = gameState.player.mesh.position.z + gameState.cameraOffset.z;
    const targetX = gameState.player.mesh.position.x * 0.5; // Dampen X movement
    const targetY = gameState.player.mesh.position.y + gameState.cameraOffset.y;

    // Smooth follow
    gameState.camera.position.z = targetZ; // Lock Z to player mostly
    gameState.camera.position.x = lerp(gameState.camera.position.x, targetX, 5.0 * deltaTime);
    gameState.camera.position.y = lerp(gameState.camera.position.y, targetY, 5.0 * deltaTime);

    // Look slightly ahead of player
    gameState.camera.lookAt(
        gameState.player.mesh.position.x * 0.2, 
        gameState.player.mesh.position.y, 
        gameState.player.mesh.position.z - 10
    );

    // Apply Shake
    if (gameState.cameraShake > 0) {
        const intensity = gameState.cameraShake;
        gameState.camera.position.add(new THREE.Vector3(
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity
        ));
        gameState.cameraShake = Math.max(0, gameState.cameraShake - deltaTime * 2.0);
    }
}

export function triggerCameraShake(amount) {
    gameState.cameraShake = amount;
}