import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score
    p.push();
    p.resetMatrix(); // Ensure UI is screen-space
    
    // HUD Bar background
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(24);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Tide Warning
    if (gameState.player) {
        const distToTide = Math.abs(gameState.player.y - gameState.tideY);
        if (distToTide < 300) {
            p.textAlign(p.CENTER, p.CENTER);
            p.fill(255, 0, 0, (Math.sin(gameState.frameCount * 0.2) + 1) * 128);
            p.textSize(18);
            p.text("!!! TIDE RISING !!!", CANVAS_WIDTH / 2, 20);
        }
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(10, 10, 20);
    
    // Pattern background
    p.stroke(30);
    for(let i=0; i<CANVAS_WIDTH; i+=40) p.line(i, 0, i, CANVAS_HEIGHT);
    for(let i=0; i<CANVAS_HEIGHT; i+=40) p.line(0, i, CANVAS_WIDTH, i);

    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255, 255, 0);
    p.textSize(48);
    p.text("TOMB OF THE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.fill(0, 255, 255);
    p.text("NEON MASK", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(255);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    
    p.fill(150);
    p.textSize(12);
    p.text("Arrows to Dash | Collect Coins | Avoid Tide", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 110);
}

export function renderGameOver(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.text("YOU WIN!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}