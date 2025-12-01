import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(64, 224, 208);
    p.textSize(60);
    p.text("Leo's Fortune", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.fill(200);
    p.textSize(16);
    p.text("Arrows: Move & Float/Dive", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderHUD(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Coins
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.collectedCoins}/${gameState.totalCoins}`, 20, 50);
    
    // Time
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Time: ${elapsed}s`, CANVAS_WIDTH - 20, 20);
    
    // Debug info for automated testing verification
    if (gameState.controlMode !== "HUMAN") {
        p.textAlign(p.RIGHT, p.BOTTOM);
        p.textSize(12);
        p.fill(0, 255, 0);
        p.text(`Mode: ${gameState.controlMode}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    }
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOverWin(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 215, 0);
    p.textSize(50);
    p.text("TREASURE FOUND!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text(`Coins: ${gameState.collectedCoins}/${gameState.totalCoins}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Play Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderGameOverLose(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}