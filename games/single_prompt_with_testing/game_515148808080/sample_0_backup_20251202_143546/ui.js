/**
 * ui.js
 * Renders the Heads-Up Display and Menus.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

export function renderUI(p) {
    const phase = gameState.gamePhase;

    // Always draw HUD if playing or paused or game over
    if (phase !== 'START') {
        drawHUD(p);
    }

    // Overlays
    if (phase === 'START') {
        drawStartScreen(p);
    } else if (phase === 'PAUSED') {
        drawPausedScreen(p);
    } else if (phase === 'GAME_OVER_WIN' || phase === 'GAME_OVER_LOSE') {
        drawGameOverScreen(p);
    }
}

function drawHUD(p) {
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    
    // Score Background
    p.fill(COLORS.HUD_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);

    // Score
    p.fill(COLORS.COIN);
    p.text(`SCORE: ${gameState.score}`, 20, 12);

    // Rooms
    p.fill(COLORS.TEXT);
    p.text(`ROOM: ${gameState.roomsCleared + 1}`, 200, 12);

    // Lives
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`LIVES: ${gameState.lives}`, CANVAS_WIDTH - 20, 12);
    
    p.pop();
}

function drawStartScreen(p) {
    p.push();
    p.background(COLORS.BACKGROUND);
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(40);
    p.fill(COLORS.PLAYER_ACCENT);
    p.text("PLATFORM PANIC", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.fill(COLORS.COIN);
    p.text("PROTOCOL", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);

    // Prompt
    p.textSize(20);
    p.fill(COLORS.TEXT);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);

    p.textSize(14);
    p.fill(150);
    p.text("ARROWS to Move/Jump", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
    
    p.pop();
}

function drawPausedScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}

function drawGameOverScreen(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === 'GAME_OVER_LOSE') {
        p.fill(COLORS.PLAYER_ACCENT);
        p.textSize(40);
        p.text("SYSTEM FAILURE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(COLORS.EXIT);
        p.textSize(40);
        p.text("TEST COMPLETE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }

    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text(`Rooms Cleared: ${gameState.roomsCleared}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(16);
    p.fill(150);
    p.text("PRESS 'R' TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);

    p.pop();
}