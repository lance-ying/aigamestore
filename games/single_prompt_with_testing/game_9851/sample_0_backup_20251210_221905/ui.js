/**
 * User Interface rendering and HUD.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD Bar Background
    p.fill(COLORS.UI_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 50);
    p.stroke(255, 255, 255, 50);
    p.line(0, 50, CANVAS_WIDTH, 50);

    if (gameState.player) {
        // Health Bar
        const hpX = 20;
        const hpY = 15;
        const hpW = 150;
        const hpH = 12;
        
        p.fill(COLORS.HEALTH_BAR_BG);
        p.noStroke();
        p.rect(hpX, hpY, hpW, hpH);
        
        const hpRatio = Math.max(0, gameState.player.health / gameState.player.maxHealth);
        p.fill(COLORS.HEALTH_BAR_FG);
        p.rect(hpX, hpY, hpW * hpRatio, hpH);
        
        p.stroke(0);
        p.noFill();
        p.rect(hpX, hpY, hpW, hpH);
        
        p.noStroke();
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text("HEALTH", hpX, hpY - 2);

        // Stamina Bar
        const stX = 20;
        const stY = 32;
        
        p.fill(COLORS.STAMINA_BAR_BG);
        p.rect(stX, stY, hpW, 6);
        
        const stRatio = Math.max(0, gameState.player.stamina / gameState.player.maxStamina);
        p.fill(COLORS.STAMINA_BAR_FG);
        p.rect(stX, stY, hpW * stRatio, 6);
    }

    // Stats
    p.fill(COLORS.ACCENT);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 25);
    
    p.fill(200);
    p.textSize(14);
    p.text(`KEYS: ${gameState.keys}`, CANVAS_WIDTH - 150, 25);

    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.ACCENT);
    p.textSize(40);
    p.text("CASTLE HAMMERWATCH", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(24);
    p.text("LITE EDITION", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.fill(150);
    p.textSize(12);
    p.text("ARROWS to Move | Z to Attack | SHIFT to Dash | SPACE to Interact", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderGameOver(p, win) {
    p.background(0, 0, 0, 200); // Overlay
    
    p.textAlign(p.CENTER, p.CENTER);
    if (win) {
        p.fill(COLORS.ACCENT);
        p.textSize(48);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.text("You escaped the castle!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(COLORS.HEALTH_BAR_FG);
        p.textSize(48);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(16);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}