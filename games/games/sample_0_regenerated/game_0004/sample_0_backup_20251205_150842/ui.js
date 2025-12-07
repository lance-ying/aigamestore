/**
 * UI Rendering system.
 * Handles Start Screen, HUD, Pause Screen, and Game Over.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WIN_DEPTH, GUN_AMMO_MAX } from './globals.js';

export function renderUI(p) {
    switch (gameState.gamePhase) {
        case "START":
            renderStartScreen(p);
            break;
        case "PLAYING":
            renderHUD(p);
            break;
        case "PAUSED":
            renderHUD(p);
            renderPauseScreen(p);
            break;
        case "GAME_OVER_WIN":
            renderHUD(p);
            renderGameOver(p, true);
            break;
        case "GAME_OVER_LOSE":
            renderHUD(p);
            renderGameOver(p, false);
            break;
    }
}

function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.PLAYER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("VERTICAL VENTURE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Description
    p.fill(200);
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Plummet down the well. Blast monsters. Collect gems.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text("Use Gunboots to slow your fall!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    // Prompt
    p.fill(255);
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.7);
    }
    
    // Controls Hint
    p.textSize(12);
    p.fill(150);
    p.text("Arrows: Move | Space: Shoot/Jump | Shift: Fall Fast", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderHUD(p) {
    p.push();
    p.resetMatrix(); // Ensure HUD is static relative to screen
    
    // Health
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(COLORS.UI_TEXT);
    p.text("HP:", 10, 10);
    
    if (gameState.player) {
        for (let i = 0; i < gameState.player.maxHealth; i++) {
            if (i < gameState.player.health) {
                p.fill(COLORS.PLAYER_HURT); // White/Red heart
            } else {
                p.fill(50); // Empty heart
            }
            p.rect(50 + i * 25, 12, 20, 15);
        }
        
        // Ammo Bar
        const ammoPct = gameState.player.ammo / GUN_AMMO_MAX;
        p.fill(COLORS.UI_BAR_BG);
        p.rect(10, 40, 100, 10);
        p.fill(COLORS.UI_BAR_FILL);
        p.rect(10, 40, 100 * ammoPct, 10);
    }
    
    // Score & Depth
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(COLORS.UI_TEXT);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
    p.text(`DEPTH: ${Math.floor(gameState.depth)}m / ${WIN_DEPTH}m`, CANVAS_WIDTH - 10, 35);
    
    // Combo
    if (gameState.combo > 1) {
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(24);
        p.fill(255, 255, 0);
        p.text(`${gameState.combo} COMBO!`, CANVAS_WIDTH / 2, 60);
    }
    
    p.pop();
}

function renderPauseScreen(p) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}

function renderGameOver(p, win) {
    p.push();
    p.resetMatrix();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(win ? COLORS.PLAYER : COLORS.ENEMY_FLYER);
    p.textSize(50);
    p.text(win ? "MISSION ACCOMPLISHED" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    p.pop();
}