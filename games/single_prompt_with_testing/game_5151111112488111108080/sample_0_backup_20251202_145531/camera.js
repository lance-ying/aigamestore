import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { lerp, randomRange } from './utils.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(
        60, // FOV
        gameState.renderer.domElement.width / gameState.renderer.domElement.height,
        0.1,
        1000
    );
    
    // Initial Position
    gameState.camera.position.set(0, 8, 10);
    gameState.camera.lookAt(0, 0, -5);
}

export function updateCamera() {
    if (!gameState.player) return;

    const playerPos = gameState.player.mesh.position;
    
    // Target position based on offset
    const targetX = playerPos.x * 0.3; // Slight lag on X to feel speed
    const targetY = playerPos.y + gameState.cameraOffset.y;
    const targetZ = playerPos.z + gameState.cameraOffset.z;
    
    // Smooth follow
    // Z axis (Forward) needs to be stiffer
    gameState.camera.position.z = lerp(gameState.camera.position.z, targetZ, 0.1);
    
    // Y axis (Height) smooth to avoid motion sickness from bouncing
    // We target a Y that averages the player's bounce height essentially
    // Or just fix Y relative to a base plane if we want ultra stability
    // Let's smooth it significantly
    gameState.camera.position.y = lerp(gameState.camera.position.y, targetY, 0.05);
    
    // X axis (Lateral) smooth follow
    gameState.camera.position.x = lerp(gameState.camera.position.x, targetX, 0.08);

    // Look ahead of the player
    const lookTarget = new THREE.Vector3(
        playerPos.x * 0.1,
        playerPos.y * 0.2, // Look slightly up/down with player
        playerPos.z - 10
    );
    
    // Apply Shake
    if (gameState.cameraShake > 0) {
        const shakeIntensity = gameState.cameraShake;
        gameState.camera.position.x += randomRange(-shakeIntensity, shakeIntensity);
        gameState.camera.position.y += randomRange(-shakeIntensity, shakeIntensity);
        gameState.camera.position.z += randomRange(-shakeIntensity, shakeIntensity);
        
        gameState.cameraShake = Math.max(0, gameState.cameraShake - 0.02);
    }
    
    gameState.camera.lookAt(lookTarget);
}

export function triggerCameraShake(intensity) {
    gameState.cameraShake = intensity;
}