import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const aspect = 600 / 400;
    // Orthographic camera works well for "pixel art" style, but perspective is asked for 3D.
    // Let's use Perspective with a narrow FOV to flatten it slightly if desired, or standard.
    // Standard Perspective
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);
    gameState.camera = camera;
}

export function updateCamera(deltaTime) {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.position;
    
    // Target position: Follow player X, dampen Y
    const targetX = playerPos.x + 5; // Look ahead slightly
    const targetY = Math.max(0, playerPos.y + 2); // Don't go below ground too much
    
    const currentPos = gameState.camera.position;
    
    // Smooth Lerp
    currentPos.x += (targetX - currentPos.x) * 5 * deltaTime;
    currentPos.y += (targetY - currentPos.y) * 2 * deltaTime;
    
    // Keep Z constant
    currentPos.z = 20;
    
    // Look target
    const lookTarget = new THREE.Vector3(playerPos.x + 2, playerPos.y, 0);
    
    // Smooth lookat is tricky with Object3D.lookAt every frame, 
    // but with camera moving smoothly, lookAt target needs to be smooth too.
    // We can just look slightly ahead of the camera position's X projection
    gameState.camera.lookAt(currentPos.x, currentPos.y - 2, 0);
}