/**
 * User Interface Rendering
 * Handles Start, Pause, Game Over screens, and HUD.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderUI(p) {
    // Top HUD
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(255);
    p.noStroke();
    
    // Score
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Energy
    p.text(`Energy: ${Math.floor(gameState.energy)}%`, 10, 30);
    
    // Debug info (optional)
    if (gameState.controlMode !== 'HUMAN') {
        p.textAlign(p.RIGHT, p.TOP);
        p.fill(255, 255, 0);
        p.text(`MODE: ${gameState.controlMode}`, CANVAS_WIDTH - 10, 10);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    drawOverlay(p, [0, 0, 0, 220]);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    
    p.textSize(40);
    p.text("MOB COMMANDER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(14);
    p.fill(200);
    p.text("Arrow Keys to Move | Space to Shoot", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("Destroy the enemy base before they breach yours!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
}

export function renderPausedOverlay(p) {
    drawOverlay(p, [0, 0, 0, 150]);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOver(p) {
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    const color = isWin ? [0, 100, 0, 200] : [100, 0, 0, 200];
    
    drawOverlay(p, color);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(48);
    p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

function drawOverlay(p, color) {
    p.push();
    p.fill(...color);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();
}