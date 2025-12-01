import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // 1. Health Bar
    // Draw centered at bottom
    const barWidth = 300;
    const barHeight = 20;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = CANVAS_HEIGHT - 40;
    
    // Background (Enemy side - Red)
    p.fill(COLORS.HEALTH_ENEMY);
    p.rect(barX, barY, barWidth, barHeight, 10);
    
    // Player side (Green)
    // Health 0 = 0 width, Health 100 = full width?
    // Usually FNF is 50/50. 0 is player dead (empty bar or full enemy).
    // Let's say Health is Player's portion. 0 = 0 width (Lose). 100 = Full width.
    const playerBarWidth = (gameState.health / 100) * barWidth;
    
    p.fill(COLORS.HEALTH_PLAYER);
    // Draw from right to left or left to right? FNF is centered icons pushing.
    // Simple bar: Left is enemy, Right is player.
    p.rect(barX, barY, playerBarWidth, barHeight, 10);
    
    // Icons (Simplified as circles)
    const iconX = barX + playerBarWidth;
    p.stroke(0);
    p.strokeWeight(2);
    // Enemy Icon
    p.fill(150, 0, 150);
    p.circle(iconX - 15, barY + 10, 30);
    // Player Icon
    p.fill(50, 200, 255);
    p.circle(iconX + 15, barY + 10, 30);
    
    // 2. Score text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`Score: ${gameState.score} | Combo: ${gameState.combo}`, CANVAS_WIDTH / 2, barY + 30);
    
    // 3. Mode indicator (for debugging visual mostly)
    /*
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(gameState.controlMode, 10, 10);
    */
}

export function renderStartScreen(p) {
    p.background(0);
    
    // Funky Background pattern
    for(let i=0; i<CANVAS_WIDTH; i+=40) {
        for(let j=0; j<CANVAS_HEIGHT; j+=40) {
            p.fill((i+j)%80 === 0 ? 30 : 20);
            p.noStroke();
            p.rect(i, j, 40, 40);
        }
    }
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("FRIDAY NIGHT", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.fill(50, 200, 255);
    p.text("FUNKIN'", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 45);
    p.fill(255);
    p.textSize(12);
    p.text("P5.js Edition", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 75);
    
    p.textSize(20);
    
    // Blinking text
    if (Math.floor(p.millis() / 500) % 2 === 0) {
        p.text("PRESS ENTER TO FUNK", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
    
    p.textSize(14);
    p.fill(200);
    p.text("Use Arrows to Hit Notes", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.85);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (isWin) {
        p.fill(50, 255, 50);
        p.textSize(40);
        p.text("NICE MOVES!", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
        p.fill(255);
        p.textSize(20);
        p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text("BLUE BALLED...", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
        // Skeleton visual or cracked mic?
        p.stroke(255);
        p.line(CANVAS_WIDTH/2 - 20, CANVAS_HEIGHT/2 - 20, CANVAS_WIDTH/2 + 20, CANVAS_HEIGHT/2 + 20);
        p.line(CANVAS_WIDTH/2 + 20, CANVAS_HEIGHT/2 - 20, CANVAS_WIDTH/2 - 20, CANVAS_HEIGHT/2 + 20);
    }
    
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}