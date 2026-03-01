/**
 * ui.js
 * Renders the Heads-Up Display (HUD) and various game screens (Start, Pause, Game Over).
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD - Health Bar
    if (gameState.player) {
        const hpPct = gameState.player.health / gameState.player.maxHealth;
        const barW = 200;
        const barH = 20;
        const x = 50;
        const y = 30;

        // Frame
        p.stroke(255);
        p.strokeWeight(3);
        p.fill(0, 0, 0, 150);
        p.rect(x, y, barW, barH); // Bg
        
        // Fill
        p.noStroke();
        p.fill(COLORS.healthBarPlayer);
        p.rect(x + 2, y + 2, (barW - 4) * Math.max(0, hpPct), barH - 4);
        
        // Portrait
        p.stroke(255);
        p.fill(COLORS.playerTunic);
        p.circle(x - 20, y + 10, 40);
        // Face
        p.fill(COLORS.playerSkin);
        p.rect(x - 25, y + 5, 10, 10);
        
        // Score
        p.fill(255);
        p.textSize(20);
        p.stroke(0);
        p.strokeWeight(2);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Score: ${gameState.score}`, x, y + 30);
        p.text(`Wave: ${gameState.levelManager.currentWaveIndex + 1}`, x + 150, y + 30);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(60);
    p.text("KINGDOM CRASHERS", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    // Subtitle
    p.textSize(24);
    p.strokeWeight(2);
    p.fill(200, 200, 255);
    p.text("Defend the Realm!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Prompt
    const pulse = Math.sin(p.frameCount * 0.1);
    p.textSize(20 + pulse * 2);
    p.fill(255, 255, 0);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    // Instructions
    p.textSize(14);
    p.fill(200);
    p.noStroke();
    p.text("Arrows: Move | Space: Jump | Z: Attack | Shift: Block", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGameOver(p, win) {
    // Overlay
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(0);
    p.strokeWeight(4);
    
    if (win) {
        p.fill(255, 255, 0);
        p.textSize(60);
        p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.textSize(24);
        p.fill(255);
        p.text("The Kingdom is Safe", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    } else {
        p.fill(200, 0, 0);
        p.textSize(60);
        p.text("DEFEAT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.textSize(24);
        p.fill(255);
        p.text("The Castle Has Fallen", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
    
    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}