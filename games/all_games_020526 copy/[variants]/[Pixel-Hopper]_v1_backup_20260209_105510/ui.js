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
    
    // Hop Charge Indicator
    if (gameState.player && gameState.player.hasHopCharge) {
        p.textAlign(p.CENTER, p.TOP);
        if (gameState.player.isDoubleHopArmed) {
            p.fill(255, 255, 100);
            p.stroke(0);
            p.strokeWeight(3);
            p.textSize(20);
            p.text("⚡ DOUBLE HOP ARMED! ⚡", CANVAS_WIDTH/2, 20);
        } else {
            p.fill(100, 200, 255);
            p.stroke(0);
            p.strokeWeight(3);
            p.textSize(20);
            p.text("⚡ DOUBLE HOP READY - Press ENTER ⚡", CANVAS_WIDTH/2, 20);
        }
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(50, 50, 60);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Main Title: Replaced with "press enter to begin"
    p.textSize(48); // Adjusted size for new title
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Preserve description and controls, adjust Y positions
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Move | Avoid Cars & Water", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(14);
    p.fill(100, 200, 255);
    p.text("Cross rivers to earn DOUBLE HOPS!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    p.text("Press ENTER to activate, then use arrows", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
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

// The renderPaused function has been removed as per user feedback.
// The game will now simply freeze without any visual overlay or "PAUSED" text.