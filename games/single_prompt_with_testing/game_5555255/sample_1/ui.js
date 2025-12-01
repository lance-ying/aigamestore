/**
 * UI Rendering
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Neon Title
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = 'cyan';
    p.fill(0, 255, 255);
    p.textSize(48);
    p.text("NEON BOUNCE ESCAPE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.drawingContext.shadowBlur = 0;
    
    p.fill(255);
    p.textSize(18);
    p.text("Escape the void. Reach the end.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    p.fill(255, 255, 0);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(14);
    p.fill(150);
    p.text("Arrows to Move | Space to Jump | Shift to Brake", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure HUD is static relative to screen
    
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Progress Bar
    let progress = Math.min(1, Math.max(0, gameState.player.x / gameState.levelLength));
    p.noFill();
    p.stroke(255);
    p.rect(CANVAS_WIDTH/2 - 100, 20, 200, 10);
    p.fill(0, 255, 0);
    p.noStroke();
    p.rect(CANVAS_WIDTH/2 - 100, 20, 200 * progress, 10);
    
    p.pop();
}

export function renderGameOver(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    let isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    if (isWin) {
        p.fill(0, 255, 0);
        p.textSize(48);
        p.text("LEVEL CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}