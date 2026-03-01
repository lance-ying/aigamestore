import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.noStroke();
    p.text(`Coins: ${gameState.coinsCollected} / ${gameState.totalCoinsInLevel}`, 20, 20);
    p.text(`Score: ${gameState.score}`, 20, 50);
    
    // Hearts
    p.fill(255, 50, 50);
    for (let i = 0; i < gameState.maxHearts; i++) {
        if (i < gameState.currentHearts) {
            p.circle(20 + i * 25, 90, 16);
        } else {
            p.stroke(255, 50, 50);
            p.strokeWeight(1);
            p.noFill();
            p.circle(20 + i * 25, 90, 16);
            p.noStroke();
            p.fill(255, 50, 50);
        }
    }
    
    // Level Indicator
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, CANVAS_WIDTH - 20, 20);
}

export function renderStartScreen(p) {
    p.background(30, 40, 50);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(36);
    p.fill(255, 215, 0); 
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    // Removed p5.js rendered control text as per feedback to rely on HTML controls section
}

export function renderGameOverWin(p) {
    p.background(0, 0, 0, 150);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.fill(0, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(24);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderLevelComplete(p) {
    p.background(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(36);
    p.fill(0, 255, 100);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    
    p.textSize(20);
    p.fill(255);
    p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Loading next level...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOverLose(p) {
    p.background(0, 0, 0, 150);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.fill(255, 50, 50);
    p.text("OUCH!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(18);
    p.fill(220);
    p.text("Watch out for spikes!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(20);
    p.fill(255);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOverFinal(p) {
    p.background(20, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.fill(255, 0, 0);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(18);
    p.fill(220);
    p.text("You ran out of hearts!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(20);
    p.fill(255);
    p.text("Press ENTER to Restart Game", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPaused(p) {
    p.background(0, 0, 0, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameComplete(p) {
    p.background(20, 30, 40);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.fill(255, 215, 0); 
    p.text("YOU WIN!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(24);
    p.fill(255);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(18);
    p.fill(180);
    p.text("All levels completed!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(20);
    p.fill(0, 255, 200);
    p.text("Press ENTER to Return to Title", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}