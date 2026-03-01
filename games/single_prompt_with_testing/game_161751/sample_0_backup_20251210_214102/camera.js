import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    // Isometric-ish view
    const aspect = gameState.gameContainer.offsetWidth / gameState.gameContainer.offsetHeight;
    const d = 25; // View size
    
    gameState.camera = new THREE.OrthographicCamera(
        -d * aspect, d * aspect, d, -d, 1, 1000
    );
    
    gameState.camera.position.set(20, 30, 20); // Iso angle
    gameState.camera.lookAt(gameState.scene.position);
    gameState.cameraOffset = new THREE.Vector3(20, 30, 20);
}

export function updateCamera() {
    if (!gameState.player) return;
    
    // Smooth follow
    const targetPos = gameState.player.mesh.position.clone().add(gameState.cameraOffset);
    gameState.camera.position.lerp(targetPos, 0.1);
    gameState.camera.lookAt(gameState.player.mesh.position);
}