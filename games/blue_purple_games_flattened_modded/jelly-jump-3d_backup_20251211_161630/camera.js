import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONFIG } from './globals.js';
import { lerp } from './utils.js';

export function setupCamera() {
    const aspect = 600 / 400;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 2, 0);
    gameState.camera = camera;
}

export function updateCamera() {
    if (!gameState.player || !gameState.camera) return;

    // Target position logic
    // Camera should follow player height, but not jitter with every jump.
    // It should track the highest platform or average climb.
    
    const targetY = Math.max(gameState.player.mesh.position.y + GAME_CONFIG.CAMERA_OFFSET_Y, 5);
    const targetX = 0; // Keep centered horizontally
    const targetZ = GAME_CONFIG.CAMERA_OFFSET_Z;

    // Smooth follow
    gameState.camera.position.x = lerp(gameState.camera.position.x, targetX, 0.05);
    gameState.camera.position.y = lerp(gameState.camera.position.y, targetY, 0.05);
    gameState.camera.position.z = lerp(gameState.camera.position.z, targetZ, 0.05);
    
    // Look ahead logic
    const lookTarget = new THREE.Vector3(
        0, 
        gameState.player.mesh.position.y + GAME_CONFIG.CAMERA_LOOK_Y_OFFSET, 
        0
    );
    
    // Smoothly interpolate lookAt target? 
    // Three.js lookAt is instantaneous. We can lerp the camera's quaternion, 
    // or just let the position smoothing handle the feel.
    // Let's stick to simple lookAt for now, it's robust.
    gameState.camera.lookAt(lookTarget);
}