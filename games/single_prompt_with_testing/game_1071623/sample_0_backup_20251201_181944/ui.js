import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.push();
    p.resetMatrix(); // Ensure UI is fixed on screen
    
    // Score
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 10, 10);
    p.text(`Level: ${gameState.level}`, 10, 35);
    
    // Deaths
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 100, 100);
    p.text(`Deaths: ${gameState.deaths}`, CANVAS_WIDTH - 10, 10);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.push();
    p.background(20);
    p.fill(255, 50, 50);
    p.textAlign(p.CENTER);
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.text("SUPER MEAT BOY", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.fill(255);
    p.text("FOREVER (Clone)", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 50);
    
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Rescue Nugget! Watch out for Dr. Fetus!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.fill(100, 255, 100);
    p.textSize(24);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
    
    p.fill(200);
    p.textSize(12);
    p.text("Controls: Arrows to Move/Slide, Space to Jump, Z to Dash Punch", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
    p.pop();
}

export function renderGameOver(p, win) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    p.textSize(50);
    
    if (win) {
        p.fill(255, 100, 200); // Pink for bandage girl
        p.text("YOU SAVED NUGGET!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(200, 0, 0); // Blood red
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.textSize(20);
    p.fill(255);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}