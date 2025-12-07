// ui.js
// Rendering User Interface and Game Screens

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderUI(p) {
    // HUD Bar
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Text Settings
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    
    // Health (Hearts)
    let hpStr = "HP: ";
    for (let i = 0; i < gameState.player.maxHealth; i++) {
        hpStr += i < gameState.player.health ? "♥" : "♡";
    }
    p.text(hpStr, 10, 20);
    
    // Score / Money
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`$ ${gameState.money}`, CANVAS_WIDTH / 2, 20);
    
    // Level
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    // Cave decorative circles
    p.noStroke();
    p.fill(30, 30, 40);
    p.circle(100, 300, 200);
    p.circle(500, 100, 150);
    
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title with shadow
    p.textSize(48);
    p.fill(0);
    p.text("LUNAR SPELUNKER", CANVAS_WIDTH/2 + 3, CANVAS_HEIGHT/3 + 3);
    p.fill(COLORS.GOLD);
    p.text("LUNAR SPELUNKER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.fill(200);
    p.text("Descend. Collect. Survive.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    // Instructions Box
    p.fill(0, 0, 0, 100);
    p.rect(CANVAS_WIDTH/2 - 200, CANVAS_HEIGHT - 120, 400, 100, 10);
    p.fill(200);
    p.textSize(14);
    p.text("Arrows to Move | Space to Jump | Z to Whip", CANVAS_WIDTH/2, CANVAS_HEIGHT - 90);
    p.text("Run: Shift | Pause: ESC", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(win ? COLORS.GOLD : '#e53935');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text(win ? "YOU ESCAPED!" : "GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Wealth: $${gameState.money}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

export function renderTransition(p) {
    p.background(0);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(`Entering Level ${gameState.currentLevel + 1}...`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}