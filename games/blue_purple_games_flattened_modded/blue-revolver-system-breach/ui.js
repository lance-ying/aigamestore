/**
 * ui.js
 * Handles HUD rendering and menu screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    p.push();
    
    // Top Bar Background
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(COLORS.GOLD);
    p.text(`SCORE: ${gameState.score.toString().padStart(8, '0')}`, 10, 10);
    
    // Chain Gauge
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(COLORS.TEXT);
    p.text(`CHAIN: ${gameState.chain}`, CANVAS_WIDTH - 10, 10);
    
    // Chain Bar
    if (gameState.chain > 0) {
        const barW = 100;
        const barH = 5;
        const ratio = gameState.chainTimer / gameState.chainMaxTime;
        p.noStroke();
        p.fill(50);
        p.rect(CANVAS_WIDTH - 120, 32, barW, barH);
        p.fill(COLORS.GOLD);
        p.rect(CANVAS_WIDTH - 120, 32, barW * ratio, barH);
    }
    
    // Lives
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(16);
    p.fill(COLORS.PLAYER);
    p.text(`LIVES: ${"★".repeat(gameState.lives)}`, 10, CANVAS_HEIGHT - 10);
    
    // Bombs
    p.fill(COLORS.ENEMY_WEAK);
    p.text(`BOMBS: ${"●".repeat(gameState.bombs)}`, 120, CANVAS_HEIGHT - 10);

    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Replaced Logo / Title with "press enter to begin"
    p.fill(COLORS.TEXT); // Keep color consistent with original prompt
    p.textSize(32); // Increased size to act as a title
    p.textStyle(p.NORMAL); // Ensure no bold styling from previous title
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Instructions (kept as is)
    p.textSize(14);
    p.fill(150);
    p.text("ARROWS: Move | Z: Bomb | SHIFT: Focus", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p) {
    p.background(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLORS.ENEMY_WEAK);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.fill(COLORS.PLAYER);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPause(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}