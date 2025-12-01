// UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
    p.push();
    p.background(COLORS.BACKGROUND);
    
    // Title with Neon Glow
    p.textAlign(p.CENTER, p.CENTER);
    
    // Glow effect
    for(let i = 5; i > 0; i--) {
        p.stroke(COLORS.ACCENT[0], COLORS.ACCENT[1], COLORS.ACCENT[2], 50 - i*10);
        p.strokeWeight(i * 4);
        p.noFill();
        p.textSize(64);
        p.text("NEON STACK", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.noStroke();
    p.fill(COLORS.TEXT);
    p.textSize(64);
    p.text("NEON STACK", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(24);
    p.fill(200);
    p.text("Stack blocks to the sky!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(18);
    
    // Blinking text
    if (p.frameCount % 60 < 40) {
        p.fill(COLORS.ACCENT);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
    
    p.pop();
}

export function renderHUD(p) {
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(COLORS.TEXT);
    
    // Score
    p.text(`Score: ${gameState.score}`, 20, 20);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Target: 50`, CANVAS_WIDTH - 20, 20);
    
    // Level/Speed indicator
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.fill(COLORS.ACCENT);
    const speed = gameState.activeBlock ? gameState.activeBlock.speed.toFixed(1) : "0";
    p.text(`Speed: ${speed}x`, CANVAS_WIDTH/2, CANVAS_HEIGHT - 10);
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}

export function renderGameOver(p, isWin) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rectMode(p.CORNER);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (isWin) {
        p.fill(0, 255, 0); // Green for win
        p.textSize(56);
        p.text("TOWER MASTER!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(255);
        p.textSize(24);
        p.text("You reached the summit!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.fill(255, 50, 50); // Red for lose
        p.textSize(56);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(255);
        p.textSize(24);
        p.text(`Height Reached: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    }
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    p.pop();
}