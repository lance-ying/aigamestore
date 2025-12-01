import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_LENGTH } from './globals.js';

export function renderUI(p) {
    // Top HUD
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 215, 0);
    p.text(`COINS: ${gameState.coins}`, CANVAS_WIDTH/2, 20);
    
    // Progress Bar
    const progress = Math.min(1, gameState.distanceTraveled / LEVEL_LENGTH);
    p.stroke(255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(CANVAS_WIDTH - 120, 15, 100, 10);
    p.noStroke();
    p.fill(255, 0, 0);
    p.rect(CANVAS_WIDTH - 120, 15, 100 * progress, 10);
}

export function renderStartScreen(p) {
    p.background(0, 150, 255); // Sky Blue
    
    // Title
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(50);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SUPER PLUMBER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.text("RUN", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Instructions
    p.noStroke();
    p.textSize(18);
    p.fill(255);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.textSize(14);
    p.text("SPACE to Jump | DOWN to Fall Fast", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
}

export function renderPausedScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOverScreen(p) {
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textSize(50);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (isWin) {
        p.fill(50, 255, 50);
        p.text("COURSE CLEAR!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}