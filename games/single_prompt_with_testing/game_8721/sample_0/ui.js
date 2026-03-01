/**
 * ui.js
 * Renders the User Interface overlays.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderUI(p) {
    // HUD (Always visible in game)
    if (gameState.gamePhase !== "START") {
        renderHUD(p);
    }

    switch (gameState.gamePhase) {
        case "START":
            renderStartScreen(p);
            break;
        case "PAUSED":
            renderPausedScreen(p);
            break;
        case "GAME_OVER_WIN":
            renderWinScreen(p);
            break;
        case "GAME_OVER_LOSE":
            renderLoseScreen(p);
            break;
    }
}

function renderHUD(p) {
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.textStyle(p.BOLD);
    
    // Score
    p.stroke(0);
    p.strokeWeight(3);
    p.fill(255);
    p.text(`SCORE: ${gameState.score}`, 20, 20);
    
    // Coins
    p.fill(COLORS.COIN);
    p.text(`COINS: ${gameState.coins}`, 20, 50);
    
    // Distance/Time simulation
    const dist = Math.floor(gameState.player.x / 10);
    p.fill(200, 200, 200);
    p.text(`DIST: ${dist}m`, 20, 80);
    
    p.pop();
}

function renderStartScreen(p) {
    // Background gradient
    drawGradient(p, COLORS.SKY, [255, 255, 255]);
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(0);
    p.strokeWeight(4);
    p.fill(255);
    
    p.textSize(50);
    p.text("SUPER PLUMBER RUN", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(20);
    p.strokeWeight(2);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200, 200, 200);
    p.noStroke();
    p.text("SPACE to Jump | Z to Spin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

function renderPausedScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

function renderWinScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(50, 255, 50);
    p.stroke(0);
    p.strokeWeight(3);
    p.text("COURSE CLEAR!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(24);
    p.fill(255);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(18);
    p.text("Press R to Play Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}

function renderLoseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255, 50, 50);
    p.stroke(0);
    p.strokeWeight(3);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(18);
    p.fill(255);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.pop();
}

function drawGradient(p, c1, c2) {
    p.push();
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
        let inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        let c = p.lerpColor(p.color(...c1), p.color(...c2), inter);
        p.stroke(c);
        p.line(0, y, CANVAS_WIDTH, y);
    }
    p.pop();
}