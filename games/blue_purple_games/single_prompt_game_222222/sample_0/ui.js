/**
 * ui.js
 * Renders all game screens and the Heads-Up Display (HUD).
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ATTACK_RANGE, COLOR_UI_ACCENT, FURY_MAX } from './globals.js';
import { formatScore } from './utils.js'; // Correctly import formatScore from utils.js

export function renderUI(p) {
    p.push();
    
    // 1. Attack Range Indicators (Ground Markers)
    const centerX = CANVAS_WIDTH / 2;
    const groundY = 320;
    
    p.strokeWeight(2);
    // Left Marker
    p.stroke(255, 255, 255, 100);
    if (gameState.leftSideEnemies.length > 0 && Math.abs(gameState.leftSideEnemies[0].x - centerX) < ATTACK_RANGE) {
        p.stroke(0, 255, 0, 200); // Green if enemy in range
    }
    p.line(centerX - ATTACK_RANGE, groundY - 10, centerX - ATTACK_RANGE, groundY + 10);
    
    // Right Marker
    p.stroke(255, 255, 255, 100);
    if (gameState.rightSideEnemies.length > 0 && Math.abs(gameState.rightSideEnemies[0].x - centerX) < ATTACK_RANGE) {
        p.stroke(0, 255, 0, 200);
    }
    p.line(centerX + ATTACK_RANGE, groundY - 10, centerX + ATTACK_RANGE, groundY + 10);

    // 2. HUD
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.noStroke();
    p.text(`SCORE: ${formatScore(gameState.score)}`, 20, 20);
    
    // Combo (Centered, Scales with size)
    if (gameState.combo > 1) {
        p.textAlign(p.CENTER, p.TOP);
        let size = Math.min(60, 20 + gameState.combo * 2);
        p.textSize(size);
        p.fill(COLOR_UI_ACCENT);
        p.text(`${gameState.combo} HITS`, CANVAS_WIDTH/2, 50);
    }
    
    // Health Bar
    const hpW = 200;
    const hpH = 15;
    const hpX = CANVAS_WIDTH / 2 - hpW / 2;
    const hpY = 20;
    
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(hpX, hpY, hpW, hpH);
    
    if (gameState.player) {
        const hpRatio = gameState.player.health / gameState.player.maxHealth;
        p.fill(255 - hpRatio * 255, hpRatio * 255, 0); // Red to Green
        p.noStroke();
        p.rect(hpX + 2, hpY + 2, (hpW - 4) * hpRatio, hpH - 4);
    }
    
    // Fury Meter (Bottom)
    const furyW = 300;
    const furyH = 10;
    const furyX = CANVAS_WIDTH/2 - furyW/2;
    const furyY = CANVAS_HEIGHT - 30;
    
    p.noFill();
    p.stroke(255, 100);
    p.rect(furyX, furyY, furyW, furyH);
    
    const furyRatio = gameState.furyMeter / FURY_MAX;
    if (furyRatio >= 1.0) {
        p.fill(0, 200, 255); // Blue glowing when ready
        // Pulse effect
        if (p.frameCount % 20 < 10) p.fill(255);
    } else {
        p.fill(0, 100, 255);
    }
    p.rect(furyX, furyY, furyW * furyRatio, furyH);
    
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.fill(255, 150);
    p.text("FURY METER (SPACE)", CANVAS_WIDTH/2, furyY - 5);
    
    // Stun Indicator
    if (gameState.isMissStunned) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(40);
        p.fill(200);
        p.text("MISSED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }

    p.pop();
}

export function renderStartScreen(p) {
    p.background(0, 0, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLOR_UI_ACCENT);
    p.textSize(48);
    p.text("STICKMAN FURY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(24);
    p.text("TWO-FINGER DEATH PUNCH", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(16);
    p.text("LEFT ARROW / RIGHT ARROW to Attack", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("Wait for enemies to enter range!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 120);
    }
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOverScreen(p) {
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 50, 50);
    p.textSize(50);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(30);
    p.text(`Final Score: ${formatScore(gameState.score)}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.textSize(20);
    p.text(`Max Combo: ${gameState.maxCombo}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.fill(COLOR_UI_ACCENT);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
}