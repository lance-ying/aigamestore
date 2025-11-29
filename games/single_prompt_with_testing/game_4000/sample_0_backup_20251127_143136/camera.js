// camera.js - Camera setup and control
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        CANVAS_WIDTH / CANVAS_HEIGHT,
        0.1,
        1000
    );
    
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    
    gameState.camera = camera;
    return camera;
}

export function updateCamera() {
    if (!gameState.player || !gameState.camera) return;
    
    const player = gameState.player;
    const camera = gameState.camera;
    
    // Third-person camera with smooth following
    const targetPosition = new THREE.Vector3();
    
    // Calculate camera position based on yaw and pitch
    const yaw = gameState.cameraRotation.yaw;
    const pitch = gameState.cameraRotation.pitch;
    
    const distance = 8;
    const offsetX = Math.sin(yaw) * Math.cos(pitch) * distance;
    const offsetY = Math.sin(pitch) * distance + 3;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * distance;
    
    targetPosition.set(
        player.mesh.position.x + offsetX,
        player.mesh.position.y + offsetY,
        player.mesh.position.z + offsetZ
    );
    
    // Smooth camera movement
    camera.position.lerp(targetPosition, 0.1);
    
    // Look at player with slight offset
    const lookAtTarget = new THREE.Vector3(
        player.mesh.position.x,
        player.mesh.position.y + 1,
        player.mesh.position.z
    );
    camera.lookAt(lookAtTarget);
}

export function getCameraDirection() {
    if (!gameState.camera) return new THREE.Vector3(0, 0, -1);
    
    const direction = new THREE.Vector3();
    gameState.camera.getWorldDirection(direction);
    return direction;
}

export function getCameraRightVector() {
    if (!gameState.camera) return new THREE.Vector3(1, 0, 0);
    
    const direction = getCameraDirection();
    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
}