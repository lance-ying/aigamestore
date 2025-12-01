// ui.js
// User Interface rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderStartScreen(p) {
    p.background(20, 20, 40);
    
    // Decorative scrolling background
    p.push();
    p.translate((p.frameCount * 2) % CANVAS_WIDTH, 0);
    p.stroke(255, 50);
    p.line(0, 0, 0, CANVAS_HEIGHT);
    p.pop();
    
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255, 50, 50);
    p.textSize(60);
    p.textStyle(p.BOLD);
    p.text("BLOCKY RUNNER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("One-button style platforming action!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(16);
    p.fill(200);
    p.text("SPACE to Jump | Z to Spin | Arrows to Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
    }
}

export function renderHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure UI is drawn in screen space
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Controls hint
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("ESC: PAUSE", CANVAS_WIDTH - 20, 20);
    
    p.pop();
}

export function renderPauseScreen(p) {
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

export function renderGameOver(p, win) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(50, 255, 50);
        p.textSize(50);
        p.text("COURSE CLEAR!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R or ENTER to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.pop();
}