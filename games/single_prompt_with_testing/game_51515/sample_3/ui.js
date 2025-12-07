/**
 * ui.js
 * Handles rendering of Head-Up Display and Menus.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderUI(p) {
    // Top Bar Background
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.fill(COLORS.UI_TEXT);
    p.textSize(20);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // High Score
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`BEST: ${Math.max(gameState.score, gameState.highScore)}`, CANVAS_WIDTH - 20, 20);
    
    // Controls Hint
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("ARROWS to Move | SPACE to Wait", CANVAS_WIDTH/2, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.push();
    p.background(COLORS.BACKGROUND);
    
    // Title
    p.fill(COLORS.VOID);
    p.textSize(60);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("CRIMSON KEEP", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    // Subtitle
    p.fill(255);
    p.textSize(24);
    p.text("Outrun the Void", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 50);
    
    // Instructions
    p.textSize(16);
    p.fill(180);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
    p.text("Controls: Arrows, Space, Shift, Z", CANVAS_WIDTH/2, CANVAS_HEIGHT - 70);
    
    p.pop();
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.COIN);
        p.textSize(50);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(COLORS.VOID);
        p.textSize(50);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(30);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}