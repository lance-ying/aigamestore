import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.text(gameState.score, CANVAS_WIDTH / 2, 20);
    p.pop();

    // High Score (small)
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(200);
    p.noStroke();
    p.text(`Best: ${gameState.highScore}`, CANVAS_WIDTH - 20, 20);
    p.pop();

    // Debug / Info
    /*
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(12);
    p.text(`Hoops: ${gameState.hoopsPassed}`, 10, CANVAS_HEIGHT - 10);
    */
}

export function renderStartScreen(p) {
    p.background(20, 20, 35);
    
    // Draw decorative hoop
    p.push();
    p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    p.noFill();
    p.stroke(200, 50, 50);
    p.strokeWeight(4);
    p.ellipse(0, 0, 80, 20);
    p.pop();

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255, 140, 0);
    p.stroke(255);
    p.strokeWeight(2);
    p.textSize(60);
    p.textStyle(p.BOLDITALIC);
    p.text("FLAPPY DUNK", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    // Subtitle
    p.noStroke();
    p.fill(200);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("Jump through the hoops!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    // Instructions
    p.fill(255);
    p.textSize(24);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
    
    // Controls
    p.fill(150);
    p.textSize(14);
    p.text("Controls: Space/Up to Jump | Esc to Pause", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    p.fill(255);
    p.noStroke();
    p.textSize(30);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}