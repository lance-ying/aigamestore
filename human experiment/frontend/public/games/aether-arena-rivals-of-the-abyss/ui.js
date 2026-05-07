// UI and HUD Rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderHUD(p) {
    if (gameState.gamePhase !== "PLAYING" && gameState.gamePhase !== "PAUSED" && gameState.gamePhase.indexOf("GAME_OVER") === -1) return;
    
    // Player Stock Icons
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(COLORS.UI.TEXT);
    p.text("Lives: ", 20, 20);
    for (let i = 0; i < (gameState.player ? gameState.player.stocks : 0); i++) {
        p.fill(COLORS.PLAYER.BODY);
        p.circle(70 + i * 20, 28, 10);
    }
    
    // Player Damage %
    if (gameState.player) {
        p.textSize(32);
        const dmg = Math.floor(gameState.player.damagePercent);
        if (dmg < 50) p.fill(COLORS.UI.DAMAGE_LOW);
        else if (dmg < 100) p.fill(COLORS.UI.DAMAGE_MED);
        else p.fill(COLORS.UI.DAMAGE_HIGH);
        
        p.text(dmg + "%", 20, 50);
    }

    // Wave / Score
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(COLORS.UI.TEXT);
    p.textSize(20);
    p.text("Wave: " + gameState.wave, CANVAS_WIDTH - 20, 20);
    p.textSize(16);
    p.text("Score: " + gameState.score, CANVAS_WIDTH - 20, 50);

    p.pop();
}

export function renderStartScreen(p) {
    p.background(0);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Replace title with simple message
    p.textSize(28);
    p.fill(255);
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    // Instructions (kept as requested)
    p.textSize(16);
    p.fill(150);
    p.text("Arrow Keys: Move/Jump | Z: Attack | Shift: Special", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOverScreen(p) {
    p.push();
    p.fill(0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(win ? [50, 255, 50] : [255, 50, 50]);
    p.textSize(40);
    p.text(win ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    p.text("Wave Reached: " + gameState.wave, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    p.fill(180);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    p.pop();
}