/**
 * ui.js
 * Renders the Heads-Up Display and Menus.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        renderHUD(p);
        if (gameState.gamePhase === "PAUSED") renderPaused(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
        renderHUD(p); // Show score still
        renderGameOver(p);
    }
}

function renderStartScreen(p) {
    p.push();
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(200, 50, 50);
    p.textSize(48);
    p.text("RED DUNGEON", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.fill(255);
    p.textSize(24);
    p.text("ESCAPE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    // Instructions
    p.textSize(16);
    p.fill(180);
    p.text("Outrun the crushing wall. Avoid traps.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    
    p.textSize(12);
    p.fill(100);
    p.text("Arrows to Move | Space to Wait", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
    p.pop();
}

function renderHUD(p) {
    p.push();
    
    // Top Bar Background
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Coins
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.coinsCollected}`, 150, 20);
    
    // Distance Warning (Doom Wall proximity)
    if (gameState.player) {
        const distToWall = gameState.player.x - gameState.doomWallX;
        if (distToWall < 300) {
            const urgency = p.map(distToWall, 0, 300, 255, 0);
            p.fill(255, 0, 0, urgency);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("!!! RUN !!!", CANVAS_WIDTH/2, 20);
        }
    }
    
    p.pop();
}

function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(win ? [50, 255, 50] : [255, 50, 50]);
    p.text(win ? "ESCAPED!" : "YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(20);
    p.fill(255);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(16);
    p.fill(180);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}