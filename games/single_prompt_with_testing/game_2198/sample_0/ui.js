/**
 * ui.js
 * Renders the Heads-Up Display (HUD) and game menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_TEXT, COLOR_HUD_BG } from './globals.js';

export function renderUI(p) {
    // 1. HUD (Always visible in PLAYING)
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        renderHUD(p);
    }
    
    // 2. Phase-specific Screens
    switch (gameState.gamePhase) {
        case "START":
            renderStartScreen(p);
            break;
        case "PAUSED":
            renderPauseScreen(p);
            break;
        case "GAME_OVER_LOSE":
            renderGameOverScreen(p, false);
            break;
        case "GAME_OVER_WIN":
            renderGameOverScreen(p, true);
            break;
    }
}

function renderHUD(p) {
    p.push();
    // Background bar for readability
    p.fill(COLOR_HUD_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 50);
    
    // Score / Distance
    p.fill(COLOR_TEXT);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    const score = Math.floor(gameState.distanceTraveled / 100);
    p.text(`DISTANCE: ${score}m`, 20, 25);
    
    // Debug info for testing mode (optional but good for verification)
    if (gameState.controlMode !== 'HUMAN') {
        p.textAlign(p.RIGHT, p.CENTER);
        p.fill(255, 100, 100);
        p.text(`AUTO: ${gameState.controlMode}`, CANVAS_WIDTH - 20, 25);
    }
    p.pop();
}

function renderStartScreen(p) {
    p.push();
    // Overlay
    p.background(30, 30, 40);
    
    // Animated Title
    const scale = 1 + Math.sin(p.frameCount * 0.05) * 0.05;
    p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.scale(scale);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.fill(255);
    p.text("GEOMETRIC", 0, -25);
    p.fill(255, 60, 60);
    p.text("JUMPER", 0, 25);
    
    p.resetMatrix(); // Reset transform for static text
    
    // Instructions
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(200);
    p.textSize(18);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(14);
    p.fill(150);
    p.text("UP / SPACE to Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    p.text("Hold to jump higher", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    
    p.pop();
}

function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

function renderGameOverScreen(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const title = win ? "LEVEL COMPLETE!" : "GAME OVER";
    const color = win ? [100, 255, 100] : [255, 60, 60];
    
    p.fill(color);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    const score = Math.floor(gameState.distanceTraveled / 100);
    p.fill(255);
    p.textSize(24);
    p.text(`Distance: ${score}m`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}