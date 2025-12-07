// ui.js - User Interface
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.resetMatrix(); // Ensure UI is drawn on top screen space
    
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255, 255, 100);
    p.noStroke();
    p.text(`Spores: ${gameState.score}`, 10, 10);

    // Tutorial text in start area
    // Just a simple check if player is near start
    if (gameState.player && gameState.player.x < 300) {
        p.textAlign(p.CENTER);
        p.fill(255, 255, 255, 150);
        p.textSize(14);
        p.text("Arrows: Move | Space: Jump | Z: Bomb", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    // Background gradient
    drawBackground(p);
    
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(60);
    p.fill(100, 255, 100);
    p.stroke(0);
    p.strokeWeight(4);
    p.text("Öoo", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(24);
    p.fill(200, 255, 200);
    p.noStroke();
    p.text("The Bomb Caterpillar", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(16);
    p.fill(255);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    // Instructions
    p.textSize(14);
    p.fill(200);
    p.text("Collect Star Spores and find the Golden Leaf!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderGameOver(p, won) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (won) {
        p.textSize(48);
        p.fill(255, 215, 0);
        p.text("YOU WIN!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.fill(255);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.textSize(48);
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.fill(255);
        p.text("Öoo has perished...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.textSize(16);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.fill(255);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

// Background render helper
export function drawBackground(p) {
    // Dark underground theme
    p.background(20, 15, 25);
    
    // Distant shapes/particles could go here
    p.noStroke();
    p.fill(30, 25, 40);
    p.circle(100, 100, 200);
    p.circle(500, 300, 300);
}