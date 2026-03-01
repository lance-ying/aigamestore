/**
 * User Interface rendering: Start Screen, HUD, Game Over, Paused.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.background(10, 10, 15);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Animated Title
    p.push();
    p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.rotate(Math.sin(p.frameCount * 0.05) * 0.05);
    p.scale(1 + Math.sin(p.frameCount * 0.1) * 0.05);
    p.textSize(48);
    p.fill(255, 200, 50);
    p.stroke(255);
    p.strokeWeight(2);
    p.text("A FEW QUICK MATCHES", 0, 0);
    p.pop();

    p.textSize(16);
    p.noStroke();
    p.fill(200);
    p.text("Fast-paced Stick Figure Fighting Action", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(18);
    p.fill(100, 255, 100);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
    
    p.textSize(14);
    p.fill(150);
    p.text("ARROWS to Move | Z to Attack | SPACE to Jump | SHIFT to Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
    p.text("Chain attacks into Dashes for massive combos!", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
}

export function renderHUD(p) {
    if (!gameState.player) return;

    // Player Health
    drawHealthBar(p, 20, 20, gameState.player.health, gameState.player.maxHealth, "PLAYER", [50, 255, 100]);
    
    // Enemy Health (Assuming 1 enemy for now)
    if (gameState.enemies.length > 0) {
        const enemy = gameState.enemies[0];
        drawHealthBar(p, CANVAS_WIDTH - 220, 20, enemy.health, enemy.maxHealth, "CPU", [255, 50, 50]);
    }
    
    // Score / Timer
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    // p.text(gameState.score, CANVAS_WIDTH/2, 20);
}

function drawHealthBar(p, x, y, current, max, label, color) {
    const w = 200;
    const h = 20;
    
    // Name
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(14);
    p.fill(255);
    p.noStroke();
    p.text(label, x, y - 5);
    
    // Bar BG
    p.fill(50);
    p.rect(x, y, w, h);
    
    // Bar Fill
    const fillW = Math.max(0, (current / max) * w);
    p.fill(color);
    p.rect(x, y, fillW, h);
    
    // Border
    p.noFill();
    p.stroke(200);
    p.strokeWeight(2);
    p.rect(x, y, w, h);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(100, 255, 100);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 50, 50);
        p.text("DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.textSize(18);
    p.fill(255);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}