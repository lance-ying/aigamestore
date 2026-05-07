/**
 * ui.js
 * Renders the HUD, Start Screen, Game Over, etc.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './globals.js';

export function renderUI(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.text(gameState.score, 20, 20);

    // Stage
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(32);
    p.fill(200, 200, 200);
    p.text(`STAGE ${gameState.stage}`, CANVAS_WIDTH / 2, 20);
    
    // Boss Indicator
    if (gameState.stage % 5 === 0) {
        p.fill(255, 50, 50);
        p.textSize(16);
        p.text("BOSS BATTLE", CANVAS_WIDTH / 2, 55);
    }

    // Apples
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(24);
    p.fill(220, 50, 50);
    p.text(`🍎 ${gameState.applesCollected}`, CANVAS_WIDTH - 20, 20);

    // Remaining Knives (Bottom Left)
    drawKnivesIndicator(p);
}

function drawKnivesIndicator(p) {
    const startX = 30;
    const startY = CANVAS_HEIGHT - 40;
    const spacing = 15;
    
    for (let i = 0; i < gameState.knivesRemaining + (gameState.activeKnife?.state === "READY" ? 1 : 0); i++) {
        // Draw icon representing available knife
        p.fill(100, 100, 120);
        if (i < gameState.knivesRemaining) p.fill(200, 200, 220); // Active ones brighter
        
        p.noStroke();
        p.rect(startX, startY - (i * spacing), 6, 12);
    }
}

export function renderStartScreen(p) {
    p.background(GAME_CONFIG.colors.bg);
    
    // Replace title with "press enter to begin"
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40); // Simple and clean styling
    p.fill(255);
    p.noStroke(); // Remove stroke for cleaner look
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(50, 255, 50);
        p.text("STAGE CLEAR!", CANVAS_WIDTH / 2, 150);
    } else {
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
    }
    
    p.textSize(30);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Stage: ${gameState.stage}`, CANVAS_WIDTH / 2, 260);
    
    p.textSize(20);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, 320);
    p.pop();
}