/**
 * ui.js
 * Renders all game screens and HUD overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.CYAN);
    p.textSize(48);
    p.text("CHROMATIC", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 80);
    p.fill(COLORS.MAGENTA);
    p.text("ASCENT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    
    // Instructions
    p.fill(255);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.fill(200);
    p.textSize(14);
    p.text("Match the color to pass obstacles.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    p.text("[SPACE] Jump   [ARROWS] Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
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