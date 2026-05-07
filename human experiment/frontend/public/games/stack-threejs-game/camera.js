import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, BLOCK_HEIGHT } from './globals.js';

export function setupCamera() {
    // Orthographic camera for isometric view
    const aspect = 600 / 400;
    const d = 10;
    
    gameState.camera = new THREE.OrthographicCamera(
        -d * aspect, d * aspect, 
        d, -d, 
        1, 1000
    );
    
    // Isometric position
    gameState.camera.position.set(20, 20, 20);
    gameState.camera.lookAt(0, 0, 0);
}

export function updateCamera() {
    if (gameState.gamePhase !== "PLAYING" && gameState.gamePhase !== "GAME_OVER_LOSE") return;

    // Smoothly follow the stack height
    // We want the camera to rise as blocks are stacked
    
    // Calculate desired Y position based on stack height
    // Base Y is 20. For each block, we want to go up 1 unit.
    const targetY = 20 + (gameState.stack.length * BLOCK_HEIGHT);
    
    // Smooth lerp
    const lerpFactor = 0.05;
    if (Math.abs(gameState.camera.position.y - targetY) > 0.01) {
        gameState.camera.position.y += (targetY - gameState.camera.position.y) * lerpFactor;
        
        // Maintain isometric angle means adjusting X and Z as well if we were orbiting,
        // but for a simple "rise", we just need to move the camera UP.
        // However, for an isometric camera looking at (0, y, 0), we need to shift the camera position
        // AND the lookAt target.
        
        // Actually, easiest way for orthographic "scroll" is to just move the camera Y 
        // and keep looking at the new center Y.
        
        // Target focus point
        const currentLookAtY = (gameState.stack.length - 2) * BLOCK_HEIGHT; 
        // We look slightly below the top
        
        // Current camera height relative to focus
        // We want to maintain relative offset (20, 20, 20) -> looking at (0, 0, 0)
        // New pos -> (20, 20 + offset, 20) -> looking at (0, offset, 0)
        
        const offset = Math.max(0, (gameState.stack.length - 3) * BLOCK_HEIGHT);
        
        const targetCamY = 20 + offset;
        const targetCamX = 20;
        const targetCamZ = 20;
        
        gameState.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.1);
        
        // IMPORTANT: Orthographic camera doesn't need to change rotation if we move it parallel
        // But we usually want to keep the "top" block in the center.
        // So we look at (0, offset, 0).
        // BUT, simply moving position is enough if rotation is fixed? 
        // No, lookAt updates rotation.
        // Let's manually manage position and lookAt.
        
        // Actually, just maintain the offset vector.
        // If initial is (20, 20, 20) looking at (0, 0, 0).
        // New is (20, 20+H, 20) looking at (0, H, 0).
        // This is pure translation.
    }
}