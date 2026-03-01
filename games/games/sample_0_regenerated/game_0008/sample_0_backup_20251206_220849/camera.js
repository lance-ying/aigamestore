/**
 * Camera controller
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    // 60 degrees FOV, Aspect ratio handled in setup
    gameState.camera = new THREE.PerspectiveCamera(60, gameState.renderer.domElement.width / gameState.renderer.domElement.height, 0.1, 500);
    gameState.camera.position.set(0, 10, -10);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera(dt) {
    const player = gameState.player;
    if (!player) return;

    // Desired position based on player
    // We want the camera to follow the player's Z, but stay behind
    // X should follow slightly but damped to prevent motion sickness
    
    const targetZ = player.position.z + gameState.cameraOffset.z;
    const targetX = player.position.x * 0.5 + gameState.cameraOffset.x; // Lag X
    const targetY = player.position.y + gameState.cameraOffset.y; // Follow bounce slightly? Better fixed relative Y
    
    // Smooth lerp
    gameState.camera.position.z += (targetZ - gameState.camera.position.z) * 5 * dt;
    gameState.camera.position.x += (targetX - gameState.camera.position.x) * 2 * dt;
    gameState.camera.position.y += (targetY - gameState.camera.position.y) * 2 * dt;
    
    // Look ahead of player
    const lookTarget = player.position.clone().add(new THREE.Vector3(0, 0, 10));
    gameState.camera.lookAt(lookTarget);
}