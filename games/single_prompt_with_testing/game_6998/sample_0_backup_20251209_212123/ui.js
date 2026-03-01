/**
 * ui.js
 * Handles rendering of all UI elements (HUD, Start Screen, etc.)
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(COLORS.text);
    p.noStroke();
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Energy Bar
    p.fill(0, 0, 0, 100);
    p.rect(20, 50, 100, 10, 5);
    p.fill(0, 255, 255);
    p.rect(20, 50, gameState.player.energy, 10, 5);
    p.stroke(255);
    p.strokeWeight(1);
    p.noFill();
    p.rect(20, 50, 100, 10, 5);
    
    // Health (Hearts)
    for (let i = 0; i < 3; i++) {
        if (i < gameState.player.health) {
            p.fill(255, 50, 50);
        } else {
            p.fill(50);
        }
        p.noStroke();
        p.circle(150 + i * 25, 30, 15);
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    
    // Decorative circles
    p.noFill();
    p.stroke(255, 255, 255, 20);
    p.strokeWeight(2);
    for(let i=0; i<5; i++) {
        p.circle(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 200 + i*40 + Math.sin(p.frameCount * 0.05) * 20);
    }

    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.player);
    p.textSize(40);
    p.noStroke();
    p.text("PHANTOM CAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(255);
    p.textSize(24);
    p.text("ADVENTURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    if (p.frameCount % 60 < 30) {
        p.textSize(18);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    p.textSize(14);
    p.fill(200);
    p.text("Controls: Arrows to Move, Space to Jump, Z to Shoot, Shift to Sprint", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(0, 255, 0);
        p.textSize(40);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(255, 0, 0);
        p.textSize(40);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}