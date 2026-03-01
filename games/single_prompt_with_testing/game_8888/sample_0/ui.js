/**
 * User Interface rendering.
 * HUD, Menus, Overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // Score
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${Math.floor(gameState.score)}`, 20, 20);
    p.text(`Dist: ${Math.floor(gameState.distanceTraveled)}m`, 20, 50);
    
    // Health Bar
    const hpX = 20;
    const hpY = 80;
    const hpWidth = 200;
    const hpHeight = 20;
    
    // Background
    p.noStroke();
    p.fill(0, 0, 0, 100);
    p.rect(hpX, hpY, hpWidth, hpHeight, 10);
    
    // Fill
    if (gameState.player) {
        const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
        p.fill(PALETTE.RED_JELLY);
        p.rect(hpX, hpY, hpWidth * hpPct, hpHeight, 10);
    }
    
    // Icon (Simplified Head)
    p.fill(PALETTE.COOKIE_BODY);
    p.circle(hpX - 10, hpY + 10, 30);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(PALETTE.SKY_BOTTOM);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(PALETTE.GROUND_TOP);
    p.stroke(255);
    p.strokeWeight(4);
    p.textSize(48);
    p.text("COOKIE KINGDOM", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.text("DEFENSE", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 50);
    
    // Prompt
    p.noStroke();
    p.fill(PALETTE.ENEMY_CAKE);
    p.textSize(20);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
    
    p.textSize(14);
    p.text("Arrows: Move | Space: Jump | Z: Attack | Shift: Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.85);
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(255);
    p.strokeWeight(4);
    p.textSize(48);
    
    if (win) {
        p.fill(PALETTE.GRASS);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(PALETTE.RED_JELLY);
        p.text("COOKIE CRUMBLED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.noStroke();
    p.textSize(24);
    p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}