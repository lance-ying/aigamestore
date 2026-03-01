/**
 * User Interface rendering.
 * Start screen, HUD, Pause screen, Game Over.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    // Title
    p.textAlign(p.CENTER);
    p.textSize(50);
    p.fill(255);
    p.text("SUMMIT ASCENT", CANVAS_WIDTH / 2, 120);
    
    // Description
    p.textSize(16);
    p.fill(200);
    p.textWrap(p.WORD);
    p.text("Help Madeline scale the dangerous mountain.\nJump, Dash, and Climb your way to the peak.", CANVAS_WIDTH / 2, 180);
    
    // Instructions
    p.textSize(20);
    p.fill(COLORS.gold);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 300);
    
    p.textSize(14);
    p.fill(150);
    p.text("Arrows: Move | Space: Jump | Z: Dash | Shift: Climb", CANVAS_WIDTH / 2, 340);
}

export function renderHUD(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.text(`Strawberries: ${gameState.score / 1000}`, 20, 20);
    
    // Dash indicator
    // p.fill(gameState.player.canDash ? COLORS.player_idle : COLORS.player_no_dash);
    // p.circle(20, 50, 10);
    
    // Render Debug info if needed (optional)
    if (gameState.controlMode !== "HUMAN") {
        p.textAlign(p.RIGHT, p.TOP);
        p.fill(255, 0, 0);
        p.text(`AUTO: ${gameState.controlMode}`, CANVAS_WIDTH - 20, 20);
    }
}

export function renderPauseScreen(p) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOver(p, isWin) {
    // Overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.textSize(50);
    
    if (isWin) {
        p.fill(COLORS.gold);
        p.text("SUMMIT REACHED!", CANVAS_WIDTH / 2, 150);
        p.textSize(24);
        p.fill(255);
        p.text(`Strawberries Collected: ${gameState.score / 1000}`, CANVAS_WIDTH / 2, 220);
    } else {
        p.fill(200, 50, 50);
        p.text("GAVE UP", CANVAS_WIDTH / 2, 150);
        p.textSize(20);
        p.fill(200);
        p.text("The mountain claimed another.", CANVAS_WIDTH / 2, 200);
    }
    
    p.textSize(20);
    p.fill(255);
    p.text("Press R to Try Again", CANVAS_WIDTH / 2, 300);
}