/**
 * UI Rendering functions.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // Score & Lives
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
        p.text(`LIVES: ${gameState.lives}`, 20, 10);
        p.text(`SCORE: ${Math.floor(gameState.score)}`, 200, 10);
        
        p.pop();
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);

    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.TEXT);
    p.noStroke();

    // Main instruction
    p.textSize(36);
    p.text("Press ENTER to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    // Controls hint
    p.textSize(18);
    p.text("Use ARROWS to Rotate, SPACE to Flip", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to Restart at any time", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    p.pop();
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