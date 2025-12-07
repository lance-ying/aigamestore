/**
 * ui.js
 * Renders the Heads-Up Display (HUD) and game menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // Reset matrix for UI (stay on screen)
    p.resetMatrix();
    
    // HUD Bar
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Health
    if (gameState.player) {
        p.fill(255, 50, 50);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(16);
        p.text(`HP:`, 10, 20);
        
        for (let i = 0; i < gameState.player.maxHp; i++) {
            if (i < gameState.player.hp) p.fill(255, 50, 50);
            else p.fill(100, 50, 50);
            p.circle(50 + i * 20, 20, 12);
        }
    }
    
    // Score
    p.fill(COLORS.GOLD);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`$ ${gameState.score}`, CANVAS_WIDTH / 2, 20);
    
    // Level
    p.fill(255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Depth: ${gameState.level}`, CANVAS_WIDTH - 10, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("SPELUNKER MOON", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    // Subtitle
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.fill(200);
    p.text("Roguelike Lunar Exploration", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    // Prompt
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.fill(COLORS.GOLD);
        p.textSize(24);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    // Instructions
    p.textSize(12);
    p.fill(150);
    p.text("ARROWS: Move  SPACE: Jump  Z: Attack  SHIFT: Run", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p, won) {
    p.push();
    p.resetMatrix();
    
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (won) {
        p.fill(COLORS.GEM);
        p.textSize(48);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.text("You found the exit portal!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(255, 50, 50);
        p.textSize(48);
        p.text("MISSION FAILED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.text("The moon claims another soul.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
    
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
    p.resetMatrix();
    
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.pop();
}