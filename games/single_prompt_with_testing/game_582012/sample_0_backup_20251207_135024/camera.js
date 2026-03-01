import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(
        60, // FOV
        600 / 400, // Aspect
        0.1, // Near
        1000 // Far
    );
    gameState.camera.position.copy(gameState.cameraOffset);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera(deltaTime) {
    if (!gameState.player) return;

    // Target position (Player position)
    const targetPos = gameState.player.mesh.position.clone();
    
    // Desired camera position based on offset
    // In a full game, we might rotate offset based on mouse, but here fixed angle is fine for keyboard only
    const desiredPos = targetPos.clone().add(gameState.cameraOffset);

    // Smoothly interpolate current camera position to desired position
    const smoothFactor = 5.0 * deltaTime;
    gameState.camera.position.lerp(desiredPos, smoothFactor);

    // Smoothly update look target
    gameState.cameraTarget.lerp(targetPos, smoothFactor);
    gameState.camera.lookAt(gameState.cameraTarget);
}

export function applyCameraShake(intensity) {
    const shake = new THREE.Vector3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
    );
    gameState.camera.position.add(shake);
}