/**
 * ui.js
 * Handles rendering of user interface, HUD, and menu screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_MAX_HEALTH, PLAYER_MAX_STABILITY, UI_PADDING } from './globals.js';

/**
 * Renders the start screen.
 * @param {object} p - p5 instance
 */
export function renderStartScreen(p) {
    p.push();
    p.background(10, 10, 20);
    
    // Grid background effect
    drawGrid(p);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(0, 255, 200);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("NEON CORE RUNNER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    // Subtitle
    p.fill(200);
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Breach the firewall. Recover the data.", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
    
    // Instructions
    p.fill(255);
    p.textSize(20);
    
    let blink = p.frameCount % 60 < 30;
    if (blink) {
        p.text("PRESS [ENTER] TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
    
    p.textSize(12);
    p.fill(150);
    p.text("Controls: Arrows to Move, Space to Jump, Shift to Phase, Z to Shoot", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
    
    p.pop();
}

/**
 * Renders the In-Game HUD.
 */
export function renderHUD(p) {
    p.push();
    
    // 1. Health Bar
    const barW = 150;
    const barH = 15;
    const x = UI_PADDING;
    const y = UI_PADDING;
    
    if (gameState.player) {
        // Bg
        p.fill(50, 0, 0);
        p.stroke(100);
        p.rect(x, y, barW, barH);
        
        // Fill
        let hpPct = gameState.player.health / PLAYER_MAX_HEALTH;
        p.fill(255, 50, 50);
        p.noStroke();
        p.rect(x, y, barW * hpPct, barH);
        
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.LEFT, p.CENTER);
        p.text("INTEGRITY", x, y - 10);
        
        // 2. Stability Bar (Energy)
        const y2 = y + 30;
        p.fill(0, 50, 50);
        p.stroke(100);
        p.rect(x, y2, barW, barH);
        
        let stbPct = gameState.player.stability / PLAYER_MAX_STABILITY;
        p.fill(0, 255, 255);
        p.noStroke();
        p.rect(x, y2, barW * stbPct, barH);
        
        p.fill(255);
        p.text("STABILITY", x, y2 - 10);
    }
    
    // 3. Score
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(24);
    p.fill(255, 255, 0);
    p.text(`BITS: ${gameState.score}`, CANVAS_WIDTH - UI_PADDING, UI_PADDING);
    
    p.pop();
}

/**
 * Renders pause overlay.
 */
export function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("SYSTEM PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}

/**
 * Renders Game Over screen (Win/Lose).
 */
export function renderGameOver(p) {
    p.push();
    // Dark overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.textSize(50);
        p.text("SYSTEM RESTORED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.fill(255);
        p.textSize(20);
        p.text(`Data Recovered: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(255, 0, 0);
        p.textSize(50);
        p.text("CRITICAL ERROR", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.fill(255);
        p.textSize(20);
        p.text("Signal Lost...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.textSize(16);
    p.fill(150);
    p.text("Press [R] to Reboot System", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.pop();
}

function drawGrid(p) {
    p.stroke(30, 30, 50);
    p.strokeWeight(1);
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        p.line(0, y, CANVAS_WIDTH, y);
    }
}