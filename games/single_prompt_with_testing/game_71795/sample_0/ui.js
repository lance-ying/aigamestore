import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(48);
    p.text("SPUD SURVIVOR", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    p.textSize(20);
    p.fill(200, 200, 200);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(14);
    p.fill(150);
    p.text("Arrows: Move | Space: Dash | Z: Ult | Shift: Strafe", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderHUD(p) {
    if (!gameState.player) return;

    // HP Bar
    p.noStroke();
    p.fill(50, 0, 0);
    p.rect(20, 20, 200, 20);
    p.fill(200, 50, 50);
    p.rect(20, 20, 200 * (gameState.player.hp / gameState.player.maxHp), 20);
    p.stroke(255);
    p.noFill();
    p.rect(20, 20, 200, 20);
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${Math.ceil(gameState.player.hp)} / ${gameState.player.maxHp}`, 120, 30);

    // XP Bar (Bottom)
    p.noStroke();
    p.fill(50, 50, 50);
    p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
    p.fill(100, 100, 255);
    p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH * (gameState.player.xp / gameState.player.maxXp), 10);
    
    // Level
    p.fill(255);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(16);
    p.text(`LVL ${gameState.player.level}`, 10, CANVAS_HEIGHT - 15);

    // Wave Info
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.fill(255);
    p.text(`WAVE ${gameState.wave}`, CANVAS_WIDTH/2, 10);
    
    // Timer
    const timeLeft = Math.max(0, gameState.waveDuration - gameState.waveTimer).toFixed(1);
    p.textSize(18);
    p.fill(timeLeft < 5 ? [255, 50, 50] : [255, 255, 255]);
    p.text(timeLeft, CANVAS_WIDTH/2, 40);

    // Stamina
    const stam = gameState.player.stamina;
    p.fill(50, 50, 200);
    p.rect(20, 45, 100, 5);
    p.fill(100, 200, 255);
    p.rect(20, 45, 100 * (stam / 100), 5);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(win ? [100, 255, 100] : [255, 50, 50]);
    p.text(win ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(24);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPause(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}