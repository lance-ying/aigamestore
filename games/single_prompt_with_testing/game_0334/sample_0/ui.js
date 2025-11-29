// ui.js
import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    const player = gameState.player;
    if (!player) return;

    p.push();
    
    // Health Bar
    p.noStroke();
    p.fill(100, 0, 0);
    p.rect(20, 20, 100, 10); // BG
    p.fill(255, 0, 100);
    p.rect(20, 20, (player.health / player.maxHealth) * 100, 10); // FG
    
    // Modules
    p.fill(COLORS.MODULE);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`MODULES: ${player.modules}/${player.totalModules}`, 20, 40);
    
    // Medkits
    p.fill(COLORS.MEDKIT);
    p.text(`MEDKITS: ${player.medkits}`, 20, 60);

    // Vignette for low health/illness
    if (player.health <= 2) {
        p.noFill();
        const flicker = p.random(0, 50);
        p.stroke(255, 0, 50, 100 + flicker);
        p.strokeWeight(30);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.PLAYER[0], COLORS.PLAYER[1], COLORS.PLAYER[2]);
    p.textSize(40);
    p.text("HYPER LIGHT DRIFTER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(16);
    p.text("Use Arrow Keys to Move, Space to Dash", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    p.text("Z to Slash, Shift to Heal", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.fill(COLORS.MODULE);
    p.text("Collect 3 Modules to Win", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    if (p.frameCount % 60 < 30) {
        p.fill(200);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    }
    p.pop();
}

export function renderGameOver(p, win) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    if (win) {
        p.fill(COLORS.PLAYER_CAPE);
        p.textSize(40);
        p.text("GATEWAY OPENED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.fill(255);
        p.text("You have survived the ruins.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.fill(200, 0, 0);
        p.textSize(40);
        p.text("DRIFTER FALLEN", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.fill(255);
        p.text("The illness consumes you.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    }
    
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPauseScreen(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}