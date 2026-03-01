// ui.js
// User Interface and HUD

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

export function renderUI(p) {
    if (gameState.gamePhase === GAME_PHASES.START) {
        renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
        renderHUD(p);
        if (gameState.gamePhase === GAME_PHASES.PAUSED) {
            renderPauseScreen(p);
        }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        renderWinScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        // Technically not used often
        renderLoseScreen(p);
    }
}

function renderStartScreen(p) {
    p.background(10, 10, 20);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("ASCENT OF THE KING", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.fill(200);
    p.text("Reach the top. Do not fall.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(14);
    p.fill(150);
    p.text("ARROWS to Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("Hold SPACE to Charge Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.text("No control in air!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
}

function renderHUD(p) {
    // Height Meter
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    
    if (gameState.player) {
        // Calculate height (inverted Y)
        const height = Math.floor((gameState.worldHeight - gameState.player.y) / 10);
        p.text(`Height: ${height}m`, 10, 10);
        p.text(`Falls: ${gameState.falls}`, 10, 30);
    }
    
    // Charge Bar (if charging)
    if (gameState.player && gameState.player.charging) {
        const barW = 40;
        const barH = 6;
        const ratio = gameState.player.chargeTimer / gameState.player.maxChargeTime;
        
        const px = gameState.player.x - gameState.camera.x - (barW - gameState.player.width)/2;
        const py = gameState.player.y - gameState.camera.y - 15;
        
        p.noStroke();
        p.fill(50);
        p.rect(px, py, barW, barH);
        p.fill(255, 200, 0);
        p.rect(px, py, barW * ratio, barH);
    }
}

function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

function renderWinScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 215, 0); // Gold
    p.textSize(40);
    p.text("LEGENDARY SUCCESS!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(255);
    p.textSize(18);
    p.text(`You reached the top with ${gameState.falls} falls.`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(200);
    p.textSize(16);
    p.text("The babe was a pixel all along.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.fill(255);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
}

function renderLoseScreen(p) {
    // Basic screen just in case
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.fill(255);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}