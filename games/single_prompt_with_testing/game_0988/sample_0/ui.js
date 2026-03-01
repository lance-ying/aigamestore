/**
 * ui.js
 * Renders the Heads-Up Display (HUD) and game screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // 1. Health Bar
    const hpBarW = 150;
    const hpBarH = 15;
    const hpX = 20;
    const hpY = 20;
    
    // Background
    p.fill(50);
    p.rect(hpX, hpY, hpBarW, hpBarH);
    
    // Fill
    const hpPct = Math.max(0, gameState.player.hp / gameState.player.maxHp);
    p.fill(200, 50, 50);
    p.rect(hpX, hpY, hpBarW * hpPct, hpBarH);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(hpX, hpY, hpBarW, hpBarH);
    
    // Text
    p.noStroke();
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`HP: ${Math.ceil(gameState.player.hp)}/${gameState.player.maxHp}`, hpX + 5, hpY + hpBarH/2 + 1);

    // 2. XP Bar
    const xpY = hpY + 25;
    p.fill(50);
    p.rect(hpX, xpY, hpBarW, 8);
    
    const xpPct = Math.max(0, gameState.player.xp / gameState.player.xpToNextLevel);
    p.fill(255, 215, 0); // Gold
    p.rect(hpX, xpY, hpBarW * xpPct, 8);
    
    p.fill(255);
    p.text(`LVL ${gameState.player.level}`, hpX + hpBarW + 10, xpY + 4);

    // 3. Score
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(20);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    
    // 4. Debug info (optional)
    if (gameState.debugMode) {
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(10);
        p.text(`FPS: ${Math.floor(p.frameRate())}\nEntities: ${gameState.entities.length}`, 20, CANVAS_HEIGHT - 40);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.background);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(255, 50, 50);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("SLAY-IN-FINITE", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(255);
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.text("The Endless Action RPG", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    // Instructions
    p.textSize(16);
    p.fill(200);
    const boxY = CANVAS_HEIGHT/2 + 20;
    p.text("Arrows: Move   Space: Jump", CANVAS_WIDTH/2, boxY);
    p.text("Z: Attack   Shift: Dash", CANVAS_WIDTH/2, boxY + 25);
    p.text("ESC: Pause", CANVAS_WIDTH/2, boxY + 50);
    
    // Prompt
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.textSize(24);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
    }
}

export function renderGameOver(p, win=false) {
    p.push();
    p.fill(0, 0, 0, 200); // Overlay
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(50, 255, 50);
        p.textSize(48);
        p.text("YOU SURVIVED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    } else {
        p.fill(200, 50, 50);
        p.textSize(48);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text(`Level Reached: ${gameState.player ? gameState.player.level : 1}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.textSize(20);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
    
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
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