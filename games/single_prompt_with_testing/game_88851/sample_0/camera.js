import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);
    gameState.camera = camera;
    return camera;
}

export function updateCamera() {
    const player = gameState.player;
    if (!player) return;
    
    // FPS Camera Position
    const eyeHeight = 1.6;
    const targetPos = player.mesh.position.clone();
    targetPos.y += eyeHeight;
    
    // If player is dead or game over, orbit or stay
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        // Orbit effect
        const time = Date.now() * 0.001;
        gameState.camera.position.x = player.mesh.position.x + Math.sin(time) * 10;
        gameState.camera.position.z = player.mesh.position.z + Math.cos(time) * 10;
        gameState.camera.position.y = 5;
        gameState.camera.lookAt(player.mesh.position);
    } else {
        // Strict FPS
        gameState.camera.position.copy(targetPos);
        
        // Rotation handled by player input directly updating camera quaternion/euler
        // Sync player visual mesh rotation to camera yaw (Y axis) only
        player.lookEuler.y = gameState.camera.rotation.y;
        
        // We set camera rotation from input in game.js, here we just ensure sync if needed
    }
}