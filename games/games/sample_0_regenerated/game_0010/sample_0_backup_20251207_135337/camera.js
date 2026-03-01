import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const aspect = gameState.gameContainer ? 
                   gameState.gameContainer.clientWidth / gameState.gameContainer.clientHeight : 
                   600/400;
                   
    gameState.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    gameState.camera.position.set(0, 10, 15);
}

export function updateCamera(dt) {
    if (!gameState.player) return;

    // Target position (Player's head/shoulder area)
    const target = gameState.player.cameraTarget.getWorldPosition(new THREE.Vector3());
    
    // Ideal camera position (Behind and above)
    // We calculate offset based on player rotation if we want "lock behind", 
    // but for simple 3rd person action, a fixed offset relative to player orientation is good.
    // Let's implement a soft follow.
    
    const offset = new THREE.Vector3(0, 6, 10);
    
    // Simple logic: Camera looks at player, positions offset from player
    // For a better feel, the camera should lag slightly
    
    const idealPos = target.clone().add(offset);
    
    // Smooth lerp
    gameState.camera.position.lerp(idealPos, 5 * dt);
    gameState.camera.lookAt(target);
    
    // Screen shake
    if (gameState.player.state === "HIT") {
        gameState.camera.position.x += (Math.random() - 0.5) * 0.5;
        gameState.camera.position.y += (Math.random() - 0.5) * 0.5;
    }
}