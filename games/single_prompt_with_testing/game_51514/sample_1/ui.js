/**
 * ui.js
 * Handles all UI rendering for Start, HUD, Pause, Game Over screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title with Glow
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = p.color(COLORS.PLAYER);
    p.fill(255);
    p.textSize(48);
    p.text("NEON GLITCH", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(32);
    p.text("GRAVITY RUNNER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.drawingContext.shadowBlur = 0;
    
    // Prompt
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.fill(200);
        p.textSize(20);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    }
    
    p.fill(150);
    p.textSize(14);
    p.text("Arrows to Move | Space to Jump | Z to Flip Gravity | Shift to Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderHUD(p) {
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    
    // Score
    p.fill(COLORS.COLLECTIBLE);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Level
    p.fill(255);
    p.text(`SECTOR: ${gameState.level}`, 20, 45);
    
    // Health
    p.text(`INTEGRITY:`, 20, 70);
    for(let i=0; i<gameState.player.maxHealth; i++) {
        p.stroke(255);
        if (i < gameState.player.health) {
            p.fill(COLORS.PLAYER_DAMAGED);
        } else {
            p.noFill();
        }
        p.rect(110 + i*25, 70, 20, 15);
    }
}

export function renderLevelComplete(p) {
    p.push();
    p.fill(COLORS.UI_BG);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.PORTAL);
    p.textSize(40);
    p.text("SECTOR CLEARED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press ENTER for Next Sector", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(COLORS.UI_BG);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.PLAYER);
        p.textSize(48);
        p.text("SYSTEM ESCAPED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(24);
        p.text("YOU WIN!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.fill(COLORS.PLAYER_DAMAGED);
        p.textSize(48);
        p.text("CRITICAL ERROR", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(24);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    }
    
    p.fill(255);
    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.text("Press R to Restart System", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(COLORS.UI_BG);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}