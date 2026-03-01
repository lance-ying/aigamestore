/**
 * User Interface Module
 * 
 * Handles HUD rendering (Stocks, %, Timer) and Screen states (Start, Pause, GameOver).
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderUI(p) {
    // HUD
    renderHUD(p);
    
    // Screens
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderPausedOverlay(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderGameOver(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOver(p, false);
    }
}

function renderHUD(p) {
    // Player Stats (Bottom Left)
    renderPlayerTag(p, gameState.player, 20, CANVAS_HEIGHT - 60, "P1");
    
    // Enemy Stats (Bottom Right)
    // Assuming 1v1 for now
    if (gameState.enemies.length > 0) {
        renderPlayerTag(p, gameState.enemies[0], CANVAS_WIDTH - 120, CANVAS_HEIGHT - 60, "CPU");
    }
}

function renderPlayerTag(p, fighter, x, y, label) {
    if (!fighter) return;
    
    p.push();
    p.translate(x, y);
    
    // Background panel
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, 100, 50, 5);
    
    // Name
    p.fill(fighter.color);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(label, 5, 5);
    
    // Percent
    p.fill(255);
    p.textSize(24);
    p.textWrap(p.WORD);
    // Color scaling with damage
    if (fighter.percent > 100) p.fill(255, 0, 0);
    else if (fighter.percent > 50) p.fill(255, 150, 0);
    p.text(Math.floor(fighter.percent) + "%", 5, 20);
    
    // Stocks
    p.fill(255);
    for (let i = 0; i < fighter.stocks; i++) {
        p.circle(80 - (i * 12), 15, 8);
    }
    
    p.pop();
}

function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.text("AETHER RIVALS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.text("Elemental Duel", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    p.fill(200);
    p.text("Controls:", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("Arrows: Move | Space: Jump | Z: Attack | Shift: Special", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.fill(COLORS.FIRE_PRIMARY);
    p.textSize(20);
    p.text("PRESS ENTER TO FIGHT", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
}

function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

function renderGameOver(p, isWin) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    if (isWin) {
        p.fill(COLORS.FIRE_SECONDARY);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(COLORS.WATER_PRIMARY);
        p.text("DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Rematch", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
}