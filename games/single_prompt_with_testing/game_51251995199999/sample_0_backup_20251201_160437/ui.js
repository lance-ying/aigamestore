import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(COLORS.TEXT);
    
    // Score
    p.text(`Score: ${gameState.score}`, 10, 10);
    p.text(`Coins: ${gameState.coins}`, 10, 30);
    
    // High Score
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH - 10, 10);
    
    // Shield Status
    if (gameState.player && gameState.player.shieldActive) {
        p.textAlign(p.CENTER, p.TOP);
        p.fill(COLORS.SHIELD);
        p.text(`SHIELD ACTIVE: ${(gameState.player.shieldTimer/60).toFixed(1)}s`, CANVAS_WIDTH/2, 10);
    } else if (gameState.coins >= 50) {
        p.textAlign(p.CENTER, p.TOP);
        p.fill(COLORS.TEXT);
        p.textSize(12);
        p.text(`[SPACE] SHIELD (50c)`, CANVAS_WIDTH/2, 10);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.PLAYER);
    p.textSize(48);
    p.text("TOMB OF THE MASK", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(24);
    p.fill(COLORS.TEXT);
    p.text("P5 EDITION", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.fill(COLORS.COIN);
    p.text("Arrow Keys to Move | Space for Shield", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.SPIKE);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}