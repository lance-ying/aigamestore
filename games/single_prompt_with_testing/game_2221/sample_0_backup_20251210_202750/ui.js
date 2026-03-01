/**
 * ui.js
 * Renders all Heads-Up Display elements and menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // Health Bar
    const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
    p.fill(50, 0, 0);
    p.rect(20, 20, 150, 15);
    p.fill(COLORS.ENEMY_MAIN); // Red for HP
    p.rect(20, 20, 150 * hpPct, 15);
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();
    p.rect(20, 20, 150, 15);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text("HP", 22, 22);

    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.fill(COLORS.TEXT);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    
    // Debug Info
    if (gameState.controlMode !== "HUMAN") {
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(10);
        p.text(`AUTO: ${gameState.controlMode}`, 10, CANVAS_HEIGHT - 10);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Logo
    p.fill(COLORS.PLAYER_MAIN);
    p.textSize(40);
    p.text("GRAVITY CIRCUIT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(COLORS.TEXT);
    p.textSize(20);
    p.text("NEON PULSE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    // Flash text
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.textSize(16);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    }
    
    p.textSize(12);
    p.text("Arrows: Move | Space: Jump | Z: Attack | Shift: Grapple", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.textSize(40);
        p.text("MISSION COMPLETE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    } else {
        p.fill(255, 0, 0);
        p.textSize(40);
        p.text("CRITICAL FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}