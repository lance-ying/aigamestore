import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export class CameraController {
    constructor() {
        this.offset = new THREE.Vector3(0, 15, 12); // High angle view
        this.lookAtTarget = new THREE.Vector3();
        this.smoothSpeed = 0.1;
    }

    setup() {
        gameState.camera.position.copy(this.offset);
        gameState.camera.lookAt(0, 0, 0);
    }

    update() {
        if (!gameState.player) return;

        // Follow player position x/z, but stay somewhat fixed
        // In "Tenkyu", camera follows the ball as it moves through the level
        
        const playerPos = gameState.player.position;
        
        // Calculate target position
        const targetPos = playerPos.clone().add(this.offset);
        
        // Smoothly interpolate camera position
        gameState.camera.position.lerp(targetPos, this.smoothSpeed);
        
        // Look at player
        // Smooth lookAt point
        this.lookAtTarget.lerp(playerPos, this.smoothSpeed);
        gameState.camera.lookAt(this.lookAtTarget);
    }
}