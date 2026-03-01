/**
 * User Interface: HUD, Metronome, Menus
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, HUD_HEIGHT, COLORS, BPM, TILE_SIZE } from './globals.js';
import { rhythmManager } from './rhythm.js';

export function renderUI(p) {
    // Background bar
    p.fill(0);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(0, CANVAS_HEIGHT - HUD_HEIGHT, CANVAS_WIDTH, HUD_HEIGHT);
    
    // Heart/Metronome
    renderMetronome(p);
    
    // Stats
    p.noStroke();
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    
    // Health (Hearts)
    let heartStr = "HP: ";
    for(let i=0; i<gameState.maxHealth; i++) {
        if (i < gameState.health) heartStr += "♥ ";
        else heartStr += "♡ ";
    }
    p.fill(255, 50, 50);
    p.text(heartStr, 20, CANVAS_HEIGHT - HUD_HEIGHT/2);
    
    // Score & Multiplier
    // Moved to the right to avoid overlapping with hearts
    p.fill(255, 215, 0);
    p.text(`Score: ${gameState.score}`, 280, CANVAS_HEIGHT - HUD_HEIGHT/2);
    
    if (gameState.multiplier > 1) {
        p.fill(0, 255, 255);
        p.textSize(20);
        p.text(`x${gameState.multiplier}`, 380, CANVAS_HEIGHT - HUD_HEIGHT/2);
    }
    
    // Combo
    if (gameState.combo > 0) {
        p.fill(255);
        p.textSize(12);
        p.text(`Combo: ${gameState.combo}`, 430, CANVAS_HEIGHT - HUD_HEIGHT/2);
    }

    // Level
    p.fill(200);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Level ${gameState.level}/${gameState.maxLevels}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - HUD_HEIGHT/2);
}

function renderMetronome(p) {
    const barCenterY = CANVAS_HEIGHT - HUD_HEIGHT/2;
    const barCenterX = CANVAS_WIDTH / 2 + 100;
    const barWidth = 200;
    const barHeight = 20;
    
    // Beat marker center
    p.fill(50);
    p.stroke(100);
    p.rectMode(p.CENTER);
    p.rect(barCenterX, barCenterY, barWidth, barHeight);
    
    // Target Line
    p.stroke(255);
    p.strokeWeight(3);
    p.line(barCenterX, barCenterY - 15, barCenterX, barCenterY + 15);
    
    // Moving Bars
    // We want bars moving from sides to center.
    // Speed depends on BPM.
    // rhythmManager.beatProgress is 0->1. 
    // We visualize future beats.
    
    const offset = rhythmManager.getBeatOffset(); // -0.5 to 0.5
    // Ideally we want to show bars approaching.
    // Let's draw lines based on time.
    
    p.noStroke();
    p.fill(COLORS.BEAT_BAR);
    
    // Current Beat Pulse
    const pulseSize = 10 + (1 - Math.abs(offset * 2)) * 10;
    p.circle(barCenterX, barCenterY, pulseSize);
    
    // Approaching bars
    // Calculate position of coming beats
    // Time to next beat is (1 - beatProgress) * BEAT_MS
    
    // Simple visual: two bars closing in from left and right
    const progress = rhythmManager.beatProgress; // 0 to 1
    // If progress is 0.9, we are close to next beat.
    // Distance from center should be proportional to (1 - progress)
    
    const maxDist = barWidth / 2;
    const dist = (1 - progress) * maxDist;
    
    // Left bar moving right
    p.rect(barCenterX - dist, barCenterY, 4, 15);
    // Right bar moving left
    p.rect(barCenterX + dist, barCenterY, 4, 15);
    
    p.rectMode(p.CORNER); // Reset
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(40);
    p.text("Crypt of the Rhythm Knight", CANVAS_WIDTH/2, 100);
    
    p.textSize(16);
    p.fill(200);
    const desc = "Move to the beat! Use Arrow Keys.\nDon't miss the rhythm or you'll lose your combo.\nFind the Golden Stairs to escape.";
    p.text(desc, CANVAS_WIDTH/2, 180);
    
    p.textSize(20);
    p.fill(COLORS.BEAT_BAR);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 300);
    
    p.textSize(12);
    p.fill(100);
    p.text("Testing Mode: " + gameState.controlMode, CANVAS_WIDTH/2, 350);
}

export function renderGameOver(p, won) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (won) {
        p.fill(COLORS.GOLD);
        p.textSize(50);
        p.text("ESCAPED!", CANVAS_WIDTH/2, 150);
    } else {
        p.fill(255, 0, 0);
        p.textSize(50);
        p.text("DEFEATED", CANVAS_WIDTH/2, 150);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 300);
    p.pop();
}

export function renderPaused(p) {
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