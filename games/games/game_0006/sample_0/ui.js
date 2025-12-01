import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.resetMatrix(); // Ensure UI is drawn on screen coordinates
    
    // Score & Level
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Level: ${gameState.currentLevelIndex + 1}`, 10, 10);
    p.text(`Score: ${gameState.score}`, 10, 30);
    
    // Coin Progress
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Coins: ${gameState.coinsCollectedInLevel} / ${gameState.totalCoinsInLevel}`, CANVAS_WIDTH - 10, 10);
    
    // Exit Indicator
    if (gameState.coinsCollectedInLevel >= gameState.totalCoinsInLevel) {
        p.fill(0, 255, 0);
        p.textAlign(p.CENTER, p.TOP);
        p.text("EXIT OPEN ->", CANVAS_WIDTH / 2, 10);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(20, 30, 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("Leo's Odyssey", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(18);
    p.text("Collect all coins to escape!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(14);
    p.fill(200);
    p.text("ARROWS: Move & Roll", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("SPACE / UP: Inflate (Float)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.text("DOWN: Deflate (Dive)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    
    p.fill(0, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 130);
}

export function renderGameOver(p, win) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (win) {
        p.fill(0, 255, 0);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 0, 0);
        p.text("OUCH!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(16);
    p.text("Press R to Restart Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    if (win) {
         p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 55);
    }
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}