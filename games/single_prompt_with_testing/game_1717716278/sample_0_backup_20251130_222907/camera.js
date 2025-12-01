/**
 * Camera logic for scrolling
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera() {
    if (!gameState.player) return;

    // Target position: Player is at 1/4 of the screen width
    const targetX = gameState.player.body.position.x - gameState.cameraOffset.x;
    
    // Smooth lerp for X
    gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
    
    // Y Axis logic: Keep player vertically visible but don't follow small bumps too jittery
    // Calculate desired Y to keep player somewhat centered but bias towards seeing the ground
    // Default Y is 0 (top of screen). If player goes high (negative Y), camera moves up (negative Y)
    let targetY = 0;
    const playerY = gameState.player.body.position.y;
    
    if (playerY < 100) {
        // Player is flying high
        targetY = playerY - 200;
    } else if (playerY > CANVAS_HEIGHT - 100) {
        // Player is deep down (shouldn't happen much with terrain)
        targetY = playerY - (CANVAS_HEIGHT - 100);
    }
    
    // Clamp Y to not show below terrain too much
    // Assuming base terrain is around CANVAS_HEIGHT
    // We want cameraY to be roughly 0 most of the time
    
    gameState.cameraY += (targetY - gameState.cameraY) * 0.05;
}