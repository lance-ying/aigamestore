/**
 * ui.js
 * Renders all game screens and HUD overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    // Title replaced with "press enter to begin"
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255); // Changed to white for simple, clean styling
    p.textSize(36); // Adjusted size to be the main message
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30); // Centered where the game title was
    
    // Removed the canvas-drawn game name "CHROMATIC ASCENT"
    // Removed the canvas-drawn instructions/description as these are now handled
    // by the preserved HTML elements (<p id="gameDescription"> and <p id="gameControls">)
    // visible below the canvas.
}

export function renderHUD(p) {
    // Score Top Left
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.text(gameState.score, 20, 20);
    
    // High Score logic (simple visual)
    if (gameState.highScore > 0) {
        p.textAlign(p.RIGHT, p.TOP);
        p.textSize(16);
        p.fill(200);
        p.text(`HI: ${gameState.highScore}`, CANVAS_WIDTH - 20, 20);
    }
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (win) {
        p.fill(COLORS.YELLOW);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(COLORS.MAGENTA);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}