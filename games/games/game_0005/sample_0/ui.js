// ui.js
// User Interface Rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.resetMatrix(); // Ensure UI is drawn on top of camera transform
    
    // Score
    p.fill(255, 215, 0);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Coins: ${gameState.score} / ${gameState.totalCoins}`, 20, 20);
    
    // Controls hint (fade out?)
    if (gameState.frameCount < 300) {
        p.fill(255, 255, 255, 255 - (gameState.frameCount - 200));
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(16);
        p.text("Arrows to Move | Space to Float | Down to Dive", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(20, 30, 40);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(0, 200, 180);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("Leo's Fuzzball Adventure", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    // Instructions
    p.fill(200);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("Collect all gold coins to unlock the exit.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    // Controls
    p.textSize(14);
    p.fill(150);
    p.text("Controls: Arrows to Move, SPACE to Inflate/Float, DOWN to Deflate/Heavy", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderGameOver(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 100);
        p.textSize(48);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(255);
        p.textSize(24);
        p.text(`You collected all ${gameState.score} coins!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(255, 50, 50);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(255);
        p.textSize(24);
        p.text("Don't give up!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.fill(200);
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}