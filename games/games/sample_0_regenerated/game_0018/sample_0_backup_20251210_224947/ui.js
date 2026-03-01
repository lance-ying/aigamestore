/**
 * UI Rendering: HUD, Start Screen, Game Over
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    p.push();
    // Reset matrix for HUD (draw on top of everything)
    p.resetMatrix();
    
    // Health Bar
    p.fill(50);
    p.rect(20, 20, 200, 20);
    p.fill(255, 0, 0);
    const hpPct = Math.max(0, gameState.player.health / gameState.player.maxHealth);
    p.rect(20, 20, 200 * hpPct, 20);
    p.noFill();
    p.stroke(255);
    p.rect(20, 20, 200, 20);
    
    // Text Info
    p.noStroke();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`BROS LEFT: INFINITE`, 20, 45);
    p.text(`GRENADES: ${gameState.player.grenades}`, 20, 65);
    p.text(`SCORE: ${gameState.score + (gameState.enemiesKilled * 100)}`, 20, 85);
    
    // Debug / Control Mode (optional, but good for feedback)
    // p.textAlign(p.RIGHT, p.TOP);
    // p.text(`MODE: ${gameState.controlMode}`, CANVAS_WIDTH - 20, 20);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(0);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255, 50, 50);
    p.textSize(48);
    p.text("BRO-OP MISSION", CANVAS_WIDTH/2, 120);
    p.fill(255);
    p.textSize(64);
    p.text("FREEDOM", CANVAS_WIDTH/2, 180);
    
    // Flashing text
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.textSize(24);
        p.text("PRESS ENTER TO LIBERATE", CANVAS_WIDTH/2, 300);
    }
    
    p.fill(150);
    p.textSize(16);
    p.text("Arrows to Move/Aim | Z to Shoot | Shift for Grenade", CANVAS_WIDTH/2, 350);
}

export function renderGameOver(p, win) {
    p.background(0, 0, 0, 200); // Overlay
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(0, 255, 0);
        p.textSize(50);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, 150);
        p.fill(255);
        p.textSize(20);
        p.text("Democracy has been served.", CANVAS_WIDTH/2, 200);
    } else {
        p.fill(255, 0, 0);
        p.textSize(50);
        p.text("M.I.A.", CANVAS_WIDTH/2, 150);
        p.fill(255);
        p.textSize(20);
        p.text("You died a hero.", CANVAS_WIDTH/2, 200);
    }
    
    p.textSize(24);
    p.fill(255, 255, 0);
    p.text("PRESS 'R' TO RESPAWN", CANVAS_WIDTH/2, 300);
}

export function renderPauseScreen(p) {
    p.background(0, 0, 0, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}