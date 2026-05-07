import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './globals.js';

export function updateCamera() {
    if (!gameState.player) return;

    // Target X is player's X minus offset (so player is on left side)
    const targetX = gameState.player.body.position.x - CANVAS_WIDTH * 0.3;
    
    // Smooth lerp
    gameState.camera.x += (targetX - gameState.camera.x) * 0.1;

    // Y following? Maybe partial
    // Keep camera mostly centered on Y, but follow player if they go too high/low
    const targetY = gameState.player.body.position.y - CANVAS_HEIGHT * 0.5;
    // Constrain Y to not show below ground
    // Ground is at CANVAS_HEIGHT - 50.
    // If we want ground always visible at bottom:
    // Camera Bottom = camera.y + CANVAS_HEIGHT. 
    // We want Camera Bottom <= Ground Y + buffer.
    
    // Let's just do a soft follow on Y
    const desiredY = targetY;
    
    // Clamp camera Y so we don't look too far below ground
    // Ground is at CANVAS_HEIGHT (approx). 
    // If camera.y is 0, we see 0 to 400.
    // We want to limit camera.y so we don't see black void below ground.
    const maxY = 100; // Allow looking down a bit
    const minY = -1000; // Allow looking up high
    
    gameState.camera.y += (desiredY - gameState.camera.y) * 0.05;
    
    // Hard clamp logic can be added if needed
}

export function applyCamera(p) {
    p.translate(-gameState.camera.x, -gameState.camera.y);
}