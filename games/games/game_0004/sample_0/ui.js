// ui.js
// UI Rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.background(30, 40, 50);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Decorative title
    p.push();
    p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 80);
    p.textSize(60);
    p.fill(0, 180, 150);
    p.text("Leo's", 0, -30);
    p.fill(255, 215, 0);
    p.text("Fortune", 0, 30);
    p.pop();
    
    p.fill(200);
    p.textSize(16);
    p.text("Recover your stolen gold!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(255);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(12);
    p.fill(150);
    p.text("Arrows to Move | Space to Inflate/Jump | Down to Deflate", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
}

export function renderHUD(p) {
    p.push();
    // Reset Matrix for UI (ignore camera)
    p.resetMatrix();
    
    // Score
    p.fill(255, 215, 0);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Coins: ${gameState.score}`, 20, 20);
    
    // Tutorial hints based on position (Hardcoded simple hints)
    if (gameState.frameCount < 300) {
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(16);
        p.fill(255, 255, 255, 200);
        p.noStroke();
        p.text("Use Arrow Keys to Roll", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
    }
    
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    let isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textAlign(p.CENTER, p.CENTER);
    if (isWin) {
        p.fill(0, 255, 100);
        p.textSize(50);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Total Loot: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    p.pop();
}