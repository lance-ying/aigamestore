/**
 * ui.js
 * Handles rendering of user interface overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    // Health Bar
    p.push();
    p.stroke(255);
    p.strokeWeight(2);
    p.fill(50, 0, 0);
    p.rectMode(p.CORNER);
    p.rect(20, 20, 200, 20);
    
    // Fill
    if (gameState.player) {
        const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
        p.fill(0, 255, 0);
        p.noStroke();
        p.rect(22, 22, 196 * hpPct, 16);
    }
    p.pop();
    
    // Score
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, 20, 50);
    
    // Height / Progress
    if (gameState.player) {
        const heightPct = Math.floor((1 - (gameState.player.y / 3000)) * 100);
        p.text(`FLOOR: ${Math.max(0, heightPct)}`, 20, 75);
        p.text(`WEAPON: ${gameState.player.weapon}`, 20, 100);
    }
}

export function renderStartScreen(p) {
    p.background(10, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(0, 255, 100);
    p.textSize(48);
    p.text("TOWER FORTRESS", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    // Subtitle
    p.fill(255);
    p.textSize(24);
    p.text("ASCEND THE SPIRE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Instructions
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Move | Z to Shoot | Space to Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.textSize(48);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.textSize(48);
        p.text("CRITICAL FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.text("PRESS 'R' TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}