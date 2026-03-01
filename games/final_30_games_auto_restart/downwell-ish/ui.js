import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';

export function renderUI(p) {
    // HUD
    
    // Health (Left)
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(PALETTE.FG);
    p.text("HP", 20, 20);
    
    // Draw hearts/blocks for health
    const hp = gameState.player ? gameState.player.health : 0;
    const maxHp = gameState.player ? gameState.player.maxHealth : 4;
    
    for (let i = 0; i < maxHp; i++) {
        if (i < hp) {
            p.fill(PALETTE.ACCENT);
        } else {
            p.fill(50);
        }
        p.noStroke();
        p.rect(50 + i * 15, 20, 10, 16);
    }
    
    // Ammo (Right)
    const ammo = gameState.player ? gameState.player.ammo : 0;
    const maxAmmo = gameState.player ? gameState.player.maxAmmo : 8;
    
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(PALETTE.FG);
    p.text("GUNBOOTS", CANVAS_WIDTH - 20, 20);
    
    for (let i = 0; i < maxAmmo; i++) {
        if (i < ammo) {
            p.fill(PALETTE.FG);
        } else {
            p.fill(50);
        }
        p.rect(CANVAS_WIDTH - 20 - (maxAmmo * 10) + (i * 10), 40, 6, 10);
    }
    
    // Score (Center)
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.fill(PALETTE.FG);
    p.text(gameState.score.toString().padStart(6, '0'), CANVAS_WIDTH / 2, 20);
    
    // Depth Meter
    if (gameState.player) {
        const depthPct = Math.min(1, Math.max(0, gameState.player.y / gameState.worldDepth));
        p.stroke(50);
        p.strokeWeight(4);
        p.line(CANVAS_WIDTH - 10, 100, CANVAS_WIDTH - 10, 300);
        
        p.stroke(PALETTE.ACCENT);
        p.point(CANVAS_WIDTH - 10, 100 + depthPct * 200);
    }
}

export function renderStartScreen(p) {
    p.background(PALETTE.BG);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(PALETTE.FG); // Use foreground color for consistency
    p.textSize(32); // Appropriate size for the new title
    p.text("press enter to begin", CANVAS_WIDTH/2, CANVAS_HEIGHT/2); // Centered
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(PALETTE.FG);
        p.textSize(40);
        p.text("WELL CONQUERED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(PALETTE.ACCENT);
        p.text("Score: " + gameState.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(PALETTE.ACCENT);
        p.textSize(40);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(PALETTE.FG);
        p.text("Score: " + gameState.score, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.textSize(18);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(PALETTE.FG);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}