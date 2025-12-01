import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.textAlign(p.LEFT, p.TOP);
    
    // Score
    p.fill(255);
    p.textSize(20);
    p.text('SCORE: ' + gameState.score.toString().padStart(5, '0'), 20, 20);
    
    // Level
    p.textAlign(p.RIGHT, p.TOP);
    p.text('LEVEL: ' + gameState.currentLevel, CANVAS_WIDTH - 20, 20);
    
    // Health Bar
    const player = gameState.player;
    if (player) {
        p.stroke(255);
        p.strokeWeight(2);
        p.fill(50);
        p.rect(20, 50, 150, 20);
        p.noStroke();
        p.fill(0, 255, 0);
        const hpWidth = (player.health / player.maxHealth) * 146;
        if (hpWidth > 0) p.rect(22, 52, hpWidth, 16);
    }
}

export function renderStartScreen(p) {
    p.background(20, 20, 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('PIXEL GAUNTLET', CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.text('Controls:', CANVAS_WIDTH / 2, 180);
    p.text('Arrows to Move/Jump', CANVAS_WIDTH / 2, 210);
    p.text('Z / Shift to Attack', CANVAS_WIDTH / 2, 230);
    p.text('ESC to Pause', CANVAS_WIDTH / 2, 250);
    
    p.textSize(24);
    p.fill(100, 255, 100);
    if (p.frameCount % 60 < 30) {
        p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 320);
    }
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderLevelComplete(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text('LEVEL ' + gameState.currentLevel + ' COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.fill(255);
    p.textSize(16);
    p.text('Press ENTER for Next Level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(255, 215, 0);
        p.textSize(40);
        p.text('YOU WIN!', CANVAS_WIDTH / 2, 150);
        p.textSize(20);
        p.fill(255);
        p.text('The Overlord is defeated!', CANVAS_WIDTH / 2, 200);
    } else {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text('GAME OVER', CANVAS_WIDTH / 2, 150);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text('Final Score: ' + gameState.score, CANVAS_WIDTH / 2, 250);
    
    p.textSize(16);
    p.fill(150);
    p.text('Press R to Return to Title', CANVAS_WIDTH / 2, 320);
}