import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { lerp } from './utils.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, 600/400, 0.1, 1000);
    gameState.camera.position.set(0, 5, 10);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
    const player = gameState.player;
    if (!player) return;
    
    // Target position behind player
    // We add velocity to the offset to look ahead/behind based on movement
    const velocityLag = player.velocity.clone().multiplyScalar(-5);
    velocityLag.y = 0; // Don't lag vertically too much
    
    const desiredPosition = player.position.clone()
        .add(gameState.cameraOffset)
        .add(velocityLag);
        
    // Clamp Y to not go below ground too much
    desiredPosition.y = Math.max(desiredPosition.y, player.position.y + 2);
    
    // Smooth lerp
    gameState.camera.position.lerp(desiredPosition, 0.1);
    
    // Look at player
    // Add slight offset to look ahead of player
    const lookTarget = player.position.clone().add(player.velocity.clone().multiplyScalar(10));
    const currentLook = new THREE.Vector3();
    gameState.camera.getWorldDirection(currentLook);
    
    // Approximate lookAt smoothing
    const tempCam = gameState.camera.clone();
    tempCam.lookAt(player.position);
    gameState.camera.quaternion.slerp(tempCam.quaternion, 0.1);
}