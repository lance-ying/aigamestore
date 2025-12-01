import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderUI(p) {
    // HUD
    // Health Bar
    p.push();
    const hp = gameState.player.health;
    const maxHp = gameState.player.maxHealth;
    
    // Bar Background
    p.fill(50);
    p.rect(20, 20, 200, 20);
    
    // HP Fill
    p.fill(COLORS.HEALTH);
    p.rect(20, 20, 200 * (hp / maxHp), 20);
    
    // Outline
    p.noFill();
    p.stroke(200);
    p.strokeWeight(2);
    p.rect(20, 20, 200, 20);
    
    // Text
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`${Math.ceil(hp)}/${maxHp}`, 230, 30);
    
    // Score / Cells
    p.fill(COLORS.CELL);
    p.textSize(18);
    p.text(`Cells: ${gameState.score}`, 20, 60);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLORS.PLAYER);
    p.textSize(60);
    p.text("DEAD PIXELS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(255);
    p.textSize(20);
    p.text("Kill. Die. Learn. Repeat.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(150);
    p.textSize(16);
    p.text("Z: Attack | Shift: Roll | Space: Jump | Arrows: Move", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    if (p.frameCount % 60 < 30) {
        p.fill(COLORS.ACCENT);
        p.textSize(24);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
    }
}

export function renderGameOver(p, isWin) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    if (isWin) {
        p.fill(COLORS.ACCENT);
        p.textSize(50);
        p.text("LEVEL CLEARED", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    } else {
        p.fill(200, 50, 50);
        p.textSize(50);
        p.text("BODY DESECRATED", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Cells Collected: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}