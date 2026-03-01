import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(60, gameState.renderer.domElement.width / gameState.renderer.domElement.height, 0.1, 1000);
    gameState.camera.position.set(0, 10, 20);
}

export function updateCamera() {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.mesh.position;
    
    // Target position: Behind and above player
    // In a full game, we'd rotate based on mouse/right-stick.
    // Here, we keep a fixed offset relative to world, but smooth it.
    // Or follow behind player velocity? Fixed angle is safer for platforming without mouse.
    
    const desiredPos = playerPos.clone().add(gameState.cameraOffset);
    
    // Smooth damp
    gameState.camera.position.lerp(desiredPos, 0.1);
    
    // Look slightly ahead of player
    const lookTarget = playerPos.clone().add(new THREE.Vector3(0, 1, -5)); // Look forward
    gameState.camera.lookAt(playerPos.clone().add(new THREE.Vector3(0, 1, 0))); // Look at player center
}

export function updateCameraShake(intensity) {
    // Optional shake effect
    const offset = new THREE.Vector3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
    );
    gameState.camera.position.add(offset);
}