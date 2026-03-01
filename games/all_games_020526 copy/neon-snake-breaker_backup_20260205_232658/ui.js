/**
 * ui.js
 * Renders User Interface overlays (Start, HUD, Pause, GameOver).
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONFIG, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(...COLORS.BACKGROUND);
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Remove game name text and replace with "press enter to begin"
    // Original title:
    // p.fill(...COLORS.PLAYER);
    // p.textSize(48);
    // p.textStyle(p.BOLD);
    // p.text("NEON SNAKE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // p.fill(255);
    // p.textSize(32);
    // p.text("BREAKER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 40);
    
    // New main title message: "press enter to begin"
    const blink = p.frameCount % 60 < 30 ? 255 : 150;
    p.fill(blink);
    p.textSize(32); // Prominent size for the new message
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2); // Centered on screen
    
    // Original prompt "PRESS ENTER TO START" is removed as it's redundant with the new title message
    // p.textSize(18);
    // p.fill(blink);
    // p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.6);
    
    // Info - Preserved as it doesn't contain the game name
    p.fill(200);
    p.textSize(14);
    p.text("Arrows to Move  |  Shift to Dash  |  Z for Fever", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
    
    p.pop();
}

export function renderHUD(p) {
    p.push();
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Fever Meter
    const barW = 150;
    const barH = 15;
    const barX = CANVAS_WIDTH - barW - 10;
    const barY = 10;
    
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();
    p.rect(barX, barY, barW, barH);
    
    const ratio = gameState.feverValue / CONFIG.FEVER_MAX;
    if (gameState.isFeverActive) {
        // Use random flicker for effect, but ensure it's visible color
        p.fill(p.random(200, 255), p.random(50, 100), p.random(150, 255));
        p.rect(barX, barY, barW * (gameState.feverTimer / CONFIG.FEVER_DURATION), barH);
        p.textAlign(p.CENTER);
        p.fill(255);
        p.textSize(12);
        p.text("FEVER!", barX + barW/2, barY + 12);
    } else {
        p.fill(...COLORS.FEVER);
        p.rect(barX, barY, barW * ratio, barH);
        if (ratio >= 1) {
             p.textAlign(p.CENTER);
             p.fill(255);
             p.textSize(10);
             p.text("PRESS Z", barX + barW/2, barY + 11);
        }
    }
    
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(...COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.fill(...COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.pop();
}