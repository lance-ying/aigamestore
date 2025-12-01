import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    // Score
    p.textAlign(p.LEFT, p.TOP);
    p.fill(COLORS.TEXT);
    p.noStroke();
    p.textSize(16);
    p.text(`SCORE: ${gameState.score}`, 10, 10);
    
    // Stones
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(COLORS.STONE);
    p.text(`STONES: ${gameState.stonesCollected} / ${gameState.totalStones}`, CANVAS_WIDTH - 10, 10);
    
    // Health Bar
    if (gameState.player) {
        const hp = gameState.player.health;
        const maxHp = gameState.player.maxHealth;
        const barWidth = 150;
        
        // Background
        p.fill(50);
        p.rect(10, 30, barWidth, 10);
        
        // Fill
        p.fill(hp > 30 ? [50, 255, 50] : [255, 50, 50]);
        p.rect(10, 30, barWidth * (hp / maxHp), 10);
        
        // Frame
        p.noFill();
        p.stroke(200);
        p.rect(10, 30, barWidth, 10);
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.STONE);
    p.textSize(40);
    p.text("STONE STORY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(COLORS.TEXT);
    p.textSize(14);
    p.text("Quest for the Soul Stones", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.textSize(12);
    p.fill(150);
    p.text("Controls: Arrows to Move, Space to Jump, Z to Attack, Shift to Block", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p, won) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (won) {
        p.fill(COLORS.STONE);
        p.textSize(40);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.text("The Realm is Restored", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text("DEFEAT", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.text("The Darkness Prevails", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    }
    
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}