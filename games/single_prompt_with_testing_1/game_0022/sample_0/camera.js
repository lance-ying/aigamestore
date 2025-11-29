// camera.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function setupCamera() {
    gameState.camera = new THREE.PerspectiveCamera(
        60,
        CANVAS_WIDTH / CANVAS_HEIGHT,
        0.1,
        1000
    );
    
    gameState.camera.position.set(0, 15, 20);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    const offsetDistance = 15;
    const offsetHeight = 10;
    
    // Position camera behind and above player
    const targetX = player.mesh.position.x - Math.sin(player.angle) * offsetDistance;
    const targetZ = player.mesh.position.z - Math.cos(player.angle) * offsetDistance;
    const targetY = player.mesh.position.y + offsetHeight;
    
    // Smooth camera follow
    gameState.camera.position.lerp(
        new THREE.Vector3(targetX, targetY, targetZ),
        0.1
    );
    
    // Look at player
    gameState.camera.lookAt(player.mesh.position);
}