/**
 * ui.js
 * Handles rendering of all UI elements (Screens, HUD, overlays).
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, LEVEL_LENGTH } from './globals.js';

export function renderUI(p) {
    // Heads Up Display (during gameplay)
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED" || gameState.gamePhase.startsWith("GAME_OVER")) {
        renderHUD(p);
    }

    // Screens
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderPauseScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        renderGameOverScreen(p, false);
    }
}

function renderHUD(p) {
    p.push();
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(...COLORS.TEXT);
    p.text(`Score: ${gameState.score}`, 20, 20);

    // Progress Bar
    const barWidth = 200;
    const barHeight = 10;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = 25;
    
    const progress = Math.min(gameState.distanceTraveled / LEVEL_LENGTH, 1);
    
    // Bar Back
    p.noStroke();
    p.fill(200);
    p.rect(barX, barY, barWidth, barHeight, 5);
    
    // Bar Fill
    p.fill(...COLORS.PLAYER);
    p.rect(barX, barY, barWidth * progress, barHeight, 5);
    
    // Percent
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.fill(100);
    p.text(`${Math.floor(progress * 100)}%`, CANVAS_WIDTH/2, barY + 14);

    p.pop();
}

function renderStartScreen(p) {
    p.push();
    p.background(...COLORS.BACKGROUND);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(...COLORS.PLAYER);
    p.text("MR. JUMP", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(24);
    p.fill(...COLORS.TEXT);
    p.text("POLYGON ADVENTURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    // Prompt
    const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 20;
    p.fill(COLORS.TEXT[0], COLORS.TEXT[1], COLORS.TEXT[2], alpha);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.pop();
}

function renderPauseScreen(p) {
    drawOverlay(p);
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.pop();
}

function renderGameOverScreen(p, win) {
    drawOverlay(p);
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(...COLORS.ORB);
        p.textSize(48);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(...COLORS.SPIKE);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 20;
    p.fill(255, 255, 255, alpha);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.pop();
}

function drawOverlay(p) {
    p.fill(...COLORS.UI_OVERLAY);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}