import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("PAPER CONQUEST", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.textSize(18);
    p.text("Conquer territory. Cut trails. Don't die.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(14);
    p.fill(180);
    p.text("Arrows: Steer  |  Space: Boost  |  Enter: Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    // Pulse effect
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.text("PRESS ENTER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
    }
}

export function renderHUD(p) {
    p.fill(255);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}%`, 10, 10);
    
    // Leaderboard (Simulated)
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.text("LEADERBOARD", CANVAS_WIDTH - 10, 10);
    
    const sorted = [
        {name: "YOU", score: gameState.score, color: COLORS.PLAYER},
        ...gameState.enemies.map((e, i) => ({
            name: `BOT ${i+1}`, 
            score: gameState.worldGrid ? gameState.worldGrid.getScore(e.id) : 0, 
            color: e.color
        }))
    ].sort((a, b) => b.score - a.score);

    for (let i = 0; i < sorted.length; i++) {
        p.fill(sorted[i].color);
        p.text(`${sorted[i].name}: ${sorted[i].score}%`, CANVAS_WIDTH - 10, 30 + i * 15);
    }
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(255, 0, 0);
        p.text("ELIMINATED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Territory: ${gameState.score}%`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}