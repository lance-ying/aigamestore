/**
 * UI Rendering functions.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // Score & Timer
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        p.push();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.fill(COLORS.TEXT);
        p.noStroke();
        
        // HUD Background
        p.fill(COLORS.HUD_BG);
        p.rect(0, 0, CANVAS_WIDTH, 40);
        
        p.fill(COLORS.TEXT);
        p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}`, 20, 10);
        p.text(`SCORE: ${Math.floor(gameState.score)}`, 200, 10);
        
        // Progress Bar for Time
        const barWidth = CANVAS_WIDTH;
        const remainingPct = gameState.timeRemaining / 60;
        p.fill(remainingPct > 0.2 ? 0 : 255, remainingPct > 0.2 ? 255 : 0, 0, 150);
        p.rect(0, 35, barWidth * remainingPct, 5);
        p.pop();
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    
    p.textSize(40);
    p.text("OCTAGON 1", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    p.textSize(20);
    p.text("MAXIMAL CHALLENGE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Rotate | Space to Flip", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
}

export function renderGameOver(p) {
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    if (win) {
        p.fill(0, 255, 0);
        p.text("MISSION COMPLETE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.text("SYSTEM FAILURE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    }
    
    p.textSize(24);
    p.fill(255);
    p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.pop();
}