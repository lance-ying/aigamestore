/**
 * ui.js
 * Handles rendering of user interface and different game screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE } from './globals.js';

export function renderUI(p) {
    // Persistent HUD (Score & Sector) - Always visible
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    
    // Floor info
    p.textSize(18);
    p.fill(255);
    p.text(`SECTOR ${gameState.currentFloor}`, CANVAS_WIDTH - 20, 20);
    
    // Score
    p.textSize(18);
    p.fill(255, 215, 0);
    p.stroke(0);
    p.strokeWeight(2);
    p.text(`CREDITS: ${gameState.score}`, CANVAS_WIDTH - 20, 45);
    p.pop();

    // Player Status HUD
    if (gameState.player) {
        const barW = 200;
        const barH = 20;
        const x = 20;
        const y = 20;
        
        p.push();
        // Health Bar BG
        p.fill(50, 0, 0);
        p.stroke(200, 200, 200);
        p.rect(x, y, barW, barH);
        
        // Health Bar Fill
        const ratio = gameState.player.health / gameState.player.maxHealth;
        if (ratio > 0) {
            p.fill(ratio < 0.3 ? [255, 0, 0] : [0, 200, 255]);
            p.noStroke();
            p.rect(x + 1, y + 1, (barW - 2) * ratio, barH - 2);
        }
        
        // Health Text
        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`${Math.ceil(gameState.player.health)} / ${gameState.player.maxHealth}`, x + barW/2, y + barH/2);
        
        // Boss Health Bar Overlay
        const boss = gameState.enemies.find(e => e.type === 'boss');
        if (boss) {
             const bw = 400;
             const bh = 15;
             const bx = (CANVAS_WIDTH - bw) / 2;
             const by = CANVAS_HEIGHT - 30;
             p.fill(0);
             p.stroke(255, 0, 0);
             p.rect(bx, by, bw, bh);
             p.fill(255, 0, 0);
             p.noStroke();
             p.rect(bx + 1, by + 1, (bw-2) * (boss.health / boss.maxHealth), bh - 2);
             p.fill(255);
             p.textAlign(p.CENTER);
             p.text("GUARDIAN", CANVAS_WIDTH/2, by - 5);
        }
        p.pop();
    }
}

export function renderStartScreen(p) {
    p.background(COLOR_PALETTE.background);
    
    // Grid effect
    drawGrid(p);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(0, 200, 255);
    p.textSize(40);
    p.text("STAR OF PROVIDENCE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(20);
    p.fill(100, 200, 255);
    p.text("SECTOR ZERO", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    
    // Instructions
    p.fill(255);
    p.textSize(16);
    if (p.frameCount % 60 < 30) {
        p.text("- PRESS ENTER TO INITIALIZE -", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    }
    
    p.textSize(12);
    p.fill(150);
    p.text("ARROWS: Move | Z: Fire | SPACE: Dash | SHIFT: Focus", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(30);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SYSTEM PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    if (win) {
        p.fill(0, 255, 0);
        p.textSize(40);
        p.text("MISSION ACCOMPLISHED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(16);
        p.fill(200, 255, 200);
        p.text("Providence Core Secured", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else {
        p.fill(255, 0, 0);
        p.textSize(40);
        p.text("CRITICAL FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(16);
        p.fill(255, 200, 200);
        p.text("Signal Lost...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(14);
    p.fill(150);
    p.text("Press R to Reboot System", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

function drawGrid(p) {
    p.stroke(30, 30, 40);
    p.strokeWeight(1);
    for(let x=0; x<CANVAS_WIDTH; x+=40) {
        p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for(let y=0; y<CANVAS_HEIGHT; y+=40) {
        p.line(0, y, CANVAS_WIDTH, y);
    }
}