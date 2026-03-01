/**
 * UI Rendering.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD (Score) - Always visible in PLAYING/PAUSED/GAMEOVER
    if (gameState.gamePhase !== "START") {
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(32);
        p.fill(COLORS.TEXT);
        p.stroke(0);
        p.strokeWeight(3);
        p.text(gameState.score, 20, 20);
        
        // High Score
        if (gameState.highScore > 0) {
            p.textSize(16);
            p.fill(COLORS.ACCENT);
            p.strokeWeight(2);
            p.text(`BEST: ${gameState.highScore}`, 20, 60);
        }
    }
    
    p.pop();

    if (gameState.gamePhase === "START") {
        drawOverlay(p, 0.6);
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(COLORS.TEXT);
        
        p.textSize(60);
        p.stroke(COLORS.ACCENT);
        p.strokeWeight(4);
        p.text("ZIGZAG", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
        p.text("INFINITY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        
        p.noStroke();
        p.textSize(20);
        p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
        
        p.textSize(14);
        p.fill(200);
        p.text("Space / Arrow Keys to Switch Direction", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 120);
        p.pop();
    }
    else if (gameState.gamePhase === "PAUSED") {
        drawOverlay(p, 0.4);
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(COLORS.TEXT);
        p.textSize(40);
        p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        p.textSize(20);
        p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
        p.pop();
    }
    else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawOverlay(p, 0.5);
        p.push();
        p.textAlign(p.CENTER, p.CENTER);
        
        p.fill(255, 100, 100);
        p.textSize(50);
        p.stroke(0);
        p.strokeWeight(3);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
        
        p.fill(COLORS.TEXT);
        p.noStroke();
        p.textSize(30);
        p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        
        p.textSize(20);
        p.fill(200);
        p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
        p.pop();
    }
}

function drawOverlay(p, alpha) {
    p.push();
    p.fill(0, 0, 0, alpha * 255);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();
}