/**
 * Cavern Tale - UI & Screen Rendering
 * Handles HUD, Start, Pause, and Game Over screens.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, PALETTE } from './globals.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    // --- Health Bar ---
    const hpX = 20;
    const hpY = 20;
    const hpW = 100;
    const hpH = 12;
    
    // Label
    p.fill(PALETTE.UI_TEXT);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    p.text("LIFE", hpX, hpY);
    
    // BG
    p.fill(PALETTE.UI_BAR_BG);
    p.rect(hpX, hpY + 2, hpW, hpH);
    
    // Fill
    const hpPercent = Math.max(0, gameState.player.health / gameState.player.maxHealth);
    p.fill(PALETTE.UI_BAR_HP);
    p.rect(hpX, hpY + 2, hpW * hpPercent, hpH);
    
    // Text value
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(Math.ceil(gameState.player.health), hpX + hpW/2, hpY + 2 + hpH/2);


    // --- Weapon XP Bar ---
    const xpX = 20;
    const xpY = 50;
    
    // Label
    p.fill(PALETTE.UI_TEXT);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    p.text(`LVL ${gameState.player.weaponLevel}`, xpX, xpY);
    
    // BG
    p.fill(PALETTE.UI_BAR_BG);
    p.rect(xpX, xpY + 2, hpW, hpH);
    
    // Fill
    let xpPercent = 0;
    if (gameState.player.weaponLevel < 3) {
        xpPercent = gameState.player.weaponXP / gameState.player.weaponMaxXP;
    } else {
        xpPercent = 1; // Max Level
    }
    p.fill(PALETTE.UI_BAR_XP);
    p.rect(xpX, xpY + 2, hpW * xpPercent, hpH);
    
    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255);
    p.textSize(14);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
}

export function renderStartScreen(p) {
    p.background(PALETTE.BACKGROUND);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(48);
    p.text("CAVERN TALE", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.fill(200);
    p.text("Help Quote escape the underground!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(PALETTE.EXP_TRIANGLE);
    p.text("Collect Energy to Level Up your Gun", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.fill(255);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
    
    // Blink effect
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 255, 100);
        p.rect(CANVAS_WIDTH/2 - 120, CANVAS_HEIGHT * 0.75 - 15, 240, 30);
    }
}

export function renderPauseScreen(p) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOverScreen(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(PALETTE.EXP_TRIANGLE);
        p.textSize(48);
        p.text("MISSION ACCOMPLISHED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(PALETTE.PLAYER_CAP);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(180);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}