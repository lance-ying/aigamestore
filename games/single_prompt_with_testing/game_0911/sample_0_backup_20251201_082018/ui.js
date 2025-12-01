import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOOL } from './globals.js';

export function renderUI(p) {
    // Top bar
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 50);
    
    // Health
    if (gameState.player) {
        p.textAlign(p.LEFT, p.TOP);
        p.fill(255);
        p.textSize(16);
        p.text("HP:", 10, 15);
        
        // Bar
        p.fill(100, 0, 0);
        p.rect(40, 15, 100, 15);
        p.fill(255, 0, 0);
        const hpPct = gameState.player.health / gameState.player.maxHealth;
        p.rect(40, 15, 100 * hpPct, 15);
        p.noFill();
        p.stroke(255);
        p.rect(40, 15, 100, 15);
        p.noStroke();
    }
    
    // Gold
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Gold: ${gameState.goldCollected} / ${gameState.goldToWin}`, CANVAS_WIDTH - 20, 15);
    
    // Tool
    if (gameState.player) {
        p.textAlign(p.CENTER, p.TOP);
        p.fill(255);
        p.text(`Tool: ${gameState.player.currentTool} (Shift)`, CANVAS_WIDTH / 2, 15);
    }
}

export function renderStartScreen(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("TERRARIA LITE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    p.textSize(16);
    p.text("Collect 10 Gold Ores to Win", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Arrows: Move | Space: Jump | Z: Action | Shift: Tool", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.fill(100, 255, 100);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(255, 215, 0);
        p.textSize(40);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.text(`You found all the gold!`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    } else {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.textSize(20);
        p.text("The slimes got you...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    }
    
    p.fill(255);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}