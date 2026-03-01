/**
 * User Interface Manager.
 * Handles HUD (Score, Energy), Start Screen, Game Over Screen, and Pause Screen.
 */

import { gameState, GAME_CONFIG, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    // Score
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    
    // Shadow
    p.fill(COLORS.UI_SHADOW);
    p.textSize(48);
    p.text(gameState.score, CANVAS_WIDTH / 2 + 2, 22);
    
    // Text
    p.fill(COLORS.UI_TEXT);
    p.text(gameState.score, CANVAS_WIDTH / 2, 20);
    p.pop();

    // Energy Bar
    renderEnergyBar(p);
    
    // Level / Season Indicator
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(255);
    p.text(`Season: ${COLORS.SEASONS[gameState.currentSeasonIndex].name}`, 10, 10);
    p.pop();
}

function renderEnergyBar(p) {
    const barWidth = 300;
    const barHeight = 20;
    const x = (CANVAS_WIDTH - barWidth) / 2;
    const y = 80;

    // Border
    p.fill(COLORS.UI_SHADOW);
    p.rect(x - 2, y - 2, barWidth + 4, barHeight + 4, 5);
    
    // Background
    p.fill(COLORS.ENERGY_BAR_BG);
    p.rect(x, y, barWidth, barHeight, 3);
    
    // Fill
    const fillPercent = gameState.energy / GAME_CONFIG.MAX_TIME;
    p.fill(COLORS.ENERGY_BAR_FILL);
    p.rect(x, y, barWidth * fillPercent, barHeight, 3);
    
    // Warning flash if low
    if (fillPercent < 0.25 && Math.floor(gameState.frameCount / 10) % 2 === 0) {
        p.fill(255, 0, 0, 100);
        p.rect(x, y, barWidth, barHeight, 3);
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.TREE_BARK_DARK); // Simple BG fallback
    
    // Try to render background instance if available for nice visual
    if (gameState.background) gameState.background.render(p);
    
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.ENERGY_BAR_FILL);
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(60);
    p.text("TIMBERMAN", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    p.noStroke();
    p.fill(255);
    p.textSize(20);
    p.text("Press ENTER to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.textSize(16);
    p.fill(200);
    p.text("Arrows: Move & Chop | ESC: Pause", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    // Current Mode
    p.textSize(14);
    p.fill(150);
    // Don't show mode strictly as per instructions? 
    // "Never display controlMode: Do not show HUMAN/TESTING mode on canvas"
    // OK, skipping control mode display.
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.textAlign(p.CENTER, p.CENTER);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    const title = isWin ? "YOU WIN!" : "GAME OVER";
    
    p.fill(isWin ? '#4CAF50' : '#F44336');
    p.stroke(0);
    p.strokeWeight(4);
    p.textSize(50);
    p.text(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    p.noStroke();
    p.fill(255);
    p.textSize(30);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}