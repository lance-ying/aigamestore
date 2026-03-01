import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score
    p.push();
    p.resetMatrix();
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(32);
    p.textAlign(p.LEFT, p.TOP);
    p.text(gameState.score, 20, 20);
    
    // High Score
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`HI: ${Math.max(gameState.score, gameState.highScore)}`, CANVAS_WIDTH - 20, 20);
    p.pop();
}

export function renderStartScreen(p) {
    p.background(50, 50, 60);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(60);
    p.text("PIXEL HOPPER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(24);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Move | Avoid Cars & Water", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOver(p, win) {
    p.push();
    p.resetMatrix();
    p.fill(0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(30);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}