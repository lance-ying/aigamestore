/**
 * User Interface Rendering.
 * Handles Start Screen, HUD, Pause Overlay, and Game Over screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === "START") {
        renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
        renderHUD(p);
        if (gameState.gamePhase === "PAUSED") renderPauseOverlay(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
        renderHUD(p); // Show hud still
        renderGameOver(p);
    }
}

function renderStartScreen(p) {
    p.background(10, 10, 20);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("FROG FIXER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(255);
    p.textSize(18);
    p.text("Mission: Repair Teleporter 42", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.text("Sector: Industrial Ruins", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.fill(200, 200, 200);
    p.textSize(14);
    p.text("Arrows to Move | Z to Shoot | Space to Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
    
    p.textSize(20);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
    }
}

function renderHUD(p) {
    // Health Bar
    const hp = gameState.player ? gameState.player.health : 0;
    const maxHp = gameState.player ? gameState.player.maxHealth : 100;
    
    p.textAlign(p.LEFT, p.TOP);
    p.noStroke();
    
    // Bar Background
    p.fill(50, 0, 0);
    p.rect(20, 20, 200, 20);
    
    // Bar Fill
    p.fill(255, 50, 50);
    const fillWidth = (hp / maxHp) * 200;
    p.rect(20, 20, Math.max(0, fillWidth), 20);
    
    // Text
    p.fill(255);
    p.textSize(16);
    p.text("LIFE", 20, 5);
    
    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.text("SCORE: " + gameState.score, CANVAS_WIDTH - 20, 20);
}

function renderPauseOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(100, 255, 100);
        p.textSize(48);
        p.text("MISSION COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 50, 50);
        p.textSize(48);
        p.text("MISSION FAILED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}