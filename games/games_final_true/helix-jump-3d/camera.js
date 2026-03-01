import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONSTANTS } from './globals.js';

export function setupCamera() {
    const aspect = 600 / 400;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.copy(CONSTANTS.CAMERA_OFFSET);
    camera.lookAt(0, 0, 0);
    gameState.camera = camera;
    return camera;
}

export function updateCamera(dt) {
    if (!gameState.camera) return;
    
    // Target Y is the ball's Y, but smoothed and clamped
    // We don't want the camera to jitter on every bounce.
    // It should follow the downward trend.
    
    let targetY = 0;
    if (gameState.ball) {
        targetY = gameState.ball.mesh.position.y;
    }
    
    // Only move down, don't move up if ball bounces high (Helix Jump style)
    if (targetY < gameState.cameraTargetY) {
        gameState.cameraTargetY = targetY;
    }
    
    // Smooth lerp
    const currentY = gameState.camera.position.y - CONSTANTS.CAMERA_OFFSET.y;
    const nextY = THREE.MathUtils.lerp(currentY, gameState.cameraTargetY, 2.0 * dt);
    
    gameState.camera.position.y = nextY + CONSTANTS.CAMERA_OFFSET.y;
    gameState.camera.lookAt(0, nextY, 0);
    
    // Update lighting position to follow camera/player
    if (gameState.directionalLight) {
        gameState.directionalLight.position.y = gameState.camera.position.y + 10;
        gameState.directionalLight.target.position.y = gameState.camera.position.y;
        gameState.directionalLight.target.updateMatrixWorld();
    }
}