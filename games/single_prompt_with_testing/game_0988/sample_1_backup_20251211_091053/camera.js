import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, DIRECTION, TURN_SPEED } from './globals.js';

export function setupCamera() {
    const aspect = 600 / 400;
    // Isometric-ish orthographic camera fits the Twist style well
    const d = 12;
    gameState.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    
    // Initial position
    gameState.camera.position.set(20, 20, 20);
    gameState.camera.lookAt(0, 0, 0);
    
    // Store offsets relative to rotation
    // We want the camera to look from a corner
    gameState.cameraOffset.set(-10, 10, -10); // From behind-ish
}

export function updateCamera() {
    if (!gameState.player) return;
    
    // Target is the player
    const target = gameState.player.mesh.position;
    
    // Determine desired offset based on player direction
    // We want the view to rotate so the player always moves roughly "UP" or "Forward-Right" on screen
    // Isometric view: Forward (-Z) is usually Top-Left or Top-Right
    
    // Let's implement a smooth following camera that rotates 90 degrees when player turns
    // Desired Camera Angle:
    // If Moving North (-Z): Cam at (+X, +Y, +Z) looking at (0,0,0) -> Looking Back-Left
    // Let's try to keep the player moving "Away" from camera
    
    let desiredOffset = new THREE.Vector3();
    const dist = 10;
    const height = 10;
    
    switch(gameState.player.direction) {
        case DIRECTION.NORTH: // Moving -Z
            desiredOffset.set(dist, height, dist); // Camera at back-right
            break;
        case DIRECTION.EAST: // Moving +X
            desiredOffset.set(-dist, height, dist);
            break;
        case DIRECTION.SOUTH: // Moving +Z
            desiredOffset.set(-dist, height, -dist);
            break;
        case DIRECTION.WEST: // Moving -X
            desiredOffset.set(dist, height, -dist);
            break;
    }
    
    // Smoothly interpolate current offset to desired offset
    // We interpolate the VECTOR of the offset, then add to player pos
    
    // We store the current smooth offset in a variable to avoid jitter
    if (!gameState.currentCameraOffset) {
        gameState.currentCameraOffset = desiredOffset.clone();
    }
    
    gameState.currentCameraOffset.lerp(desiredOffset, 0.05);
    
    const camPos = target.clone().add(gameState.currentCameraOffset);
    gameState.camera.position.lerp(camPos, 0.1);
    gameState.camera.lookAt(target);
    
    // Optional: Add slight camera shake on landing?
}