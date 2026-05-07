import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        60, // FOV
        600 / 400, // Aspect
        0.1, // Near
        1000 // Far
    );
    gameState.camera = camera;
    return camera;
}

export function updateCamera() {
    if (!gameState.player) return;
    
    const playerPos = gameState.player.mesh.position;
    
    // Camera follows player in Z
    // Camera is positioned "above" and "behind" the player relative to the tunnel rotation
    // In our implementation, the player stays visually at the top (0, r, z).
    // The world rotates.
    // So camera can just be fixed relative to player's Z.
    
    const offsetZ = -8;
    const offsetY = 5;
    const targetZ = playerPos.z + offsetZ;
    
    // Smooth follow Z
    if (!gameState.camera.position.z) gameState.camera.position.z = targetZ;
    gameState.camera.position.z = THREE.MathUtils.lerp(gameState.camera.position.z, targetZ, 0.1);
    
    // Fixed height relative to tunnel center
    gameState.camera.position.y = offsetY + 3; // +3 for tunnel radius offset approx
    gameState.camera.position.x = 0;
    
    // Look ahead of player
    const lookTarget = new THREE.Vector3(0, 2, playerPos.z + 10);
    gameState.camera.lookAt(lookTarget);
    
    // Add some dynamic shake if speed is high or landing
    // (Simplification: keep steady for now)
}