/**
 * ui.js
 * Rendering functions for the HUD, Start Screen, Pause Screen, and Game Over.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
        renderHUD(p);
    } else if (gameState.gamePhase === "PAUSED") {
        renderHUD(p); // Show HUD behind
        renderPausedScreen(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
        renderHUD(p);
        renderGameOverScreen(p);
    }
}

function renderStartScreen(p) {
    // Animated Background (Neon Grid handled in game.js, this overlays text)
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.TEXT_MAIN);
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.stroke(COLORS.TILE_ACTIVE);
    p.strokeWeight(4);
    p.text("NEON HOP", CANVAS_WIDTH / 2, 120);
    
    // Subtitle
    p.noStroke();
    p.textSize(20);
    p.fill(COLORS.TEXT_ACCENT);
    p.text("Rhythm of the Void", CANVAS_WIDTH / 2, 160);
    
    // Instructions
    p.textSize(16);
    p.fill(200);
    const blink = Math.sin(p.frameCount * 0.1) > 0;
    if (blink) p.fill(255);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 250);
    
    p.fill(150);
    p.textSize(14);
    p.text("Arrows: Steer  |  Space: Boost  |  Shift: Slam", CANVAS_WIDTH / 2, 300);
    
    p.pop();
}

function renderHUD(p) {
    p.push();
    
    // Score Top Left
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(COLORS.TEXT_MAIN);
    p.stroke(0);
    p.strokeWeight(2);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Distance Top Right
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`DIST: ${Math.floor(gameState.distance / 10)}m`, CANVAS_WIDTH - 20, 20);
    
    // Combo multiplier (if > 1)
    if (gameState.combo > 1) {
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(30);
        p.fill(COLORS.PARTICLE_COLLECT);
        p.text(`x${gameState.combo}`, CANVAS_WIDTH / 2, 60);
    }
    
    p.pop();
}

function renderPausedScreen(p) {
    p.push();
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT_MAIN);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}

function renderGameOverScreen(p) {
    p.push();
    p.fill(COLORS.UI_OVERLAY);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(gameState.gamePhase === "GAME_OVER_WIN" ? "#2ecc71" : "#e74c3c");
    p.textSize(50);
    p.stroke(0);
    p.strokeWeight(4);
    p.text(gameState.gamePhase === "GAME_OVER_WIN" ? "COMPLETED!" : "GAME OVER", CANVAS_WIDTH / 2, 140);
    
    p.noStroke();
    p.fill(COLORS.TEXT_MAIN);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`Distance: ${Math.floor(gameState.distance/10)}m`, CANVAS_WIDTH / 2, 230);
    
    p.fill(COLORS.TEXT_ACCENT);
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, 300);
    p.pop();
}