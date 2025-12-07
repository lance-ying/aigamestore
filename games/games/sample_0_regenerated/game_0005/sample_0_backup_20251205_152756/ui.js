/**
 * ui.js
 * Renders the UI layers.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    p.push();
    
    // Top Bar Background
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Health (Hearts)
    p.fill(200, 50, 50);
    for (let i = 0; i < gameState.player.maxHealth; i++) {
        const x = 20 + i * 25;
        const y = 20;
        if (i < gameState.player.health) {
            p.circle(x, y, 16);
        } else {
            p.stroke(200, 50, 50);
            p.noFill();
            p.circle(x, y, 16);
            p.noStroke();
        }
    }
    
    // Score
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(20);
    p.text(`$ ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    
    // Depth/Level
    p.fill(200);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`Depth: ${gameState.levelDepth}`, CANVAS_WIDTH / 2, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(48);
    p.text("MOON SPELUNKER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Subtitle
    p.textSize(16);
    p.fill(COLORS.GOLD);
    p.text("Explore the depths. Find the Gold. Survive.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 40);
    
    // Instructions
    p.fill(200);
    p.textSize(14);
    p.text("ARROWS to Move  |  SPACE to Jump", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Z to Whip  |  SHIFT to Sprint", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
    
    // Prompt
    p.textSize(20);
    p.fill(255);
    // Blink effect
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    }
}

export function renderPauseScreen(p) {
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOverScreen(p, win) {
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.GOLD);
        p.textSize(40);
        p.text("MISSION ACCOMPLISHED!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.fill(255);
        p.textSize(18);
        p.text(`You escaped with $${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    } else {
        p.fill(200, 50, 50);
        p.textSize(40);
        p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.fill(255);
        p.textSize(18);
        p.text("The moon claims another soul...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }
    
    p.fill(200);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}