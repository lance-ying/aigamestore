import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.push();
    p.background(30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255, 200, 0);
    p.textSize(50);
    p.textStyle(p.BOLD);
    p.text("JETPACK", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.fill(255);
    p.text("JOYRIDE P5", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    // Instructions
    p.textSize(18);
    p.fill(200);
    p.text("Hold SPACE or UP to Fly", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.textSize(24);
    p.fill(0, 255, 0);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    p.pop();
}

export function renderHUD(p) {
    p.push();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    
    // Distance
    p.text(`Distance: ${Math.floor(gameState.distance)}m`, 20, 20);
    
    // Score
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.score}`, 20, 50);
    
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
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
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text(`Coins Collected: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    // Calculate final score
    let finalScore = Math.floor(gameState.distance) + (gameState.score * 10);
    p.fill(255, 215, 0);
    p.textSize(30);
    p.text(`FINAL SCORE: ${finalScore}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    
    p.fill(200);
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 130);
    p.pop();
}