/**
 * UI Rendering functions.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.push();
    p.background(10, 10, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("ASCENT TO THE PEAK", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.fill(200);
    p.text("Reach the Artifact. Don't Fall.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(16);
    p.fill(150);
    p.text("Arrows: Move | Hold SPACE: Charge Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("Release SPACE to Jump. NO Air Control!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 65);
    
    p.textSize(24);
    p.fill(255, 215, 0);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
    }
    p.pop();
}

export function renderHUD(p) {
    p.push();
    
    // Score / Height
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Height: ${Math.floor(gameState.score / 10)}m`, 10, 10);
    p.text(`Max: ${Math.floor(gameState.maxHeight / 10)}m`, 10, 30);
    
    // Timer
    if (gameState.startTime > 0) {
        const time = Math.floor((Date.now() - gameState.startTime) / 1000);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`Time: ${time}s`, CANVAS_WIDTH - 10, 10);
    }
    
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
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    if (win) {
        p.fill(255, 215, 0);
        p.text("YOU REACHED THE PEAK!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.textSize(24);
        p.fill(255);
        p.text("The Artifact is yours.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else {
        // Technically not used as there is no lose condition other than quitting, 
        // but implemented for completeness
        p.fill(200, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.textSize(20);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
    p.pop();
}