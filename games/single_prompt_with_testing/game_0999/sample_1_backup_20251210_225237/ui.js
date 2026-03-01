/**
 * User Interface rendering.
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';

export function renderUI(p, gameState) {
    // Top Bar Background
    p.noStroke();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 50);
    
    if (gameState.player) {
        const player = gameState.player;
        
        // Portrait / Name
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.LEFT, p.TOP);
        p.text(player.characterType, 10, 10);
        
        // Health Bar
        const barW = 150;
        const barH = 15;
        p.fill(PALETTE.uiBarBg);
        p.rect(100, 10, barW, barH);
        p.fill(PALETTE.uiHealth);
        const hpPct = Math.max(0, player.health / player.maxHealth);
        p.rect(100, 10, barW * hpPct, barH);
        
        // Score
        p.fill(255);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
    }
}

export function renderStartScreen(p) {
    p.background(10, 5, 10);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(200, 50, 50);
    p.textSize(40);
    p.text("CURSE OF THE MOON", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(255);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(12);
    p.text("Controls: Arrows to Move, Space to Jump, Z to Attack, Shift to Switch", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    if (win) {
        p.fill(50, 200, 50);
        p.text("DEMON DEFEATED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(200, 50, 50);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}