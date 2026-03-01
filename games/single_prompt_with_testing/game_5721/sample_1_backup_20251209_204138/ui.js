/**
 * User Interface Rendering
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // Heads Up Display (HUD) during gameplay
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        drawHUD(p);
    }

    // Screens
    if (gameState.gamePhase === "START") {
        drawStartScreen(p);
    } else if (gameState.gamePhase === "PAUSED") {
        drawPauseScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        drawWinScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawLoseScreen(p);
    }
}

function drawHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure UI draws over everything in screen space
    
    // Top Bar Background
    p.fill(COLORS.HUD_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 50);
    
    // Score
    p.fill(COLORS.TEXT);
    p.textSize(20);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`SCORE: ${gameState.score}`, 20, 25);
    
    // Orbs
    p.fill(COLORS.COLLECTIBLE);
    p.circle(200, 25, 10);
    p.fill(COLORS.TEXT);
    p.text(`x ${gameState.orbsCollected}`, 215, 25);
    
    // Energy Bar (Boost)
    if (gameState.player) {
        p.fill(50);
        p.rect(CANVAS_WIDTH - 160, 15, 140, 20, 5);
        p.fill(0, 255, 255);
        p.rect(CANVAS_WIDTH - 160, 15, 140 * (gameState.player.energy / 100), 20, 5);
        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("ENERGY", CANVAS_WIDTH - 90, 25);
    }
    
    p.pop();
}

function drawStartScreen(p) {
    p.push();
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(60);
    p.fill(COLORS.PLAYER);
    p.stroke(255);
    p.strokeWeight(4);
    p.text("GO ESCAPE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    // Subtitle
    p.noStroke();
    p.fill(255);
    p.textSize(20);
    p.text("Neon Physics Platformer", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    // Instructions
    p.textSize(16);
    p.fill(200);
    p.text("Arrows to Move | Space to Jump | Z to Boost", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    // Blink Effect
    if (p.frameCount % 60 < 30) {
        p.fill(COLORS.GOAL);
        p.textSize(24);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 120);
    }
    p.pop();
}

function drawPauseScreen(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

function drawWinScreen(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.GOAL);
    p.textSize(50);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    if (p.frameCount % 60 < 40) {
        p.textSize(18);
        p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    }
    p.pop();
}

function drawLoseScreen(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.SPIKE);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(18);
    p.text("You hit a hazard or fell into the void.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(24);
    p.text("Press R to Try Again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}