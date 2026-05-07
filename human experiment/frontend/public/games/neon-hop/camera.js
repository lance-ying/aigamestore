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

    // Steady Camera Logic
    // We only follow the player's Z position.
    // X and Y are fixed relative to the world origin (X=0) or a fixed height offset.
    // This prevents the camera from bouncing up/down or swaying left/right.
    
    const targetZ = player.position.z + gameState.cameraOffset.z;
    const targetX = gameState.cameraOffset.x; // Fixed X (0)
    const targetY = gameState.cameraOffset.y; // Fixed Y (absolute height)
    
    // Smooth lerp for Z to follow player speed changes smoothly
    gameState.camera.position.z += (targetZ - gameState.camera.position.z) * 5 * dt;
    
    // Lerp X/Y to fixed positions (handles initial transition or resets)
    gameState.camera.position.x += (targetX - gameState.camera.position.x) * 2 * dt;
    gameState.camera.position.y += (targetY - gameState.camera.position.y) * 2 * dt;
    
    // Look ahead of player, but keep the look target steady in X/Y to avoid rotation wobble
    // Looking at the center of the lane (x=0) ahead of the player
    const lookTarget = new THREE.Vector3(0, 0, player.position.z + 20);
    gameState.camera.lookAt(lookTarget);
}