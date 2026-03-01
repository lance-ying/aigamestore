import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export class CameraController {
    constructor() {
        this.offset = new THREE.Vector3(0, 6, 10);
        this.lookAtOffset = new THREE.Vector3(0, 1, 0);
        this.smoothing = 0.1;
        this.currentPos = new THREE.Vector3();
    }

    setup() {
        gameState.camera = new THREE.PerspectiveCamera(60, 600 / 400, 0.1, 1000);
        gameState.camera.position.set(0, 10, 20);
        this.currentPos.copy(gameState.camera.position);
    }

    update() {
        if (!gameState.player || !gameState.player.mesh) return;

        const targetPos = gameState.player.mesh.position.clone().add(this.offset);
        
        // Smooth follow
        this.currentPos.lerp(targetPos, this.smoothing);
        gameState.camera.position.copy(this.currentPos);
        
        const targetLookAt = gameState.player.mesh.position.clone().add(this.lookAtOffset);
        gameState.camera.lookAt(targetLookAt);
    }
}

export const cameraSystem = new CameraController();