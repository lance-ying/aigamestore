/**
 * User Interface rendering: Start Screen, HUD, Game Over, Paused.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.background(10, 10, 15);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Replace title with simple message
    p.textSize(24); // Slightly smaller than original title, but prominent
    p.fill(255, 200, 50); // Keep similar color to original title
    p.noStroke(); // No stroke for simplicity
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
        p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2); // Centered where title was
    }
    
    // Keep controls section (in-canvas tips)
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
        drawHealthBar(p, CANVAS_WIDTH - 220, 20, enemy.health, enemy.maxHealth, "CPU Lvl " + enemy.level, [255, 50, 50]);
    }
    
    // Score / Timer
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.text("SCORE: " + gameState.score, CANVAS_WIDTH/2, 10);
    p.textSize(14);
    p.text("STAGE " + gameState.stage, CANVAS_WIDTH/2, 35);
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
    
    p.textSize(24);
    p.fill(200);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(18);
    p.fill(255);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}