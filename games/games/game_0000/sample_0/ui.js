import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // Score
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Fortune: ${gameState.score}`, 20, 20);
    
    // Level Info
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, CANVAS_WIDTH - 20, 20);
    
    // Debug info (Z key)
    if (gameState.player && p.keyIsDown(90)) { // Z key
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(12);
        p.text(`State: ${gameState.player.state} | VX: ${gameState.player.vx.toFixed(2)}`, 10, CANVAS_HEIGHT - 10);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    // Draw fancy background
    p.background(20, 30, 40);
    drawBackgroundPattern(p);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("Leo's Odyssey", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.text("Recover your stolen fortune!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(16);
    p.fill(200, 255, 200);
    p.text("ARROWS to Roll & Deflate | SPACE to Jump & Inflate", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(20);
    p.fill(255);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
    }
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    if (win) {
        p.fill(255, 215, 0);
        p.text("FORTUNE RECOVERED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.textSize(24);
        p.fill(255);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else {
        p.fill(255, 50, 50);
        p.text("OUCH!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.textSize(20);
        p.fill(255);
        p.text("Leo lost his fluff...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

function drawBackgroundPattern(p) {
    p.push();
    p.stroke(255, 255, 255, 20);
    for(let i=0; i<CANVAS_WIDTH; i+=40) {
        p.line(i, 0, i, CANVAS_HEIGHT);
    }
    for(let i=0; i<CANVAS_HEIGHT; i+=40) {
        p.line(0, i, CANVAS_WIDTH, i);
    }
    p.pop();
}