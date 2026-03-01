/**
 * ui.js
 * Handles all on-screen rendering for HUD and Menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // Phase dependent rendering
    if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
        renderHUD(p);
    }

    if (gameState.gamePhase === 'START') {
        renderStartScreen(p);
    } else if (gameState.gamePhase === 'PAUSED') {
        renderPauseScreen(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
        renderWinScreen(p);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        renderLoseScreen(p);
    }
}

function renderHUD(p) {
    // Health Bar
    const hpPct = Math.max(0, gameState.player.health / 100);
    
    p.push();
    p.translate(10, 10);
    
    // Bar Background
    p.fill(COLORS.UI_BAR_BG);
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(0, 0, 150, 15);
    
    // Bar Fill
    p.fill(COLORS.UI_BAR_FILL);
    p.noStroke();
    p.rect(1, 1, 148 * hpPct, 13);
    
    // Weapon Text
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`WPN: ${gameState.player.weapon}`, 0, 20);
    
    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 0);

    p.pop();
}

function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Replaced game title with "press enter to begin"
    p.fill(COLORS.TELEPORTER);
    p.textSize(40);
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    // Preserved subtitle/tagline as it does not contain the game name
    p.fill(255);
    p.textSize(16);
    p.text("Fix the teleporters. Clear the bugs.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Preserved controls section as it does not contain the game name
    p.textSize(14);
    p.fill(180);
    p.text("ARROWS: Move/Aim | Z: Shoot | SPACE: Jump | SHIFT: Swap Weapon", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    // Removed the flashing "PRESS ENTER TO START" as "press enter to begin" now serves as the main prompt.
}

function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderWinScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("SYSTEM RESTORED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.text("Press R to Play Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

function renderLoseScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("CRITICAL ERROR", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Retry", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}