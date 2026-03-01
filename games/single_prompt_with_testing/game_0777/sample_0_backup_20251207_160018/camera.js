import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function updateCamera(dt) {
    if (!gameState.player || !gameState.camera) return;
    
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "GAME_OVER_WIN") {
        const target = gameState.player.mesh;
        
        // Desired position relative to car
        // Behind and above
        const relativeOffset = new THREE.Vector3(0, 5, -10);
        
        // Transform offset to world space based on player rotation
        const cameraOffset = relativeOffset.applyMatrix4(target.matrixWorld);
        
        // Smooth follow
        gameState.camera.position.lerp(cameraOffset, 5 * dt);
        
        // Look at player + a bit forward
        const lookTarget = target.position.clone().add(new THREE.Vector3(0, 2, 0));
        gameState.camera.lookAt(lookTarget);
    } else if (gameState.gamePhase === "START") {
        // Orbit camera around track center or player
        const t = gameState.elapsedTime * 0.2;
        gameState.camera.position.set(
            Math.cos(t) * 40,
            20,
            Math.sin(t) * 40
        );
        gameState.camera.lookAt(0, 0, 0);
    }
}