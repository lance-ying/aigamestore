/**
 * ui.js
 * Rendering for HUD, Start Screen, etc.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { HexMath, drawHex } from './utils.js';

export function renderUI(p) {
    if (gameState.gamePhase === 'START') {
        renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED' || gameState.gamePhase.startsWith('GAME_OVER')) {
        renderHUD(p);
        renderCursor(p);
        
        if (gameState.gamePhase === 'PAUSED') renderPaused(p);
        if (gameState.gamePhase.startsWith('GAME_OVER')) renderGameOver(p);
    }
}

function renderStartScreen(p) {
    p.background(10, 5, 15);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Decorative Hexes
    p.stroke(40);
    p.noFill();
    for(let i=0; i<5; i++) {
        drawHex(p, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 100 + i*20, "stroke", p.color(40, 40, 60));
    }

    p.fill(0, 200, 255);
    p.textSize(48);
    p.text("UNDERWORLD TACTICS", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(200);
    p.textSize(16);
    p.text("Descend into the depths. Outsmart the legion.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(255, 200, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

function renderHUD(p) {
    // Stats Bar
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Level: ${gameState.level}`, 20, 20);
    p.text(`Score: ${gameState.score}`, 120, 20);
    
    // HP
    if (gameState.player) {
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(`HP: ${gameState.player.hp}/${gameState.player.maxHp}`, CANVAS_WIDTH - 20, 20);
    }
    
    // Controls Hint
    p.fill(255, 255, 255, 100);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Arrows: Select | Space: Move/Attack | Shift+Space: Jump | Z: Wait", CANVAS_WIDTH/2, CANVAS_HEIGHT - 10);
}

function renderCursor(p) {
    if (!gameState.cursor.visible || !gameState.grid) return;
    
    const tile = gameState.grid.getTile(gameState.cursor.q, gameState.cursor.r);
    if (!tile) return;
    
    const pulse = 150 + Math.sin(p.frameCount * 0.1) * 100;
    
    // Draw Cursor selection
    p.noFill();
    p.stroke(255, pulse);
    p.strokeWeight(3);
    drawHex(p, tile.pixelX, tile.pixelY, 22, "stroke", p.color(255, pulse));
    
    // Draw path line from player to cursor?
    if (gameState.player) {
        const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
        const dist = HexMath.distance(pTile, tile);
        
        // Color code valid move
        if (dist === 1) {
            p.stroke(0, 255, 0, 100);
            p.line(gameState.player.pixelX, gameState.player.pixelY, tile.pixelX, tile.pixelY);
        } else if (dist === 2) {
            p.stroke(255, 200, 0, 100); // Jump range
            // Dashed line logic could go here
             p.line(gameState.player.pixelX, gameState.player.pixelY, tile.pixelX, tile.pixelY);
        }
    }
}

function renderPaused(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderGameOver(p) {
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(win ? p.color(100, 255, 100) : p.color(255, 50, 50));
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(win ? "VICTORY!" : "YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}